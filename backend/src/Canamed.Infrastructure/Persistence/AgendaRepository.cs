using Canamed.Application.Abstractions;
using Canamed.Domain.Agenda;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

/// <summary>Acesso a dados de agenda com isolamento por clínica (RN-004).</summary>
public sealed class AgendaRepository(CanamedDbContext dbContext) : IAgendaRepository
{
    public async Task<IReadOnlyList<Appointment>> ListAppointmentsAsync(
        Guid clinicId,
        Guid? professionalId,
        DateTimeOffset fromUtc,
        DateTimeOffset toUtc,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Appointments
            .AsNoTracking()
            .Where(appointment => appointment.ClinicId == clinicId)
            .Where(appointment => appointment.DeletedAt == null)
            .Where(appointment => appointment.StartsAt < toUtc && appointment.EndsAt > fromUtc);

        if (professionalId is not null)
        {
            query = query.Where(appointment => appointment.ProfessionalId == professionalId);
        }

        return await query
            .OrderBy(appointment => appointment.StartsAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<ProfessionalBlock>> ListBlocksAsync(
        Guid clinicId,
        Guid? professionalId,
        DateTimeOffset fromUtc,
        DateTimeOffset toUtc,
        CancellationToken cancellationToken)
    {
        var query = dbContext.ProfessionalBlocks
            .AsNoTracking()
            .Where(block => block.ClinicId == clinicId)
            .Where(block => block.StartsAt < toUtc && block.EndsAt > fromUtc);

        if (professionalId is not null)
        {
            query = query.Where(block => block.ProfessionalId == professionalId);
        }

        return await query
            .OrderBy(block => block.StartsAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<Appointment?> FindAppointmentAsync(
        Guid appointmentId,
        Guid clinicId,
        CancellationToken cancellationToken) =>
        await dbContext.Appointments
            .Where(appointment => appointment.Id == appointmentId && appointment.ClinicId == clinicId)
            .Where(appointment => appointment.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

    public Task<bool> ProfessionalExistsAsync(
        Guid clinicId,
        Guid professionalId,
        CancellationToken cancellationToken) =>
        dbContext.Professionals.AnyAsync(
            professional => professional.Id == professionalId && professional.ClinicId == clinicId,
            cancellationToken);

    public void AddAppointment(Appointment appointment) => dbContext.Appointments.Add(appointment);

    public void AddBlock(ProfessionalBlock block) => dbContext.ProfessionalBlocks.Add(block);

    public Task<ProfessionalBlock?> FindBlockAsync(
        Guid clinicId,
        Guid professionalId,
        Guid blockId,
        CancellationToken cancellationToken) =>
        dbContext.ProfessionalBlocks.FirstOrDefaultAsync(
            block => block.Id == blockId && block.ClinicId == clinicId && block.ProfessionalId == professionalId,
            cancellationToken);

    public void RemoveBlock(ProfessionalBlock block) => dbContext.ProfessionalBlocks.Remove(block);

    /// <summary>
    /// Trava de agenda por profissional no escopo da transação corrente. Duas requisições simultâneas
    /// para o mesmo profissional são serializadas, o que impede *double booking* (RN-001).
    /// </summary>
    public async Task LockProfessionalAgendaAsync(Guid professionalId, CancellationToken cancellationToken) =>
        await dbContext.Database
            .ExecuteSqlRawAsync(
                "SELECT pg_advisory_xact_lock(hashtextextended({0}::text, 0))",
                [professionalId],
                cancellationToken)
            .ConfigureAwait(false);

    public async Task SaveChangesAsync(CancellationToken cancellationToken) =>
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
}
