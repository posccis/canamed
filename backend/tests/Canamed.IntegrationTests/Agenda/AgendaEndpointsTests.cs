using System.Net;
using Canamed.Application.Agenda;
using Canamed.Application.Identity;
using Canamed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Canamed.IntegrationTests;

namespace Canamed.IntegrationTests.Agenda;

/// <summary>
/// Critérios de aceitação CA-001 a CA-010 da SPEC-0002, verificados contra a API e o banco de testes.
/// </summary>
[Collection(CanamedCollection.Name)]
public sealed class AgendaEndpointsTests(CanamedApiFactory factory) : AgendaTestBase(factory)
{
    [Fact]
    public async Task CA001_CriacaoComSobreposicao_DeveResponderConflito()
    {
        using var client = CreateReceptionClient();
        var start = LocalStart(1, 14);

        await CreateAppointmentAsync(client, start);

        var response = await client.PostAsync(
            new Uri("/api/v1/appointments", UriKind.Relative),
            JsonBody(new
            {
                professionalId = CanamedApiFactory.ProfessionalAId,
                patientId = CanamedApiFactory.PatientAId,
                appointmentTypeId = CanamedApiFactory.AppointmentTypeAId,
                startsAt = start.AddMinutes(15),
            }));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("https://canamed.local/problems/appointment-overlap", await ReadProblemTypeAsync(response));
    }

    [Fact]
    public async Task CA002_AgendamentoCriado_DeveAparecerNaAgendaDoDia()
    {
        using var client = CreateReceptionClient();
        var start = LocalStart(2, 9, 30);

        var created = await CreateAppointmentAsync(client, start);
        var date = DateOnly.FromDateTime(AgendaTimeZone.ToLocal(start).DateTime);

        var day = await ReadAsync<AgendaDayResponse>(await client.GetAsync(new Uri(
            $"/api/v1/appointments?date={date:yyyy-MM-dd}&professionalId={CanamedApiFactory.ProfessionalAId}",
            UriKind.Relative)));

        var appointment = Assert.Single(day.Appointments);
        Assert.Equal(created.Id, appointment.Id);
        Assert.Equal(30, appointment.DurationMinutes);
        Assert.Equal("agendado", appointment.Status);
        Assert.Equal("Paciente Teste A", appointment.PatientName);
        Assert.Equal(start.ToUniversalTime(), appointment.StartsAt);
    }

