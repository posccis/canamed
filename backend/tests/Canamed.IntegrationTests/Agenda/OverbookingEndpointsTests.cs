using System.Net;
using Canamed.Application.Agenda;
using Canamed.Application.Identity;

namespace Canamed.IntegrationTests.Agenda;

[Collection(CanamedCollection.Name)]
public sealed class OverbookingEndpointsTests(CanamedApiFactory factory) : AgendaTestBase(factory)
{
    [Fact]
    public async Task Overbooking_SemPermissao_RetornaForbidden()
    {
        // Cliente com permissões de agenda mas SEM Permissions.AgendaOverbooking
        using var client = CreateClient(CanamedApiFactory.ClinicAId, "recepcao-sem-overbooking", Permissions.AgendaRead, Permissions.AgendaWrite);

        var start = LocalStart(7, 10);
        var response = await client.PostAsync(
            new Uri("/api/v1/appointments", UriKind.Relative),
            JsonBody(new
            {
                professionalId = CanamedApiFactory.ProfessionalAId,
                patientId = CanamedApiFactory.PatientAId,
                appointmentTypeId = CanamedApiFactory.AppointmentTypeAId,
                startsAt = start,
                isOverbooking = true,
                overbookingReason = "Encaixe sem permissao"
            }));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Overbooking_SemJustificativaValida_RetornaBadRequest()
    {
        using var client = CreateReceptionClient("recepcao-com-overbooking");

        var start = LocalStart(7, 11);
        var response = await client.PostAsync(
            new Uri("/api/v1/appointments", UriKind.Relative),
            JsonBody(new
            {
                professionalId = CanamedApiFactory.ProfessionalAId,
                patientId = CanamedApiFactory.PatientAId,
                appointmentTypeId = CanamedApiFactory.AppointmentTypeAId,
                startsAt = start,
                isOverbooking = true,
                overbookingReason = "abc" // menos de 5 caracteres
            }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Overbooking_EmHorarioOcupado_CriaComSucessoEGravaJustificativa()
    {
        using var client = CreateReceptionClient("recepcao-com-overbooking");

        var start = LocalStart(8, 14);

        // 1. Cria agendamento normal
        var first = await CreateAppointmentAsync(client, start);
        Assert.False(first.IsOverbooking);

        // 2. Cria encaixe no mesmo horário para o mesmo médico
        var overbookingResponse = await client.PostAsync(
            new Uri("/api/v1/appointments", UriKind.Relative),
            JsonBody(new
            {
                professionalId = CanamedApiFactory.ProfessionalAId,
                patientId = CanamedApiFactory.PatientAId,
                appointmentTypeId = CanamedApiFactory.AppointmentTypeAId,
                startsAt = start,
                isOverbooking = true,
                overbookingReason = "Encaixe de urgência aprovado pela diretoria clínica"
            }));

        Assert.Equal(HttpStatusCode.OK, overbookingResponse.StatusCode);
        var overbooked = await ReadAsync<AppointmentResponse>(overbookingResponse);

        Assert.True(overbooked.IsOverbooking);
        Assert.Equal("Encaixe de urgência aprovado pela diretoria clínica", overbooked.OverbookingReason);

        // 3. Consulta dia e confirma que ambos aparecem
        var date = DateOnly.FromDateTime(start.UtcDateTime);
        var dayResponse = await client.GetAsync(
            new Uri($"/api/v1/appointments?date={date:yyyy-MM-dd}&professionalId={CanamedApiFactory.ProfessionalAId}", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, dayResponse.StatusCode);
        var day = await ReadAsync<AgendaDayResponse>(dayResponse);
        Assert.Contains(day.Appointments, a => a.Id == first.Id && !a.IsOverbooking);
        Assert.Contains(day.Appointments, a => a.Id == overbooked.Id && a.IsOverbooking);
    }
}
