using System.Net;
using Canamed.Application.Agenda;
using Canamed.Application.Identity;
using Canamed.Application.Queue;
using Canamed.Domain.Agenda;
using Canamed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Canamed.IntegrationTests.Queue;

/// <summary>
/// Critérios de aceitação CA-001 a CA-013 da SPEC-0005: check-in, ordenação por prioridade, ciclo de
/// atendimento, consistência com a agenda, fechamento do dia e isolamento por clínica.
///
/// A suíte usa o relógio fixo da fábrica (início do dia local), o que torna os cenários
/// determinísticos em qualquer horário de execução.
/// </summary>
[Collection(CanamedCollection.Name)]
public sealed class QueueEndpointsTests(CanamedApiFactory factory) : Agenda.AgendaTestBase(factory)
{
    private static DateOnly Today =>
        DateOnly.FromDateTime(AgendaTimeZone.ToLocal(CanamedApiFactory.FixedNow).DateTime);

    [Fact]
    public async Task CA001_CheckIn_DeveColocarOPacienteNaFilaDoProfissional()
    {
        using var client = CreateReceptionClient("recepcao-fila");
        var appointment = await CreateTodayAppointmentAsync(client, 8);

        var entry = await CheckInAsync(client, appointment.Id);

        Assert.Equal("aguardando", entry.Status);
        Assert.Equal("normal", entry.Priority);
        Assert.Equal(1, entry.Position);
        Assert.Equal("Paciente Teste A", entry.PatientName);
        Assert.Equal(appointment.Id, entry.AppointmentId);
        Assert.Equal(CanamedApiFactory.ProfessionalAId, entry.ProfessionalId);

        var day = await ReadAsync<QueueDayResponse>(await client.GetAsync(
            new Uri($"/api/v1/queue?date={Today:yyyy-MM-dd}", UriKind.Relative)));

        Assert.Contains(day.Entries, item => item.Id == entry.Id);
    }

    [Fact]
    public async Task CA002_EncaixeSemAgendamento_DeveEntrarNaMesmaFila()
    {
        using var client = CreateReceptionClient();

        var entry = await ReadAsync<QueueEntryResponse>(await client.PostAsync(
            new Uri("/api/v1/queue/check-in", UriKind.Relative),
            JsonBody(new
            {
                appointmentId = (Guid?)null,
                patientId = CanamedApiFactory.PatientAId,
                professionalId = CanamedApiFactory.ProfessionalAId,
                priority = "normal",
            })));

        Assert.Null(entry.AppointmentId);
        Assert.Equal("aguardando", entry.Status);

        var day = await ReadAsync<QueueDayResponse>(await client.GetAsync(
            new Uri($"/api/v1/queue?date={Today:yyyy-MM-dd}", UriKind.Relative)));

        Assert.Contains(day.Entries, item => item.Id == entry.Id);
    }

    [Fact]
    public async Task CA003_Preferencial_DevePassarNaFrenteDeQuemChegouAntes()
    {
        using var client = CreateReceptionClient();
        var first = await CheckInAsync(client, (await CreateTodayAppointmentAsync(client, 9)).Id);
        var second = await CheckInAsync(client, (await CreateTodayAppointmentAsync(client, 10)).Id, "preferencial");

        var day = await ReadAsync<QueueDayResponse>(await client.GetAsync(
            new Uri($"/api/v1/queue?date={Today:yyyy-MM-dd}", UriKind.Relative)));

        var ordered = day.Entries.Where(entry => entry.Status == "aguardando").ToList();

        Assert.Equal(second.Id, ordered[0].Id);
        Assert.Equal(first.Id, ordered[1].Id);
        Assert.Equal(1, ordered[0].Position);
        Assert.Equal(2, ordered[1].Position);
    }

    [Fact]
    public async Task CA004_CicloCompleto_DeveMarcarOAgendamentoComoAtendido()
    {
        using var client = CreateReceptionClient("recepcao-ciclo");
        var appointment = await CreateTodayAppointmentAsync(client, 11);
        var entry = await CheckInAsync(client, appointment.Id);

        await TransitionAsync(client, entry.Id, "call");
        var started = await TransitionAsync(client, entry.Id, "start");

        Assert.Equal("em_atendimento", started.Status);

        var completed = await TransitionAsync(client, entry.Id, "complete");

        Assert.Equal("atendido", completed.Status);

        var updated = await ReadAsync<AppointmentResponse>(await client.GetAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}", UriKind.Relative)));

        Assert.Equal("atendido", updated.Status);
    }

