using Canamed.Api.Authorization;
using Canamed.Application.Identity;
using Canamed.Application.Payments;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class PaymentEndpoints
{
    public static RouteGroupBuilder MapPaymentEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var payments = api.MapGroup("/payments");

        payments.MapPost(string.Empty, RecordPaymentAsync)
            .WithName("RecordPayment")
            .Produces<PaymentTransactionResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.PaymentsWrite);

        payments.MapPost("/{id:guid}/refund", RefundPaymentAsync)
            .WithName("RefundPayment")
            .Produces<PaymentTransactionResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.PaymentsRefund);

        payments.MapGet("/appointment/{appointmentId:guid}", ListByAppointmentAsync)
            .WithName("ListPaymentsByAppointment")
            .Produces<IReadOnlyList<PaymentTransactionResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.PaymentsRead);

        payments.MapGet("/summary", GetDailySummaryAsync)
            .WithName("GetDailyPaymentSummary")
            .Produces<DailyPaymentSummaryResponse>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.PaymentsRead);

        return api;
    }

    private static async Task<IResult> RecordPaymentAsync(
        PaymentService paymentService,
        [FromBody] RecordPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await paymentService.RecordPaymentAsync(request, cancellationToken).ConfigureAwait(false);
        return Results.Created($"/api/v1/payments/appointment/{result.AppointmentId}", result);
    }

    private static async Task<IResult> RefundPaymentAsync(
        PaymentService paymentService,
        Guid id,
        [FromBody] RefundPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await paymentService.RefundPaymentAsync(id, request, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> ListByAppointmentAsync(
        PaymentService paymentService,
        Guid appointmentId,
        CancellationToken cancellationToken)
    {
        var result = await paymentService.ListByAppointmentAsync(appointmentId, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetDailySummaryAsync(
        PaymentService paymentService,
        CancellationToken cancellationToken,
        [FromQuery] DateOnly? date = null)
    {
        var result = await paymentService.GetDailySummaryAsync(date, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }
}
