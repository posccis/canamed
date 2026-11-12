using System.Collections.Concurrent;
using Canamed.Application.Abstractions;
using Canamed.Application.Kiosk;
using Canamed.Domain.Auditing;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class KioskEndpoints
{
    private static readonly ConcurrentDictionary<string, (int Count, DateTimeOffset ResetAt)> _ipRateLimits = new();

    public static RouteGroupBuilder MapKioskEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var group = api.MapGroup("/kiosk");

        group.MapGet("/{clinicId:guid}/search", SearchAppointmentsAsync)
            .WithName("KioskSearchAppointments")
            .Produces<IReadOnlyList<KioskAppointmentSearchResult>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status429TooManyRequests)
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
        IAuditRepository auditRepository,
        Guid clinicId,
        [FromQuery] string? q,
        [FromQuery] string? cpf,
        [FromQuery] string? cpfPartial,
        [FromQuery] DateOnly? birthDate,
        HttpContext httpContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_ip";

        // Rate-limiting: Max 10 requests per minute per IP (RN-001, ER-002)
        var limitEntry = _ipRateLimits.AddOrUpdate(
            clientIp,
            _ => (1, now.AddMinutes(1)),
            (_, current) => now >= current.ResetAt ? (1, now.AddMinutes(1)) : (current.Count + 1, current.ResetAt));

        if (limitEntry.Count > 10)
        {
            auditRepository.Add(AuditEvent.Record(
                clinicId,
                clientIp,
                "Terminal Totem",
                "RateLimitExceeded",
                "kiosk",
                clinicId.ToString(),
                now,
                $"{{\"ip\":\"{clientIp}\",\"limit\":10}}"));
            await auditRepository.SaveChangesAsync(cancellationToken);

            return Results.Problem(
                statusCode: StatusCodes.Status429TooManyRequests,
                title: "Limite de tentativas excedido",
                detail: "Muitas tentativas em sequência. Por favor, aguarde um minuto ou dirija-se à recepção.");
        }

        var resolvedCpf = !string.IsNullOrWhiteSpace(cpf) ? cpf : null;
        var resolvedCpfPartial = !string.IsNullOrWhiteSpace(cpfPartial) ? cpfPartial : null;

        if (resolvedCpf is null && resolvedCpfPartial is null && !string.IsNullOrWhiteSpace(q))
        {
            var digitsOnly = new string(q.Where(char.IsDigit).ToArray());
            if (digitsOnly.Length == 11)
            {
                resolvedCpf = digitsOnly;
            }
            else if (digitsOnly.Length == 6)
            {
                resolvedCpfPartial = digitsOnly;
            }
        }

        try
        {
            var results = await kioskService.SearchTodayAppointmentsAsync(
                clinicId,
                resolvedCpf,
                resolvedCpfPartial,
                birthDate,
                now,
                cancellationToken);

            return Results.Ok(results);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { title = "Parâmetros de busca insuficientes", detail = ex.Message });
        }
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