    [Fact]
    public async Task CA005_Desistencia_DeveEncerrarAEspera()
    {
        using var client = CreateReceptionClient();
        var entry = await CheckInAsync(client, (await CreateTodayAppointmentAsync(client, 12)).Id);

        var left = await TransitionAsync(client, entry.Id, "leave");

        Assert.Equal("desistiu", left.Status);
        Assert.Null(left.Position);
    }

    [Fact]
    public async Task CA006_SegundoCheckIn_NoMesmoAgendamento_DeveSerRecusado()
    {
        using var client = CreateReceptionClient();
        var appointment = await CreateTodayAppointmentAsync(client, 13);

        await CheckInAsync(client, appointment.Id);

        var duplicated = await client.PostAsync(
            new Uri("/api/v1/queue/check-in", UriKind.Relative),
            JsonBody(new { appointmentId = appointment.Id, priority = "normal" }));

        Assert.Equal(HttpStatusCode.Conflict, duplicated.StatusCode);
        Assert.Equal("https://canamed.local/problems/queue-entry-conflict", await ReadProblemTypeAsync(duplicated));
    }

    [Fact]
    public async Task CA007_AtendimentoPelaAgenda_DeveConcluirAEntradaDaFila()
    {
        using var client = CreateReceptionClient();
        var appointment = await CreateTodayAppointmentAsync(client, 14);
        var entry = await CheckInAsync(client, appointment.Id);

        await client.PostAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}/attend", UriKind.Relative),
            JsonBody(new { }));

        var day = await ReadAsync<QueueDayResponse>(await client.GetAsync(
            new Uri($"/api/v1/queue?date={Today:yyyy-MM-dd}", UriKind.Relative)));

        var updated = day.Entries.Single(item => item.Id == entry.Id);

        Assert.Equal("atendido", updated.Status);
    }

    [Fact]
    public async Task CA008_CancelamentoNaAgenda_DeveCancelarAEntradaDaFila()
    {
        using var client = CreateReceptionClient();
        var appointment = await CreateTodayAppointmentAsync(client, 15);
        var entry = await CheckInAsync(client, appointment.Id);

        await client.PostAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}/cancel", UriKind.Relative),
            JsonBody(new { reason = "Paciente desmarcou" }));

        var day = await ReadAsync<QueueDayResponse>(await client.GetAsync(
            new Uri($"/api/v1/queue?date={Today:yyyy-MM-dd}", UriKind.Relative)));

        Assert.Equal("cancelado", day.Entries.Single(item => item.Id == entry.Id).Status);
    }

    [Fact]
    public async Task CA009_CA010_FechamentoDoDia_DeveResolverPendenciasESerIdempotente()
    {
        using var client = CreateReceptionClient("recepcao-fechamento");
        var yesterday = Today.AddDays(-1);
        var (appointment, entry) = await ArrangeYesterdayAsync(yesterday);

        var summary = await ReadAsync<CloseDayResponse>(await client.PostAsync(
            new Uri("/api/v1/agenda/close-day", UriKind.Relative),
            JsonBody(new { date = yesterday.ToString("yyyy-MM-dd"), professionalId = CanamedApiFactory.ProfessionalAId })));

        Assert.Equal(1, summary.NoShowAppointments);
        Assert.Equal(1, summary.LeftQueueEntries);
        Assert.Contains(appointment.Id, summary.NoShowAppointmentIds);

        var updatedAppointment = await ReadAsync<AppointmentResponse>(await client.GetAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}", UriKind.Relative)));

        Assert.Equal("faltou", updatedAppointment.Status);

        using (var context = new CanamedDbContext(TestDatabase.Options))
        {
            var stored = await context.QueueEntries.AsNoTracking().SingleAsync(item => item.Id == entry.Id);

            Assert.Equal(QueueStatus.Left, stored.Status);
        }

        var again = await ReadAsync<CloseDayResponse>(await client.PostAsync(
            new Uri("/api/v1/agenda/close-day", UriKind.Relative),
            JsonBody(new { date = yesterday.ToString("yyyy-MM-dd"), professionalId = CanamedApiFactory.ProfessionalAId })));

        Assert.Equal(0, again.NoShowAppointments);
        Assert.Equal(0, again.LeftQueueEntries);
    }

    [Fact]
    public async Task CA011_EntradaDeOutraClinica_DeveResponderNaoEncontrado()
    {
        using var clientA = CreateReceptionClient();
        var foreignEntryId = await CreateForeignEntryAsync();

        var response = await clientA.PostAsync(
            new Uri($"/api/v1/queue/{foreignEntryId}/call", UriKind.Relative),
            JsonBody(new { }));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/resource-not-found", await ReadProblemTypeAsync(response));
    }

    [Fact]
    public async Task CA012_Profissional_NaoOperaAFilaDeOutro()
    {
        using var reception = CreateReceptionClient();
        var entry = await CheckInAsync(reception, (await CreateTodayAppointmentAsync(reception, 16)).Id);

        using var professional = CreateClient(
            CanamedApiFactory.ClinicAId,
            "profissional-sem-permissao",
            Permissions.AgendaReadOwn);

        professional.DefaultRequestHeaders.Add("X-Canamed-Professional-Id", Guid.NewGuid().ToString());

        var response = await professional.PostAsync(
            new Uri($"/api/v1/queue/{entry.Id}/call", UriKind.Relative),
            JsonBody(new { }));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/permission-denied", await ReadProblemTypeAsync(response));
    }

    [Fact]
    public async Task CA013_CheckInForaDoDia_DeveSerRecusado()
    {
        using var client = CreateReceptionClient();
        var future = await CreateAppointmentAsync(client, LocalStart(20, 9));

        var response = await client.PostAsync(
            new Uri("/api/v1/queue/check-in", UriKind.Relative),
            JsonBody(new { appointmentId = future.Id, priority = "normal" }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/queue-not-today", await ReadProblemTypeAsync(response));
    }

    [Fact]
    public async Task FechamentoDeDiaFuturo_DeveSerRecusado()
    {
        using var client = CreateReceptionClient();

        var response = await client.PostAsync(
            new Uri("/api/v1/agenda/close-day", UriKind.Relative),
            JsonBody(new { date = Today.AddDays(1).ToString("yyyy-MM-dd"), professionalId = (Guid?)null }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/future-day-close", await ReadProblemTypeAsync(response));
    }

    private async Task<AppointmentResponse> CreateTodayAppointmentAsync(HttpClient client, int hour) =>
        await CreateAppointmentAsync(client, LocalStart(0, hour));

    private static async Task<QueueEntryResponse> CheckInAsync(
        HttpClient client,
        Guid appointmentId,
        string priority = "normal") =>
        await ReadAsync<QueueEntryResponse>(await client.PostAsync(
            new Uri("/api/v1/queue/check-in", UriKind.Relative),
            JsonBody(new { appointmentId, priority })));

    private static async Task<QueueEntryResponse> TransitionAsync(HttpClient client, Guid entryId, string action) =>
        await ReadAsync<QueueEntryResponse>(await client.PostAsync(
            new Uri($"/api/v1/queue/{entryId}/{action}", UriKind.Relative),
            JsonBody(new { })));

    /// <summary>
    /// Prepara a pendência de ontem direto no banco: a API recusa criar agendamento no passado (RN-003 da
    /// SPEC-0002) e só permite check-in do dia atual (RN-010 da SPEC-0005). O agendamento é criado pelo
    /// próprio domínio, com o relógio de ontem, para não burlar as regras de construção.
    /// </summary>
    private static async Task<(Appointment Appointment, QueueEntry Entry)> ArrangeYesterdayAsync(DateOnly yesterday)
    {
        await using var context = new CanamedDbContext(TestDatabase.Options);

        var dayStart = AgendaTimeZone.LocalDayToUtcRange(yesterday).StartUtc;
        var startsAt = dayStart.AddHours(8);

        var appointment = Appointment.Schedule(
            CanamedApiFactory.ClinicAId,
            CanamedApiFactory.ProfessionalAId,
            CanamedApiFactory.PatientAId,
            CanamedApiFactory.AppointmentTypeAId,
            startsAt,
            30,
            dayStart);

        var entry = QueueEntry.CheckIn(
            CanamedApiFactory.ClinicAId,
            CanamedApiFactory.ProfessionalAId,
            CanamedApiFactory.PatientAId,
            appointment.Id,
            yesterday,
            QueuePriority.Normal,
            startsAt);

        context.Appointments.Add(appointment);
        context.QueueEntries.Add(entry);
        await context.SaveChangesAsync();

        return (appointment, entry);
    }

    private static async Task<Guid> CreateForeignEntryAsync()
    {
        await using var context = new CanamedDbContext(TestDatabase.Options);
        var entry = QueueEntry.CheckIn(
            CanamedApiFactory.ClinicBId,
            CanamedApiFactory.ProfessionalBId,
            CanamedApiFactory.PatientAId,
            null,
            DateOnly.FromDateTime(DateTime.UtcNow),
            QueuePriority.Normal,
            DateTimeOffset.UtcNow);

        context.QueueEntries.Add(entry);
        await context.SaveChangesAsync();

        return entry.Id;
    }
}
