using System.Net;
using Canamed.Application.Catalog;
using Canamed.Application.Privacy;

namespace Canamed.IntegrationTests.Catalog;

[Collection(CanamedCollection.Name)]
public sealed class PrivacyEndpointsTests(CanamedApiFactory factory) : Agenda.AgendaTestBase(factory)
{
    private static async Task<Guid> CreateDedicatedPatientAsync(HttpClient client, string name = "Paciente LGPD Teste")
    {
        var response = await client.PostAsync(
            new Uri("/api/v1/patients", UriKind.Relative),
            JsonBody(new
            {
                name,
                phone = "(81) 98765-4321",
                email = $"lgpd.{Guid.NewGuid():N}@teste.com",
                document = "12345678901"
            }));
        response.EnsureSuccessStatusCode();
        var patient = await ReadAsync<PatientResponse>(response);
        return patient.Id;
    }

    [Fact]
    public async Task ExportDataPortability_RetornaDossieCompletoDoTitular()
    {
        using var client = CreateReceptionClient("recepcao-lgpd-export");
        var patientId = await CreateDedicatedPatientAsync(client, "Paciente Exportação");

        var response = await client.GetAsync(
            new Uri($"/api/v1/patients/{patientId}/data-portability", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var portability = await ReadAsync<PatientDataPortabilityResponse>(response);

        Assert.NotNull(portability.Patient);
        Assert.Equal(patientId, portability.Patient.Id);
        Assert.Contains("LGPD", portability.Confirmation);
    }

    [Fact]
    public async Task Anonymize_ComConsultaFuturaAtiva_RetornaConflito()
    {
        using var client = CreateReceptionClient("recepcao-lgpd-conflict");
        var patientId = await CreateDedicatedPatientAsync(client, "Paciente Consulta Futura");

        // Cria agendamento futuro para este paciente dedicado
        var futureAppointment = await CreateAppointmentAsync(client, LocalStart(10, 10), patientId: patientId);

        var response = await client.PostAsync(
            new Uri($"/api/v1/patients/{patientId}/anonymize", UriKind.Relative),
            JsonBody(new
            {
                reason = "Solicitação de eliminação de dados pelo titular"
            }));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Anonymize_ComMotivoCurto_RetornaBadRequest()
    {
        using var client = CreateReceptionClient("recepcao-lgpd-val");
        var patientId = await CreateDedicatedPatientAsync(client, "Paciente Motivo Curto");

        var response = await client.PostAsync(
            new Uri($"/api/v1/patients/{patientId}/anonymize", UriKind.Relative),
            JsonBody(new
            {
                reason = "abc"
            }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Anonymize_SemConsultasFuturas_AnonimizaCadastroPreservandoHistorico()
    {
        using var client = CreateReceptionClient("recepcao-lgpd-anon");
        var patientId = await CreateDedicatedPatientAsync(client, "Paciente Anonimizacao Sucesso");

        var response = await client.PostAsync(
            new Uri($"/api/v1/patients/{patientId}/anonymize", UriKind.Relative),
            JsonBody(new
            {
                reason = "Solicitação formal de anonimização exercida com base no Art. 18 da LGPD"
            }));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var anonRes = await ReadAsync<AnonymizePatientResponse>(response);
        Assert.Equal(patientId, anonRes.PatientId);
        Assert.Equal("anonimizado", anonRes.Status);

        // Ao exportar ou consultar novamente, dados pessoais diretos estão anonimizados
        var exportRes = await client.GetAsync(
            new Uri($"/api/v1/patients/{patientId}/data-portability", UriKind.Relative));
        Assert.Equal(HttpStatusCode.OK, exportRes.StatusCode);
        var portability = await ReadAsync<PatientDataPortabilityResponse>(exportRes);

        Assert.Equal("[TITULAR ANONIMIZADO - LGPD]", portability.Patient.Name);
        Assert.Equal("(00) 00000-0000", portability.Patient.Phone);
        Assert.Null(portability.Patient.Email);
        Assert.Null(portability.Patient.BirthDate);
        Assert.Null(portability.Patient.Document);
        Assert.False(portability.Patient.IsActive);
    }
}
