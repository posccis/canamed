using Canamed.Domain.Notifications;

namespace Canamed.Application.Notifications;

public sealed record AppointmentNotificationResponse(
    Guid Id,
    Guid AppointmentId,
    Guid PatientId,
    string Channel,
    string RecipientPhone,
    string TriggerType,
    string Status,
    string MessageBody,
    string? ResponsePayload,
    DateTimeOffset? SentAt,
    DateTimeOffset? RepliedAt,
    string? FailureReason,
    DateTimeOffset CreatedAt);

public sealed record ProcessRemindersRequest(
    Guid ClinicId,
    DateTimeOffset? ReferenceTime);

public sealed record ProcessRemindersResult(
    int ProcessedCount,
    int SentCount,
    int SkippedOptOutCount,
    int FailedCount);

public sealed record IncomingWebhookMessageRequest(
    string FromPhone,
    string MessageBody,
    string? Channel);

public sealed record IncomingWebhookResult(
    bool Processed,
    string ActionTaken,
    string? Details);

public sealed record SetOptOutRequest(
    string Phone,
    string? Reason);
