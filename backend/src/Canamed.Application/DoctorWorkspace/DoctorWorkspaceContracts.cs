using Canamed.Application.MedicalRecords;
using Canamed.Application.Queue;

namespace Canamed.Application.DoctorWorkspace;

public sealed record CallNextPatientRequest(
    Guid? QueueEntryId,
    Guid? RoomId);

public sealed record StartConsultationRequest(
    Guid QueueEntryId);

public sealed record FinishConsultationRequest(
    Guid MedicalRecordId,
    Guid QueueEntryId);

public sealed record ActiveConsultationDto(
    Guid QueueEntryId,
    Guid PatientId,
    string PatientName,
    DateOnly? PatientBirthDate,
    string? Allergies,
    string? ChronicConditions,
    string? HealthPlanName,
    TriageRecordResponse? Triage,
    MedicalRecordResponse? MedicalRecord,
    DateTimeOffset? StartedAt);

public sealed record DoctorWaitingItemDto(
    Guid QueueEntryId,
    Guid PatientId,
    string PatientName,
    string Priority,
    string Status,
    string? RiskClassification,
    int WaitingTimeMinutes,
    DateTimeOffset ArrivedAt,
    Guid? AppointmentId);

public sealed record DoctorWorkspaceStateResponse(
    Guid DoctorId,
    string DoctorName,
    Guid ClinicId,
    Guid? ActiveRoomId,
    string? ActiveRoomName,
    ActiveConsultationDto? ActiveConsultation,
    IReadOnlyList<DoctorWaitingItemDto> WaitingQueue);
