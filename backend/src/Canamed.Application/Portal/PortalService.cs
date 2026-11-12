using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.MedicalRecords;
using Canamed.Application.MedicalRecords.Services;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;
using Canamed.Domain.MedicalRecords;
using Canamed.Domain.Notifications;

namespace Canamed.Application.Portal;

/// <summary>
/// Serviço de suporte às jornadas de autoatendimento e portal da paciente (SPEC-0036).
/// Atende ao agendamento de consulta avulsa sem conta, acompanhamento de pré-natal e cartão da gestante.
/// </summary>
public sealed class PortalService(
    IPortalRepository portalRepository,
    IAgendaRepository agendaRepository,
    ICatalogRepository catalogRepository,
    IMedicalRecordRepository medicalRecordRepository,
    IAuditRepository auditRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<PrenatalSummaryDto> GetPrenatalSummaryAsync(
        string sessionToken,
        DateTimeOffset now,
        DateOnly? dumOverride = null,
        CancellationToken cancellationToken = default)
    {
        var session = await portalRepository.GetSessionAsync(sessionToken, now, cancellationToken);
        if (session is null)
        {
            throw new UnauthorizedAccessException("Sessão inválida ou expirada.");
        }

        var clinicId = await portalRepository.ResolveClinicIdAsync(null, cancellationToken)
            ?? throw new InvalidOperationException("Nenhuma clínica disponível.");

        var patient = await catalogRepository.FindPatientAsync(session.PatientId, clinicId, cancellationToken);
        var visits = await medicalRecordRepository.ListPrenatalVisitsByPatientAsync(session.PatientId, clinicId, cancellationToken);
        var gynProfile = await medicalRecordRepository.GetGynecologicalProfileAsync(session.PatientId, clinicId, cancellationToken);

        DateOnly? dum = dumOverride;
        if (dum is null && visits.Count > 0)
        {
            var firstVisit = visits.OrderBy(v => v.VisitDate).First();
            dum = firstVisit.VisitDate.AddDays(-(firstVisit.GestationalAgeWeeks * 7 + firstVisit.GestationalAgeDays));
        }

        DateOnly? dpp = null;
        int currentWeeks = 0;
        int currentDays = 0;

        if (dum.HasValue)
        {
            dpp = ObstetricCalculator.CalculateNaegeleEdd(dum.Value);
            var (weeks, days) = ObstetricCalculator.CalculateGestationalAge(dum.Value, DateOnly.FromDateTime(now.DateTime));
            currentWeeks = weeks;
            currentDays = days;
        }
        else if (visits.Count > 0)
        {
            var latestVisit = visits.OrderByDescending(v => v.VisitDate).First();
            var daysSinceVisit = DateOnly.FromDateTime(now.DateTime).DayNumber - latestVisit.VisitDate.DayNumber;
            var totalDays = (latestVisit.GestationalAgeWeeks * 7) + latestVisit.GestationalAgeDays + Math.Max(0, daysSinceVisit);
            currentWeeks = totalDays / 7;
            currentDays = totalDays % 7;
        }

        var isRhNeg = (patient?.RhFactor?.Contains("neg", StringComparison.OrdinalIgnoreCase) == true)
            || (patient?.BloodType?.EndsWith("-") == true);

        var milestone = GetFetalMilestone(currentWeeks);

        var visitItems = visits
            .OrderByDescending(v => v.VisitDate)
            .Select(v => new PrenatalVisitItemDto(
                v.Id,
                v.VisitDate,
                v.GestationalAgeWeeks,
                v.GestationalAgeDays,
                v.BloodPressure,
                v.FetalHeartRateBpm,
                v.UterineHeightCm,
                v.WeightKg))
            .ToList();

        return new PrenatalSummaryDto(
            session.PatientId,
            patient?.Name ?? "Paciente",
            dum,
            dpp,
            currentWeeks,
            currentDays,
            isRhNeg,
            patient?.BloodType,
            patient?.RhFactor,
            gynProfile?.ObstetricNotes,
            milestone,
            visitItems);
    }

    public async Task<BookGuestAppointmentResponse> BookGuestAppointmentAsync(
        BookGuestAppointmentRequest request,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.PatientName) ||
            string.IsNullOrWhiteSpace(request.Cpf) ||
            string.IsNullOrWhiteSpace(request.Phone))
        {
            throw new ArgumentException("Nome, CPF e WhatsApp são obrigatórios para agendamento CFM.");
        }

        var prof = await catalogRepository.FindProfessionalAsync(request.ClinicId, request.ProfessionalId, cancellationToken)
            ?? throw new InvalidOperationException("Médica ou profissional não encontrado.");

        var effectiveTypeId = request.AppointmentTypeId;
        int duration = 30;

        if (effectiveTypeId.HasValue)
        {
            var type = await catalogRepository.FindAppointmentTypeAsync(request.ClinicId, effectiveTypeId.Value, cancellationToken);
            if (type is not null)
            {
                duration = type.DurationMinutes;
            }
        }
        else
        {
            var types = await catalogRepository.ListAppointmentTypesAsync(request.ClinicId, cancellationToken);
            var firstType = types.FirstOrDefault(t => t.IsActive) ?? types.FirstOrDefault();
            if (firstType is not null)
            {
                effectiveTypeId = firstType.Id;
                duration = firstType.DurationMinutes;
            }
            else
            {
                throw new InvalidOperationException("Nenhum tipo de atendimento ativo encontrado.");
            }
        }

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var patient = await portalRepository.GetPatientByCpfOrPhoneAsync(request.Cpf, request.Phone, request.ClinicId, token);
            if (patient is null)
            {
                patient = Patient.Create(
                    clinicId: request.ClinicId,
                    name: request.PatientName.Trim(),
                    phone: request.Phone.Trim(),
                    now: now,
                    birthDate: request.BirthDate,
                    document: request.Cpf.Trim());

                catalogRepository.AddPatient(patient);
            }

            var preAnamnesis = $"[Triagem Avulsa] Sintomas: {request.Symptoms ?? "Não informados"} | " +
                               $"Alergias: {request.Allergies ?? "Nenhuma declarada"} | " +
                               $"Gestante: {(request.IsPregnant ? "Sim" : "Não")} | " +
                               $"Nota Fiscal Solicitada: {(request.WantsInvoice ? "Sim" : "Não")}";

            var appointment = Appointment.Schedule(
                clinicId: request.ClinicId,
                professionalId: request.ProfessionalId,
                patientId: patient.Id,
                appointmentTypeId: effectiveTypeId!.Value,
                startsAt: request.StartsAt,
                durationMinutes: duration,
                now: now,
                origin: "guest",
                clinicalPreAnamnesis: preAnamnesis);

            appointment.Confirm(now);
            agendaRepository.AddAppointment(appointment);

            auditRepository.Add(AuditEvent.Record(
                request.ClinicId,
                patient.Id.ToString(),
                patient.Name,
                "GuestAppointmentBooked",
                "appointments",
                appointment.Id.ToString(),
                now,
                $"{{\"allergies\":\"{request.Allergies}\",\"isPregnant\":{request.IsPregnant.ToString().ToLowerInvariant()},\"wantsInvoice\":{request.WantsInvoice.ToString().ToLowerInvariant()}}}"));

            var meetUrl = $"https://meet.canamed.com.br/sala/{appointment.Id}";
            var instructions = "Caso a modalidade seja telemedicina, acesse a sala virtual no horário agendado. Em caso de atendimento presencial, chegue com 10 minutos de antecedência.";

            return new BookGuestAppointmentResponse(
                appointment.Id,
                appointment.StartsAt,
                prof.Name,
                meetUrl,
                instructions);
        }, cancellationToken);
    }

    public async Task<byte[]> DownloadPrenatalCardPdfAsync(
        string sessionToken,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var session = await portalRepository.GetSessionAsync(sessionToken, now, cancellationToken);
        if (session is null)
        {
            throw new UnauthorizedAccessException("Sessão inválida ou expirada.");
        }

        var clinicId = await portalRepository.ResolveClinicIdAsync(null, cancellationToken)
            ?? throw new InvalidOperationException("Nenhuma clínica disponível.");

        var patient = await catalogRepository.FindPatientAsync(session.PatientId, clinicId, cancellationToken)
            ?? throw new InvalidOperationException("Paciente não encontrada.");

        var visits = await medicalRecordRepository.ListPrenatalVisitsByPatientAsync(session.PatientId, clinicId, cancellationToken);
        var gynProfile = await medicalRecordRepository.GetGynecologicalProfileAsync(session.PatientId, clinicId, cancellationToken);

        return PrenatalCardPdfGenerator.Generate(patient, gynProfile, visits, "CANA MED MULHER");
    }

    private static string GetFetalMilestone(int weeks)
    {
        return weeks switch
        {
            <= 8 => "Grão de Feijão",
            <= 12 => "Ameixa",
            <= 16 => "Abacate",
            <= 20 => "Banana",
            <= 24 => "Espiga de Milho",
            <= 28 => "Berinjela 🍆",
            <= 32 => "Abóbora",
            <= 36 => "Mamão Papaya",
            <= 40 => "Melancia",
            _ => "Bebê a Termo"
        };
    }
}
