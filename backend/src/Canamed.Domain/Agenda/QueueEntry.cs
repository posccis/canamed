using Canamed.Domain.Common;

namespace Canamed.Domain.Agenda;

/// <summary>Prioridade de atendimento na fila (RN-004 da SPEC-0005).</summary>
public enum QueuePriority
{
    /// <summary>Atendimento normal, por ordem de chegada.</summary>
    Normal,

    /// <summary>Atendimento preferencial (idoso, gestante, pessoa com deficiência, lactante).</summary>
    Preferential,
}

/// <summary>Ciclo de vida da entrada na fila de espera (RN-005).</summary>
public enum QueueStatus
{
    /// <summary>Aguardando chamada.</summary>
    Waiting,

    /// <summary>Paciente chamado.</summary>
    Called,

    /// <summary>Atendimento em andamento.</summary>
    InService,

    /// <summary>Atendimento concluído.</summary>
    Completed,

    /// <summary>Paciente desistiu da espera.</summary>
    Left,

    /// <summary>Entrada cancelada (por exemplo, agendamento cancelado).</summary>
    Canceled,
}

/// <summary>Lançada quando a transição pedida não é válida para o estado atual (RN-005).</summary>
public sealed class QueueTransitionException(string message) : Exception(message);

/// <summary>Conversão entre o enum de código e o valor persistido (RN-014 da SPEC-0001).</summary>
public static class QueueMap
{
    private static readonly Dictionary<QueuePriority, string> Priorities = new()
    {
        [QueuePriority.Normal] = "normal",
        [QueuePriority.Preferential] = "preferencial",
    };

    private static readonly Dictionary<QueueStatus, string> Statuses = new()
    {
        [QueueStatus.Waiting] = "aguardando",
        [QueueStatus.Called] = "chamado",
        [QueueStatus.InService] = "em_atendimento",
        [QueueStatus.Completed] = "atendido",
        [QueueStatus.Left] = "desistiu",
        [QueueStatus.Canceled] = "cancelado",
    };

    private static readonly Dictionary<string, QueuePriority> PrioritiesByValue =
        Priorities.ToDictionary(pair => pair.Value, pair => pair.Key, StringComparer.Ordinal);

    private static readonly Dictionary<string, QueueStatus> StatusesByValue =
        Statuses.ToDictionary(pair => pair.Value, pair => pair.Key, StringComparer.Ordinal);

    /// <summary>Valores de prioridade aceitos pelo banco.</summary>
    public static IReadOnlyList<string> PriorityValues { get; } = [.. Priorities.Values];

    /// <summary>Valores de status aceitos pelo banco.</summary>
    public static IReadOnlyList<string> StatusValues { get; } = [.. Statuses.Values];

    /// <summary>Status considerados abertos (o paciente ainda está na fila ou em atendimento).</summary>
    public static IReadOnlyList<string> OpenStatusValues { get; } =
        [Statuses[QueueStatus.Waiting], Statuses[QueueStatus.Called], Statuses[QueueStatus.InService]];

    /// <summary>Converte a prioridade para o valor persistido.</summary>
    public static string ToStoredValue(this QueuePriority priority) =>
        Priorities.TryGetValue(priority, out var value)
            ? value
            : throw new ArgumentOutOfRangeException(nameof(priority), priority, "Prioridade desconhecida.");

    /// <summary>Converte o status para o valor persistido.</summary>
    public static string ToStoredValue(this QueueStatus status) =>
        Statuses.TryGetValue(status, out var value)
            ? value
            : throw new ArgumentOutOfRangeException(nameof(status), status, "Status de fila desconhecido.");

    /// <summary>Converte o valor persistido em prioridade.</summary>
    public static QueuePriority PriorityFromStoredValue(string? value) =>
        value is not null && PrioritiesByValue.TryGetValue(value, out var priority)
            ? priority
            : throw new ArgumentOutOfRangeException(nameof(value), value, "Prioridade desconhecida.");

