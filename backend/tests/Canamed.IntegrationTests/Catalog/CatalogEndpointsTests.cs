using System.Net;
using Canamed.Application.Agenda;
using Canamed.Application.Catalog;
using Canamed.Application.Identity;
using Canamed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Canamed.IntegrationTests.Catalog;

/// <summary>
/// Critérios de aceitação CA-001 a CA-010 da SPEC-0004: classificação das consultas, catálogo
/// assistencial, edição de cadastros e desbloqueio de agenda.
///
/// Os cenários criam os próprios registros e nunca alteram o catálogo compartilhado pela suíte de agenda.
/// </summary>
[Collection(CanamedCollection.Name)]
public sealed class CatalogEndpointsTests(CanamedApiFactory factory) : Agenda.AgendaTestBase(factory)
{
    [Fact]
    public async Task CA001_CA002_TipoClassificado_DeveChegarAoAgendamento()
    {
        using var client = CreateReceptionClient("recepcao-catalogo");
        var specialty = await CreateSpecialtyAsync(client, "Ortopedia " + Guid.NewGuid().ToString("N")[..6]);
        var type = await CreateTypeAsync(client, "Avaliação ortopédica", "avulsa", "plano_saude", 45, specialty.Id);

        Assert.Equal("avulsa", type.Category);
        Assert.Equal("plano_saude", type.Coverage);
        Assert.Equal(specialty.Id, type.SpecialtyId);
        Assert.Equal("Ortopedia", specialty.Name.Split(' ')[0]);

        var start = LocalStart(60, 14);
        var appointment = await CreateAppointmentAsync(
            client,
            start,
            appointmentTypeId: type.Id,
            professionalId: CanamedApiFactory.ProfessionalAId);

        Assert.Equal("avulsa", appointment.Category);
        Assert.Equal("plano_saude", appointment.Coverage);
        Assert.Equal(specialty.Name, appointment.SpecialtyName);
        Assert.Equal(45, appointment.DurationMinutes);
    }

    [Fact]
    public async Task CA003_CA004_TipoInativo_NaoAgendaMasPreservaHistorico()
    {
        using var client = CreateReceptionClient();
        var type = await CreateTypeAsync(client, "Tipo sazonal", "avulsa", "particular", 30, specialtyId: null);
        var appointment = await CreateAppointmentAsync(client, LocalStart(61, 9), appointmentTypeId: type.Id);

        var deactivate = await client.PostAsync(
            new Uri($"/api/v1/appointment-types/{type.Id}/deactivate", UriKind.Relative),
            JsonBody(new { }));

        Assert.Equal(HttpStatusCode.NoContent, deactivate.StatusCode);

        var refused = await CreateAppointmentResponseAsync(client, LocalStart(61, 10), type.Id);

        Assert.Equal(HttpStatusCode.NotFound, refused.StatusCode);

        var existing = await ReadAsync<AppointmentResponse>(await client.GetAsync(
            new Uri($"/api/v1/appointments/{appointment.Id}", UriKind.Relative)));

        Assert.Equal("avulsa", existing.Category);
        Assert.Equal(30, existing.DurationMinutes);
    }

    [Fact]
    public async Task CA005_EspecialidadeEmUso_NaoPodeSerDesativada()
    {
        using var client = CreateReceptionClient();
        var specialty = await CreateSpecialtyAsync(client, "Cardiologia " + Guid.NewGuid().ToString("N")[..6]);

        await client.PostAsync(
            new Uri("/api/v1/professionals", UriKind.Relative),
            JsonBody(new { name = "Dr. Teste Cardio", specialtyId = specialty.Id }));

        var response = await client.PostAsync(
            new Uri($"/api/v1/specialties/{specialty.Id}/deactivate", UriKind.Relative),
            JsonBody(new { }));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/specialty-in-use", await ReadProblemTypeAsync(response));
    }

    [Fact]
    public async Task CA006_CA007_EdicaoDePaciente_ComAuditoriaEInativacao()
    {
        using var client = CreateReceptionClient("recepcao-paciente");
        var patient = await CreatePatientAsync(client, "Paciente Editável", "(81) 91111-1111");

        var updated = await ReadAsync<PatientResponse>(await client.PostAsync(
            new Uri($"/api/v1/patients/{patient.Id}", UriKind.Relative),
            JsonBody(new
            {
                name = "Paciente Editado",
                phone = "(81) 92222-2222",
                email = "editado@canamed.local",
                birthDate = "1990-04-12",
            })));

        Assert.Equal("Paciente Editado", updated.Name);
        Assert.Equal("(81) 92222-2222", updated.Phone);
        Assert.Equal("editado@canamed.local", updated.Email);

        using (var context = new CanamedDbContext(TestDatabase.Options))
        {
            var events = await context.AuditEvents
                .AsNoTracking()
                .Where(auditEvent => auditEvent.ResourceId == patient.Id.ToString())
                .Select(auditEvent => auditEvent.Action)
                .ToListAsync();

            Assert.Contains("patient.updated", events);
        }

        var deactivate = await client.PostAsync(
            new Uri($"/api/v1/patients/{patient.Id}/deactivate", UriKind.Relative),
            JsonBody(new { }));

        Assert.Equal(HttpStatusCode.NoContent, deactivate.StatusCode);

        var refused = await CreateAppointmentResponseAsync(client, LocalStart(62, 11), null, patient.Id);

        Assert.Equal(HttpStatusCode.NotFound, refused.StatusCode);
    }

