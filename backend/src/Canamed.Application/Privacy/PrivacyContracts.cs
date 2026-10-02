namespace Canamed.Application.Privacy;

public sealed record PatientPersonalDataDto(
    Guid Id,
    string Name,
    string Phone,
    string? Email,
    DateOnly? BirthDate,
    string? Document,
    bool IsActive);

public sealed record PatientAppointmentHistoryDto(
    Guid Id,
    DateTimeOffset StartsAt,
    string Status,
    string AppointmentType,
    string ProfessionalName,
    bool IsOverbooking);

public sealed record PatientTriageHistoryDto(
    Guid Id,
    DateTimeOffset RecordedAt,
    string RiskLevel,
    string ChiefComplaint,
    decimal? Temperature,
    string? BloodPressure);

public sealed record PatientPaymentHistoryDto(
    Guid Id,
    DateTimeOffset PaidAt,
    decimal Amount,
    string Method,
    string Status);

public sealed record PatientDataPortabilityResponse(
    string Confirmation,
    DateTimeOffset ExportedAt,
    PatientPersonalDataDto Patient,
    IReadOnlyList<PatientAppointmentHistoryDto> Appointments,
    IReadOnlyList<PatientTriageHistoryDto> TriageRecords,
    IReadOnlyList<PatientPaymentHistoryDto> Payments);

public sealed record AnonymizePatientRequest(string Reason);

public sealed record AnonymizePatientResponse(
    Guid PatientId,
    string Status,
    DateTimeOffset AnonymizedAt,
    string Message);
