namespace Canamed.Application.Portal;

/// <summary>
/// Resumo do acompanhamento pré-natal da gestante para exibição no portal (SPEC-0036).
/// </summary>
public sealed record PrenatalSummaryDto(
    Guid PatientId,
    string PatientName,
    DateOnly? LastMenstrualPeriod,
    DateOnly? EstimatedDueDate,
    int CurrentGestationalWeeks,
    int CurrentGestationalDays,
    bool IsRhNegative,
    string? BloodType,
    string? RhFactor,
    string? KnownAllergies,
    string? FetalMilestoneName,
    IReadOnlyList<PrenatalVisitItemDto> Visits);

/// <summary>
/// Consulta pré-natal resumida para exibição na linha do tempo do portal (SPEC-0036).
/// </summary>
public sealed record PrenatalVisitItemDto(
    Guid Id,
    DateOnly VisitDate,
    int GestationalWeeks,
    int GestationalDays,
    string BloodPressure,
    int? FetalHeartRateBpm,
    double? UterineHeightCm,
    double WeightKg);

/// <summary>
/// Solicitação de agendamento de consulta avulsa sem conta prévia (SPEC-0036 / RN-004 / RN-005).
/// </summary>
public sealed record BookGuestAppointmentRequest(
    Guid ClinicId,
    Guid ProfessionalId,
    DateTimeOffset StartsAt,
    string PatientName,
    string Cpf,
    string Phone,
    DateOnly BirthDate,
    string? Symptoms,
    string? Allergies,
    bool IsPregnant,
    bool WantsInvoice,
    Guid? AppointmentTypeId = null);

/// <summary>
/// Confirmação do agendamento avulso (SPEC-0036 / F-002).
/// </summary>
public sealed record BookGuestAppointmentResponse(
    Guid AppointmentId,
    DateTimeOffset StartsAt,
    string DoctorName,
    string? MeetUrl,
    string? Instructions);
