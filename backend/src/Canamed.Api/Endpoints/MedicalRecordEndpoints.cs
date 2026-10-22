using Canamed.Api.Authorization;
using Canamed.Application.Identity;
using Canamed.Application.MedicalRecords;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class MedicalRecordEndpoints
{
    public static RouteGroupBuilder MapMedicalRecordEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var records = api.MapGroup("/medical-records");

        records.MapPost(string.Empty, StartOrGetRecordAsync)
            .WithName("StartMedicalRecord")
            .Produces<MedicalRecordResponse>(StatusCodes.Status200OK)
            .Produces<MedicalRecordResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permissions.RecordsCreate);

        records.MapPut("/{id:guid}", UpdateDraftAsync)
            .WithName("UpdateDraftMedicalRecord")
            .Produces<MedicalRecordResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.RecordsUpdate);

        records.MapPost("/{id:guid}/finalize", FinalizeRecordAsync)
            .WithName("FinalizeMedicalRecord")
            .Produces<MedicalRecordResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.RecordsFinalize);

        records.MapPost("/{id:guid}/addenda", AddAddendumAsync)
            .WithName("AddMedicalRecordAddendum")
            .Produces<MedicalRecordAddendumResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.RecordsAddendum);

        records.MapGet("/{id:guid}", GetByIdAsync)
            .WithName("GetMedicalRecordById")
            .Produces<MedicalRecordResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.RecordsRead);

        api.MapGet("/patients/{patientId:guid}/medical-records", GetHistoryByPatientIdAsync)
            .WithName("GetPatientMedicalRecordHistory")
            .Produces<IReadOnlyList<MedicalRecordResponse>>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.RecordsRead);

        records.MapGet("/patients/{patientId:guid}/gynecological-profile", GetGynecologicalProfileAsync)
            .WithName("GetGynecologicalProfile")
            .Produces<GynecologicalProfileDto>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.RecordsRead);

        records.MapPut("/patients/{patientId:guid}/gynecological-profile", UpdateGynecologicalProfileAsync)
            .WithName("UpdateGynecologicalProfile")
            .Produces<GynecologicalProfileDto>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.RecordsCreate);

        records.MapGet("/patients/{patientId:guid}/screenings", ListScreeningsAsync)
            .WithName("ListPatientScreenings")
            .Produces<IReadOnlyList<PreventiveScreeningDto>>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.RecordsRead);

        records.MapPost("/patients/{patientId:guid}/screenings", AddScreeningAsync)
            .WithName("AddPatientScreening")
            .Produces<PreventiveScreeningDto>(StatusCodes.Status201Created)
            .RequirePermissions(Permissions.RecordsCreate);

        records.MapGet("/{id:guid}/gynecological", GetGynecologicalConsultationDataAsync)
            .WithName("GetGynecologicalConsultationData")
            .Produces<GynecologicalConsultationDataDto>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.RecordsRead);

        records.MapPut("/{id:guid}/gynecological", UpdateGynecologicalConsultationDataAsync)
            .WithName("UpdateGynecologicalConsultationData")
            .Produces<GynecologicalConsultationDataDto>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.RecordsCreate);

        records.MapPost("/{id:guid}/prenatal-visits", AddPrenatalVisitAsync)
            .WithName("AddPrenatalVisit")
            .Produces<PrenatalVisitDto>(StatusCodes.Status201Created)
            .RequirePermissions(Permissions.RecordsCreate);

        api.MapGet("/patients/{patientId:guid}/prenatal-visits", ListPrenatalVisitsAsync)
            .WithName("ListPatientPrenatalVisits")
            .Produces<IReadOnlyList<PrenatalVisitDto>>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.RecordsRead);

        api.MapGet("/patients/{patientId:guid}/prenatal-card/pdf", DownloadPrenatalCardPdfAsync)
            .WithName("DownloadPrenatalCardPdf")
            .Produces(StatusCodes.Status200OK, contentType: "application/pdf")
            .RequirePermissions(Permissions.RecordsRead);

        return api;
    }

    private static async Task<IResult> StartOrGetRecordAsync(
        MedicalRecordService service,
        [FromBody] StartMedicalRecordRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.StartOrGetRecordAsync(request, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> UpdateDraftAsync(
        MedicalRecordService service,
        Guid id,
        [FromBody] UpdateDraftMedicalRecordRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.UpdateDraftAsync(id, request, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> FinalizeRecordAsync(
        MedicalRecordService service,
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await service.FinalizeAsync(id, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> AddAddendumAsync(
        MedicalRecordService service,
        Guid id,
        [FromBody] AddAddendumRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.AddAddendumAsync(id, request, cancellationToken).ConfigureAwait(false);
        return Results.Created($"/api/v1/medical-records/{id}", result);
    }

    private static async Task<IResult> GetByIdAsync(
        MedicalRecordService service,
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await service.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetHistoryByPatientIdAsync(
        MedicalRecordService service,
        Guid patientId,
        CancellationToken cancellationToken)
    {
        var result = await service.GetHistoryByPatientIdAsync(patientId, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetGynecologicalProfileAsync(
        MedicalRecordService service,
        Guid patientId,
        CancellationToken cancellationToken)
    {
        var result = await service.GetGynecologicalProfileAsync(patientId, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> UpdateGynecologicalProfileAsync(
        MedicalRecordService service,
        Guid patientId,
        [FromBody] UpdateGynecologicalProfileRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.UpdateGynecologicalProfileAsync(patientId, request, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> ListScreeningsAsync(
        MedicalRecordService service,
        Guid patientId,
        CancellationToken cancellationToken)
    {
        var result = await service.ListScreeningsAsync(patientId, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> AddScreeningAsync(
        MedicalRecordService service,
        Guid patientId,
        [FromBody] CreatePreventiveScreeningRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.AddScreeningAsync(patientId, request, cancellationToken).ConfigureAwait(false);
        return Results.Created($"/api/v1/medical-records/patients/{patientId}/screenings/{result.Id}", result);
    }

    private static async Task<IResult> GetGynecologicalConsultationDataAsync(
        MedicalRecordService service,
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await service.GetGynecologicalConsultationDataAsync(id, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> UpdateGynecologicalConsultationDataAsync(
        MedicalRecordService service,
        Guid id,
        [FromBody] UpdateGynecologicalConsultationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.UpdateGynecologicalConsultationDataAsync(id, request, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> AddPrenatalVisitAsync(
        MedicalRecordService service,
        Guid id,
        [FromBody] CreatePrenatalVisitRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.AddPrenatalVisitAsync(id, request, cancellationToken).ConfigureAwait(false);
        return Results.Created($"/api/v1/medical-records/{id}/prenatal-visits", result);
    }

    private static async Task<IResult> ListPrenatalVisitsAsync(
        MedicalRecordService service,
        Guid patientId,
        CancellationToken cancellationToken)
    {
        var result = await service.ListPrenatalVisitsByPatientAsync(patientId, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> DownloadPrenatalCardPdfAsync(
        MedicalRecordService service,
        Canamed.Application.Abstractions.ICatalogRepository catalogRepository,
        Guid patientId,
        CancellationToken cancellationToken)
    {
        var result = await service.GeneratePrenatalCardPdfAsync(patientId, catalogRepository, cancellationToken).ConfigureAwait(false);
        return Results.File(result, "application/pdf", $"cartao-gestante-{patientId.ToString()[..8]}.pdf");
    }
}
