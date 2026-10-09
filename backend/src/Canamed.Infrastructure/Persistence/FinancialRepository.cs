using Canamed.Application.Financial;
using Canamed.Domain.Financial;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

public sealed class FinancialRepository(CanamedDbContext dbContext) : IFinancialRepository
{
    public async Task<MedicalPayoutContract?> GetContractAsync(Guid clinicId, Guid professionalId, CancellationToken cancellationToken = default)
    {
        return await dbContext.MedicalPayoutContracts
            .FirstOrDefaultAsync(c => c.ClinicId == clinicId && c.ProfessionalId == professionalId, cancellationToken);
    }

    public async Task UpsertContractAsync(MedicalPayoutContract contract, CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.MedicalPayoutContracts
            .FirstOrDefaultAsync(c => c.ClinicId == contract.ClinicId && c.ProfessionalId == contract.ProfessionalId, cancellationToken);

        if (existing is null)
        {
            await dbContext.MedicalPayoutContracts.AddAsync(contract, cancellationToken);
        }
        else
        {
            dbContext.MedicalPayoutContracts.Update(existing);
        }
    }

    public async Task AddBatchAsync(MedicalPayoutBatch batch, CancellationToken cancellationToken = default)
    {
        await dbContext.MedicalPayoutBatches.AddAsync(batch, cancellationToken);
    }

    public async Task<MedicalPayoutBatch?> GetBatchByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.MedicalPayoutBatches
            .Include(b => b.Items)
            .FirstOrDefaultAsync(b => b.Id == id && b.ClinicId == clinicId, cancellationToken);
    }

    public async Task<IReadOnlyList<MedicalPayoutBatch>> ListBatchesAsync(Guid clinicId, Guid? professionalId = null, CancellationToken cancellationToken = default)
    {
        var query = dbContext.MedicalPayoutBatches
            .Include(b => b.Items)
            .Where(b => b.ClinicId == clinicId);

        if (professionalId.HasValue)
        {
            query = query.Where(b => b.ProfessionalId == professionalId.Value);
        }

        return await query.OrderByDescending(b => b.PeriodEnd).ToListAsync(cancellationToken);
    }

    public Task UpdateBatchAsync(MedicalPayoutBatch batch, CancellationToken cancellationToken = default)
    {
        dbContext.MedicalPayoutBatches.Update(batch);
        return Task.CompletedTask;
    }

    public async Task AddTransactionAsync(FinancialTransaction tx, CancellationToken cancellationToken = default)
    {
        await dbContext.FinancialTransactions.AddAsync(tx, cancellationToken);
    }

    public async Task<IReadOnlyList<FinancialTransaction>> ListTransactionsAsync(Guid clinicId, DateTimeOffset from, DateTimeOffset to, CancellationToken cancellationToken = default)
    {
        return await dbContext.FinancialTransactions
            .Where(t => t.ClinicId == clinicId && t.CompetenceDate >= from && t.CompetenceDate <= to)
            .OrderByDescending(t => t.CompetenceDate)
            .ToListAsync(cancellationToken);
    }
}
