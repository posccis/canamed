using Canamed.Api.Authorization;
using Canamed.Application.Financial;
using Canamed.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class FinancialEndpoints
{
    public static RouteGroupBuilder MapFinancialEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var group = api.MapGroup("/financial");

        group.MapGet("/payout-contract", async (
            FinancialService service,
            [FromQuery] Guid clinicId,
            [FromQuery] Guid professionalId,
            CancellationToken ct) =>
        {
            var res = await service.GetPayoutContractAsync(clinicId, professionalId, ct);
            return res is null ? Results.NotFound(new { message = "Contrato de repasse não cadastrado." }) : Results.Ok(res);
        })
        .WithName("GetPayoutContract")
        .Produces<PayoutContractDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permissions.FinancialAdmin);

        group.MapPost("/payout-contract", async (
            FinancialService service,
            [FromBody] UpsertPayoutContractRequest request,
            CancellationToken ct) =>
        {
            var res = await service.UpsertPayoutContractAsync(request, ct);
            return Results.Ok(res);
        })
        .WithName("UpsertPayoutContract")
        .Produces<PayoutContractDto>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.FinancialAdmin);

        group.MapPost("/payout-batches/generate", async (
            FinancialService service,
            [FromBody] GeneratePayoutBatchRequest request,
            CancellationToken ct) =>
        {
            var res = await service.GeneratePayoutBatchAsync(request, ct);
            return Results.Created($"/api/v1/financial/payout-batches/{res.Id}", res);
        })
        .WithName("GeneratePayoutBatch")
        .Produces<PayoutBatchDto>(StatusCodes.Status201Created)
        .RequirePermissions(Permissions.PayoutManage);

        group.MapPost("/payout-batches/{id:guid}/settle", async (
            FinancialService service,
            Guid id,
            [FromQuery] Guid clinicId,
            [FromBody] SettlePayoutBatchRequest request,
            CancellationToken ct) =>
        {
            var res = await service.SettlePayoutBatchAsync(id, clinicId, request, ct);
            return Results.Ok(res);
        })
        .WithName("SettlePayoutBatch")
        .Produces<PayoutBatchDto>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.PayoutManage);

        group.MapGet("/payout-batches", async (
            FinancialService service,
            [FromQuery] Guid clinicId,
            [FromQuery] Guid? professionalId,
            CancellationToken ct) =>
        {
            var res = await service.ListBatchesAsync(clinicId, professionalId, ct);
            return Results.Ok(res);
        })
        .WithName("ListPayoutBatches")
        .Produces<IReadOnlyList<PayoutBatchDto>>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.PayoutManage, Permissions.PayoutViewOwn);

        group.MapPost("/transactions", async (
            FinancialService service,
            [FromBody] CreateTransactionRequest request,
            CancellationToken ct) =>
        {
            var res = await service.CreateTransactionAsync(request, ct);
            return Results.Created($"/api/v1/financial/transactions/{res.Id}", res);
        })
        .WithName("CreateFinancialTransaction")
        .Produces<FinancialTransactionDto>(StatusCodes.Status201Created)
        .RequirePermissions(Permissions.FinancialAdmin);

        group.MapGet("/summary", async (
            FinancialService service,
            [FromQuery] Guid clinicId,
            [FromQuery] DateTimeOffset from,
            [FromQuery] DateTimeOffset to,
            CancellationToken ct) =>
        {
            var res = await service.GetFinancialSummaryAsync(clinicId, from, to, ct);
            return Results.Ok(res);
        })
        .WithName("GetFinancialSummary")
        .Produces<FinancialSummaryDto>(StatusCodes.Status200OK)
        .RequirePermissions(Permissions.FinancialAdmin);

        return api;
    }
}
