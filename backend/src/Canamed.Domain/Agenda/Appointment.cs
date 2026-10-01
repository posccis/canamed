using Canamed.Domain.Common;

namespace Canamed.Domain.Agenda;

/// <summary>
/// Agendamento de consulta. Concentra as regras de negócio RN-002, RN-003, RN-005, RN-006, RN-007,
/// RN-008, RN-010 e RN-012 da SPEC-0002, de modo que sejam testáveis sem banco de dados.
/// </summary>
public sealed class Appointment : Entity
{
    private Appointment()
    {
    }

    public Guid ClinicId { get; private set; }

    public Guid ProfessionalId { get; private set; }

    public Guid PatientId { get; private set; }

    public Guid AppointmentTypeId { get; private set; }

    /// <summary>Início do atendimento, em UTC (RN-010).</summary>
    public DateTimeOffset StartsAt { get; private set; }

    /// <summary>Fim do atendimento, em UTC. Sempre igual a <see cref="StartsAt"/> + <see cref="DurationMinutes"/>.</summary>
    public DateTimeOffset EndsAt { get; private set; }

    /// <summary>Duração vigente do tipo de atendimento no momento da criação (RN-002).</summary>
    public int DurationMinutes { get; private set; }

    public AppointmentStatus Status { get; private set; }

    /// <summary>Motivo do cancelamento, obrigatório na operação (RN-006).</summary>
    public string? CancellationReason { get; private set; }

    /// <summary>Preenchido na exclusão lógica (RN-012); registros excluídos não bloqueiam a agenda.</summary>
    public DateTimeOffset? DeletedAt { get; private set; }

    /// <summary>Indica se o agendamento ocupa horário na agenda do profissional.</summary>
    public bool OccupiesAgenda => DeletedAt is null && Status is AppointmentStatus.Scheduled or AppointmentStatus.Confirmed;

    /// <summary>Intervalo ocupado pelo agendamento.</summary>
    public TimeRange TimeRange => new(StartsAt, EndsAt);

    /// <summary>Cria um agendamento válido (RN-002, RN-003, RN-005).</summary>
    public static Appointment Schedule(
        Guid clinicId,
        Guid professionalId,
        Guid patientId,
        Guid appointmentTypeId,
        DateTimeOffset startsAt,
        int durationMinutes,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("A clínica é obrigatória.", nameof(clinicId));
        }

        if (professionalId == Guid.Empty)
        {
            throw new ArgumentException("O profissional é obrigatório.", nameof(professionalId));
        }

        if (patientId == Guid.Empty)
        {
            throw new ArgumentException("O paciente é obrigatório.", nameof(patientId));
        }

        if (appointmentTypeId == Guid.Empty)
        {
            throw new ArgumentException("O tipo de atendimento é obrigatório.", nameof(appointmentTypeId));
        }

        var range = TimeRange.FromStartAndMinutes(startsAt.ToUniversalTime(), durationMinutes);
        AgendaRules.EnsureNotInThePast(range, now);

        var appointment = new Appointment
        {
            ClinicId = clinicId,
            ProfessionalId = professionalId,
            PatientId = patientId,
            AppointmentTypeId = appointmentTypeId,
            StartsAt = range.StartsAt,
            EndsAt = range.EndsAt,
            DurationMinutes = durationMinutes,
            Status = AppointmentStatus.Scheduled,
        };

        appointment.MarkCreated(now);

        return appointment;
    }

    /// <summary>Remarca o agendamento para um novo início, mantendo o histórico no log de auditoria (RN-007).</summary>
    public void Reschedule(DateTimeOffset newStartsAt, DateTimeOffset now)
    {
        EnsureChangeable();

        var range = TimeRange.FromStartAndMinutes(newStartsAt.ToUniversalTime(), DurationMinutes);
        AgendaRules.EnsureNotInThePast(range, now);

        StartsAt = range.StartsAt;
        EndsAt = range.EndsAt;
        MarkUpdated(now);
    }

    /// <summary>Cancela o agendamento preservando o registro e liberando o horário (RN-006).</summary>
    public void Cancel(string reason, DateTimeOffset now)
    {
        EnsureChangeable();

        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("O motivo do cancelamento é obrigatório.", nameof(reason));
        }

        Status = AppointmentStatus.Cancelled;
        CancellationReason = reason.Trim();
        MarkUpdated(now);
    }

    /// <summary>Confirma a presença do paciente.</summary>
    public void Confirm(DateTimeOffset now)
    {
        EnsureChangeable();

        Status = AppointmentStatus.Confirmed;
        MarkUpdated(now);
    }

    /// <summary>Registra que o paciente foi atendido.</summary>
    public void MarkAttended(DateTimeOffset now)
    {
        if (Status is not (AppointmentStatus.Scheduled or AppointmentStatus.Confirmed))
        {
            throw new AppointmentStatusTransitionException(
                "Somente agendamentos agendados ou confirmados podem ser marcados como atendidos.");
        }

        Status = AppointmentStatus.Attended;
        MarkUpdated(now);
    }

    /// <summary>Registra a falta do paciente.</summary>
    public void MarkNoShow(DateTimeOffset now)
    {
        if (Status is not (AppointmentStatus.Scheduled or AppointmentStatus.Confirmed))
        {
            throw new AppointmentStatusTransitionException(
                "Somente agendamentos agendados ou confirmados podem ser marcados como falta.");
        }

        Status = AppointmentStatus.NoShow;
        MarkUpdated(now);
    }

    /// <summary>Exclusão lógica (RN-012).</summary>
    public void SoftDelete(DateTimeOffset now)
    {
        if (DeletedAt is not null)
        {
            return;
        }

        DeletedAt = now;
        MarkUpdated(now);
    }

    private void EnsureChangeable()
    {
        if (Status is not (AppointmentStatus.Scheduled or AppointmentStatus.Confirmed) || DeletedAt is not null)
        {
            throw new AppointmentStatusTransitionException(
                "Este agendamento não pode mais ser alterado: apenas agendamentos agendados ou confirmados aceitam remarcação ou cancelamento.");
        }
    }
}
