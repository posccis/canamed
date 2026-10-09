using Canamed.Domain.Privacy;

namespace Canamed.Application.Privacy;

public interface IPrivacyRepository
{
    Task AddRequestAsync(PrivacyRequest request, CancellationToken cancellationToken = default);
    Task UpdateRequestAsync(PrivacyRequest request, CancellationToken cancellationToken = default);
    Task<PrivacyRequest?> GetRequestByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PrivacyRequest?> GetRequestByProtocolAsync(string protocol, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PrivacyRequest>> ListRequestsByClinicAsync(Guid clinicId, PrivacyRequestStatus? status, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PrivacyRequest>> ListRequestsByPatientAsync(Guid patientId, CancellationToken cancellationToken = default);

    Task SaveConsentAsync(PrivacyConsent consent, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PrivacyConsent>> ListConsentsByPatientAsync(Guid patientId, CancellationToken cancellationToken = default);
    Task<PrivacyConsent?> GetConsentByTypeAsync(Guid patientId, string consentType, CancellationToken cancellationToken = default);
}
