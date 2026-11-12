using Canamed.Api.Authorization;
using Canamed.Application.Identity;
using Canamed.Application.MedicalRecords;
using Canamed.Application.MedicalRecords.Services;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class LarcEndpoints
{
    public static RouteGroupBuilder MapLarcEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/patients/{patientId:guid}/larc-records")
            .WithTags("Larc")
            .RequireAuthorization();

        group.MapPost("/", CreateLarcPlacementAsync)
            .WithName("CreateLarcPlacement")
            .Produces<LarcPlacementDto>(StatusCodes.Status201Created)
            .RequirePermissions(Permissions.RecordsCreate);

        group.MapGet("/", ListLarcPlacementsAsync)
            .WithName("ListLarcPlacements")
            .Produces<IReadOnlyList<LarcPlacementDto>>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.RecordsRead);

        group.MapPut("/{id:guid}/remove", RemoveLarcPlacementAsync)
            .WithName("RemoveLarcPlacement")
            .Produces<LarcPlacementDto>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.RecordsCreate);

        return group;
    }

    private static async Task<IResult> CreateLarcPlacementAsync(
        [FromRoute] Guid patientId,
        [FromBody] CreateLarcPlacementRequest request,
        LarcService service,
        CancellationToken cancellationToken)
    {
        var result = await service.CreateAsync(patientId, request, cancellationToken).ConfigureAwait(false);
        return Results.Created($"/api/v1/patients/{patientId}/larc-records/{result.Id}", result);
    }

    private static async Task<IResult> ListLarcPlacementsAsync(
        [FromRoute] Guid patientId,
        LarcService service,
        CancellationToken cancellationToken)
    {
        var list = await service.ListByPatientAsync(patientId, cancellationToken).ConfigureAwait(false);
        return Results.Ok(list);
    }

    private static async Task<IResult> RemoveLarcPlacementAsync(
        [FromRoute] Guid patientId,
        [FromRoute] Guid id,
        [FromBody] RemoveLarcPlacementRequest request,
        LarcService service,
        CancellationToken cancellationToken)
    {
        var result = await service.RemoveAsync(patientId, id, request, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }
}
