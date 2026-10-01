using Canamed.Application.Abstractions;
using Canamed.Domain.Agenda;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

/// <summary>Cadastro mínimo de profissionais, pacientes e tipos de atendimento.</summary>
public sealed class CatalogRepository(CanamedDbContext dbContext) : ICatalogRepository
{
    public async Task<IReadOnlyList<Professional>> ListProfessionalsAsync(
        Guid clinicId,
        CancellationToken cancellationToken) =>
        await dbContext.Professionals
            .AsNoTracking()
            .Where(professional => professional.ClinicId == clinicId)
            .OrderBy(professional => professional.Name)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<Patient>> ListPatientsAsync(Guid clinicId, CancellationToken cancellationToken) =>
        await dbContext.Patients
            .AsNoTracking()
            .Where(patient => patient.ClinicId == clinicId)
            .OrderBy(patient => patient.Name)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<Patient>> ListPatientsByIdsAsync(
        Guid clinicId,
        IReadOnlyCollection<Guid> patientIds,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(patientIds);

        if (patientIds.Count is 0)
        {
            return [];
        }

        return await dbContext.Patients
            .AsNoTracking()
            .Where(patient => patient.ClinicId == clinicId && patientIds.Contains(patient.Id))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<AppointmentType>> ListAppointmentTypesAsync(
        Guid clinicId,
        CancellationToken cancellationToken) =>
        await dbContext.AppointmentTypes
            .AsNoTracking()
            .Where(appointmentType => appointmentType.ClinicId == clinicId)
            .OrderBy(appointmentType => appointmentType.Name)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<AppointmentType>> ListAppointmentTypesByIdsAsync(
        Guid clinicId,
        IReadOnlyCollection<Guid> appointmentTypeIds,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(appointmentTypeIds);

        if (appointmentTypeIds.Count is 0)
        {
            return [];
        }

        return await dbContext.AppointmentTypes
            .AsNoTracking()
            .Where(type => type.ClinicId == clinicId && appointmentTypeIds.Contains(type.Id))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public Task<Patient?> FindPatientAsync(
        Guid patientId,
        Guid clinicId,
        CancellationToken cancellationToken) =>
        dbContext.Patients
            .FirstOrDefaultAsync(patient => patient.Id == patientId && patient.ClinicId == clinicId, cancellationToken);

    public Task<AppointmentType?> FindAppointmentTypeAsync(
        Guid clinicId,
        Guid appointmentTypeId,
        CancellationToken cancellationToken) =>
        dbContext.AppointmentTypes
            .FirstOrDefaultAsync(
                appointmentType => appointmentType.Id == appointmentTypeId && appointmentType.ClinicId == clinicId,
                cancellationToken);

    public void AddProfessional(Professional professional) => dbContext.Professionals.Add(professional);

    public void AddPatient(Patient patient) => dbContext.Patients.Add(patient);

    public void AddAppointmentType(AppointmentType appointmentType) =>
        dbContext.AppointmentTypes.Add(appointmentType);

    public void AddSpecialty(Specialty specialty) => dbContext.Specialties.Add(specialty);

    public Task<Professional?> FindProfessionalAsync(
        Guid clinicId,
        Guid professionalId,
        CancellationToken cancellationToken) =>
        dbContext.Professionals.FirstOrDefaultAsync(
            professional => professional.Id == professionalId && professional.ClinicId == clinicId,
            cancellationToken);

    public async Task<IReadOnlyList<Specialty>> ListSpecialtiesAsync(
        Guid clinicId,
        CancellationToken cancellationToken) =>
        await dbContext.Specialties
            .AsNoTracking()
            .Where(specialty => specialty.ClinicId == clinicId)
            .OrderBy(specialty => specialty.Name)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<Specialty>> ListSpecialtiesByIdsAsync(
        Guid clinicId,
        IReadOnlyCollection<Guid> specialtyIds,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(specialtyIds);

        if (specialtyIds.Count is 0)
        {
            return [];
        }

        return await dbContext.Specialties
            .AsNoTracking()
            .Where(specialty => specialty.ClinicId == clinicId && specialtyIds.Contains(specialty.Id))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public Task<Specialty?> FindSpecialtyAsync(
        Guid clinicId,
        Guid specialtyId,
        CancellationToken cancellationToken) =>
        dbContext.Specialties.FirstOrDefaultAsync(
            specialty => specialty.Id == specialtyId && specialty.ClinicId == clinicId,
            cancellationToken);

    public Task<bool> SpecialtyNameExistsAsync(
        Guid clinicId,
        string name,
        Guid? exceptSpecialtyId,
        CancellationToken cancellationToken)
    {
        var normalized = name.Trim().ToLowerInvariant();

        return dbContext.Specialties.AnyAsync(
            specialty => specialty.ClinicId == clinicId
                && specialty.Name.ToLower() == normalized
                && (exceptSpecialtyId == null || specialty.Id != exceptSpecialtyId),
            cancellationToken);
    }

    public Task<bool> AppointmentTypeNameExistsAsync(
        Guid clinicId,
        string name,
        Guid? exceptAppointmentTypeId,
        CancellationToken cancellationToken)
    {
        var normalized = name.Trim().ToLowerInvariant();

        return dbContext.AppointmentTypes.AnyAsync(
            appointmentType => appointmentType.ClinicId == clinicId
                && appointmentType.Name.ToLower() == normalized
                && (exceptAppointmentTypeId == null || appointmentType.Id != exceptAppointmentTypeId),
            cancellationToken);
    }

    public async Task<bool> SpecialtyHasActiveLinksAsync(
        Guid clinicId,
        Guid specialtyId,
        CancellationToken cancellationToken)
    {
        var usedByType = await dbContext.AppointmentTypes
            .AnyAsync(
                appointmentType => appointmentType.ClinicId == clinicId
                    && appointmentType.SpecialtyId == specialtyId
                    && appointmentType.IsActive,
                cancellationToken)
            .ConfigureAwait(false);

        if (usedByType)
        {
            return true;
        }

        return await dbContext.Professionals
            .AnyAsync(
                professional => professional.ClinicId == clinicId
                    && professional.SpecialtyId == specialtyId
                    && professional.IsActive,
                cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken) =>
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
}
