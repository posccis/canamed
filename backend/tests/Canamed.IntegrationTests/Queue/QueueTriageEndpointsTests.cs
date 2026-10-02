using System.Net;
using Canamed.Application.Agenda;
using Canamed.Application.Queue;

namespace Canamed.IntegrationTests.Queue;

[Collection(CanamedCollection.Name)]
public sealed class QueueTriageEndpointsTests(CanamedApiFactory factory) : Agenda.AgendaTestBase(factory)
{
    private static DateOnly Today =>
        DateOnly.FromDateTime(AgendaTimeZone.ToLocal(CanamedApiFactory.FixedNow).DateTime);

    [Fact]
    public async Task CA001_RegistrarEConsultarTriagem_ComCalculoDeImc()
    {
        using var client = CreateReceptionClient("recepcao-triagem-1");
        var appointment = await CreateAppointmentAsync(client, LocalStart(0, 9));

        var checkInResponse = await client.PostAsync(
            new Uri("/api/v1/queue/check-in", UriKind.Relative),
            JsonBody(new { appointmentId = appointment.Id, priority = "normal" }));

        var entry = await ReadAsync<QueueEntryResponse>(checkInResponse);

        var triageResponse = await client.PostAsync(
            new Uri($"/api/v1/queue/{entry.Id}/triage", UriKind.Relative),
            JsonBody(new
            {
                riskClassification = "amarelo",
                bloodPressure = "130/85",
                heartRate = 82,
                temperature = 36.7m,
                oxygenSaturation = 98,
                glucose = 95,
                weightKg = 72m,
                heightCm = 175m,
                chiefComplaint = "Febre leve e tosse há 3 dias",
                allergies = "Nenhuma"
            }));

        Assert.Equal(HttpStatusCode.OK, triageResponse.StatusCode);
        var triage = await ReadAsync<TriageRecordResponse>(triageResponse);
        Assert.Equal("amarelo", triage.RiskClassification);
        Assert.Equal("130/85", triage.BloodPressure);
        Assert.Equal(82, triage.HeartRate);
        Assert.Equal(36.7m, triage.Temperature);
        Assert.Equal(98, triage.OxygenSaturation);
        // IMC = 72 / (1.75 * 1.75) = 23.51
        Assert.Equal(23.51m, triage.CalculatedBmi);

        // Consulta endpoint GET
        var getTriageResponse = await client.GetAsync(
            new Uri($"/api/v1/queue/{entry.Id}/triage", UriKind.Relative));
        Assert.Equal(HttpStatusCode.OK, getTriageResponse.StatusCode);
        var queried = await ReadAsync<TriageRecordResponse>(getTriageResponse);
        Assert.Equal(triage.Id, queried.Id);
        Assert.Equal("Febre leve e tosse há 3 dias", queried.ChiefComplaint);
    }

    [Fact]
    public async Task CA002_TriagemAltaGravidade_PromoveEntradaParaPreferencial()
    {
        using var client = CreateReceptionClient("recepcao-triagem-2");
        var appointment = await CreateAppointmentAsync(client, LocalStart(0, 10));

        var checkInResponse = await client.PostAsync(
            new Uri("/api/v1/queue/check-in", UriKind.Relative),
            JsonBody(new { appointmentId = appointment.Id, priority = "normal" }));

        var entry = await ReadAsync<QueueEntryResponse>(checkInResponse);
        Assert.Equal("normal", entry.Priority);

        // Triagem vermelha (emergência)
        await client.PostAsync(
            new Uri($"/api/v1/queue/{entry.Id}/triage", UriKind.Relative),
            JsonBody(new
            {
                riskClassification = "vermelho",
                bloodPressure = "180/110",
                heartRate = 125,
                temperature = 39.5m,
                oxygenSaturation = 91,
                chiefComplaint = "Crise hipertensiva com dor torácica"
            }));

        // Consulta a fila para verificar se foi promovido
        var listResponse = await client.GetAsync(
            new Uri($"/api/v1/queue?date={Today:yyyy-MM-dd}", UriKind.Relative));

        var queueDay = await ReadAsync<QueueDayResponse>(listResponse);
        var promotedEntry = queueDay.Entries.Single(e => e.Id == entry.Id);

        Assert.Equal("preferencial", promotedEntry.Priority);
    }
}
