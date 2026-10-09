using Canamed.Application.Kiosk;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class KioskEndpoints
{
    public static RouteGroupBuilder MapKioskEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var group = api.MapGroup("/kiosk");

        group.MapGet("/{clinicId:guid}/search", SearchAppointmentsAsync)
            .WithName("KioskSearchAppointments")
            .Produces<IReadOnlyList<KioskAppointmentSearchResult>>(StatusCodes.Status200OK)
            .AllowAnonymous();

        group.MapPost("/check-in", ConfirmCheckInAsync)
            .WithName("KioskConfirmCheckIn")
            .Produces<KioskCheckInResult>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .AllowAnonymous();

        group.MapGet("/{clinicId:guid}/tickets/{ticketCode}/status", GetTicketStatusAsync)
            .WithName("KioskGetTicketStatus")
            .Produces<KioskTicketStatusResult>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AllowAnonymous();

        return api;
    }

    private static async Task<IResult> SearchAppointmentsAsync(
        KioskCheckInService kioskService,
        Guid clinicId,
        [FromQuery] string? q,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Results.Ok(Array.Empty<KioskAppointmentSearchResult>());
        }

        var results = await kioskService.SearchTodayAppointmentsAsync(clinicId, q, timeProvider.GetUtcNow(), cancellationToken);
        return Results.Ok(results);
    }

    private static async Task<IResult> ConfirmCheckInAsync(
        KioskCheckInService kioskService,
        [FromBody] KioskConfirmCheckInRequest request,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await kioskService.ConfirmKioskCheckInAsync(request, timeProvider.GetUtcNow(), cancellationToken);
            return Results.Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    }

    private static async Task<IResult> GetTicketStatusAsync(
        KioskCheckInService kioskService,
        Guid clinicId,
        string ticketCode,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await kioskService.GetTicketStatusAsync(clinicId, ticketCode, timeProvider.GetUtcNow(), cancellationToken);
            return Results.Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Results.NotFound(new { message = ex.Message });
        }
    }
}
