using Canamed.Api.Authorization;
using Canamed.Application.DpoGovernance;
using Canamed.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class DpoGovernanceEndpoints
{
    public static RouteGroupBuilder MapDpoGovernanceEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var group = api.MapGroup("/dpo");

        group.MapGet("/overview", async (
            DpoGovernanceService service,
            [FromQuery] Guid clinicId,
            CancellationToken ct) =>
        {
            var res = await service.GetOverviewAsync(clinicId, ct);
            return Results.Ok(res);
        })
        .WithName("GetDpoOverview")
        .Produces<DpoOverviewDto>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.DpoManage);

        group.MapPost("/requests/{id:guid}/process", async (
            DpoGovernanceService service,
            Guid id,
            [FromBody] DpoProcessRequestCommand command,
            CancellationToken ct) =>
        {
            var adjustedCommand = command with { RequestId = id };
            var res = await service.ProcessRequestAsync(adjustedCommand, ct);
            return Results.Ok(res);
        })
        .WithName("ProcessDpoRequest")
        .Produces<DpoRequestItemDto>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.DpoManage);

        return api;
    }
}
