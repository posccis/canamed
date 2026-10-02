using System.Text.Json;
using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;

namespace Canamed.Application.Privacy;

public sealed class PrivacyService(
    ICatalogRepository catalogRepository,
    IAgendaRepository agendaRepository,
    IPaymentRepository paymentRepository,
    ICurrentActorAccessor actorAccessor,
    IAuditRepository auditRepository,
    TimeProvider timeProvider)
{
    public async Task<PatientDataPortabilityResponse> ExportDataPortabilityAsync(
        Guid patientId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        actor.EnsurePermission(Permissions.PrivacyExport);

        var patient = await catalogRepository.FindPatientAsync(patientId, actor.ClinicId, cancellationToken).ConfigureAwait(false);
        if (patient is null)
        {
            throw new CanamedException(
                ProblemKind.NotFound,
                "Paciente não encontrado",
                "O paciente informado não existe nesta clínica.",
                "patient-not-found");
        }

        var appointments = await agendaRepository
            .ListAppointmentsByPatientAsync(actor.ClinicId, patientId, cancellationToken)
            .ConfigureAwait(false);

        var payments = await paymentRepository
            .ListByPatientAsync(patientId, actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        var professionals = await catalogRepository.ListProfessionalsAsync(actor.ClinicId, cancellationToken).ConfigureAwait(false);
        var profMap = professionals.ToDictionary(p => p.Id, p => p.Name);

        var types = await catalogRepository.ListAppointmentTypesAsync(actor.ClinicId, cancellationToken).ConfigureAwait(false);
        var typeMap = types.ToDictionary(t => t.Id, t => t.Name);

        var appointmentDtos = appointments.Select(a => new PatientAppointmentHistoryDto(
            a.Id,
            a.StartsAt,
            a.Status.ToStoredValue(),
            typeMap.TryGetValue(a.AppointmentTypeId, out var tName) ? tName : "Atendimento",
            profMap.TryGetValue(a.ProfessionalId, out var pName) ? pName : "Profissional",
            a.IsOverbooking)).ToList();

        var paymentDtos = payments.Select(p => new PatientPaymentHistoryDto(
            p.Id,
            p.PaidAt,
            p.Amount,
            p.Method,
            p.Status)).ToList();

        auditRepository.Add(AuditEvent.Record(
            actor.ClinicId,
            actor.UserId,
            actor.Name,
            AuditActions.PatientDataExported,
            AuditResources.Privacy,
            patient.Id.ToString(),
            timeProvider.GetUtcNow(),
            JsonSerializer.Serialize(new
            {
                patientId = patient.Id,
                totalAppointments = appointmentDtos.Count,
                totalPayments = paymentDtos.Count
            })));

        return new PatientDataPortabilityResponse(
            Confirmation: "Tratamento confirmado com base nos Art. 7, VIII e Art. 11, II, f da LGPD para fins de tutela da saúde e execução de contratos.",
            ExportedAt: timeProvider.GetUtcNow(),
            Patient: new PatientPersonalDataDto(
                patient.Id,
                patient.Name,
                patient.Phone,
                patient.Email,
                patient.BirthDate,
                patient.Document,
                patient.IsActive),
            Appointments: appointmentDtos,
            TriageRecords: [],
            Payments: paymentDtos);
    }

    public async Task<AnonymizePatientResponse> AnonymizePatientAsync(
        Guid patientId,
        AnonymizePatientRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        actor.EnsurePermission(Permissions.PrivacyAnonymize);

        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 5)
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Justificativa obrigatória",
                "A justificativa da anonimização deve conter no mínimo 5 caracteres.",
                "anonymization-reason-required");
        }

        var patient = await catalogRepository.FindPatientAsync(patientId, actor.ClinicId, cancellationToken).ConfigureAwait(false);
        if (patient is null)
        {
            throw new CanamedException(
                ProblemKind.NotFound,
                "Paciente não encontrado",
                "O paciente informado não existe nesta clínica.",
                "patient-not-found");
        }

        var appointments = await agendaRepository
            .ListAppointmentsByPatientAsync(actor.ClinicId, patientId, cancellationToken)
            .ConfigureAwait(false);

        var now = timeProvider.GetUtcNow();
        var hasFutureActive = appointments.Any(a => a.StartsAt >= now && a.Status is AppointmentStatus.Scheduled or AppointmentStatus.Confirmed);
        if (hasFutureActive)
        {
            throw new CanamedException(
                ProblemKind.Conflict,
                "Impossível anonimizar",
                "O paciente possui consultas futuras agendadas ou confirmadas. Cancele-as antes de proceder com a anonimização.",
                "patient-has-active-future-appointments");
        }

        patient.Anonymize(now);
        await catalogRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        auditRepository.Add(AuditEvent.Record(
            actor.ClinicId,
            actor.UserId,
            actor.Name,
            AuditActions.PatientAnonymized,
            AuditResources.Privacy,
            patient.Id.ToString(),
            now,
            JsonSerializer.Serialize(new
            {
                patientId = patient.Id,
                reason = request.Reason.Trim(),
                anonymizedAt = now
            })));

        return new AnonymizePatientResponse(
            patient.Id,
            "anonimizado",
            now,
            "Dados cadastrais diretos foram anonimizados em conformidade com a LGPD e Lei nº 13.787/2018.");
    }
}
