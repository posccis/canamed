using Canamed.Api.Authorization;
using Canamed.Application.Abstractions;
using Canamed.Application.Identity;
using Canamed.Application.MedicalDocuments;
using Canamed.Domain.MedicalDocuments;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class MedicalDocumentEndpoints
{
    public static RouteGroupBuilder MapMedicalDocumentEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var documents = api.MapGroup("/medical-documents");

        documents.MapPost(string.Empty, CreateDraftAsync)
            .WithName("CreateMedicalDocumentDraft")
            .Produces<MedicalDocumentResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permissions.DocumentsCreate);

        documents.MapPut("/{id:guid}", UpdateDraftAsync)
            .WithName("UpdateMedicalDocumentDraft")
            .Produces<MedicalDocumentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.DocumentsCreate);

        documents.MapPost("/{id:guid}/sign", SignDocumentAsync)
            .WithName("SignMedicalDocument")
            .Produces<MedicalDocumentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.DocumentsSign);

        documents.MapPost("/{id:guid}/cancel", CancelDocumentAsync)
            .WithName("CancelMedicalDocument")
            .Produces<MedicalDocumentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.DocumentsCancel);

        documents.MapGet("/{id:guid}", GetByIdAsync)
            .WithName("GetMedicalDocumentById")
            .Produces<MedicalDocumentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        api.MapGet("/patients/{patientId:guid}/medical-documents", GetByPatientIdAsync)
            .WithName("GetPatientMedicalDocuments")
            .Produces<IReadOnlyList<MedicalDocumentResponse>>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.DocumentsRead);

        api.MapGet("/public/validate-document/{publicToken}", ValidatePublicDocumentAsync)
            .WithName("ValidatePublicMedicalDocument")
            .Produces<PublicDocumentValidationResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AllowAnonymous();

        api.MapPost("/public/validate-document/{publicToken}/unlock", UnlockPublicDocumentAsync)
            .WithName("UnlockPublicMedicalDocument")
            .Produces<MedicalDocumentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AllowAnonymous();

        api.MapGet("/public/validate-document/{publicToken}/download", DownloadPublicDocumentAsync)
            .WithName("DownloadPublicMedicalDocument")
            .Produces(StatusCodes.Status200OK, contentType: "application/pdf")
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AllowAnonymous();

        return api;
    }

    private static async Task<IResult> CreateDraftAsync(
        MedicalDocumentService service,
        [FromBody] CreateMedicalDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.CreateDraftAsync(request, cancellationToken).ConfigureAwait(false);
        return Results.Created($"/api/v1/medical-documents/{result.Id}", result);
    }

    private static async Task<IResult> UpdateDraftAsync(
        MedicalDocumentService service,
        Guid id,
        [FromBody] UpdateMedicalDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.UpdateDraftAsync(id, request, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> SignDocumentAsync(
        MedicalDocumentService service,
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await service.SignDocumentAsync(id, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> CancelDocumentAsync(
        MedicalDocumentService service,
        Guid id,
        [FromBody] CancelMedicalDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.CancelDocumentAsync(id, request, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetByIdAsync(
        MedicalDocumentService service,
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await service.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetByPatientIdAsync(
        MedicalDocumentService service,
        Guid patientId,
        CancellationToken cancellationToken)
    {
        var result = await service.GetByPatientIdAsync(patientId, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> ValidatePublicDocumentAsync(
        MedicalDocumentService service,
        string publicToken,
        CancellationToken cancellationToken)
    {
        var result = await service.ValidatePublicTokenAsync(publicToken, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> UnlockPublicDocumentAsync(
        IMedicalDocumentRepository documentRepository,
        ICatalogRepository catalogRepository,
        string publicToken,
        [FromBody] UnlockChallengeRequest challenge,
        HttpContext httpContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var doc = await documentRepository.GetByPublicTokenAsync(publicToken.Trim(), cancellationToken);
        if (doc is null)
        {
            return Results.NotFound(new { message = "Documento não encontrado." });
        }

        var patient = await catalogRepository.FindPatientAsync(doc.ClinicId, doc.PatientId, cancellationToken);
        if (patient is null)
        {
            return Results.NotFound(new { message = "Paciente associado não encontrado." });
        }

        var birthYearMatch = patient.BirthDate.HasValue &&
            challenge.Answer.Trim() == patient.BirthDate.Value.Year.ToString();

        var cpfMatch = !string.IsNullOrEmpty(patient.Document) &&
            challenge.Answer.Trim() == new string(patient.Document.Where(char.IsDigit).Take(3).ToArray());

        if (!birthYearMatch && !cpfMatch)
        {
            return Results.BadRequest(new { message = "Resposta do desafio de segurança incorreta." });
        }

        var ip = httpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = httpContext.Request.Headers.UserAgent.ToString();
        await documentRepository.LogAccessAsync(
            MedicalDocumentAccessLog.Record(doc.Id, "challenge_unlocked", timeProvider.GetUtcNow(), ip, userAgent),
            cancellationToken);

        return Results.Ok(new MedicalDocumentResponse(
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
            doc.CreatedAt));
    }

    private static async Task<IResult> DownloadPublicDocumentAsync(
        IMedicalDocumentRepository documentRepository,
        string publicToken,
        HttpContext httpContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var doc = await documentRepository.GetByPublicTokenAsync(publicToken.Trim(), cancellationToken);
        if (doc is null)
        {
            return Results.NotFound();
        }

        var ip = httpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = httpContext.Request.Headers.UserAgent.ToString();
        await documentRepository.LogAccessAsync(
            MedicalDocumentAccessLog.Record(doc.Id, "pdf_downloaded", timeProvider.GetUtcNow(), ip, userAgent),
            cancellationToken);

        var pdfBytes = System.Text.Encoding.UTF8.GetBytes(
            $"%PDF-1.4\n1 0 obj\n<< /Title (Documento Clinico CANAMED) /Subject ({doc.DocumentType}) /Author (CANAMED) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF");

        return Results.File(pdfBytes, "application/pdf", $"canamed-{doc.DocumentType.ToLowerInvariant()}-{doc.PublicToken[..8]}.pdf");
    }
}

public sealed record UnlockChallengeRequest(string Answer);
