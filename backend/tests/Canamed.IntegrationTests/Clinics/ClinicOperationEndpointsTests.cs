using System.Net;
using Canamed.Application.Agenda;
using Canamed.Application.Catalog;
using Canamed.Application.Clinics;
using Canamed.Application.Identity;
using Canamed.Domain.Agenda;
using Canamed.Domain.Clinics;
using Canamed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Canamed.IntegrationTests.Clinics;

/// <summary>
/// Critérios de aceitação CA-001 a CA-012 da SPEC-0006: convênios, salas, funcionamento, feriados e
/// cadastro ampliado. Cada cenário usa uma clínica própria, de modo que horário de funcionamento e
/// feriados não interfiram nos demais testes da coleção.
/// </summary>
[Collection(CanamedCollection.Name)]
public sealed class ClinicOperationEndpointsTests(CanamedApiFactory factory) : Agenda.AgendaTestBase(factory)
{
    [Fact]
    public async Task CA001_Convenio_NomeDuplicadoDeveSerRecusado()
    {
        var clinic = CreateIsolatedClinic();
        using var client = CreateClient(clinic.ClinicId, "gestor-operacao", [.. Permissions.All]);
        var name = "Convênio " + Guid.NewGuid().ToString("N")[..6];

        var created = await CreateHealthPlanAsync(client, name, "123456");

        Assert.True(created.IsActive);
        Assert.Equal("123456", created.AnsCode);

        var duplicated = await client.PostAsync(
            new Uri("/api/v1/health-plans", UriKind.Relative),
            JsonBody(new { name = name.ToLowerInvariant(), ansCode = (string?)null }));

        Assert.Equal(HttpStatusCode.Conflict, duplicated.StatusCode);
        Assert.Equal("https://canamed.local/problems/duplicated-name", await ReadProblemTypeAsync(duplicated));
    }

    [Fact]
    public async Task CA002_Convenio_ComPacienteAtivo_NaoPodeSerDesativado()
    {
        var clinic = CreateIsolatedClinic();
        using var client = CreateClient(clinic.ClinicId, "gestor-operacao", [.. Permissions.All]);
        var plan = await CreateHealthPlanAsync(client, "Convênio em uso " + Guid.NewGuid().ToString("N")[..6], null);

        await ReadAsync<PatientResponse>(await client.PostAsync(
            new Uri("/api/v1/patients", UriKind.Relative),
            JsonBody(new
            {
                name = "Paciente Convênio",
                phone = "(81) 93333-3333",
                email = (string?)null,
                birthDate = (string?)null,
                document = (string?)null,
                healthPlanId = plan.Id,
            })));

        var response = await client.PostAsync(
            new Uri($"/api/v1/health-plans/{plan.Id}/deactivate", UriKind.Relative),
            JsonBody(new { }));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/health-plan-in-use", await ReadProblemTypeAsync(response));
    }

    [Fact]
    public async Task CA003_Sala_ComAgendaFutura_NaoPodeSerDesativada()
    {
        var clinic = CreateIsolatedClinic();
        using var client = CreateClient(clinic.ClinicId, "gestor-operacao", [.. Permissions.All]);
        var room = await CreateRoomAsync(client, "Sala 1 " + Guid.NewGuid().ToString("N")[..6]);
        var freeRoom = await CreateRoomAsync(client, "Sala livre " + Guid.NewGuid().ToString("N")[..6]);

        var appointment = await CreateAppointmentAsync(client, LocalStart(70, 10), clinic, room.Id);

        Assert.Equal(room.Id, appointment.RoomId);

        var blocked = await client.PostAsync(
            new Uri($"/api/v1/rooms/{room.Id}/deactivate", UriKind.Relative),
            JsonBody(new { }));

        Assert.Equal(HttpStatusCode.Conflict, blocked.StatusCode);
        Assert.Equal("https://canamed.local/problems/room-in-use", await ReadProblemTypeAsync(blocked));

        var ok = await client.PostAsync(
            new Uri($"/api/v1/rooms/{freeRoom.Id}/deactivate", UriKind.Relative),
            JsonBody(new { }));

        Assert.Equal(HttpStatusCode.NoContent, ok.StatusCode);
    }

