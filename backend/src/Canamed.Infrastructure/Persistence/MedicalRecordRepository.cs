using Canamed.Application.MedicalRecords;
using Canamed.Domain.MedicalRecords;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

public sealed class MedicalRecordRepository(CanamedDbContext dbContext) : IMedicalRecordRepository
{
    public async Task<MedicalRecord?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.MedicalRecords
            .Include(r => r.Addenda)
            .FirstOrDefaultAsync(r => r.Id == id && r.ClinicId == clinicId, cancellationToken);
    }

    public async Task<MedicalRecord?> GetByAppointmentIdAsync(Guid appointmentId, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.MedicalRecords
            .Include(r => r.Addenda)
            .FirstOrDefaultAsync(r => r.AppointmentId == appointmentId && r.ClinicId == clinicId, cancellationToken);
    }

    public async Task<IReadOnlyList<MedicalRecord>> GetHistoryByPatientIdAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.MedicalRecords
            .Include(r => r.Addenda)
            .Where(r => r.PatientId == patientId && r.ClinicId == clinicId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(MedicalRecord record, CancellationToken cancellationToken = default)
    {
        await dbContext.MedicalRecords.AddAsync(record, cancellationToken);
    }

    public Task UpdateAsync(MedicalRecord record, CancellationToken cancellationToken = default)
    {
        dbContext.MedicalRecords.Update(record);
        return Task.CompletedTask;
    }
}
