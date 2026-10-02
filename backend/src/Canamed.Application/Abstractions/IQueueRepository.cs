using Canamed.Domain.Agenda;

namespace Canamed.Application.Abstractions;

/// <summary>Acesso à fila de espera, sempre no escopo de uma clínica (RN-016 da SPEC-0005).</summary>
public interface IQueueRepository
{
    /// <summary>
    /// Lista as entradas de um dia, opcionalmente de um profissional. As entradas vêm rastreadas para
    /// permitir transições dentro do mesmo contexto (a lista de um dia é pequena).
    /// </summary>
    Task<IReadOnlyList<QueueEntry>> ListAsync(
        Guid clinicId,
        DateOnly date,
        Guid? professionalId,
        CancellationToken cancellationToken);

    /// <summary>Obtém uma entrada da clínica, rastreada para alteração.</summary>
    Task<QueueEntry?> FindAsync(Guid clinicId, Guid entryId, CancellationToken cancellationToken);

    /// <summary>Obtém a entrada aberta vinculada a um agendamento (RN-003).</summary>
    Task<QueueEntry?> FindOpenByAppointmentAsync(
        Guid clinicId,
        Guid appointmentId,
        CancellationToken cancellationToken);

    /// <summary>Adiciona uma entrada à fila.</summary>
    void Add(QueueEntry entry);

    /// <summary>Confirma as alterações pendentes.</summary>
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