    [Fact]
    public async Task CA003_Remarcacao_DeveLiberarOHorarioAnterior()
    {
        using var client = CreateReceptionClient();
        var original = LocalStart(3, 10);
        var appointment = await CreateAppointmentAsync(client, original);

        var newStart = original.AddHours(2);
        var rescheduled = await ReadAsync<AppointmentResponse>(await client.PostAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}/reschedule", UriKind.Relative),
            JsonBody(new { startsAt = newStart })));

        Assert.Equal(newStart.ToUniversalTime(), rescheduled.StartsAt);

        // O horário antigo voltou a ficar livre.
        var reused = await CreateAppointmentAsync(client, original);
        Assert.Equal(original.ToUniversalTime(), reused.StartsAt);
    }

    [Fact]
    public async Task CA004_Cancelamento_DeveExigirMotivoELiberarOHorario()
    {
        using var client = CreateReceptionClient();
        var start = LocalStart(4, 8);
        var appointment = await CreateAppointmentAsync(client, start);

        var semMotivo = await client.PostAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}/cancel", UriKind.Relative),
            JsonBody(new { reason = "  " }));

        Assert.Equal(HttpStatusCode.BadRequest, semMotivo.StatusCode);

        var cancelled = await ReadAsync<AppointmentResponse>(await client.PostAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}/cancel", UriKind.Relative),
            JsonBody(new { reason = "Paciente solicitou" })));

        Assert.Equal("cancelado", cancelled.Status);
        Assert.Equal("Paciente solicitou", cancelled.CancellationReason);

        var reused = await CreateAppointmentAsync(client, start);
        Assert.Equal(start.ToUniversalTime(), reused.StartsAt);
    }

    [Fact]
    public async Task CA005_OutraClinica_NaoDeveEnxergarOAgendamento()
    {
        using var clientA = CreateReceptionClient();
        var appointment = await CreateAppointmentAsync(clientA, LocalStart(5, 11));

        using var clientB = CreateClient(CanamedApiFactory.ClinicBId, "recepcao-teste-b", [.. Permissions.All]);

        var detail = await clientB.GetAsync(new Uri($"/api/v1/appointments/{appointment.Id}", UriKind.Relative));
        Assert.Equal(HttpStatusCode.NotFound, detail.StatusCode);

        var foreign = await clientB.PostAsync(
            new Uri("/api/v1/appointments", UriKind.Relative),
            JsonBody(new
            {
                professionalId = CanamedApiFactory.ProfessionalBId,
                patientId = CanamedApiFactory.PatientAId,
                appointmentTypeId = CanamedApiFactory.AppointmentTypeAId,
                startsAt = LocalStart(5, 13),
            }));

        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);
    }

    [Fact]
    public async Task CA006_IntervaloBloqueado_DeveImpedirAgendamento()
    {
        using var client = CreateReceptionClient();
        var day = DateOnly.FromDateTime(AgendaTimeZone.ToLocal(DateTimeOffset.UtcNow).DateTime);
        var date = day.AddDays(6);
        var blockStart = AgendaTimeZone.LocalToUtc(date.ToDateTime(TimeOnly.MinValue).AddHours(8));
        var blockEnd = blockStart.AddHours(1);

        var block = await ReadAsync<BlockResponse>(await client.PostAsync(
            new Uri($"/api/v1/professionals/{CanamedApiFactory.ProfessionalAId}/blocks", UriKind.Relative),
            JsonBody(new { startsAt = blockStart, endsAt = blockEnd, reason = "Reunião clínica" })));

        Assert.Equal(blockStart, block.StartsAt);

        var response = await client.PostAsync(
            new Uri("/api/v1/appointments", UriKind.Relative),
            JsonBody(new
            {
                professionalId = CanamedApiFactory.ProfessionalAId,
                patientId = CanamedApiFactory.PatientAId,
                appointmentTypeId = CanamedApiFactory.AppointmentTypeAId,
                startsAt = blockStart.AddMinutes(30),
            }));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/professional-blocked", await ReadProblemTypeAsync(response));
    }

    [Fact]
    public async Task CA007_AgendamentoAtendido_NaoPodeSerCancelado()
    {
        using var client = CreateReceptionClient();
        var appointment = await CreateAppointmentAsync(client, LocalStart(7, 15));

        TestDatabase.SetAppointmentStatus(appointment.Id, "atendido");

        var response = await client.PostAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}/cancel", UriKind.Relative),
            JsonBody(new { reason = "Tentativa indevida" }));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/appointment-state", await ReadProblemTypeAsync(response));
    }

    [Fact]
    public async Task CA011_Atendimento_DeveMudarOStatusELiberarOHorarioPorNaoOcupar()
    {
        using var client = CreateReceptionClient("recepcao-atendimento");
        var start = LocalStart(12, 9);
        var appointment = await CreateAppointmentAsync(client, start);

        var attended = await ReadAsync<AppointmentResponse>(await client.PostAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}/attend", UriKind.Relative),
            JsonBody(new { })));

        Assert.Equal("atendido", attended.Status);

        // Um atendimento já realizado não bloqueia mais o horário para uma nova marcação.
        var reused = await CreateAppointmentAsync(client, start);
        Assert.Equal(start.ToUniversalTime(), reused.StartsAt);

        // E não aceita cancelamento depois de realizado (RN-008).
        var cancel = await client.PostAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}/cancel", UriKind.Relative),
            JsonBody(new { reason = "Tentativa indevida" }));

        Assert.Equal(HttpStatusCode.Conflict, cancel.StatusCode);
    }

    [Fact]
    public async Task CA012_Falta_DeveMudarOStatusEGerarAuditoria()
    {
        using var client = CreateReceptionClient("recepcao-falta");
        var appointment = await CreateAppointmentAsync(client, LocalStart(13, 10));

        var noShow = await ReadAsync<AppointmentResponse>(await client.PostAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}/no-show", UriKind.Relative),
            JsonBody(new { })));

        Assert.Equal("faltou", noShow.Status);

        using var context = new CanamedDbContext(TestDatabase.Options);
        var actions = await context.AuditEvents
            .AsNoTracking()
            .Where(auditEvent => auditEvent.ResourceId == appointment.Id.ToString())
            .Select(auditEvent => auditEvent.Action)
            .ToListAsync();

        Assert.Contains("appointment.no_show", actions);
    }

    [Fact]
    public async Task Atendimento_DeveRecusarAgendamentoJaCancelado()
    {
        using var client = CreateReceptionClient();
        var appointment = await CreateAppointmentAsync(client, LocalStart(14, 8));

        await client.PostAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}/cancel", UriKind.Relative),
            JsonBody(new { reason = "Paciente desmarcou" }));

        var response = await client.PostAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}/attend", UriKind.Relative),
            JsonBody(new { }));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/appointment-state", await ReadProblemTypeAsync(response));
    }

    [Fact]
    public async Task CA008_Mutacoes_DevemGerarTrilhaDeAuditoria()
    {
        using var client = CreateReceptionClient("recepcao-auditoria");
        var start = LocalStart(8, 16);
        var appointment = await CreateAppointmentAsync(client, start);

        await client.PostAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}/reschedule", UriKind.Relative),
            JsonBody(new { startsAt = start.AddHours(1) }));

        await client.PostAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}/cancel", UriKind.Relative),
            JsonBody(new { reason = "Paciente remarcou por telefone" }));

        using var context = new CanamedDbContext(TestDatabase.Options);
        var events = await context.AuditEvents
            .AsNoTracking()
            .Where(auditEvent => auditEvent.ClinicId == CanamedApiFactory.ClinicAId)
            .Where(auditEvent => auditEvent.ResourceId == appointment.Id.ToString())
            .ToListAsync();

        // A suíte usa relógio fixo, então os eventos compartilham o mesmo instante: a comparação é por
        // conjunto de ações (a ordem temporal é o que o critério exige, não a ordem de leitura).
        Assert.Equal(
            ["appointment.cancelled", "appointment.created", "appointment.rescheduled"],
            events.Select(auditEvent => auditEvent.Action).OrderBy(action => action, StringComparer.Ordinal));
        Assert.All(events, auditEvent => Assert.Equal("recepcao-auditoria", auditEvent.ActorId));
        Assert.Contains(
            events,
            auditEvent => auditEvent.Details is not null
                && auditEvent.Details.Contains("Paciente remarcou por telefone", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CA009_HorarioNoPassado_DeveSerRecusado()
    {
        using var client = CreateReceptionClient();

        var response = await client.PostAsync(
            new Uri("/api/v1/appointments", UriKind.Relative),
            JsonBody(new
            {
                professionalId = CanamedApiFactory.ProfessionalAId,
                patientId = CanamedApiFactory.PatientAId,
                appointmentTypeId = CanamedApiFactory.AppointmentTypeAId,
                startsAt = LocalStart(-1, 10),
            }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/past-scheduling", await ReadProblemTypeAsync(response));
    }

    [Fact]
    public async Task CA010_DuracaoVigente_DeveSerCopiadaParaOAgendamento()
    {
        using var client = CreateReceptionClient();
        var start = LocalStart(9, 14);
        var appointment = await CreateAppointmentAsync(client, start);

        try
        {
            TestDatabase.SetAppointmentTypeDuration(CanamedApiFactory.AppointmentTypeAId, 60);

            var existing = await ReadAsync<AppointmentResponse>(await client.GetAsync(
                new Uri($"/api/v1/appointments/{appointment.Id}", UriKind.Relative)));

            Assert.Equal(30, existing.DurationMinutes);
            Assert.Equal(start.AddMinutes(30).ToUniversalTime(), existing.EndsAt);

            var created = await CreateAppointmentAsync(client, start.AddHours(3));
            Assert.Equal(60, created.DurationMinutes);
        }
        finally
        {
            TestDatabase.SetAppointmentTypeDuration(CanamedApiFactory.AppointmentTypeAId, 30);
        }
    }

    [Fact]
    public async Task SemPermissaoDeEscrita_DeveResponderAcessoNegado()
    {
        using var client = CreateClient(CanamedApiFactory.ClinicAId, "profissional-teste", Permissions.AgendaRead);

        var response = await client.PostAsync(
            new Uri("/api/v1/appointments", UriKind.Relative),
            JsonBody(new
            {
                professionalId = CanamedApiFactory.ProfessionalAId,
                patientId = CanamedApiFactory.PatientAId,
                appointmentTypeId = CanamedApiFactory.AppointmentTypeAId,
                startsAt = LocalStart(10, 9),
            }));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/permission-denied", await ReadProblemTypeAsync(response));
    }

    [Fact]
    public async Task AgendaDeOutroProfissional_DeveSerNegada_ParaQuemSoVeAPropriaAgenda()
    {
        using var client = CreateClient(
            CanamedApiFactory.ClinicAId,
            "profissional-teste",
            Permissions.AgendaReadOwn);

        var response = await client.GetAsync(new Uri(
            $"/api/v1/appointments?date={DateOnly.FromDateTime(DateTime.UtcNow):yyyy-MM-dd}&professionalId={CanamedApiFactory.ProfessionalAId}",
            UriKind.Relative));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task TrilhaDeAuditoria_DeveSerAppendOnly()
    {
        using var client = CreateReceptionClient("recepcao-append-only");

        await CreateAppointmentAsync(client, LocalStart(11, 17));

        using var context = new CanamedDbContext(TestDatabase.Options);
        var auditEvent = await context.AuditEvents
            .AsNoTracking()
            .FirstAsync(item => item.ClinicId == CanamedApiFactory.ClinicAId);

        var exception = Assert.ThrowsAny<Exception>(() => context.Database.ExecuteSqlRaw(
            "UPDATE audit_events SET action = 'adulterado' WHERE id = {0}",
            auditEvent.Id));

        Assert.Contains("append-only", exception.Message, StringComparison.OrdinalIgnoreCase);
    }
}
