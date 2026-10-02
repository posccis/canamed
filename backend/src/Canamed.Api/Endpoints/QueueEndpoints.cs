using Canamed.Api.Authorization;
using Canamed.Application.Identity;
using Canamed.Application.Queue;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

/// <summary>
/// Fila de espera e ciclo de atendimento (seção 8 da SPEC-0005), incluindo o fechamento do dia.
/// </summary>
public static class QueueEndpoints
{
    private static readonly string[] QueueReadPermissions =
    [
        Permissions.AgendaRead,
        Permissions.AgendaReadOwn,
        Permissions.AgendaWrite,
    ];

    /// <summary>
    /// Quem opera a fila: a recepção (agenda:write) em qualquer agenda e o profissional nas entradas
    /// da própria agenda (agenda:read:own, validado no caso de uso).
    /// </summary>
    private static readonly string[] QueueOperatePermissions =
    [
        Permissions.AgendaWrite,
        Permissions.AgendaReadOwn,
    ];

    /// <summary>Mapeia as rotas da fila e o fechamento do dia.</summary>
    public static RouteGroupBuilder MapQueueEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var queue = api.MapGroup("/queue");

        queue.MapPost("/check-in", CheckInAsync)
            .WithName("QueueCheckIn")
            .Produces<QueueEntryResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.AgendaWrite);

        queue.MapGet(string.Empty, ListAsync)
            .WithName("ListQueue")
            .Produces<QueueDayResponse>(StatusCodes.Status200OK)
            .RequirePermissions(QueueReadPermissions);

        queue.MapPost("/{id:guid}/call", CallAsync)
            .WithName("CallQueueEntry")
            .Produces<QueueEntryResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(QueueOperatePermissions);

        queue.MapPost("/{id:guid}/start", StartAsync)
            .WithName("StartQueueEntry")
            .Produces<QueueEntryResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(QueueOperatePermissions);

        queue.MapPost("/{id:guid}/complete", CompleteAsync)
            .WithName("CompleteQueueEntry")
            .Produces<QueueEntryResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(QueueOperatePermissions);

        queue.MapPost("/{id:guid}/leave", LeaveAsync)
            .WithName("LeaveQueueEntry")
            .Produces<QueueEntryResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(QueueOperatePermissions);

        queue.MapPost("/{id:guid}/triage", RecordTriageAsync)
            .WithName("RecordQueueTriage")
            .Produces<TriageRecordResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.TriageWrite);

        queue.MapGet("/{id:guid}/triage", GetTriageAsync)
            .WithName("GetQueueTriage")
            .Produces<TriageRecordResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.TriageRead);

        api.MapPost("/agenda/close-day", CloseDayAsync)
            .WithName("CloseAgendaDay")
            .Produces<CloseDayResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permissions.AgendaWrite);

        return api;
    }

    private static async Task<IResult> CheckInAsync(
        QueueService queueService,
        [FromBody] CheckInRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await queueService.CheckInAsync(request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> ListAsync(
        QueueService queueService,
        CancellationToken cancellationToken,
        [FromQuery] DateOnly? date = null,
        [FromQuery] Guid? professionalId = null) =>
        Results.Ok(await queueService.ListAsync(date, professionalId, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> CallAsync(
        QueueService queueService,
        Guid id,
        CancellationToken cancellationToken) =>
        Results.Ok(await queueService.CallAsync(id, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> StartAsync(
        QueueService queueService,
        Guid id,
        CancellationToken cancellationToken) =>
        Results.Ok(await queueService.StartAsync(id, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> CompleteAsync(
        QueueService queueService,
        Guid id,
        CancellationToken cancellationToken) =>
        Results.Ok(await queueService.CompleteAsync(id, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> LeaveAsync(
        QueueService queueService,
        Guid id,
        CancellationToken cancellationToken) =>
        Results.Ok(await queueService.LeaveAsync(id, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> CloseDayAsync(
        DayClosingService dayClosingService,
        [FromBody] CloseDayRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await dayClosingService.CloseAsync(request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> RecordTriageAsync(
        TriageService triageService,
        Guid id,
        [FromBody] RecordTriageRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await triageService.RecordTriageAsync(id, request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> GetTriageAsync(
        TriageService triageService,
        Guid id,
        CancellationToken cancellationToken) =>
        Results.Ok(await triageService.GetTriageAsync(id, cancellationToken).ConfigureAwait(false));
}
