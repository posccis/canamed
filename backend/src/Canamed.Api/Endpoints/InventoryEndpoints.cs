using Canamed.Api.Authorization;
using Canamed.Application.Identity;
using Canamed.Application.Inventory;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class InventoryEndpoints
{
    public static RouteGroupBuilder MapInventoryEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var group = api.MapGroup("/inventory");

        group.MapGet(string.Empty, async (
            InventoryService service,
            [FromQuery] Guid clinicId,
            [FromQuery] string? category,
            [FromQuery] string? search,
            CancellationToken ct) =>
        {
            var res = await service.ListAsync(clinicId, category, search, ct);
            return Results.Ok(res);
        })
        .WithName("ListInventoryItems")
        .Produces<IReadOnlyList<InventoryItemDto>>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.InventoryRead);

        group.MapPost(string.Empty, async (
            InventoryService service,
            [FromBody] CreateInventoryItemRequest request,
            CancellationToken ct) =>
        {
            var res = await service.CreateItemAsync(request, ct);
            return Results.Created($"/api/v1/inventory/{res.Id}", res);
        })
        .WithName("CreateInventoryItem")
        .Produces<InventoryItemDto>(StatusCodes.Status201Created)
        .RequirePermissions(Permissions.InventoryManage);

        group.MapPut("/{id:guid}", async (
            InventoryService service,
            Guid id,
            [FromQuery] Guid clinicId,
            [FromBody] UpdateInventoryItemRequest request,
            CancellationToken ct) =>
        {
            var res = await service.UpdateItemAsync(id, clinicId, request, ct);
            return Results.Ok(res);
        })
        .WithName("UpdateInventoryItem")
        .Produces<InventoryItemDto>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.InventoryManage);

        group.MapPost("/{id:guid}/entry", async (
            InventoryService service,
            Guid id,
            [FromQuery] Guid clinicId,
            [FromBody] InventoryMovementRequest request,
            CancellationToken ct) =>
        {
            var res = await service.RegisterEntryAsync(id, clinicId, request, ct);
            return Results.Ok(res);
        })
        .WithName("RegisterInventoryEntry")
        .Produces<InventoryItemDto>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.InventoryManage);

        group.MapPost("/{id:guid}/exit", async (
            InventoryService service,
            Guid id,
            [FromQuery] Guid clinicId,
            [FromBody] InventoryMovementRequest request,
            CancellationToken ct) =>
        {
            var res = await service.RegisterExitAsync(id, clinicId, request, ct);
            return Results.Ok(res);
        })
        .WithName("RegisterInventoryExit")
        .Produces<InventoryItemDto>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.InventoryManage);

        group.MapGet("/alerts", async (
            InventoryService service,
            [FromQuery] Guid clinicId,
            CancellationToken ct) =>
        {
            var res = await service.GetAlertsAsync(clinicId, ct);
            return Results.Ok(res);
        })
        .WithName("GetInventoryAlerts")
        .Produces<InventoryAlertsDto>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.InventoryRead);

        return api;
    }
}
