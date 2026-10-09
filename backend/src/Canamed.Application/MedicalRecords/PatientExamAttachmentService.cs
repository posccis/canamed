using System.Security.Cryptography;
using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Auditing;
using Canamed.Domain.MedicalRecords;

namespace Canamed.Application.MedicalRecords;

public sealed class PatientExamAttachmentService(
    IMedicalRecordRepository recordRepository,
    IFileStorage fileStorage,
    IAuditRepository auditRepository,
    IUnitOfWork unitOfWork,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp"
    };

    private const long MaxFileSizeBytes = 15 * 1024 * 1024; // 15 MB

    public async Task<PatientExamAttachmentResponse> UploadAttachmentAsync(
        Guid patientId,
        CreateExamAttachmentMetadata metadata,
        string originalFileName,
        string contentType,
        Stream fileStream,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(metadata);
        ArgumentException.ThrowIfNullOrWhiteSpace(originalFileName);
        ArgumentException.ThrowIfNullOrWhiteSpace(contentType);
        ArgumentNullException.ThrowIfNull(fileStream);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsCreate) && !actor.Has(Permissions.RecordsUpdate))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para anexar exames ao prontuário.", "permission-denied");
        }

        var normalizedContentType = contentType.Trim().ToLowerInvariant();
        if (!AllowedMimeTypes.Contains(normalizedContentType))
        {
            throw new CanamedException(ProblemKind.Validation, "Formato não suportado", "Apenas documentos PDF e imagens (PNG, JPEG, WEBP) podem ser anexados.", "invalid-file-type");
        }

        // Buffer do arquivo para cálculo de SHA-256 e salvamento seguro
        using var memoryStream = new MemoryStream();
        await fileStream.CopyToAsync(memoryStream, cancellationToken).ConfigureAwait(false);
        var fileSizeBytes = memoryStream.Length;

        if (fileSizeBytes == 0)
        {
            throw new CanamedException(ProblemKind.Validation, "Arquivo vazio", "O arquivo selecionado está vazio.", "empty-file");
        }

        if (fileSizeBytes > MaxFileSizeBytes)
        {
            throw new CanamedException(ProblemKind.Validation, "Arquivo muito grande", "O tamanho máximo permitido para anexo de exame é de 15 MB.", "file-too-large");
        }

        memoryStream.Position = 0;
        var sha256Bytes = await SHA256.HashDataAsync(memoryStream, cancellationToken).ConfigureAwait(false);
        var fileHash = Convert.ToHexString(sha256Bytes).ToLowerInvariant();

        memoryStream.Position = 0;
        var attachmentId = Guid.NewGuid();
        var extension = Path.GetExtension(originalFileName);
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension = normalizedContentType == "application/pdf" ? ".pdf" : ".jpg";
        }

        var storageRelativePath = $"patients/{patientId}/exams/{attachmentId}{extension}";
        await fileStorage.SaveFileAsync(storageRelativePath, memoryStream, cancellationToken).ConfigureAwait(false);

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var attachment = PatientExamAttachment.Create(
                actor.ClinicId,
                patientId,
                metadata.MedicalRecordId,
                metadata.Title,
                metadata.ExamType,
                metadata.ExamDate,
                metadata.LabFacility,
                metadata.Notes,
                originalFileName,
                normalizedContentType,
                fileSizeBytes,
                fileHash,
                storageRelativePath,
                actor.UserId,
                actor.Name,
                now);

            await recordRepository.AddExamAttachmentAsync(attachment, token).ConfigureAwait(false);

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.ExamAttachmentUploaded,
                AuditResources.ExamAttachments,
                attachment.Id.ToString(),
                now,
                $"{{\"patientId\":\"{patientId}\",\"title\":\"{attachment.Title}\",\"examType\":\"{attachment.ExamType}\",\"hash\":\"{fileHash}\"}}"));

            return MapToResponse(attachment);
        }, cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<PatientExamAttachmentResponse>> ListByPatientAsync(
        Guid patientId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        actor.EnsurePermission(Permissions.RecordsRead);

        var attachments = await recordRepository
            .ListExamAttachmentsByPatientAsync(patientId, actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        return attachments.Select(MapToResponse).ToList();
    }

    public async Task<(Stream Stream, string FileName, string ContentType)> GetFileForDownloadAsync(
        Guid attachmentId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        actor.EnsurePermission(Permissions.RecordsRead);

        var attachment = await recordRepository
            .GetExamAttachmentByIdAsync(attachmentId, actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        if (attachment is null || !attachment.IsActive)
        {
            throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Exame anexado não encontrado ou inativado.", "attachment-not-found");
        }

        var stream = await fileStorage.GetFileAsync(attachment.StoragePath, cancellationToken).ConfigureAwait(false);
        if (stream is null)
        {
            throw new CanamedException(ProblemKind.NotFound, "Arquivo não localizado", "O arquivo físico do anexo não foi localizado no armazenamento.", "file-not-found");
        }

        var now = timeProvider.GetUtcNow();
        auditRepository.Add(AuditEvent.Record(
            actor.ClinicId,
            actor.UserId,
            actor.Name,
            AuditActions.ExamAttachmentViewed,
            AuditResources.ExamAttachments,
            attachment.Id.ToString(),
            now,
            $"{{\"title\":\"{attachment.Title}\",\"fileName\":\"{attachment.FileName}\"}}"));
        await auditRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return (stream, attachment.FileName, attachment.ContentType);
    }

    public async Task DeactivateAttachmentAsync(
        Guid attachmentId,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.RecordsUpdate) && !actor.Has(Permissions.RecordsCreate))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para inativar anexos.", "permission-denied");
        }

        var attachment = await recordRepository
            .GetExamAttachmentByIdAsync(attachmentId, actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        if (attachment is null || !attachment.IsActive)
        {
            throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Exame anexado não encontrado.", "attachment-not-found");
        }

        var now = timeProvider.GetUtcNow();
        await unitOfWork.ExecuteInTransactionAsync<bool>(async token =>
        {
            attachment.Deactivate(now);
            await recordRepository.UpdateExamAttachmentAsync(attachment, token).ConfigureAwait(false);

            auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.ExamAttachmentDeactivated,
                AuditResources.ExamAttachments,
                attachment.Id.ToString(),
                now,
                $"{{\"title\":\"{attachment.Title}\"}}"));

            return true;
        }, cancellationToken).ConfigureAwait(false);
    }

    private static PatientExamAttachmentResponse MapToResponse(PatientExamAttachment a) =>
        new(
            a.Id,
            a.ClinicId,
            a.PatientId,
            a.MedicalRecordId,
            a.Title,
            a.ExamType,
            a.ExamDate,
            a.LabFacility,
            a.Notes,
            a.FileName,
            a.ContentType,
            a.FileSizeBytes,
            a.FileHash,
            a.UploadedByUserId,
            a.UploadedByName,
            a.IsActive,
            a.CreatedAt);
}
