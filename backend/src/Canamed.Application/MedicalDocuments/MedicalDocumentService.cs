using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Auditing;
using Canamed.Domain.MedicalDocuments;

namespace Canamed.Application.MedicalDocuments;

public sealed class MedicalDocumentService(
    IMedicalDocumentRepository documentRepository,
    IDigitalSignatureProvider signatureProvider,
    IAuditRepository auditRepository,
    IUnitOfWork unitOfWork,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    public async Task<MedicalDocumentResponse> CreateDraftAsync(
        CreateMedicalDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.DocumentsCreate))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para emitir documentos médicos.", "permission-denied");
        }

        var doctorId = actor.ProfessionalId
            ?? (Guid.TryParse(actor.UserId, out var parsedGuid) ? parsedGuid : Guid.Empty);

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            MedicalDocument document;
            try
            {
                document = MedicalDocument.CreateDraft(
                    actor.ClinicId,
                    request.PatientId,
                    doctorId,
                    request.MedicalRecordId,
                    request.DocumentType,
                    request.ContentPayload,
                    request.Cid10Code,
                    request.PatientConsentedCid,
                    now);
            }
            catch (ArgumentException ex)
            {
                throw new CanamedException(ProblemKind.Validation, "Dados inválidos", ex.Message, "invalid-document");
            }
            catch (InvalidOperationException ex)
            {
                throw new CanamedException(ProblemKind.Validation, "Conformidade ética", ex.Message, "cid-consent-required");
            }

            await documentRepository.AddAsync(document, token);

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.MedicalDocumentCreated,
                AuditResources.MedicalDocuments,
                document.Id.ToString(),
                now,
                $"{{\"type\":\"{document.DocumentType}\",\"patientId\":\"{document.PatientId}\"}}"));

            return MapToResponse(document);
        }, cancellationToken);
    }

    public async Task<MedicalDocumentResponse> UpdateDraftAsync(
        Guid documentId,
        UpdateMedicalDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.DocumentsCreate))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para alterar documentos médicos.", "permission-denied");
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var document = await documentRepository.GetByIdAsync(documentId, actor.ClinicId, token);
            if (document is null)
            {
                throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Documento médico não encontrado.", "document-not-found");
            }

            try
            {
                document.UpdateDraft(request.ContentPayload, request.Cid10Code, request.PatientConsentedCid, now);
            }
            catch (InvalidOperationException ex)
            {
                throw new CanamedException(ProblemKind.Conflict, "Conflito", ex.Message, "document-not-draft");
            }

            await documentRepository.UpdateAsync(document, token);
            return MapToResponse(document);
        }, cancellationToken);
    }

    public async Task<MedicalDocumentResponse> SignDocumentAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.DocumentsSign))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para assinar documentos médicos.", "permission-denied");
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var document = await documentRepository.GetByIdAsync(documentId, actor.ClinicId, token);
            if (document is null)
            {
                throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Documento médico não encontrado.", "document-not-found");
            }

            var hash = await signatureProvider.ComputeSignatureHashAsync(document, token);

            try
            {
                document.Sign(hash, now);
            }
            catch (InvalidOperationException ex)
            {
                throw new CanamedException(ProblemKind.Conflict, "Conflito", ex.Message, "document-already-signed");
            }

            await documentRepository.UpdateAsync(document, token);

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.MedicalDocumentSigned,
                AuditResources.MedicalDocuments,
                document.Id.ToString(),
                now,
                $"{{\"publicToken\":\"{document.PublicToken}\"}}"));

            return MapToResponse(document);
        }, cancellationToken);
    }

    public async Task<MedicalDocumentResponse> CancelDocumentAsync(
        Guid documentId,
        CancelMedicalDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.DocumentsCancel))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para cancelar documentos médicos.", "permission-denied");
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var document = await documentRepository.GetByIdAsync(documentId, actor.ClinicId, token);
            if (document is null)
            {
                throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Documento médico não encontrado.", "document-not-found");
            }

            try
            {
                document.Cancel(request.Reason, now);
            }
            catch (ArgumentException ex)
            {
                throw new CanamedException(ProblemKind.Validation, "Dados inválidos", ex.Message, "invalid-cancellation-reason");
            }
            catch (InvalidOperationException ex)
            {
                throw new CanamedException(ProblemKind.Conflict, "Conflito", ex.Message, "document-already-cancelled");
            }

            await documentRepository.UpdateAsync(document, token);

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.MedicalDocumentCancelled,
                AuditResources.MedicalDocuments,
                document.Id.ToString(),
                now,
                $"{{\"reason\":\"{document.CancellationReason}\"}}"));

            return MapToResponse(document);
        }, cancellationToken);
    }

    public async Task<MedicalDocumentResponse> GetByIdAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.DocumentsRead) && !actor.Has(Permissions.DocumentsPrint))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para visualizar este documento.", "permission-denied");
        }

        var document = await documentRepository.GetByIdAsync(documentId, actor.ClinicId, cancellationToken);
        if (document is null)
        {
            throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Documento médico não encontrado.", "document-not-found");
        }

        var now = timeProvider.GetUtcNow();
        auditRepository.Add(AuditEvent.Record(
            actor.ClinicId,
            actor.UserId,
            actor.Name,
            AuditActions.MedicalDocumentViewed,
            AuditResources.MedicalDocuments,
            document.Id.ToString(),
            now,
            $"{{\"status\":\"{document.Status}\"}}"));
        await auditRepository.SaveChangesAsync(cancellationToken);

        return MapToResponse(document);
    }

    public async Task<IReadOnlyList<MedicalDocumentResponse>> GetByPatientIdAsync(
        Guid patientId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.DocumentsRead))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para listar documentos médicos.", "permission-denied");
        }

        var documents = await documentRepository.GetByPatientIdAsync(patientId, actor.ClinicId, cancellationToken);
        return documents.Select(MapToResponse).ToList();
    }

    public async Task<PublicDocumentValidationResponse> ValidatePublicTokenAsync(
        string publicToken,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(publicToken))
        {
            throw new CanamedException(ProblemKind.Validation, "Token inválido", "O código verificador do documento deve ser informado.", "invalid-token");
        }

        var document = await documentRepository.GetByPublicTokenAsync(publicToken.Trim(), cancellationToken);
        if (document is null)
        {
            throw new CanamedException(ProblemKind.NotFound, "Não localizado", "Documento médico não localizado ou código verificador inválido.", "document-not-found");
        }

        return new PublicDocumentValidationResponse(
            IsValid: document.Status == MedicalDocumentStatus.Assinado,
            Status: document.Status,
            DocumentType: document.DocumentType,
            IssuedAt: document.SignedAt,
            DoctorName: "Profissional Responsável",
            ClinicName: "Clínica CANAMED",
            PatientInitials: "Paciente Protegido (LGPD)",
            CancellationReason: document.CancellationReason);
    }

    private static MedicalDocumentResponse MapToResponse(MedicalDocument doc) =>
        new(
            doc.Id,
            doc.ClinicId,
            doc.PatientId,
            doc.DoctorId,
            doc.MedicalRecordId,
            doc.DocumentType,
            doc.Status,
            doc.ContentPayload,
            doc.Cid10Code,
            doc.PatientConsentedCid,
            doc.SignatureHash,
            doc.PublicToken,
            doc.CancellationReason,
            doc.SignedAt,
            doc.CancelledAt,
            doc.CreatedAt);
}
