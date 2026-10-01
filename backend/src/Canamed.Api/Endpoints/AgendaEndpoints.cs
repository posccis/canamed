using Canamed.Api.Authorization;
using Canamed.Application.Agenda;
using Canamed.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

/// <summary>Rotas da agenda de consultas (seção 8 da SPEC-0002).</summary>
public static class AgendaEndpoints
{
    private static readonly string[] ReadPermissions = [Permissions.AgendaRead, Permissions.AgendaReadOwn];

    /// <summary>Mapeia as rotas de agendamento, remarcação, cancelamento e bloqueio.</summary>
    public static RouteGroupBuilder MapAgendaEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var appointments = api.MapGroup("/appointments");

        appointments.MapPost(string.Empty, CreateAsync)
            .WithName("CreateAppointment")
            .Produces<AppointmentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.AgendaWrite);

        appointments.MapGet(string.Empty, ListDayAsync)
            .WithName("ListAppointmentsByDay")
            .Produces<AgendaDayResponse>(StatusCodes.Status200OK)
            .RequirePermissions([.. ReadPermissions, Permissions.AgendaWrite]);

        appointments.MapGet("/{id:guid}", GetAsync)
            .WithName("GetAppointment")
            .Produces<AppointmentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions([.. ReadPermissions, Permissions.AgendaWrite]);

        appointments.MapPost("/{id:guid}/reschedule", RescheduleAsync)
            .WithName("RescheduleAppointment")
            .Produces<AppointmentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.AgendaWrite);

        appointments.MapPost("/{id:guid}/cancel", CancelAsync)
            .WithName("CancelAppointment")
            .Produces<AppointmentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.AgendaWrite);

        appointments.MapPost("/{id:guid}/attend", AttendAsync)
            .WithName("MarkAppointmentAttended")
            .Produces<AppointmentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.AgendaWrite);

        appointments.MapPost("/{id:guid}/no-show", MarkNoShowAsync)
            .WithName("MarkAppointmentNoShow")
            .Produces<AppointmentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.AgendaWrite);

        api.MapPost("/professionals/{id:guid}/blocks", CreateBlockAsync)
            .WithName("CreateProfessionalBlock")
            .Produces<BlockResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.AgendaBlock, Permissions.AgendaWrite);

        api.MapGet("/professionals/{id:guid}/blocks", ListBlocksAsync)
            .WithName("ListProfessionalBlocks")
            .Produces<IReadOnlyList<BlockResponse>>(StatusCodes.Status200OK)
            .RequirePermissions([.. ReadPermissions, Permissions.AgendaWrite, Permissions.AgendaBlock]);

        api.MapDelete("/professionals/{id:guid}/blocks/{blockId:guid}", RemoveBlockAsync)
            .WithName("RemoveProfessionalBlock")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.AgendaBlock, Permissions.AgendaWrite);

        return api;
    }

    private static async Task<IResult> CreateAsync(
        AgendaService agendaService,
        [FromBody] CreateAppointmentRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await agendaService.CreateAsync(request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> ListDayAsync(
        AgendaService agendaService,
        TimeProvider timeProvider,
        CancellationToken cancellationToken,
        [FromQuery] DateOnly? date = null,
        [FromQuery] Guid? professionalId = null)
    {
        var targetDate = date
            ?? DateOnly.FromDateTime(AgendaTimeZone.ToLocal(timeProvider.GetUtcNow()).DateTime);

        return Results.Ok(await agendaService
            .ListDayAsync(targetDate, professionalId, cancellationToken)
            .ConfigureAwait(false));
    }

    private static async Task<IResult> GetAsync(
        AgendaService agendaService,
        Guid id,
        CancellationToken cancellationToken) =>
        Results.Ok(await agendaService.GetAsync(id, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> RescheduleAsync(
        AgendaService agendaService,
        Guid id,
        [FromBody] RescheduleAppointmentRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await agendaService.RescheduleAsync(id, request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> CancelAsync(
        AgendaService agendaService,
        Guid id,
        [FromBody] CancelAppointmentRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await agendaService.CancelAsync(id, request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> CreateBlockAsync(
        AgendaService agendaService,
        Guid id,
        [FromBody] CreateBlockRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await agendaService.CreateBlockAsync(id, request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> AttendAsync(
        AgendaService agendaService,
        Guid id,
        CancellationToken cancellationToken) =>
        Results.Ok(await agendaService.MarkAttendedAsync(id, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> MarkNoShowAsync(
        AgendaService agendaService,
        Guid id,
        CancellationToken cancellationToken) =>
        Results.Ok(await agendaService.MarkNoShowAsync(id, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> ListBlocksAsync(
        AgendaService agendaService,
        TimeProvider timeProvider,
        Guid id,
        CancellationToken cancellationToken,
        [FromQuery] DateOnly? date = null) =>
        Results.Ok(await agendaService
            .ListBlocksAsync(
                id,
                date ?? DateOnly.FromDateTime(AgendaTimeZone.ToLocal(timeProvider.GetUtcNow()).DateTime),
                cancellationToken)
            .ConfigureAwait(false));

    private static async Task<IResult> RemoveBlockAsync(
        AgendaService agendaService,
        Guid id,
        Guid blockId,
        CancellationToken cancellationToken)
    {
        await agendaService.RemoveBlockAsync(id, blockId, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }
}
