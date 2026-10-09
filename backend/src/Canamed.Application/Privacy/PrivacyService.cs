using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Portal;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;
using Canamed.Domain.Privacy;

namespace Canamed.Application.Privacy;

public sealed class PrivacyService(
    IPrivacyRepository privacyRepository,
    IPortalRepository portalRepository,
    ICatalogRepository catalogRepository,
    IAuditRepository auditRepository,
    IUnitOfWork unitOfWork)
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