    [Fact]
    public async Task CA008_Desbloqueio_DeveLiberarOHorario()
    {
        using var client = CreateReceptionClient("recepcao-desbloqueio");
        var date = DateOnly.FromDateTime(AgendaTimeZone.ToLocal(DateTimeOffset.UtcNow).DateTime).AddDays(63);
        var start = AgendaTimeZone.LocalToUtc(date.ToDateTime(TimeOnly.MinValue).AddHours(8));

        var block = await ReadAsync<BlockResponse>(await client.PostAsync(
            new Uri($"/api/v1/professionals/{CanamedApiFactory.ProfessionalAId}/blocks", UriKind.Relative),
            JsonBody(new { startsAt = start, endsAt = start.AddHours(1), reason = "Compromisso" })));

        var blocked = await CreateAppointmentResponseAsync(client, start.AddMinutes(30));

        Assert.Equal(HttpStatusCode.Conflict, blocked.StatusCode);

        await PrepareDayAsync(client, date);

        var removed = await client.DeleteAsync(new Uri(
            $"/api/v1/professionals/{CanamedApiFactory.ProfessionalAId}/blocks/{block.Id}",
            UriKind.Relative));

        Assert.Equal(HttpStatusCode.NoContent, removed.StatusCode);

        var appointment = await CreateAppointmentAsync(client, start.AddMinutes(30));

        Assert.Equal(start.AddMinutes(30).ToUniversalTime(), appointment.StartsAt);
    }

    [Fact]
    public async Task CA009_NomeDuplicado_DeveSerRecusado()
    {
        using var client = CreateReceptionClient();
        var name = "Consulta repetida " + Guid.NewGuid().ToString("N")[..6];

        await CreateTypeAsync(client, name, "avulsa", "particular", 30, specialtyId: null);

        var duplicated = await client.PostAsync(
            new Uri("/api/v1/appointment-types", UriKind.Relative),
            JsonBody(new
            {
                name = name.ToLowerInvariant(),
                category = "avulsa",
                coverage = "particular",
                durationMinutes = 30,
                specialtyId = (Guid?)null,
            }));

        Assert.Equal(HttpStatusCode.Conflict, duplicated.StatusCode);
        Assert.Equal("https://canamed.local/problems/duplicated-name", await ReadProblemTypeAsync(duplicated));
    }

    [Fact]
    public async Task CA010_Recepcao_NaoConfiguraOCatalogo()
    {
        using var client = CreateClient(
            CanamedApiFactory.ClinicAId,
            "recepcao-sem-configuracao",
            Permissions.AgendaRead,
            Permissions.AgendaWrite);

        var response = await client.PostAsync(
            new Uri("/api/v1/appointment-types", UriKind.Relative),
            JsonBody(new
            {
                name = "Tipo indevido",
                category = "avulsa",
                coverage = "particular",
                durationMinutes = 30,
                specialtyId = (Guid?)null,
            }));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/permission-denied", await ReadProblemTypeAsync(response));
    }

    [Fact]
    public async Task ClassificacaoInvalida_DeveSerRecusada()
    {
        using var client = CreateReceptionClient();

        var response = await client.PostAsync(
            new Uri("/api/v1/appointment-types", UriKind.Relative),
            JsonBody(new
            {
                name = "Tipo inválido",
                category = "urgente",
                coverage = "particular",
                durationMinutes = 30,
                specialtyId = (Guid?)null,
            }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/invalid-category", await ReadProblemTypeAsync(response));
    }

    private static async Task<SpecialtyResponse> CreateSpecialtyAsync(HttpClient client, string name) =>
        await ReadAsync<SpecialtyResponse>(await client.PostAsync(
            new Uri("/api/v1/specialties", UriKind.Relative),
            JsonBody(new { name })));

    private static async Task<AppointmentTypeResponse> CreateTypeAsync(
        HttpClient client,
        string name,
        string category,
        string coverage,
        int durationMinutes,
        Guid? specialtyId) =>
        await ReadAsync<AppointmentTypeResponse>(await client.PostAsync(
            new Uri("/api/v1/appointment-types", UriKind.Relative),
            JsonBody(new { name, category, coverage, durationMinutes, specialtyId })));

    private static async Task<PatientResponse> CreatePatientAsync(HttpClient client, string name, string phone) =>
        await ReadAsync<PatientResponse>(await client.PostAsync(
            new Uri("/api/v1/patients", UriKind.Relative),
            JsonBody(new { name, phone, email = (string?)null, birthDate = (string?)null })));

    private static async Task<HttpResponseMessage> CreateAppointmentResponseAsync(
        HttpClient client,
        DateTimeOffset startsAt,
        Guid? appointmentTypeId = null,
        Guid? patientId = null) =>
        await client.PostAsync(
            new Uri("/api/v1/appointments", UriKind.Relative),
            JsonBody(new
            {
                professionalId = CanamedApiFactory.ProfessionalAId,
                patientId = patientId ?? CanamedApiFactory.PatientAId,
                appointmentTypeId = appointmentTypeId ?? CanamedApiFactory.AppointmentTypeAId,
                startsAt,
            }));

    private static async Task PrepareDayAsync(HttpClient client, DateOnly date)
    {
        var day = await ReadAsync<AgendaDayResponse>(await client.GetAsync(new Uri(
            $"/api/v1/appointments?date={date:yyyy-MM-dd}&professionalId={CanamedApiFactory.ProfessionalAId}",
            UriKind.Relative)));

        foreach (var appointment in day.Appointments.Where(item => item.Status is "agendado" or "confirmado"))
        {
            await client.PostAsync(
                new Uri($"/api/v1/appointments/{appointment.Id}/cancel", UriKind.Relative),
                JsonBody(new { reason = "preparação do cenário" }));
        }
    }
}
