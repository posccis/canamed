using Canamed.Domain.MedicalRecords;

namespace Canamed.Application.MedicalRecords;

public interface IMedicalRecordRepository
{
    Task<MedicalRecord?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default);

    Task<MedicalRecord?> GetByAppointmentIdAsync(Guid appointmentId, Guid clinicId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MedicalRecord>> GetHistoryByPatientIdAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default);

    Task AddAsync(MedicalRecord record, CancellationToken cancellationToken = default);

    Task UpdateAsync(MedicalRecord record, CancellationToken cancellationToken = default);

    Task<GynecologicalProfile?> GetGynecologicalProfileAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default);

    Task SaveGynecologicalProfileAsync(GynecologicalProfile profile, CancellationToken cancellationToken = default);

    Task<GynecologicalConsultationData?> GetGynecologicalConsultationDataAsync(Guid medicalRecordId, CancellationToken cancellationToken = default);

    Task SaveGynecologicalConsultationDataAsync(GynecologicalConsultationData data, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PreventiveScreeningRecord>> ListScreeningsByPatientAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default);

    Task AddScreeningAsync(PreventiveScreeningRecord record, CancellationToken cancellationToken = default);

    Task AddExamAttachmentAsync(PatientExamAttachment attachment, CancellationToken cancellationToken = default);

    Task<PatientExamAttachment?> GetExamAttachmentByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PatientExamAttachment>> ListExamAttachmentsByPatientAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default);

    Task UpdateExamAttachmentAsync(PatientExamAttachment attachment, CancellationToken cancellationToken = default);

    Task<int> CountPendingDraftsAsync(Guid clinicId, Guid? doctorId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MedicalRecord>> ListPendingDraftsAsync(Guid clinicId, Guid? doctorId, CancellationToken cancellationToken = default);

    Task AddPrenatalVisitAsync(PrenatalVisitRecord record, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PrenatalVisitRecord>> ListPrenatalVisitsByPatientAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default);
    Task AddLarcPlacementAsync(LarcPlacementRecord record, CancellationToken cancellationToken = default);

    Task<LarcPlacementRecord?> GetLarcPlacementByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<LarcPlacementRecord>> ListLarcPlacementsByPatientAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default);

    Task UpdateLarcPlacementAsync(LarcPlacementRecord record, CancellationToken cancellationToken = default);
}
