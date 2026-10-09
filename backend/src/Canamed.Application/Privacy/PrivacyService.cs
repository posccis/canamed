using System.Text.Json;
using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Application.Portal;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;
using Canamed.Domain.Privacy;

namespace Canamed.Application.Privacy;

public sealed class PrivacyService(
    IPrivacyRepository privacyRepository,
    IPortalRepository portalRepository,
    ICatalogRepository catalogRepository,
    IAgendaRepository agendaRepository,
    IPaymentRepository paymentRepository,
    ICurrentActorAccessor actorAccessor,
    IAuditRepository auditRepository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider)
{
    public async Task<PrivacyRequestResponse> OpenPrivacyRequestAsync(
        string sessionToken,
        CreatePrivacyRequestInput input,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        return await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var session = await portalRepository.GetSessionAsync(sessionToken, now, ct);
            if (session is null)
            {
                throw new UnauthorizedAccessException("Sessão inválida ou expirada.");
            }

            var type = input.RequestType.ToLowerInvariant() switch
            {
                "data_access" => PrivacyRequestType.DataAccess,
                "rectification" => PrivacyRequestType.Rectification,
                "deletion" => PrivacyRequestType.Deletion,
                "consent_revocation" => PrivacyRequestType.ConsentRevocation,
                _ => throw new ArgumentException("Tipo de solicitação LGPD desconhecido.", nameof(input.RequestType)),
            };

            var request = PrivacyRequest.Open(input.ClinicId, session.PatientId, type, input.Details, now);
            await privacyRepository.AddRequestAsync(request, ct);

            auditRepository.Add(AuditEvent.Record(
                input.ClinicId,
                session.PatientId.ToString(),
                "Titular dos Dados",
                "PrivacyRequestCreated",
                "privacy_requests",
                request.Id.ToString(),
                now,
                $"{{\"protocol\":\"{request.Protocol}\",\"type\":\"{request.RequestType}\"}}"));

            return MapResponse(request);
        }, cancellationToken);
    }

    public async Task<PrivacyRequestResponse> GetRequestByProtocolAsync(
        string protocol,
        CancellationToken cancellationToken = default)
    {
        var request = await privacyRepository.GetRequestByProtocolAsync(protocol.Trim(), cancellationToken);
        if (request is null)
        {
            throw new KeyNotFoundException("Protocolo de solicitação de privacidade não encontrado.");
        }

        return MapResponse(request);
    }

    public async Task<PatientDataExportDto> ExportMyDataAsync(
        string sessionToken,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        return await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var session = await portalRepository.GetSessionAsync(sessionToken, now, ct);
            if (session is null)
            {
                throw new UnauthorizedAccessException("Sessão inválida ou expirada.");
            }

            var patientAppointments = await portalRepository.GetPatientAppointmentsAsync(session.PatientId, ct);
            var clinicId = patientAppointments.FirstOrDefault()?.ClinicId ?? Guid.Empty;

            var patient = await catalogRepository.FindPatientAsync(clinicId, session.PatientId, ct);
            var name = patient?.Name ?? "Paciente";
            var phone = patient?.Phone ?? "";
            var cpf = patient?.Document;
            var email = patient?.Email;
            var birthDate = patient?.BirthDate;
            var createdAt = patient?.CreatedAt ?? now;

            var aptHistory = new List<PatientAppointmentHistoryItem>();

            foreach (var a in patientAppointments)
            {
                var prof = await catalogRepository.FindProfessionalAsync(a.ClinicId, a.ProfessionalId, ct);
                aptHistory.Add(new PatientAppointmentHistoryItem(
                    a.Id,
                    a.StartsAt,
                    AppointmentStatusMap.ToStoredValue(a.Status),
                    prof?.Name ?? "Médico"));
            }

            const string legalNotice = "Declaração de Conformidade Regulatória (LGPD e CFM): Os dados cadastrais acima refletem as informações registradas na plataforma CANAMED. Conforme estipulado pelo Artigo 16, I da Lei Federal nº 13.709/2018 (LGPD), pela Lei Federal nº 13.787/2018 e pelo Conselho Federal de Medicina (CFM), os prontuários eletrônicos e registros clínicos possuem guarda médica legal obrigatória de no mínimo 20 (vinte) anos após o último registro, razão pela qual permanecem arquivados sob estrito sigilo profissional.";

            auditRepository.Add(AuditEvent.Record(
                clinicId,
                session.PatientId.ToString(),
                name,
                "PrivacyDataExported",
                "patients",
                session.PatientId.ToString(),
                now,
                "{\"format\":\"json\"}"));

            return new PatientDataExportDto(
                session.PatientId,
                name,
                cpf,
                phone,
                email,
                birthDate,
                createdAt,
                aptHistory,
                legalNotice);
        }, cancellationToken);
    }

    public async Task<IReadOnlyList<ConsentItemDto>> GetMyConsentsAsync(
        string sessionToken,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var session = await portalRepository.GetSessionAsync(sessionToken, now, cancellationToken);
        if (session is null)
        {
            throw new UnauthorizedAccessException("Sessão inválida ou expirada.");
        }

        var consents = await privacyRepository.ListConsentsByPatientAsync(session.PatientId, cancellationToken);
        return consents.Select(c => new ConsentItemDto(c.Id, c.ConsentType, c.PolicyVersion, c.IsGranted, c.GrantedAt)).ToList();
    }

    public async Task UpdateConsentAsync(
        string sessionToken,
        UpdateConsentInput input,
        string? ipAddress,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var session = await portalRepository.GetSessionAsync(sessionToken, now, ct);
            if (session is null)
            {
                throw new UnauthorizedAccessException("Sessão inválida ou expirada.");
            }

            var consent = await privacyRepository.GetConsentByTypeAsync(session.PatientId, input.ConsentType, ct);
            if (consent is null)
            {
                consent = PrivacyConsent.Grant(session.PatientId, input.ConsentType, "1.0", now, ipAddress);
                if (!input.IsGranted)
                {
                    consent.Revoke(now, ipAddress);
                }
            }
            else
            {
                if (input.IsGranted)
                {
                    consent = PrivacyConsent.Grant(session.PatientId, input.ConsentType, consent.PolicyVersion, now, ipAddress);
                }
                else
                {
                    consent.Revoke(now, ipAddress);
                }
            }

            await privacyRepository.SaveConsentAsync(consent, ct);

            auditRepository.Add(AuditEvent.Record(
                Guid.Empty,
                session.PatientId.ToString(),
                "Titular dos Dados",
                "PrivacyConsentUpdated",
                "privacy_consents",
                consent.Id.ToString(),
                now,
                $"{{\"consentType\":\"{input.ConsentType}\",\"isGranted\":{input.IsGranted.ToString().ToLowerInvariant()}}}"));

            return true;
        }, cancellationToken);
    }

    public async Task<IReadOnlyList<PrivacyRequestResponse>> ListRequestsForClinicAsync(
        Guid clinicId,
        string? statusFilter,
        CancellationToken cancellationToken = default)
    {
        PrivacyRequestStatus? status = null;
        if (!string.IsNullOrWhiteSpace(statusFilter) && Enum.TryParse<PrivacyRequestStatus>(statusFilter, true, out var parsed))
        {
            status = parsed;
        }

        var list = await privacyRepository.ListRequestsByClinicAsync(clinicId, status, cancellationToken);
        return list.Select(MapResponse).ToList();
    }

    public async Task<PrivacyRequestResponse> DpoRespondRequestAsync(
        Guid requestId,
        DpoRespondPrivacyRequestInput input,
        Guid dpoUserId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        return await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var request = await privacyRepository.GetRequestByIdAsync(requestId, ct);
            if (request is null)
            {
                throw new KeyNotFoundException("Solicitação não encontrada.");
            }

            var targetStatus = input.Status.ToLowerInvariant() switch
            {
                "completed" => PrivacyRequestStatus.Completed,
                "rejected" => PrivacyRequestStatus.Rejected,
                _ => PrivacyRequestStatus.UnderReview,
            };

            request.Respond(input.ResponseNotes, targetStatus, now);
            await privacyRepository.UpdateRequestAsync(request, ct);

            auditRepository.Add(AuditEvent.Record(
                request.ClinicId,
                dpoUserId.ToString(),
                "DPO Encarregado",
                "PrivacyRequestAnswered",
                "privacy_requests",
                request.Id.ToString(),
                now,
                $"{{\"protocol\":\"{request.Protocol}\",\"finalStatus\":\"{targetStatus}\"}}"));

            return MapResponse(request);
        }, cancellationToken);
    }

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

    private static PrivacyRequestResponse MapResponse(PrivacyRequest r) =>
        new(
            r.Id,
            r.Protocol,
            r.ClinicId,
            r.PatientId,
            r.RequestType.ToString(),
            r.Details,
            r.Status.ToString().ToLowerInvariant(),
            r.ResponseNotes,
            r.DueDate,
            r.CompletedAt,
            r.CreatedAt);
}
