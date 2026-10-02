using Canamed.Application.Abstractions;
using Canamed.Application.Errors;
using Canamed.Domain.Agenda;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

/// <summary>Acesso à fila de espera (SPEC-0005).</summary>
public sealed class QueueRepository(CanamedDbContext dbContext) : IQueueRepository
{
    public async Task<IReadOnlyList<QueueEntry>> ListAsync(
        Guid clinicId,
        DateOnly date,
        Guid? professionalId,
        CancellationToken cancellationToken)
    {
        var query = dbContext.QueueEntries
            .Where(entry => entry.ClinicId == clinicId && entry.QueueDate == date);

        if (professionalId is not null)
        {
            query = query.Where(entry => entry.ProfessionalId == professionalId);
        }

        return await query
            .OrderBy(entry => entry.ArrivedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public Task<QueueEntry?> FindAsync(Guid clinicId, Guid entryId, CancellationToken cancellationToken) =>
        dbContext.QueueEntries.FirstOrDefaultAsync(
            entry => entry.Id == entryId && entry.ClinicId == clinicId,
            cancellationToken);

    public Task<QueueEntry?> FindOpenByAppointmentAsync(
        Guid clinicId,
        Guid appointmentId,
        CancellationToken cancellationToken) =>
        dbContext.QueueEntries.FirstOrDefaultAsync(
            entry => entry.ClinicId == clinicId
                && entry.AppointmentId == appointmentId
                && (entry.Status == QueueStatus.Waiting
                    || entry.Status == QueueStatus.Called
                    || entry.Status == QueueStatus.InService),
            cancellationToken);

    public void Add(QueueEntry entry) => dbContext.QueueEntries.Add(entry);

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            // RN-003: o índice único parcial garante uma única entrada aberta por agendamento,
            // inclusive sob requisições simultâneas.
            throw new CanamedException(
                ProblemKind.Conflict,
                "Paciente já está na fila",
                "Este agendamento já está na fila.",
                "queue-entry-conflict");
        }
    }

    private static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is Npgsql.PostgresException { SqlState: "23505" };
}
