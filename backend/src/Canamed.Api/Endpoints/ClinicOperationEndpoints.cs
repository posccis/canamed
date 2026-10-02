using Canamed.Api.Authorization;
using Canamed.Application.Clinics;
using Canamed.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

/// <summary>
/// Gestão operacional da clínica (seção 8 da SPEC-0006): convênios, salas, funcionamento e feriados.
/// </summary>
public static class ClinicOperationEndpoints
{
    /// <summary>Mapeia as rotas de convênios, salas, funcionamento e feriados.</summary>
    public static RouteGroupBuilder MapClinicOperationEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        MapHealthPlans(api);
        MapRooms(api);
        MapOperatingHours(api);
        MapClosures(api);

        return api;
    }

    private static void MapHealthPlans(RouteGroupBuilder api)
    {
        var healthPlans = api.MapGroup("/health-plans");

        healthPlans.MapGet(string.Empty, ListHealthPlansAsync)
            .WithName("ListHealthPlans")
            .Produces<IReadOnlyList<HealthPlanResponse>>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.ClinicRead);

        healthPlans.MapPost(string.Empty, CreateHealthPlanAsync)
            .WithName("CreateHealthPlan")
            .Produces<HealthPlanResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.ClinicManage);

        healthPlans.MapPost("/{id:guid}", UpdateHealthPlanAsync)
            .WithName("UpdateHealthPlan")
            .Produces<HealthPlanResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.ClinicManage);

        healthPlans.MapPost("/{id:guid}/deactivate", DeactivateHealthPlanAsync)
            .WithName("DeactivateHealthPlan")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.ClinicManage);

        healthPlans.MapPost("/{id:guid}/activate", ActivateHealthPlanAsync)
            .WithName("ActivateHealthPlan")
            .Produces(StatusCodes.Status204NoContent)
            .RequirePermissions(Permissions.ClinicManage);
    }

    private static void MapRooms(RouteGroupBuilder api)
    {
        var rooms = api.MapGroup("/rooms");

        rooms.MapGet(string.Empty, ListRoomsAsync)
            .WithName("ListRooms")
            .Produces<IReadOnlyList<RoomResponse>>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.ClinicRead);

        rooms.MapPost(string.Empty, CreateRoomAsync)
            .WithName("CreateRoom")
            .Produces<RoomResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.ClinicManage);

        rooms.MapPost("/{id:guid}", RenameRoomAsync)
            .WithName("RenameRoom")
            .Produces<RoomResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.ClinicManage);

        rooms.MapPost("/{id:guid}/deactivate", DeactivateRoomAsync)
            .WithName("DeactivateRoom")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.ClinicManage);

        rooms.MapPost("/{id:guid}/activate", ActivateRoomAsync)
            .WithName("ActivateRoom")
            .Produces(StatusCodes.Status204NoContent)
            .RequirePermissions(Permissions.ClinicManage);
    }

    private static void MapOperatingHours(RouteGroupBuilder api)
    {
        var hours = api.MapGroup("/operating-hours");

        hours.MapGet(string.Empty, ListOperatingHoursAsync)
            .WithName("ListOperatingHours")
            .Produces<IReadOnlyList<OperatingHourResponse>>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.ClinicRead);

        hours.MapPut(string.Empty, ReplaceOperatingHoursAsync)
            .WithName("ReplaceOperatingHours")
            .Produces<IReadOnlyList<OperatingHourResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permissions.ClinicManage);
    }

    private static void MapClosures(RouteGroupBuilder api)
    {
        var closures = api.MapGroup("/clinic-closures");

        closures.MapGet(string.Empty, ListClosuresAsync)
            .WithName("ListClinicClosures")
            .Produces<IReadOnlyList<ClinicClosureResponse>>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.ClinicRead);

        closures.MapPost(string.Empty, CreateClosureAsync)
            .WithName("CreateClinicClosure")
            .Produces<ClinicClosureResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.ClinicManage);

        closures.MapDelete("/{id:guid}", RemoveClosureAsync)
            .WithName("RemoveClinicClosure")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.ClinicManage);
    }

    private static async Task<IResult> ListHealthPlansAsync(
        ClinicOperationService service,
        CancellationToken cancellationToken) =>
        Results.Ok(await service.ListHealthPlansAsync(cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> CreateHealthPlanAsync(
        ClinicOperationService service,
        [FromBody] CreateHealthPlanRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await service.CreateHealthPlanAsync(request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> UpdateHealthPlanAsync(
        ClinicOperationService service,
        Guid id,
        [FromBody] UpdateHealthPlanRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await service.UpdateHealthPlanAsync(id, request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> DeactivateHealthPlanAsync(
        ClinicOperationService service,
        Guid id,
        CancellationToken cancellationToken)
    {
        await service.DeactivateHealthPlanAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }

    private static async Task<IResult> ActivateHealthPlanAsync(
        ClinicOperationService service,
        Guid id,
        CancellationToken cancellationToken)
    {
        await service.ActivateHealthPlanAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }

    private static async Task<IResult> ListRoomsAsync(
        ClinicOperationService service,
        CancellationToken cancellationToken) =>
        Results.Ok(await service.ListRoomsAsync(cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> CreateRoomAsync(
        ClinicOperationService service,
        [FromBody] CreateRoomRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await service.CreateRoomAsync(request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> RenameRoomAsync(
        ClinicOperationService service,
        Guid id,
        [FromBody] RenameRoomRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await service.RenameRoomAsync(id, request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> DeactivateRoomAsync(
        ClinicOperationService service,
        Guid id,
        CancellationToken cancellationToken)
    {
        await service.DeactivateRoomAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }

    private static async Task<IResult> ActivateRoomAsync(
        ClinicOperationService service,
        Guid id,
        CancellationToken cancellationToken)
    {
        await service.ActivateRoomAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }

    private static async Task<IResult> ListOperatingHoursAsync(
        ClinicOperationService service,
        CancellationToken cancellationToken) =>
        Results.Ok(await service.ListOperatingHoursAsync(cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> ReplaceOperatingHoursAsync(
        ClinicOperationService service,
        [FromBody] ReplaceOperatingHoursRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await service.ReplaceOperatingHoursAsync(request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> ListClosuresAsync(
        ClinicOperationService service,
        CancellationToken cancellationToken) =>
        Results.Ok(await service.ListClosuresAsync(cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> CreateClosureAsync(
        ClinicOperationService service,
        [FromBody] CreateClinicClosureRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await service.CreateClosureAsync(request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> RemoveClosureAsync(
        ClinicOperationService service,
        Guid id,
        CancellationToken cancellationToken)
    {
        await service.RemoveClosureAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }
}
