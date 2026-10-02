using Canamed.Application.Payments;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Canamed.Api.Endpoints;

public static class CashRegisterEndpoints
{
    public static RouteGroupBuilder MapCashRegisterEndpoints(this RouteGroupBuilder group)
    {
        var cashRegister = group.MapGroup("/cash-register");

        cashRegister.MapPost("/open", async (OpenCashRegisterRequest request, CashRegisterService service, CancellationToken token) =>
        {
            var result = await service.OpenShiftAsync(request, token);
            return Results.Created($"/api/v1/cash-register/{result.Id}", result);
        }).WithName("OpenCashRegister");

        cashRegister.MapPost("/movement", async (RegisterCashMovementRequest request, CashRegisterService service, CancellationToken token) =>
        {
            var result = await service.RegisterMovementAsync(request, token);
            return Results.Created($"/api/v1/cash-register/movement/{result.Id}", result);
        }).WithName("RegisterCashMovement");

        cashRegister.MapGet("/current", async (CashRegisterService service, CancellationToken token) =>
        {
            var result = await service.GetCurrentStatusAsync(token);
            return Results.Ok(result);
        }).WithName("GetCurrentCashRegisterStatus");

        cashRegister.MapPost("/close", async (CloseCashRegisterRequest request, CashRegisterService service, CancellationToken token) =>
        {
            var result = await service.CloseShiftAsync(request, token);
            return Results.Ok(result);
        }).WithName("CloseCashRegister");

        cashRegister.MapGet("/history", async (DateOnly? date, CashRegisterService service, CancellationToken token) =>
        {
            var result = await service.ListHistoryAsync(date, token);
            return Results.Ok(result);
        }).WithName("ListCashRegisterHistory");

        return group;
    }
}
