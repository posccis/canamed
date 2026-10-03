using Canamed.Api.Authorization;
using Canamed.Application.Identity;
using Canamed.Application.MedicalDocuments;
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
}
