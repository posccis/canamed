using Canamed.Domain.MedicalRecords;

namespace Canamed.Application.MedicalRecords;

public interface IMedicalRecordRepository
{
    Task<MedicalRecord?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default);

    Task<MedicalRecord?> GetByAppointmentIdAsync(Guid appointmentId, Guid clinicId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MedicalRecord>> GetHistoryByPatientIdAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default);

    Task AddAsync(MedicalRecord record, CancellationToken cancellationToken = default);

    Task UpdateAsync(MedicalRecord record, CancellationToken cancellationToken = default);
}
