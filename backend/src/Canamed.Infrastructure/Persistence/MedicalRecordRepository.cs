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
            .Include(r => r.GynecologicalData)
            .FirstOrDefaultAsync(r => r.Id == id && r.ClinicId == clinicId, cancellationToken);
    }

    public async Task<MedicalRecord?> GetByAppointmentIdAsync(Guid appointmentId, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.MedicalRecords
            .Include(r => r.Addenda)
            .Include(r => r.GynecologicalData)
            .FirstOrDefaultAsync(r => r.AppointmentId == appointmentId && r.ClinicId == clinicId, cancellationToken);
    }

    public async Task<IReadOnlyList<MedicalRecord>> GetHistoryByPatientIdAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.MedicalRecords
            .Include(r => r.Addenda)
            .Include(r => r.GynecologicalData)
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

    public async Task<GynecologicalProfile?> GetGynecologicalProfileAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.GynecologicalProfiles
            .FirstOrDefaultAsync(p => p.PatientId == patientId && p.ClinicId == clinicId, cancellationToken);
    }

    public async Task SaveGynecologicalProfileAsync(GynecologicalProfile profile, CancellationToken cancellationToken = default)
    {
        var exists = await dbContext.GynecologicalProfiles.AnyAsync(p => p.Id == profile.Id, cancellationToken);
        if (exists)
        {
            dbContext.GynecologicalProfiles.Update(profile);
        }
        else
        {
            await dbContext.GynecologicalProfiles.AddAsync(profile, cancellationToken);
        }
    }

    public async Task<GynecologicalConsultationData?> GetGynecologicalConsultationDataAsync(Guid medicalRecordId, CancellationToken cancellationToken = default)
    {
        return await dbContext.GynecologicalConsultationData
            .FirstOrDefaultAsync(d => d.MedicalRecordId == medicalRecordId, cancellationToken);
    }

    public async Task SaveGynecologicalConsultationDataAsync(GynecologicalConsultationData data, CancellationToken cancellationToken = default)
    {
        var exists = await dbContext.GynecologicalConsultationData.AnyAsync(d => d.Id == data.Id, cancellationToken);
        if (exists)
        {
            dbContext.GynecologicalConsultationData.Update(data);
        }
        else
        {
            await dbContext.GynecologicalConsultationData.AddAsync(data, cancellationToken);
        }
    }

    public async Task<IReadOnlyList<PreventiveScreeningRecord>> ListScreeningsByPatientAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.PreventiveScreeningRecords
            .Where(s => s.PatientId == patientId && s.ClinicId == clinicId)
            .OrderByDescending(s => s.PerformedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddScreeningAsync(PreventiveScreeningRecord record, CancellationToken cancellationToken = default)
    {
        await dbContext.PreventiveScreeningRecords.AddAsync(record, cancellationToken);
    }

    public async Task AddExamAttachmentAsync(PatientExamAttachment attachment, CancellationToken cancellationToken = default)
    {
        await dbContext.PatientExamAttachments.AddAsync(attachment, cancellationToken);
    }

    public Task<PatientExamAttachment?> GetExamAttachmentByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return dbContext.PatientExamAttachments
            .FirstOrDefaultAsync(a => a.Id == id && a.ClinicId == clinicId, cancellationToken);
    }

    public async Task<IReadOnlyList<PatientExamAttachment>> ListExamAttachmentsByPatientAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.PatientExamAttachments
            .Where(a => a.ClinicId == clinicId && a.PatientId == patientId && a.IsActive)
            .OrderByDescending(a => a.ExamDate)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task UpdateExamAttachmentAsync(PatientExamAttachment attachment, CancellationToken cancellationToken = default)
    {
        dbContext.PatientExamAttachments.Update(attachment);
        return Task.CompletedTask;
    }

    public Task<int> CountPendingDraftsAsync(Guid clinicId, Guid? doctorId, CancellationToken cancellationToken = default)
    {
        var query = dbContext.MedicalRecords
            .Where(r => r.ClinicId == clinicId && r.Status == MedicalRecordStatus.EmAndamento);

        if (doctorId is not null && doctorId != Guid.Empty)
        {
            query = query.Where(r => r.DoctorId == doctorId);
        }

        return query.CountAsync(cancellationToken);
    }
}