    [Fact]
    public async Task CA004_CA005_CA006_FuncionamentoEFeriadoDevemLimitarAAgenda()
    {
        var clinic = CreateIsolatedClinic();
        using var client = CreateClient(clinic.ClinicId, "gestor-operacao", [.. Permissions.All]);
        var date = DateOnly.FromDateTime(AgendaTimeZone.ToLocal(DateTimeOffset.UtcNow).DateTime).AddDays(71);

        var hours = await ReplaceOperatingHoursAsync(
            client,
            [
                new OperatingHourRequest((int)date.DayOfWeek, "08:00", "12:00"),
                new OperatingHourRequest((int)date.DayOfWeek, "14:00", "18:00"),
            ]);

        Assert.Equal(2, hours.Count);
        Assert.Equal("08:00", hours[0].StartsAt);

        var outside = await CreateAppointmentResponseAsync(
            client,
            clinic,
            AgendaTimeZone.LocalToUtc(date.ToDateTime(TimeOnly.MinValue).AddHours(13)));

        Assert.Equal(HttpStatusCode.Conflict, outside.StatusCode);
        Assert.Equal("https://canamed.local/problems/outside-operating-hours", await ReadProblemTypeAsync(outside));

        var inside = await CreateAppointmentAsync(
            client,
            AgendaTimeZone.LocalToUtc(date.ToDateTime(TimeOnly.MinValue).AddHours(9)),
            clinic);

        Assert.Equal(9, AgendaTimeZone.ToLocal(inside.StartsAt).Hour);

        await ReadAsync<ClinicClosureResponse>(await client.PostAsync(
            new Uri("/api/v1/clinic-closures", UriKind.Relative),
            JsonBody(new { date = date.AddDays(1).ToString("yyyy-MM-dd"), description = "Feriado local" })));

        var closed = await CreateAppointmentResponseAsync(
            client,
            clinic,
            AgendaTimeZone.LocalToUtc(date.AddDays(1).ToDateTime(TimeOnly.MinValue).AddHours(10)));

        Assert.Equal(HttpStatusCode.Conflict, closed.StatusCode);
        Assert.Equal("https://canamed.local/problems/clinic-closed", await ReadProblemTypeAsync(closed));
    }

    [Fact]
    public async Task CA007_ClinicaSemFuncionamento_NaoRestringe()
    {
        var clinic = CreateIsolatedClinic();
        using var client = CreateClient(clinic.ClinicId, "gestor-operacao", [.. Permissions.All]);

        var appointment = await CreateAppointmentAsync(client, LocalStart(72, 23), clinic);

        Assert.Equal(23, AgendaTimeZone.ToLocal(appointment.StartsAt).Hour);
    }

    [Fact]
    public async Task CA008_CA009_SalaOcupadaESalaNaResposta()
    {
        var clinic = CreateIsolatedClinic();
        using var client = CreateClient(clinic.ClinicId, "gestor-operacao", [.. Permissions.All]);
        var room = await CreateRoomAsync(client, "Sala conflito " + Guid.NewGuid().ToString("N")[..6]);
        var start = LocalStart(73, 15);

        var first = await CreateAppointmentAsync(client, start, clinic, room.Id);

        Assert.Equal(room.Name, first.RoomName);

        var conflict = await CreateAppointmentResponseAsync(client, clinic, start.AddMinutes(15), room.Id);

        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);
        Assert.Equal("https://canamed.local/problems/room-conflict", await ReadProblemTypeAsync(conflict));

        var otherRoom = await CreateRoomAsync(client, "Sala alternativa " + Guid.NewGuid().ToString("N")[..6]);
        var alternative = await CreateAppointmentAsync(client, start.AddHours(1), clinic, otherRoom.Id);

