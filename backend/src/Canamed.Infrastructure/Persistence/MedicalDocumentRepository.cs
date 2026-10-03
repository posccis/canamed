using Canamed.Application.MedicalDocuments;
using Canamed.Domain.MedicalDocuments;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

public sealed class MedicalDocumentRepository(CanamedDbContext dbContext) : IMedicalDocumentRepository
{
    public async Task<MedicalDocument?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.MedicalDocuments
            .FirstOrDefaultAsync(d => d.Id == id && d.ClinicId == clinicId, cancellationToken);
    }

    public async Task<MedicalDocument?> GetByPublicTokenAsync(string publicToken, CancellationToken cancellationToken = default)
    {
        return await dbContext.MedicalDocuments
            .FirstOrDefaultAsync(d => d.PublicToken == publicToken, cancellationToken);
    }

    public async Task<IReadOnlyList<MedicalDocument>> GetByPatientIdAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.MedicalDocuments
            .Where(d => d.PatientId == patientId && d.ClinicId == clinicId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(MedicalDocument document, CancellationToken cancellationToken = default)
    {
        await dbContext.MedicalDocuments.AddAsync(document, cancellationToken);
    }

    public Task UpdateAsync(MedicalDocument document, CancellationToken cancellationToken = default)
    {
        dbContext.MedicalDocuments.Update(document);
        return Task.CompletedTask;
    }
}
