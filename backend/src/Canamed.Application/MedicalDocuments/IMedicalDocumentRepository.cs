using Canamed.Domain.MedicalDocuments;

namespace Canamed.Application.MedicalDocuments;

public interface IMedicalDocumentRepository
{
    Task<MedicalDocument?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default);

    Task<MedicalDocument?> GetByPublicTokenAsync(string publicToken, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MedicalDocument>> GetByPatientIdAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default);

    Task AddAsync(MedicalDocument document, CancellationToken cancellationToken = default);

    Task UpdateAsync(MedicalDocument document, CancellationToken cancellationToken = default);
}