        Assert.Equal(otherRoom.Id, alternative.RoomId);
    }

    [Fact]
    public async Task CA010_RegistroProfissional_DocumentoEConvenio_DevemSerPersistidos()
    {
        var clinic = CreateIsolatedClinic();
        using var client = CreateClient(clinic.ClinicId, "gestor-operacao", [.. Permissions.All]);
        var plan = await CreateHealthPlanAsync(client, "Convênio cadastro " + Guid.NewGuid().ToString("N")[..6], null);

        var professional = await ReadAsync<ProfessionalResponse>(await client.PostAsync(
            new Uri("/api/v1/professionals", UriKind.Relative),
            JsonBody(new { name = "Dr. Registro", specialtyId = (Guid?)null, registrationNumber = "CRM-PE 12345" })));

        Assert.Equal("CRM-PE 12345", professional.RegistrationNumber);

        var patient = await ReadAsync<PatientResponse>(await client.PostAsync(
            new Uri("/api/v1/patients", UriKind.Relative),
            JsonBody(new
            {
                name = "Paciente Documentado",
                phone = "(81) 94444-4444",
                email = (string?)null,
                birthDate = (string?)null,
                document = "123.456.789-09",
                healthPlanId = plan.Id,
            })));

        Assert.Equal("12345678909", patient.Document);
        Assert.Equal(plan.Id, patient.HealthPlanId);
        Assert.Equal(plan.Name, patient.HealthPlanName);
    }

    [Fact]
    public async Task CA011_Recepcao_NaoGerenciaOperacao()
    {
        var clinic = CreateIsolatedClinic();
        using var client = CreateClient(
            clinic.ClinicId,
            "recepcao-operacao",
            Permissions.ClinicRead,
            Permissions.AgendaRead,
            Permissions.AgendaWrite);

        var read = await client.GetAsync(new Uri("/api/v1/rooms", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, read.StatusCode);

        var write = await client.PostAsync(
            new Uri("/api/v1/rooms", UriKind.Relative),
            JsonBody(new { name = "Sala indevida" }));

        Assert.Equal(HttpStatusCode.Forbidden, write.StatusCode);
        Assert.Equal("https://canamed.local/problems/permission-denied", await ReadProblemTypeAsync(write));
    }

    [Fact]
    public async Task CA012_AlteracaoDeOperacao_GeraAuditoria()
    {
        var clinic = CreateIsolatedClinic();
        using var client = CreateClient(clinic.ClinicId, "gestor-operacao", [.. Permissions.All]);
        var plan = await CreateHealthPlanAsync(client, "Convênio auditoria " + Guid.NewGuid().ToString("N")[..6], null);

        using var context = new CanamedDbContext(TestDatabase.Options);
        var actions = await context.AuditEvents
            .AsNoTracking()
            .Where(auditEvent => auditEvent.ResourceId == plan.Id.ToString())
            .Select(auditEvent => auditEvent.Action)
            .ToListAsync();

        Assert.Contains("health_plan.created", actions);
    }

    /// <summary>Clínica isolada por cenário, com profissional, paciente e tipo de consulta próprios.</summary>
    private sealed record IsolatedClinic(Guid ClinicId, Guid ProfessionalId, Guid PatientId, Guid AppointmentTypeId);

    private static IsolatedClinic CreateIsolatedClinic()
    {
        using var context = new CanamedDbContext(TestDatabase.Options);
        var now = DateTimeOffset.UtcNow;
        var clinicId = Guid.NewGuid();

        context.Clinics.Add(Clinic.Create("Clínica Operação (sintética)", now, clinicId));

        var professional = Professional.Create(clinicId, "Profissional Operação", now);
        var patient = Patient.Create(clinicId, "Paciente Operação", "(81) 95555-5555", now);
        var appointmentType = AppointmentType.Create(
            clinicId,
            "Consulta Operação",
            AppointmentCategory.Single,
            AppointmentCoverage.Private,
            30,
            now);

        context.Professionals.Add(professional);
        context.Patients.Add(patient);
        context.AppointmentTypes.Add(appointmentType);
        context.SaveChanges();

        return new IsolatedClinic(clinicId, professional.Id, patient.Id, appointmentType.Id);
    }

    private static async Task<HealthPlanResponse> CreateHealthPlanAsync(HttpClient client, string name, string? ansCode) =>
        await ReadAsync<HealthPlanResponse>(await client.PostAsync(
            new Uri("/api/v1/health-plans", UriKind.Relative),
            JsonBody(new { name, ansCode })));

    private static async Task<RoomResponse> CreateRoomAsync(HttpClient client, string name) =>
        await ReadAsync<RoomResponse>(await client.PostAsync(
            new Uri("/api/v1/rooms", UriKind.Relative),
            JsonBody(new { name })));

    private static async Task<IReadOnlyList<OperatingHourResponse>> ReplaceOperatingHoursAsync(
        HttpClient client,
        IReadOnlyList<OperatingHourRequest> hours)
    {
        var response = await client.PutAsync(
            new Uri("/api/v1/operating-hours", UriKind.Relative),
            JsonBody(new { hours }));

        response.EnsureSuccessStatusCode();

        return await ReadAsync<IReadOnlyList<OperatingHourResponse>>(response);
    }

    private static async Task<AppointmentResponse> CreateAppointmentAsync(
        HttpClient client,
        DateTimeOffset startsAt,
        IsolatedClinic clinic,
        Guid? roomId = null)
    {
        var response = await CreateAppointmentResponseAsync(client, clinic, startsAt, roomId);
        response.EnsureSuccessStatusCode();
        return await ReadAsync<AppointmentResponse>(response);
    }

    private static async Task<HttpResponseMessage> CreateAppointmentResponseAsync(
        HttpClient client,
        IsolatedClinic clinic,
        DateTimeOffset startsAt,
        Guid? roomId = null) =>
        await client.PostAsync(
            new Uri("/api/v1/appointments", UriKind.Relative),
            JsonBody(new
            {
                professionalId = clinic.ProfessionalId,
                patientId = clinic.PatientId,
                appointmentTypeId = clinic.AppointmentTypeId,
                startsAt,
                roomId,
            }));
}