    /// <summary>Converte o valor persistido em status.</summary>
    public static QueueStatus StatusFromStoredValue(string? value) =>
        value is not null && StatusesByValue.TryGetValue(value, out var status)
            ? status
            : throw new ArgumentOutOfRangeException(nameof(value), value, "Status de fila desconhecido.");
}

/// <summary>
/// Entrada da fila de espera: chegada do paciente, prioridade, vínculo opcional com o agendamento e
/// marcos de tempo do atendimento (RN-001 a RN-011 da SPEC-0005).
/// </summary>
public sealed class QueueEntry : Entity
{
    private QueueEntry()
    {
    }

    public Guid ClinicId { get; private set; }

    public Guid ProfessionalId { get; private set; }

    public Guid PatientId { get; private set; }

    /// <summary>Agendamento de origem; nulo em encaixes sem hora marcada (RN-002).</summary>
    public Guid? AppointmentId { get; private set; }

    /// <summary>Data local da clínica a que a fila pertence (RN-010).</summary>
    public DateOnly QueueDate { get; private set; }

    public QueuePriority Priority { get; private set; }

    public QueueStatus Status { get; private set; }

    public DateTimeOffset ArrivedAt { get; private set; }

    public DateTimeOffset? CalledAt { get; private set; }

    public DateTimeOffset? StartedAt { get; private set; }

    public DateTimeOffset? FinishedAt { get; private set; }

    /// <summary>Indica se a entrada ainda ocupa a fila (RN-003).</summary>
    public bool IsOpen => Status is QueueStatus.Waiting or QueueStatus.Called or QueueStatus.InService;

    /// <summary>Registra a chegada do paciente.</summary>
    public static QueueEntry CheckIn(
        Guid clinicId,
        Guid professionalId,
        Guid patientId,
        Guid? appointmentId,
        DateOnly queueDate,
        QueuePriority priority,
        DateTimeOffset now,
        Guid? id = null)
    {
        if (clinicId == Guid.Empty || professionalId == Guid.Empty || patientId == Guid.Empty)
        {
            throw new ArgumentException("Clínica, profissional e paciente são obrigatórios.");
        }

        var entry = new QueueEntry
        {
            ClinicId = clinicId,
            ProfessionalId = professionalId,
            PatientId = patientId,
            AppointmentId = appointmentId,
            QueueDate = queueDate,
            Priority = priority,
            Status = QueueStatus.Waiting,
            ArrivedAt = now,
        };

        if (id is not null)
        {
            entry.Id = id.Value;
        }

        entry.MarkCreated(now);

        return entry;
    }

    /// <summary>Chama o paciente (RN-005).</summary>
    public void Call(DateTimeOffset now) =>
        TransitionTo(QueueStatus.Called, now, [QueueStatus.Waiting], static (entry, moment) => entry.CalledAt = moment);

    /// <summary>Inicia o atendimento (RN-005).</summary>
    public void Start(DateTimeOffset now) =>
        TransitionTo(QueueStatus.InService, now, [QueueStatus.Called], static (entry, moment) => entry.StartedAt = moment);

    /// <summary>Conclui o atendimento na fila, a partir do atendimento em andamento (RN-005).</summary>
    public void Complete(DateTimeOffset now) =>
        TransitionTo(
            QueueStatus.Completed,
            now,
            [QueueStatus.InService],
            static (entry, moment) => entry.FinishedAt = moment);

    /// <summary>
    /// Conclui a entrada porque o agendamento vinculado foi marcado como atendido na agenda
    /// (RN-007 da SPEC-0005): vale de qualquer estado aberto, pois a agenda é a fonte da verdade.
    /// </summary>
    public void CompleteFromAgenda(DateTimeOffset now) =>
        TransitionTo(
            QueueStatus.Completed,
            now,
            [QueueStatus.Waiting, QueueStatus.Called, QueueStatus.InService],
            static (entry, moment) =>
            {
                entry.CalledAt ??= moment;
                entry.StartedAt ??= moment;
                entry.FinishedAt = moment;
            });

