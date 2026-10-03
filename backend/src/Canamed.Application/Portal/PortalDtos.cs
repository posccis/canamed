namespace Canamed.Application.Portal;

public sealed record RequestOtpRequest(
    string Phone,
    string Cpf);

public sealed record RequestOtpResponse(
    bool Success,
    string Message,
    int ExpiresInSeconds);

public sealed record VerifyOtpRequest(
    string Phone,
    string Cpf,
    string Code);

public sealed record VerifyOtpResponse(
    bool Success,
    string? SessionToken,
    Guid? PatientId,
    string? PatientName,
    string? Message);

public sealed record PublicSpecialtyDto(
    Guid Id,
    string Name,
    string? Description);

public sealed record PublicSlotDto(
    Guid ProfessionalId,
    string ProfessionalName,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    int DurationMinutes);

public sealed record BookOnlineAppointmentRequest(
    Guid ClinicId,
    Guid ProfessionalId,
    Guid SpecialtyId,
    Guid AppointmentTypeId,
    DateTimeOffset StartsAt,
    string? PatientNotes);

public sealed record OnlineAppointmentDto(
    Guid Id,
    Guid ClinicId,
    Guid ProfessionalId,
    string ProfessionalName,
    string SpecialtyName,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string Status,
    string PaymentStatus);

public sealed record CancelOnlineAppointmentRequest(
    string Reason);
