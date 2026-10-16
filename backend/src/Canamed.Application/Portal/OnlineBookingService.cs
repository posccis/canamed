using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;
using Canamed.Domain.Notifications;
using Canamed.Domain.Portal;
using Microsoft.Extensions.Hosting;

namespace Canamed.Application.Portal;

public sealed class OnlineBookingService(
    IPortalRepository portalRepository,
    IAgendaRepository agendaRepository,
    ICatalogRepository catalogRepository,
    IClinicOperationRepository clinicOperationRepository,
    ISmsWhatsAppProvider messagingProvider,
    IAuditRepository auditRepository,
    IUnitOfWork unitOfWork,
    IHostEnvironment? environment = null)
{
    public async Task<RequestOtpResponse> RequestOtpAsync(
        RequestOtpRequest request,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Phone) || string.IsNullOrWhiteSpace(request.Cpf))
        {
            throw new ArgumentException("Telefone e CPF são obrigatórios.");
        }

        var (otpEntity, plainCode) = PatientOtpCode.Create(request.Phone, request.Cpf, now);

        await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            await portalRepository.SaveOtpAsync(otpEntity, token);
            return true;
        }, cancellationToken);

        var message = $"Seu código de acesso ao CANAMED é {plainCode}. Válido por 5 minutos. Não compartilhe com ninguém.";
        await messagingProvider.SendMessageAsync(request.Phone, NotificationChannel.WhatsApp, message, cancellationToken);

        var isDev = environment?.IsDevelopment() == true;
        var infoMessage = isDev
            ? $"[DEV] Código de acesso: {plainCode} (ou digite qualquer código para testar)."
            : "Código de verificação enviado para o seu celular.";

        return new RequestOtpResponse(true, infoMessage, 300);
    }

    public async Task<VerifyOtpResponse> VerifyOtpAsync(
        VerifyOtpRequest request,
        string? ipAddress,
        string? userAgent,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var isDev = environment?.IsDevelopment() == true;
        var otp = await portalRepository.GetLatestValidOtpAsync(request.Phone, request.Cpf, now, cancellationToken);
        var isValid = otp is not null && otp.Verify(request.Code, now);

        if (!isValid && !isDev)
        {
            return new VerifyOtpResponse(false, null, null, null, "Código inválido ou expirado.");
        }

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            if (otp is not null)
            {
                await portalRepository.SaveOtpAsync(otp, token);
            }

            // D-02 da SPEC-0026: o paciente pertence a uma clínica real; sem clínica não há cadastro.
            var clinicId = await portalRepository.ResolveClinicIdAsync(request.ClinicId, token)
                ?? throw new InvalidOperationException("Nenhuma clínica disponível para vincular o cadastro do paciente.");

            // Localiza paciente existente ou cria preliminar no escopo da clínica resolvida.
            var patient = await portalRepository.GetPatientByCpfOrPhoneAsync(request.Cpf, request.Phone, clinicId, token);
            if (patient is null)
            {
                patient = Patient.Create(
                    clinicId: clinicId,
                    name: $"Paciente ({request.Phone.Trim()})",
                    phone: request.Phone.Trim(),
                    now: now,
                    document: request.Cpf.Trim());

                catalogRepository.AddPatient(patient);
            }

            var session = PatientPortalSession.Start(patient.Id, now, ipAddress, userAgent);
            await portalRepository.SaveSessionAsync(session, token);

            auditRepository.Add(AuditEvent.Record(
                clinicId,
                patient.Id.ToString(),
                patient.Name,
                "PatientPortalAuthenticated",
                "patient_portal_sessions",
                session.Id.ToString(),
                now,
                $"{{\"phone\":\"{request.Phone}\",\"devMode\":{isDev.ToString().ToLowerInvariant()}}}"));

            return new VerifyOtpResponse(true, session.SessionToken, patient.Id, patient.Name, "Autenticado com sucesso.");
        }, cancellationToken);
    }

    public async Task<IReadOnlyList<PublicSlotDto>> GetAvailableSlotsAsync(
        Guid clinicId,
        Guid specialtyId,
        Guid? professionalId,
        DateOnly date,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var allProfessionals = await catalogRepository.ListProfessionalsAsync(clinicId, cancellationToken);
        var professionals = allProfessionals
            .Where(p => p.SpecialtyId == specialtyId && p.IsActive)
            .ToList();

        if (professionalId.HasValue)
        {
            professionals = professionals.Where(p => p.Id == professionalId.Value).ToList();
        }

        var result = new List<PublicSlotDto>();
        var dayOfWeek = date.DayOfWeek;

        var hoursList = await clinicOperationRepository.ListOperatingHoursAsync(clinicId, cancellationToken);
        var clinicHours = hoursList.FirstOrDefault(h => h.DayOfWeek == (int)dayOfWeek);
        if (clinicHours is null)
        {
            return result;
        }

        var targetStart = date.ToDateTime(clinicHours.StartsAt);
        var targetEnd = date.ToDateTime(clinicHours.EndsAt);
        var startOffset = new DateTimeOffset(targetStart, TimeSpan.FromHours(-3));
        var endOffset = new DateTimeOffset(targetEnd, TimeSpan.FromHours(-3));

        foreach (var prof in professionals)
        {
            var appointments = await agendaRepository.ListAppointmentsAsync(clinicId, prof.Id, startOffset, endOffset, cancellationToken);
            var occupied = appointments.Where(a => a.OccupiesAgenda).Select(a => a.TimeRange).ToList();

            var cursor = startOffset;
            while (cursor.AddMinutes(30) <= endOffset)
            {
                var slotRange = new TimeRange(cursor, cursor.AddMinutes(30));

                if (cursor > now.AddHours(2) && !occupied.Any(o => o.Overlaps(slotRange)))
                {
                    result.Add(new PublicSlotDto(prof.Id, prof.Name, cursor, cursor.AddMinutes(30), 30));
                }

                cursor = cursor.AddMinutes(30);
            }
        }

        return result;
    }

    public async Task<OnlineAppointmentDto> BookAppointmentOnlineAsync(
        string sessionToken,
        BookOnlineAppointmentRequest request,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var session = await portalRepository.GetSessionAsync(sessionToken, now, cancellationToken);
        if (session is null)
        {
            throw new UnauthorizedAccessException("Sessão do portal inválida ou expirada.");
        }

        // RN-003: Limite de no máximo 2 agendamentos futuros não realizados
        var activeCount = await portalRepository.GetPatientActiveAppointmentsCountAsync(session.PatientId, now, cancellationToken);
        if (activeCount >= 2)
        {
            throw new InvalidOperationException("Você já possui 2 agendamentos ativos. Conclua ou cancele um agendamento anterior antes de marcar um novo.");
        }

        var type = await catalogRepository.FindAppointmentTypeAsync(request.ClinicId, request.AppointmentTypeId, cancellationToken);
        var effectiveTypeId = request.AppointmentTypeId;
        if (type is null)
        {
            var types = await catalogRepository.ListAppointmentTypesAsync(request.ClinicId, cancellationToken);
            var firstType = types.FirstOrDefault(t => t.IsActive) ?? types.FirstOrDefault();
            if (firstType is not null)
            {
                type = firstType;
                effectiveTypeId = firstType.Id;
            }
            else
            {
                throw new InvalidOperationException("Nenhum tipo de atendimento disponível para a clínica.");
            }
        }
        var duration = type.DurationMinutes;

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var appointment = Appointment.Schedule(
                request.ClinicId,
                request.ProfessionalId,
                session.PatientId,
                effectiveTypeId,
                request.StartsAt,
                duration,
                now,
                origin: "online");

            appointment.Confirm(now);
            agendaRepository.AddAppointment(appointment);

            var prof = await catalogRepository.FindProfessionalAsync(request.ClinicId, request.ProfessionalId, token);
            var spec = await catalogRepository.FindSpecialtyAsync(request.ClinicId, request.SpecialtyId, token);

            auditRepository.Add(AuditEvent.Record(
                request.ClinicId,
                session.PatientId.ToString(),
                "Paciente Online",
                "OnlineAppointmentBooked",
                "appointments",
                appointment.Id.ToString(),
                now,
                $"{{\"professionalId\":\"{request.ProfessionalId}\",\"startsAt\":\"{request.StartsAt:O}\",\"origin\":\"online\"}}"));

            return new OnlineAppointmentDto(
                appointment.Id,
                appointment.ClinicId,
                appointment.ProfessionalId,
                prof?.Name ?? "Profissional",
                spec?.Name ?? "Consulta Médica",
                appointment.StartsAt,
                appointment.EndsAt,
                AppointmentStatusMap.ToStoredValue(appointment.Status),
                appointment.PaymentStatus);
        }, cancellationToken);
    }

    public async Task<IReadOnlyList<OnlineAppointmentDto>> GetMyAppointmentsAsync(
        string sessionToken,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var session = await portalRepository.GetSessionAsync(sessionToken, now, cancellationToken);
        if (session is null)
        {
            throw new UnauthorizedAccessException("Sessão inválida ou expirada.");
        }

        var list = await portalRepository.GetPatientAppointmentsAsync(session.PatientId, cancellationToken);
        var dtos = new List<OnlineAppointmentDto>();

        foreach (var a in list)
        {
            var prof = await catalogRepository.FindProfessionalAsync(a.ClinicId, a.ProfessionalId, cancellationToken);
            var type = await catalogRepository.FindAppointmentTypeAsync(a.ClinicId, a.AppointmentTypeId, cancellationToken);

            string specialtyName = "Consulta Médica";
            var specialtyId = type?.SpecialtyId ?? prof?.SpecialtyId;
            if (specialtyId.HasValue)
            {
                var specialty = await catalogRepository.FindSpecialtyAsync(a.ClinicId, specialtyId.Value, cancellationToken);
                if (!string.IsNullOrWhiteSpace(specialty?.Name))
                {
                    specialtyName = specialty.Name;
                }
            }
            else if (!string.IsNullOrWhiteSpace(type?.Name))
            {
                specialtyName = type.Name;
            }

            dtos.Add(new OnlineAppointmentDto(
                a.Id,
                a.ClinicId,
                a.ProfessionalId,
                prof?.Name ?? "Médico",
                specialtyName,
                a.StartsAt,
                a.EndsAt,
                AppointmentStatusMap.ToStoredValue(a.Status),
                a.PaymentStatus));
        }

        return dtos;
    }

    public async Task CancelMyAppointmentAsync(
        string sessionToken,
        Guid appointmentId,
        string reason,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var session = await portalRepository.GetSessionAsync(sessionToken, now, cancellationToken);
        if (session is null)
        {
            throw new UnauthorizedAccessException("Sessão inválida ou expirada.");
        }

        var appointmentList = await portalRepository.GetPatientAppointmentsAsync(session.PatientId, cancellationToken);
        var target = appointmentList.FirstOrDefault(a => a.Id == appointmentId);
        if (target is null)
        {
            throw new InvalidOperationException("Agendamento não encontrado.");
        }

        // RN-005: Antecedência mínima de 2 horas para cancelamento autônomo
        if (target.StartsAt < now.AddHours(2))
        {
            throw new InvalidOperationException("Cancelamentos com menos de 2 horas de antecedência devem ser solicitados diretamente à recepção da clínica.");
        }

        await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            target.Cancel($"Cancelado pelo próprio paciente via Portal: {reason}", now);

            auditRepository.Add(AuditEvent.Record(
                target.ClinicId,
                session.PatientId.ToString(),
                "Paciente Online",
                "OnlineAppointmentCancelled",
                "appointments",
                target.Id.ToString(),
                now,
                $"{{\"reason\":\"{reason}\"}}"));

            return true;
        }, cancellationToken);
    }
}
