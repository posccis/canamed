using System.Net;
using Canamed.Application.Agenda;
using Canamed.Application.Dashboard;
using Canamed.Application.Identity;
using Canamed.Domain.Agenda;
using Canamed.Domain.Clinics;
using Canamed.Infrastructure.Persistence;

namespace Canamed.IntegrationTests.Dashboard;

[Collection(CanamedCollection.Name)]
public sealed class DashboardEndpointsTests(CanamedApiFactory factory) : Agenda.AgendaTestBase(factory)
{
    private static DateOnly Today =>
        DateOnly.FromDateTime(AgendaTimeZone.ToLocal(CanamedApiFactory.FixedNow).DateTime);

    [Fact]
    public async Task CA001_CA002_CA003_ResumoOperacional_DeveRetornarIndicadoresCorretos()
    {
        var (clinicId, profId, patientId, typeId, roomId) = CreateIsolatedClinicWithRoom();
        using var client = CreateClient(clinicId, "gestor-dashboard", [.. Permissions.All]);

        var localDate = Today;
        var startUtc = LocalStart(0, 10);

        // Criar agendamento com sala
        var apptResponse = await client.PostAsync(
            new Uri("/api/v1/appointments", UriKind.Relative),
            JsonBody(new
            {
                professionalId = profId,
                patientId,
                appointmentTypeId = typeId,
                startsAt = startUtc,
                roomId,
            }));
        apptResponse.EnsureSuccessStatusCode();
        var appt = await ReadAsync<Canamed.Application.Agenda.AppointmentResponse>(apptResponse);

        // Confirmar agendamento
        var attendResponse = await client.PostAsync(
            new Uri($"/api/v1/appointments/{appt.Id}/attend", UriKind.Relative),
            JsonBody(new { }));
        attendResponse.EnsureSuccessStatusCode();

        // Check-in na fila
        var queueResponse = await client.PostAsync(
            new Uri("/api/v1/queue/check-in", UriKind.Relative),
            JsonBody(new
            {
                appointmentId = appt.Id,
                priority = "normal",
            }));
        queueResponse.EnsureSuccessStatusCode();
        var entry = await ReadAsync<Canamed.Application.Queue.QueueEntryResponse>(queueResponse);

        // Chamar na fila
        var callResponse = await client.PostAsync(
            new Uri($"/api/v1/queue/{entry.Id}/call", UriKind.Relative),
            JsonBody(new { }));
        callResponse.EnsureSuccessStatusCode();

        // Iniciar atendimento na fila
        var startResponse = await client.PostAsync(
            new Uri($"/api/v1/queue/{entry.Id}/start", UriKind.Relative),
            JsonBody(new { }));
        startResponse.EnsureSuccessStatusCode();

        // Consultar dashboard
        var summaryResponse = await client.GetAsync(
            new Uri($"/api/v1/dashboard/summary?date={localDate:yyyy-MM-dd}", UriKind.Relative));
        summaryResponse.EnsureSuccessStatusCode();

        var summary = await ReadAsync<DashboardSummaryResponse>(summaryResponse);

        Assert.Equal(localDate, summary.Date);
        Assert.Equal(1, summary.TotalAppointments);
        Assert.Equal(1, summary.AttendedCount);
        Assert.Equal(0, summary.NoShowCount);
        Assert.Equal(100.0, summary.AttendanceRate);

        // Fila
        Assert.Equal(1, summary.QueueInServiceCount);

        // Detalhamento por profissional e sala
        Assert.NotEmpty(summary.Professionals);
        Assert.Equal(profId, summary.Professionals[0].ProfessionalId);
        Assert.Equal(1, summary.Professionals[0].TotalAppointments);

        Assert.NotEmpty(summary.Rooms);
        Assert.Equal(roomId, summary.Rooms[0].RoomId);
        Assert.Equal(1, summary.Rooms[0].AppointmentsCount);
    }

