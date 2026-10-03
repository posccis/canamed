using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;

namespace Canamed.Application.Kiosk;

public sealed class KioskCheckInService(
    IQueueRepository queueRepository,
    IAgendaRepository agendaRepository,
    ICatalogRepository catalogRepository,
    IAuditRepository auditRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<IReadOnlyList<KioskAppointmentSearchResult>> SearchTodayAppointmentsAsync(
        Guid clinicId,
        string searchTerm,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return [];

        var digitsOnly = new string(searchTerm.Where(char.IsDigit).ToArray());
        var today = DateOnly.FromDateTime(now.ToOffset(TimeSpan.FromHours(-3)).Date);

        var startOfDay = new DateTimeOffset(today.ToDateTime(TimeOnly.MinValue), TimeSpan.FromHours(-3));
        var endOfDay = new DateTimeOffset(today.ToDateTime(TimeOnly.MaxValue), TimeSpan.FromHours(-3));

        var clinicAppointments = await agendaRepository.ListAppointmentsAsync(clinicId, null, startOfDay, endOfDay, cancellationToken);

        var results = new List<KioskAppointmentSearchResult>();

        foreach (var apt in clinicAppointments)
        {
            if (apt.Status is not (AppointmentStatus.Scheduled or AppointmentStatus.Confirmed))
                continue;

            var patient = await catalogRepository.FindPatientAsync(clinicId, apt.PatientId, cancellationToken);
            if (patient is null)
                continue;

            var patientCpfDigits = new string((patient.Document ?? "").Where(char.IsDigit).ToArray());
            var patientPhoneDigits = new string(patient.Phone.Where(char.IsDigit).ToArray());

            bool matches = (!string.IsNullOrEmpty(digitsOnly) && (patientCpfDigits.Contains(digitsOnly) || patientPhoneDigits.Contains(digitsOnly))) ||
                           patient.Name.Contains(searchTerm.Trim(), StringComparison.OrdinalIgnoreCase);

            if (!matches)
                continue;

            var prof = await catalogRepository.FindProfessionalAsync(clinicId, apt.ProfessionalId, cancellationToken);

            var diff = now - apt.StartsAt;
            bool allowed = true;
            string? disallowReason = null;

            if (diff.TotalMinutes > 15)
            {
                allowed = false;
                disallowReason = "Atraso superior a 15 minutos do horário agendado. Por favor, compareça à recepção para verificar encaixe com a equipe.";
            }
            else if (diff.TotalMinutes < -60)
            {
                allowed = false;
                disallowReason = "Check-in antecipado permitido apenas com até 60 minutos de antecedência.";
            }

            var existingQueue = await queueRepository.FindOpenByAppointmentAsync(clinicId, apt.Id, cancellationToken);
            if (existingQueue is not null)
            {
                allowed = false;
                disallowReason = $"Check-in já realizado hoje. Sua senha é {existingQueue.TicketCode ?? "emitida"}.";
            }

            results.Add(new KioskAppointmentSearchResult(
                apt.Id,
                patient.Id,
                MaskName(patient.Name),
                MaskCpf(patient.Document),
                apt.ProfessionalId,
                prof?.Name ?? "Médico",
                apt.StartsAt,
                "Consulta Médica",
                allowed,
                disallowReason));
        }

        return results;
    }

    public async Task<KioskCheckInResult> ConfirmKioskCheckInAsync(
        KioskConfirmCheckInRequest request,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        return await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var apt = await agendaRepository.FindAppointmentAsync(request.AppointmentId, request.ClinicId, ct);
            if (apt is null)
            {
                throw new InvalidOperationException("Agendamento não encontrado.");
            }

            var today = DateOnly.FromDateTime(now.ToOffset(TimeSpan.FromHours(-3)).Date);

            var existing = await queueRepository.FindOpenByAppointmentAsync(request.ClinicId, apt.Id, ct);
            if (existing is not null)
            {
                var p = await catalogRepository.FindPatientAsync(request.ClinicId, apt.PatientId, ct);
                var pr = await catalogRepository.FindProfessionalAsync(request.ClinicId, apt.ProfessionalId, ct);
                return new KioskCheckInResult(
                    existing.Id,
                    existing.TicketCode ?? "N-001",
                    existing.Priority.ToString(),
                    existing.Status.ToString(),
                    1,
                    p?.Name ?? "Paciente",
                    pr?.Name ?? "Médico",
                    existing.ArrivedAt);
            }

            var todayEntries = await queueRepository.ListAsync(request.ClinicId, today, null, ct);
            var priority = request.IsPreferential ? QueuePriority.Preferential : QueuePriority.Normal;
            var prefix = request.IsPreferential ? "P" : "N";
            var sequence = todayEntries.Count(e => e.Priority == priority) + 1;
            var ticketCode = $"{prefix}-{sequence:D3}";

            var entry = QueueEntry.CheckIn(
                request.ClinicId,
                apt.ProfessionalId,
                apt.PatientId,
                apt.Id,
                today,
                priority,
                now);

            entry.AssignTicket(ticketCode, request.Origin);

            queueRepository.Add(entry);

            if (apt.Status is AppointmentStatus.Scheduled)
            {
                apt.Confirm(now);
            }

            var patient = await catalogRepository.FindPatientAsync(request.ClinicId, apt.PatientId, ct);
            var prof = await catalogRepository.FindProfessionalAsync(request.ClinicId, apt.ProfessionalId, ct);

            auditRepository.Add(AuditEvent.Record(
                request.ClinicId,
                "kiosk_terminal",
                "Terminal Totem",
                "KioskCheckInCompleted",
                "queue_entries",
                entry.Id.ToString(),
                now,
                $"{{\"ticketCode\":\"{ticketCode}\",\"priority\":\"{priority}\",\"origin\":\"{request.Origin}\"}}"));

            var waitingEntries = todayEntries.Where(e => e.Status == QueueStatus.Waiting).ToList();
            var position = waitingEntries.Count + 1;

            return new KioskCheckInResult(
                entry.Id,
                ticketCode,
                priority.ToString(),
                entry.Status.ToString(),
                position,
                patient?.Name ?? "Paciente",
                prof?.Name ?? "Médico",
                entry.ArrivedAt);
        }, cancellationToken);
    }

    public async Task<KioskTicketStatusResult> GetTicketStatusAsync(
        Guid clinicId,
        string ticketCode,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(now.ToOffset(TimeSpan.FromHours(-3)).Date);
        var todayEntries = await queueRepository.ListAsync(clinicId, today, null, cancellationToken);

        var entry = todayEntries.FirstOrDefault(e => string.Equals(e.TicketCode, ticketCode, StringComparison.OrdinalIgnoreCase));
        if (entry is null)
        {
            throw new InvalidOperationException("Senha não encontrada para hoje.");
        }

        var aheadCount = todayEntries
            .Where(e => e.Status == QueueStatus.Waiting && e.ArrivedAt < entry.ArrivedAt)
            .Count();

        int estimatedWait = aheadCount * 15;

        return new KioskTicketStatusResult(
            ticketCode.ToUpperInvariant(),
            entry.Status.ToString(),
            aheadCount,
            estimatedWait,
            null);
    }

    private static string MaskName(string fullName)
    {
        var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length <= 1)
            return fullName;

        var first = parts[0];
        var middle = string.Join(" ", parts.Skip(1).Take(parts.Length - 2).Select(p => p[0] + "."));
        var last = parts[^1];

        return string.IsNullOrWhiteSpace(middle) ? $"{first} {last}" : $"{first} {middle} {last}";
    }

    private static string MaskCpf(string? cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf))
            return "***.***.***-**";

        var digits = new string(cpf.Where(char.IsDigit).ToArray());
        if (digits.Length != 11)
            return "***.***.***-**";

        return $"***.***.{digits.Substring(6, 3)}-**";
    }
}
