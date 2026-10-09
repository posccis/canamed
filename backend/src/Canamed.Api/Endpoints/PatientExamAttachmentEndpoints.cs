using Canamed.Api.Authorization;
using Canamed.Application.Identity;
using Canamed.Application.MedicalRecords;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class PatientExamAttachmentEndpoints
{
    public static RouteGroupBuilder MapPatientExamAttachmentEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var group = api.MapGroup("/patients/{patientId:guid}/exam-attachments");

        group.MapPost(string.Empty, UploadAttachmentAsync)
            .WithName("UploadPatientExamAttachment")
            .Produces<PatientExamAttachmentResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .RequirePermissions(Permissions.RecordsCreate)
            .DisableAntiforgery();

        group.MapGet(string.Empty, ListAttachmentsAsync)
            .WithName("ListPatientExamAttachments")
            .Produces<IReadOnlyList<PatientExamAttachmentResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .RequirePermissions(Permissions.RecordsRead);

        group.MapGet("/{id:guid}/download", DownloadAttachmentAsync)
            .WithName("DownloadPatientExamAttachment")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.RecordsRead);

        group.MapDelete("/{id:guid}", DeactivateAttachmentAsync)
            .WithName("DeactivatePatientExamAttachment")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.RecordsUpdate);

        return api;
    }

    private static async Task<IResult> UploadAttachmentAsync(
        PatientExamAttachmentService service,
        Guid patientId,
        HttpRequest request,
        CancellationToken cancellationToken)
    {
        if (!request.HasFormContentType)
        {
            return Results.BadRequest(new { message = "Requisição deve ser multipart/form-data." });
        }

        var form = await request.ReadFormAsync(cancellationToken);
        var file = form.Files.GetFile("file") ?? form.Files.FirstOrDefault();
        if (file is null || file.Length == 0)
        {
            return Results.BadRequest(new { message = "Nenhum arquivo enviado." });
        }

        var title = form["title"].ToString();
        var examType = form["examType"].ToString();
        var examDateStr = form["examDate"].ToString();
        var labFacility = form["labFacility"].ToString();
        var notes = form["notes"].ToString();
        var medicalRecordIdStr = form["medicalRecordId"].ToString();

        if (string.IsNullOrWhiteSpace(title))
        {
            return Results.BadRequest(new { message = "O título do exame é obrigatório." });
        }

        if (string.IsNullOrWhiteSpace(examType))
        {
            return Results.BadRequest(new { message = "O tipo do exame é obrigatório." });
        }

        if (!DateOnly.TryParse(examDateStr, out var examDate))
        {
            examDate = DateOnly.FromDateTime(DateTime.UtcNow);
        }

        Guid? medicalRecordId = Guid.TryParse(medicalRecordIdStr, out var mId) ? mId : null;

        var metadata = new CreateExamAttachmentMetadata(
            title,
            examType,
            examDate,
            string.IsNullOrWhiteSpace(labFacility) ? null : labFacility,
            string.IsNullOrWhiteSpace(notes) ? null : notes,
            medicalRecordId);

        await using var stream = file.OpenReadStream();
        var response = await service.UploadAttachmentAsync(
            patientId,
            metadata,
            file.FileName,
            file.ContentType,
            stream,
            cancellationToken);

        return Results.Created($"/api/v1/patients/{patientId}/exam-attachments/{response.Id}", response);
    }

    private static async Task<IResult> ListAttachmentsAsync(
        PatientExamAttachmentService service,
        Guid patientId,
        CancellationToken cancellationToken)
    {
        var list = await service.ListByPatientAsync(patientId, cancellationToken);
        return Results.Ok(list);
    }

    private static async Task<IResult> DownloadAttachmentAsync(
        PatientExamAttachmentService service,
        Guid patientId,
        Guid id,
        CancellationToken cancellationToken)
    {
        var (stream, fileName, contentType) = await service.GetFileForDownloadAsync(id, cancellationToken);
        return Results.File(stream, contentType, fileName);
    }

    private static async Task<IResult> DeactivateAttachmentAsync(
        PatientExamAttachmentService service,
        Guid patientId,
        Guid id,
        CancellationToken cancellationToken)
    {
        await service.DeactivateAttachmentAsync(id, cancellationToken);
        return Results.NoContent();
    }
}
