namespace Canamed.Application.Kiosk;

public sealed record KioskSearchRequest(
    Guid ClinicId,
    string SearchTerm); // CPF ou Telefone

public sealed record KioskAppointmentSearchResult(
    Guid AppointmentId,
    Guid PatientId,
    string PatientMaskedName,
    string PatientMaskedCpf,
    Guid ProfessionalId,
    string ProfessionalName,
    DateTimeOffset ScheduledStartsAt,
    string AppointmentTypeName,
    bool IsCheckInAllowed,
    string? DisallowReason);

public sealed record KioskConfirmCheckInRequest(
    Guid ClinicId,
    Guid AppointmentId,
    bool IsPreferential,
    string Origin); // 'kiosk' ou 'mobile_qrcode'

public sealed record KioskCheckInResult(
    Guid QueueEntryId,
    string TicketCode,
    string Priority,
    string Status,
    int PositionInQueue,
    string PatientName,
    string ProfessionalName,
    DateTimeOffset ArrivedAt);

public sealed record KioskTicketStatusResult(
    string TicketCode,
    string Status,
    int PeopleAheadCount,
    int EstimatedWaitMinutes,
    string? CalledRoomName);
