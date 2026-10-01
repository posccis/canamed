using Canamed.Domain.Agenda;

namespace Canamed.UnitTests.Agenda;

/// <summary>
/// Regras de negócio do agendamento, testadas sem banco de dados (requisito não funcional da SPEC-0002).
/// </summary>
public sealed class AppointmentTests
{
    private static readonly Guid ClinicId = Guid.NewGuid();
    private static readonly Guid ProfessionalId = Guid.NewGuid();
    private static readonly Guid PatientId = Guid.NewGuid();
    private static readonly Guid TypeId = Guid.NewGuid();
    private static readonly DateTimeOffset Now = new(2026, 10, 1, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Schedule_DeveCopiarDuracaoDoTipoDeAtendimento_QuandoCriado()
    {
        var appointment = Schedule(Now.AddHours(2), 30);

        Assert.Equal(30, appointment.DurationMinutes);
        Assert.Equal(appointment.StartsAt.AddMinutes(30), appointment.EndsAt);
        Assert.Equal(AppointmentStatus.Scheduled, appointment.Status);
        Assert.True(appointment.OccupiesAgenda);
    }

    [Fact]
    public void Schedule_DeveRecusarInicioNoPassado()
    {
        var exception = Assert.Throws<PastSchedulingException>(() => Schedule(Now.AddMinutes(-1), 30));

        Assert.Contains("data passada", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Schedule_DeveConverterHorarioParaUtc()
    {
        var fortalezaOffset = TimeSpan.FromHours(-3);
        var localStart = new DateTimeOffset(2026, 10, 2, 14, 0, 0, fortalezaOffset);

        var appointment = Schedule(localStart, 30);

        Assert.Equal(TimeSpan.Zero, appointment.StartsAt.Offset);
        Assert.Equal(localStart.ToUniversalTime(), appointment.StartsAt);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-15)]
    public void Schedule_DeveRecusarDuracaoNaoPositiva(int durationMinutes)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Schedule(Now.AddHours(1), durationMinutes));
    }

    [Fact]
    public void Reschedule_DeveManterADuracaoOriginal_QuandoTipoDeAtendimentoMuda()
    {
        var appointment = Schedule(Now.AddHours(2), 30);

        // RN-002: a duração do agendamento é a vigente no momento da criação.
        appointment.Reschedule(Now.AddHours(4), Now);

        Assert.Equal(30, appointment.DurationMinutes);
        Assert.Equal(appointment.StartsAt.AddMinutes(30), appointment.EndsAt);
    }

    [Fact]
    public void Reschedule_DeveRecusarNovoHorarioNoPassado()
    {
        var appointment = Schedule(Now.AddHours(2), 30);

        Assert.Throws<PastSchedulingException>(() => appointment.Reschedule(Now.AddMinutes(-30), Now));
    }

    [Fact]
    public void Cancel_DeveExigirMotivo()
    {
        var appointment = Schedule(Now.AddHours(2), 30);

        Assert.Throws<ArgumentException>(() => appointment.Cancel("   ", Now));
    }

    [Fact]
    public void Cancel_DeveLiberarOHorarioESeusarOCicloDeVida()
    {
        var appointment = Schedule(Now.AddHours(2), 30);

        appointment.Cancel("Paciente desmarcou", Now.AddMinutes(5));

        Assert.Equal(AppointmentStatus.Cancelled, appointment.Status);
        Assert.Equal("Paciente desmarcou", appointment.CancellationReason);
        Assert.False(appointment.OccupiesAgenda);
    }

    [Fact]
    public void Cancel_DeveRecusarAgendamentoJaCancelado_RN008()
    {
        var appointment = Schedule(Now.AddHours(2), 30);
        appointment.Cancel("Primeiro motivo", Now);

        Assert.Throws<AppointmentStatusTransitionException>(() => appointment.Cancel("Segundo motivo", Now));
    }

    [Fact]
    public void Cancel_DeveRecusarAgendamentoAtendido_RN008()
    {
        var appointment = Schedule(Now.AddHours(2), 30);
        appointment.MarkAttended(Now);

        Assert.Throws<AppointmentStatusTransitionException>(() => appointment.Cancel("Tentativa indevida", Now));
    }

    [Fact]
    public void Reschedule_DeveRecusarAgendamentoAtendido_RN008()
    {
        var appointment = Schedule(Now.AddHours(2), 30);
        appointment.MarkAttended(Now);

        Assert.Throws<AppointmentStatusTransitionException>(() => appointment.Reschedule(Now.AddHours(3), Now));
    }

    [Fact]
    public void Confirm_DeveManterOHorarioOcupado()
    {
        var appointment = Schedule(Now.AddHours(2), 30);

        appointment.Confirm(Now);

        Assert.Equal(AppointmentStatus.Confirmed, appointment.Status);
        Assert.True(appointment.OccupiesAgenda);
    }

    [Fact]
    public void SoftDelete_DeveLiberarOHorarioEPreservarORegistro()
    {
        var appointment = Schedule(Now.AddHours(2), 30);

        appointment.SoftDelete(Now);

        Assert.False(appointment.OccupiesAgenda);
        Assert.NotNull(appointment.DeletedAt);
    }

    [Fact]
    public void Schedule_DeveRecusarIdentificadoresVazios()
    {
        Assert.Throws<ArgumentException>(() => Appointment.Schedule(
            Guid.Empty,
            ProfessionalId,
            PatientId,
            TypeId,
            Now.AddHours(1),
            30,
            Now));
    }

    private static Appointment Schedule(DateTimeOffset startsAt, int durationMinutes) =>
        Appointment.Schedule(ClinicId, ProfessionalId, PatientId, TypeId, startsAt, durationMinutes, Now);
}
