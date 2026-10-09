using Canamed.Application.Clinics;
using Canamed.Domain.Clinics;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

public sealed class ClinicPolicyRepository(CanamedDbContext dbContext) : IClinicPolicyRepository
{
    public async Task<ClinicPolicy?> GetByClinicIdAsync(Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.ClinicPolicies
            .FirstOrDefaultAsync(p => p.ClinicId == clinicId, cancellationToken);
    }

    public async Task UpsertAsync(ClinicPolicy policy, CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.ClinicPolicies
            .FirstOrDefaultAsync(p => p.ClinicId == policy.ClinicId, cancellationToken);

        if (existing is null)
        {
            await dbContext.ClinicPolicies.AddAsync(policy, cancellationToken);
        }
        else
        {
            dbContext.ClinicPolicies.Update(existing);
        }
    }
}
