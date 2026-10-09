using Canamed.Application.Queue;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class TvDisplayEndpoints
{
    public static RouteGroupBuilder MapTvDisplayEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var group = api.MapGroup("/tv-display");

        // Rota pública para painel de TV do saguão
        group.MapGet("/{clinicId:guid}/state", async (
            QueueCallService service,
            Guid clinicId,
            CancellationToken ct) =>
        {
            var res = await service.GetTvDisplayStateAsync(clinicId, ct);
            return Results.Ok(res);
        })
        .WithName("GetTvDisplayState")
        .Produces<TvDisplayStateDto>(StatusCodes.Status200OK);

        group.MapPost("/trigger", async (
            QueueCallService service,
            [FromBody] TriggerCallRequest request,
            CancellationToken ct) =>
        {
            var res = await service.TriggerCallAsync(request, ct);
            return Results.Ok(res);
        })
        .WithName("TriggerTvCall")
        .Produces<QueueCallEventDto>(StatusCodes.Status200OK);

        group.MapPost("/recall/{id:guid}", async (
            QueueCallService service,
            Guid id,
            [FromQuery] Guid clinicId,
            CancellationToken ct) =>
        {
            var res = await service.RecallAsync(id, clinicId, ct);
            return Results.Ok(res);
        })
        .WithName("RecallTvCall")
        .Produces<QueueCallEventDto>(StatusCodes.Status200OK);

        return api;
    }
}
