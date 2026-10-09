using Canamed.Api.Authorization;
using Canamed.Application.Identity;
using Canamed.Application.Notifications;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class NotificationEndpoints
{
    public static RouteGroupBuilder MapNotificationEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var group = api.MapGroup("/notifications");

        group.MapPost("/process-reminders", ProcessRemindersAsync)
            .WithName("ProcessAppointmentReminders")
            .Produces<ProcessRemindersResult>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.AgendaWrite);

        group.MapPost("/webhook/incoming", HandleIncomingWebhookAsync)
            .WithName("IncomingNotificationWebhook")
            .Produces<IncomingWebhookResult>(StatusCodes.Status200OK)
            .AllowAnonymous();

        group.MapPost("/opt-out", HandleOptOutAsync)
            .WithName("NotificationOptOut")
            .Produces(StatusCodes.Status200OK)
            .AllowAnonymous();

        group.MapGet("/preferences/{patientId:guid}", GetPreferenceAsync)
            .WithName("GetPatientNotificationPreference")
            .Produces<Canamed.Domain.Notifications.PatientCommunicationPreference>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.AgendaRead);

        return api;
    }

    private static async Task<IResult> ProcessRemindersAsync(
        NotificationService notificationService,
        [FromQuery] Guid clinicId,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var result = await notificationService.ProcessPendingRemindersAsync(clinicId, timeProvider.GetUtcNow(), cancellationToken);
        return Results.Ok(result);
    }

    private static async Task<IResult> HandleIncomingWebhookAsync(
        NotificationService notificationService,
        [FromBody] IncomingWebhookMessageRequest payload,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var result = await notificationService.HandleIncomingReplyAsync(payload.FromPhone, payload.MessageBody, timeProvider.GetUtcNow(), cancellationToken);
        return Results.Ok(result);
    }

    private static async Task<IResult> HandleOptOutAsync(
        NotificationService notificationService,
        [FromBody] SetOptOutRequest request,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        await notificationService.SetPatientOptOutAsync(request.Phone, request.Reason, timeProvider.GetUtcNow(), cancellationToken);
        return Results.Ok(new { message = "Preferência de comunicação atualizada com sucesso." });
    }

    private static async Task<IResult> GetPreferenceAsync(
        NotificationService notificationService,
        Guid patientId,
        CancellationToken cancellationToken)
    {
        var pref = await notificationService.GetPreferenceAsync(patientId, cancellationToken);
        return Results.Ok(pref);
    }
}
