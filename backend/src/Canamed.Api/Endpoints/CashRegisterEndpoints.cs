using Canamed.Api.Authorization;
using Canamed.Application.CashRegister;
using Canamed.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class CashRegisterEndpoints
{
    public static RouteGroupBuilder MapCashRegisterEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var group = api.MapGroup("/cash-register");

        group.MapPost("/sessions/open", async (
            CashRegisterService service,
            [FromBody] OpenCashSessionRequest request,
            CancellationToken ct) =>
        {
            var res = await service.OpenSessionAsync(request, ct);
            return Results.Created($"/api/v1/cash-register/sessions/{res.Id}", res);
        })
        .WithName("OpenCashSession")
        .Produces<CashSessionDto>(StatusCodes.Status201Created)
        .RequirePermissions(Permissions.CashierManage);

        group.MapGet("/sessions/active", async (
            CashRegisterService service,
            [FromQuery] Guid clinicId,
            CancellationToken ct) =>
        {
            var res = await service.GetActiveSessionAsync(clinicId, ct);
            return res is null ? Results.NotFound(new { message = "Nenhuma sessão de caixa aberta." }) : Results.Ok(res);
        })
        .WithName("GetActiveCashSession")
        .Produces<CashSessionDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permissions.CashierManage);

        group.MapPost("/sessions/{id:guid}/sangria", async (
            CashRegisterService service,
            Guid id,
            [FromQuery] Guid clinicId,
            [FromBody] CashSangriaRequest request,
            CancellationToken ct) =>
        {
            var res = await service.RegisterSangriaAsync(id, clinicId, request, ct);
            return Results.Ok(res);
        })
        .WithName("RegisterCashSangria")
        .Produces<CashSessionDto>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.CashierManage);

        group.MapPost("/sessions/{id:guid}/suprimento", async (
            CashRegisterService service,
            Guid id,
            [FromQuery] Guid clinicId,
            [FromBody] CashSuprimentoRequest request,
            CancellationToken ct) =>
        {
            var res = await service.RegisterSuprimentoAsync(id, clinicId, request, ct);
            return Results.Ok(res);
        })
        .WithName("RegisterCashSuprimento")
        .Produces<CashSessionDto>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.CashierManage);

        group.MapPost("/sessions/{id:guid}/close", async (
            CashRegisterService service,
            Guid id,
            [FromQuery] Guid clinicId,
            [FromBody] CloseCashSessionRequest request,
            CancellationToken ct) =>
        {
            var res = await service.CloseSessionAsync(id, clinicId, request, ct);
            return Results.Ok(res);
        })
        .WithName("CloseCashSession")
        .Produces<CashSessionDto>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.CashierManage);

        group.MapGet("/sessions", async (
            CashRegisterService service,
            [FromQuery] Guid clinicId,
            [FromQuery] DateTimeOffset? from,
            [FromQuery] DateTimeOffset? to,
            CancellationToken ct) =>
        {
            var res = await service.ListSessionsAsync(clinicId, from, to, ct);
            return Results.Ok(res);
        })
        .WithName("ListCashSessions")
        .Produces<IReadOnlyList<CashSessionDto>>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.CashierViewAll);

        return api;
    }
}