    [Fact]
    public async Task CA004_IsolamentoPorClinica_NaoExibeDadosDeOutraClinica()
    {
        var (clinicA, profA, patientA, typeA, _) = CreateIsolatedClinicWithRoom();
        var (clinicB, _, _, _, _) = CreateIsolatedClinicWithRoom();

        using var clientA = CreateClient(clinicA, "gestor-a", [.. Permissions.All]);
        using var clientB = CreateClient(clinicB, "gestor-b", [.. Permissions.All]);

        var localDate = Today;
        var startUtc = LocalStart(0, 14);

        var apptResponse = await clientA.PostAsync(
            new Uri("/api/v1/appointments", UriKind.Relative),
            JsonBody(new
            {
                professionalId = profA,
                patientId = patientA,
                appointmentTypeId = typeA,
                startsAt = startUtc,
            }));
        apptResponse.EnsureSuccessStatusCode();

        // Clínica B consulta o dashboard da mesma data
        var summaryBResponse = await clientB.GetAsync(
            new Uri($"/api/v1/dashboard/summary?date={localDate:yyyy-MM-dd}", UriKind.Relative));
        summaryBResponse.EnsureSuccessStatusCode();

        var summaryB = await ReadAsync<DashboardSummaryResponse>(summaryBResponse);

        // Clínica B não deve ver os agendamentos da Clínica A
        Assert.Equal(0, summaryB.TotalAppointments);
        Assert.Empty(summaryB.Professionals);
    }

    [Fact]
    public async Task CA005_DiaSemRegistros_DeveRetornarTaxasZeroSemErro()
    {
        var (clinicId, _, _, _, _) = CreateIsolatedClinicWithRoom();
        using var client = CreateClient(clinicId, "gestor-vazio", [.. Permissions.All]);

        var localDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(25));

        var response = await client.GetAsync(
            new Uri($"/api/v1/dashboard/summary?date={localDate:yyyy-MM-dd}", UriKind.Relative));
        response.EnsureSuccessStatusCode();

        var summary = await ReadAsync<DashboardSummaryResponse>(response);

        Assert.Equal(0, summary.TotalAppointments);
        Assert.Equal(0.0, summary.AttendanceRate);
        Assert.Equal(0, summary.QueueWaitingCount);
        Assert.Equal(0.0, summary.AverageWaitMinutes);
    }

    [Fact]
    public async Task CA006_SemPermissao_DeveRetornarForbidden()
    {
        var (clinicId, _, _, _, _) = CreateIsolatedClinicWithRoom();
        // Cliente sem dashboard:read
        using var client = CreateClient(clinicId, "sem-permissao", Permissions.AgendaRead);

        var response = await client.GetAsync(
            new Uri("/api/v1/dashboard/summary", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private static (Guid ClinicId, Guid ProfessionalId, Guid PatientId, Guid AppointmentTypeId, Guid RoomId)
        CreateIsolatedClinicWithRoom()
    {
        using var context = new CanamedDbContext(TestDatabase.Options);
        var now = DateTimeOffset.UtcNow;
        var clinicId = Guid.NewGuid();

        context.Clinics.Add(Clinic.Create("Clínica Dashboard (sintética)", now, clinicId));

        var prof = Professional.Create(clinicId, "Dr. Painel " + Guid.NewGuid().ToString("N")[..4], now);
        var patient = Patient.Create(clinicId, "Paciente Painel", "(81) 98888-8888", now);
        var type = AppointmentType.Create(
            clinicId,
            "Consulta Painel",
            AppointmentCategory.Single,
            AppointmentCoverage.Private,
            30,
            now);
        var room = Room.Create(clinicId, "Sala 101 " + Guid.NewGuid().ToString("N")[..4], now);

        context.Professionals.Add(prof);
        context.Patients.Add(patient);
        context.AppointmentTypes.Add(type);
        context.Rooms.Add(room);
        context.SaveChanges();

        return (clinicId, prof.Id, patient.Id, type.Id, room.Id);
    }
}
