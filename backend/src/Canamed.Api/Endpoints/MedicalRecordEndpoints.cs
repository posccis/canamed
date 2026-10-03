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
}
