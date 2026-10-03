using Canamed.Application.CashRegister;
using Canamed.Domain.CashRegister;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

public sealed class CashSessionRepository(CanamedDbContext dbContext) : ICashSessionRepository
{
    public async Task AddAsync(CashSession session, CancellationToken cancellationToken = default)
    {
        await dbContext.CashSessions.AddAsync(session, cancellationToken);
    }

    public async Task<CashSession?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.CashSessions
            .Include(c => c.Movements)
            .FirstOrDefaultAsync(c => c.Id == id && c.ClinicId == clinicId, cancellationToken);
    }

    public async Task<CashSession?> GetActiveByOperatorAsync(Guid clinicId, Guid operatorUserId, CancellationToken cancellationToken = default)
    {
        return await dbContext.CashSessions
            .Include(c => c.Movements)
            .FirstOrDefaultAsync(c => c.ClinicId == clinicId && c.OperatorUserId == operatorUserId && c.Status == "aberta", cancellationToken);
    }

    public async Task<IReadOnlyList<CashSession>> ListAsync(Guid clinicId, DateTimeOffset? from = null, DateTimeOffset? to = null, CancellationToken cancellationToken = default)
    {
        var query = dbContext.CashSessions
            .Include(c => c.Movements)
            .Where(c => c.ClinicId == clinicId);

        if (from.HasValue) query = query.Where(c => c.OpenedAt >= from.Value);
        if (to.HasValue) query = query.Where(c => c.OpenedAt <= to.Value);

        return await query.OrderByDescending(c => c.OpenedAt).ToListAsync(cancellationToken);
    }

    public Task UpdateAsync(CashSession session, CancellationToken cancellationToken = default)
    {
        dbContext.CashSessions.Update(session);
        return Task.CompletedTask;
    }
}