    /// <summary>Registra desistência porque o paciente faltou, segundo a agenda (RN-007).</summary>
    public void LeaveFromAgenda(DateTimeOffset now) =>
        TransitionTo(
            QueueStatus.Left,
            now,
            [QueueStatus.Waiting, QueueStatus.Called, QueueStatus.InService],
            static (entry, moment) => entry.FinishedAt = moment);

    /// <summary>Cancela a entrada porque o agendamento foi cancelado (RN-007).</summary>
    public void CancelFromAgenda(DateTimeOffset now) =>
        TransitionTo(
            QueueStatus.Canceled,
            now,
            [QueueStatus.Waiting, QueueStatus.Called, QueueStatus.InService],
            static (entry, moment) => entry.FinishedAt = moment);

    /// <summary>Registra desistência (RN-005).</summary>
    public void Leave(DateTimeOffset now) =>
        TransitionTo(QueueStatus.Left, now, [QueueStatus.Waiting, QueueStatus.Called], static (entry, moment) => entry.FinishedAt = moment);

    /// <summary>Cancela a entrada (por exemplo, agendamento cancelado).</summary>
    public void Cancel(DateTimeOffset now) =>
        TransitionTo(QueueStatus.Canceled, now, [QueueStatus.Waiting, QueueStatus.Called], static (entry, moment) => entry.FinishedAt = moment);

    /// <summary>Tempo de espera até a chamada — ou até agora, se ainda aguarda (RN-009).</summary>
    public TimeSpan WaitingTime(DateTimeOffset now)
    {
        var elapsed = (CalledAt ?? now) - ArrivedAt;

        return elapsed > TimeSpan.Zero ? elapsed : TimeSpan.Zero;
    }

    /// <summary>Duração do atendimento, quando concluído (RN-009).</summary>
    public TimeSpan? ServiceTime =>
        StartedAt is not null && FinishedAt is not null ? FinishedAt.Value - StartedAt.Value : null;

    /// <summary>Atualiza a prioridade da fila com base na triagem ou preferência (SPEC-0009).</summary>
    public void PromoteToPriority(QueuePriority priority, DateTimeOffset now)
    {
        Priority = priority;
        MarkUpdated(now);
    }

    private void TransitionTo(
        QueueStatus target,
        DateTimeOffset now,
        IReadOnlyList<QueueStatus> allowedFrom,
        Action<QueueEntry, DateTimeOffset> apply)
    {
        if (Status == target)
        {
            // RN-008: repetir a mesma operação não é erro.
            return;
        }

        if (!allowedFrom.Contains(Status))
        {
            throw new QueueTransitionException(
                "Esta entrada da fila não pode mudar para este status.");
        }

        Status = target;
        apply(this, now);
        MarkUpdated(now);
    }
}

/// <summary>Ordenação e posição da fila, isoladas do banco (RN-004).</summary>
public static class QueueOrdering
{
    /// <summary>Ordena por prioridade e, dentro dela, por ordem de chegada e criação.</summary>
    public static IReadOnlyList<QueueEntry> Sort(IEnumerable<QueueEntry> entries)
    {
        ArgumentNullException.ThrowIfNull(entries);

        return
        [
            .. entries
                .OrderBy(static entry => entry.Priority == QueuePriority.Preferential ? 0 : 1)
                .ThenBy(static entry => entry.ArrivedAt)
                .ThenBy(static entry => entry.CreatedAt)
                .ThenBy(static entry => entry.Id),
        ];
    }

    /// <summary>Posição (1-based) da entrada na fila ordenada, ou nulo quando não está aguardando.</summary>
    public static int? PositionOf(IReadOnlyList<QueueEntry> orderedEntries, QueueEntry entry)
    {
        ArgumentNullException.ThrowIfNull(orderedEntries);
        ArgumentNullException.ThrowIfNull(entry);

        if (entry.Status != QueueStatus.Waiting)
        {
            return null;
        }

        var index = orderedEntries
            .Where(static item => item.Status == QueueStatus.Waiting)
            .ToList()
            .FindIndex(item => item.Id == entry.Id);

        return index < 0 ? null : index + 1;
    }
}
