using Canamed.Domain.Agenda;

namespace Canamed.Application.Abstractions;

/// <summary>Acesso aos dados de agenda, sempre no escopo de uma clínica (RN-004).</summary>
public interface IAgendaRepository
{
    /// <summary>Lista agendamentos da clínica em um intervalo, opcionalmente de um profissional.</summary>
    Task<IReadOnlyList<Appointment>> ListAppointmentsAsync(
        Guid clinicId,
        Guid? professionalId,
        DateTimeOffset fromUtc,
        DateTimeOffset toUtc,
        CancellationToken cancellationToken);

    /// <summary>Lista bloqueios de agenda da clínica em um intervalo, opcionalmente de um profissional.</summary>
    Task<IReadOnlyList<ProfessionalBlock>> ListBlocksAsync(
        Guid clinicId,
        Guid? professionalId,
        DateTimeOffset fromUtc,
        DateTimeOffset toUtc,
        CancellationToken cancellationToken);

    /// <summary>Obtém um agendamento da clínica, ou <c>null</c> quando não existir no escopo.</summary>
    Task<Appointment?> FindAppointmentAsync(Guid appointmentId, Guid clinicId, CancellationToken cancellationToken);

    /// <summary>Verifica se o profissional existe na clínica.</summary>
    Task<bool> ProfessionalExistsAsync(Guid clinicId, Guid professionalId, CancellationToken cancellationToken);

    /// <summary>Adiciona um agendamento ao contexto de persistência.</summary>
    void AddAppointment(Appointment appointment);

    /// <summary>Adiciona um bloqueio de agenda ao contexto de persistência.</summary>
    void AddBlock(ProfessionalBlock block);

    /// <summary>Obtém um bloqueio específico da agenda do profissional.</summary>
    Task<ProfessionalBlock?> FindBlockAsync(
        Guid clinicId,
        Guid professionalId,
        Guid blockId,
        CancellationToken cancellationToken);

    /// <summary>Remove um bloqueio da agenda (RN-007 da SPEC-0004).</summary>
    void RemoveBlock(ProfessionalBlock block);

    /// <summary>
    /// Serializa as escritas de agenda de um profissional dentro da transação corrente
    /// (<c>pg_advisory_xact_lock</c>), impedindo corrida entre duas requisições simultâneas.
    /// </summary>
    Task LockProfessionalAgendaAsync(Guid professionalId, CancellationToken cancellationToken);

    /// <summary>Confirma as alterações pendentes no contexto de persistência.</summary>
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
