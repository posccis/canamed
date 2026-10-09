using Canamed.Application.Privacy;
using Canamed.Domain.Privacy;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

public sealed class PrivacyRepository(CanamedDbContext dbContext) : IPrivacyRepository
{
    public async Task AddRequestAsync(PrivacyRequest request, CancellationToken cancellationToken = default)
    {
        await dbContext.PrivacyRequests.AddAsync(request, cancellationToken);
    }

    public Task UpdateRequestAsync(PrivacyRequest request, CancellationToken cancellationToken = default)
    {
        dbContext.PrivacyRequests.Update(request);
        return Task.CompletedTask;
    }

    public async Task<PrivacyRequest?> GetRequestByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await dbContext.PrivacyRequests.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<PrivacyRequest?> GetRequestByProtocolAsync(string protocol, CancellationToken cancellationToken = default)
    {
        return await dbContext.PrivacyRequests.FirstOrDefaultAsync(r => r.Protocol == protocol, cancellationToken);
    }

    public async Task<IReadOnlyList<PrivacyRequest>> ListRequestsByClinicAsync(
        Guid clinicId,
        PrivacyRequestStatus? status,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.PrivacyRequests.Where(r => r.ClinicId == clinicId);

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        return await query.OrderByDescending(r => r.CreatedAt).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PrivacyRequest>> ListRequestsByPatientAsync(
        Guid patientId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.PrivacyRequests
            .Where(r => r.PatientId == patientId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task SaveConsentAsync(PrivacyConsent consent, CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.PrivacyConsents.FirstOrDefaultAsync(c => c.Id == consent.Id, cancellationToken);
        if (existing is null)
        {
            await dbContext.PrivacyConsents.AddAsync(consent, cancellationToken);
        }
        else
        {
            dbContext.PrivacyConsents.Update(consent);
        }
    }

    public async Task<IReadOnlyList<PrivacyConsent>> ListConsentsByPatientAsync(
        Guid patientId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.PrivacyConsents
            .Where(c => c.PatientId == patientId)
            .OrderBy(c => c.ConsentType)
            .ToListAsync(cancellationToken);
    }

    public async Task<PrivacyConsent?> GetConsentByTypeAsync(
        Guid patientId,
        string consentType,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.PrivacyConsents
            .FirstOrDefaultAsync(c => c.PatientId == patientId && c.ConsentType == consentType, cancellationToken);
    }
}
