namespace Canamed.Application.MedicalRecords;

public sealed record LarcPlacementDto(
    Guid Id,
    Guid ClinicId,
    Guid PatientId,
    Guid? MedicalRecordId,
    string DeviceType,
    string DeviceName,
    string BatchNumber,
    DateOnly InsertionDate,
    DateOnly ExpirationDate,
    DateOnly? ControlUltrasoundDate,
    decimal? HysterometryCm,
    string? ProcedureNotes,
    bool IsRemoved,
    DateOnly? RemovalDate,
    string? RemovalReason,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt);

public sealed record CreateLarcPlacementRequest(
    Guid? MedicalRecordId,
    string DeviceType,
    string? DeviceName,
    string? BatchNumber,
    string? LotNumber,
    DateOnly InsertionDate,
    decimal? HysterometryCm,
    string? ProcedureNotes,
    string? Notes);

public sealed record RemoveLarcPlacementRequest(
    DateOnly RemovalDate,
    string? RemovalReason);
