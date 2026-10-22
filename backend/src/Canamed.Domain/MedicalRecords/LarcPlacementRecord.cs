using Canamed.Domain.Common;

namespace Canamed.Domain.MedicalRecords;

/// <summary>
/// Registro especializado de inserção, rastreabilidade de lote e seguimento de LARCs
/// (DIU / Implante Contraceptivo Subdérmico) conforme RN-013.
/// </summary>
public sealed class LarcPlacementRecord : Entity
{
    private LarcPlacementRecord()
    {
    }

    public Guid ClinicId { get; private set; }
    public Guid PatientId { get; private set; }
    public Guid? MedicalRecordId { get; private set; }
    public string DeviceType { get; private set; } = null!;
    public string DeviceName { get; private set; } = null!;
    public string BatchNumber { get; private set; } = null!;
    public DateOnly InsertionDate { get; private set; }
    public DateOnly ExpirationDate { get; private set; }
    public DateOnly? ControlUltrasoundDate { get; private set; }
    public decimal? HysterometryCm { get; private set; }
    public string? ProcedureNotes { get; private set; }
    public bool IsRemoved { get; private set; }
    public DateOnly? RemovalDate { get; private set; }
    public string? RemovalReason { get; private set; }

    public static LarcPlacementRecord Create(
        Guid clinicId,
        Guid patientId,
        Guid? medicalRecordId,
        string deviceType,
        string deviceName,
        string batchNumber,
        DateOnly insertionDate,
        decimal? hysterometryCm,
        string? procedureNotes,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("A clínica é obrigatória.", nameof(clinicId));
        }

        if (patientId == Guid.Empty)
        {
            throw new ArgumentException("A paciente é obrigatória.", nameof(patientId));
        }

        if (string.IsNullOrWhiteSpace(deviceType))
        {
            throw new ArgumentException("O tipo de dispositivo é obrigatório.", nameof(deviceType));
        }

        if (string.IsNullOrWhiteSpace(deviceName))
        {
            throw new ArgumentException("O nome comercial do dispositivo é obrigatório.", nameof(deviceName));
        }

        if (string.IsNullOrWhiteSpace(batchNumber))
        {
            throw new ArgumentException("O número de lote do dispositivo é obrigatório para rastreabilidade.", nameof(batchNumber));
        }

        var expirationDate = LarcDeviceCalculator.CalculateExpirationDate(deviceType, insertionDate);
        var controlUltrasoundDate = LarcDeviceCalculator.CalculateControlUltrasoundDate(insertionDate);

        var record = new LarcPlacementRecord
        {
            ClinicId = clinicId,
            PatientId = patientId,
            MedicalRecordId = medicalRecordId,
            DeviceType = deviceType.Trim().ToLowerInvariant(),
            DeviceName = deviceName.Trim(),
            BatchNumber = batchNumber.Trim().ToUpperInvariant(),
            InsertionDate = insertionDate,
            ExpirationDate = expirationDate,
            ControlUltrasoundDate = controlUltrasoundDate,
            HysterometryCm = hysterometryCm,
            ProcedureNotes = procedureNotes?.Trim(),
            IsRemoved = false
        };

        record.MarkCreated(now);
        return record;
    }

    public void MarkAsRemoved(DateOnly removalDate, string? reason, DateTimeOffset now)
    {
        IsRemoved = true;
        RemovalDate = removalDate;
        RemovalReason = reason?.Trim();
        MarkUpdated(now);
    }
}
