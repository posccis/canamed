using System.Net;
using System.Net.Http.Json;
using Canamed.Application.Agenda;
using Canamed.Application.Portal;
using Canamed.IntegrationTests.Agenda;
using Xunit;

namespace Canamed.IntegrationTests.PublicPortal;

/// <summary>
/// Superfície pública do paciente (SPEC-0026): slug da clínica, links tokenizados, confirmação em um
/// clique, check-in digital e acompanhamento da fila.
/// </summary>
[Collection(CanamedCollection.Name)]
public sealed class PublicPortalEndpointsTests(CanamedApiFactory factory) : AgendaTestBase(factory)
{
    [Fact]
    public async Task ClinicMeta_BySlug_ReturnsPublicData()
    {
        using var client = Factory.CreateClient();

        var response = await client.GetAsync(new Uri("/api/v1/public/clinics/clinica-teste-a/meta", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var meta = await ReadAsync<PublicClinicMetaResponse>(response);
        Assert.Equal(CanamedApiFactory.ClinicAId, meta.ClinicId);
        Assert.Equal("clinica-teste-a", meta.Slug);
        Assert.Contains(meta.Specialties, item => item.Id == CanamedApiFactory.SpecialtyAId);
        Assert.Contains(meta.AppointmentTypes, item => item.Id == CanamedApiFactory.AppointmentTypeAId);
    }

    [Fact]
    public async Task ClinicMeta_UnknownSlug_ReturnsNotFound_WithNoIndexHeader()
    {
        using var client = Factory.CreateClient();

        var response = await client.GetAsync(new Uri("/api/v1/public/clinics/clinica-inexistente/meta", UriKind.Relative));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Contains("noindex", response.Headers.GetValues("X-Robots-Tag").Single());
    }

    [Fact]
    public async Task ConfirmLink_ConfirmsPresence_AndBecomesSingleUse()
    {
        using var reception = CreateReceptionClient();
        var appointment = await CreateAppointmentAsync(reception, LocalStart(1, 10, 0));

        var link = await IssueLinkAsync(reception, "confirm", appointment.Id);
        Assert.StartsWith("/p/clinica-teste-a/c/", link.Path, StringComparison.Ordinal);

        using var anonymous = CreateSpaClient();

        var resolution = await anonymous.GetAsync(
            new Uri($"/api/v1/public/capabilities/{link.Token}", UriKind.Relative));
        Assert.Equal(HttpStatusCode.OK, resolution.StatusCode);

        var resolved = await ReadAsync<CapabilityResolutionResponse>(resolution);
        Assert.Equal("confirm", resolved.Scope);
        Assert.NotNull(resolved.Appointment);

        var confirm = await anonymous.PostAsync(
            new Uri($"/api/v1/public/capabilities/{link.Token}/confirm", UriKind.Relative),
            JsonBody(new { }));
        Assert.Equal(HttpStatusCode.OK, confirm.StatusCode);

        // RN-007: repetir a abertura do link consumido resulta em rejeição (ER-001/ER-008).
        var replay = await anonymous.GetAsync(
            new Uri($"/api/v1/public/capabilities/{link.Token}", UriKind.Relative));
        Assert.Equal(HttpStatusCode.NotFound, replay.StatusCode);
    }

    [Fact]
    public async Task CheckInLink_IssuesTicket_AndQueueLinkReflectsStage()
    {
        using var reception = CreateReceptionClient();
        var appointment = await CreateAppointmentAsync(reception, CanamedApiFactory.FixedNow);

        var link = await IssueLinkAsync(reception, "check_in", appointment.Id);

        using var anonymous = CreateSpaClient();
        var checkIn = await anonymous.PostAsync(
            new Uri($"/api/v1/public/check-in/{link.Token}", UriKind.Relative),
            JsonBody(new { isPreferential = false }));
        Assert.Equal(HttpStatusCode.OK, checkIn.StatusCode);

        var result = await ReadAsync<CapabilityCheckInResponse>(checkIn);
        Assert.Equal("N-001", result.TicketCode);
        Assert.NotNull(result.QueuePath);

        var queueToken = result.QueuePath!.Split('/').Last();
        var queue = await anonymous.GetAsync(
            new Uri($"/api/v1/public/capabilities/{queueToken}/queue", UriKind.Relative));
        Assert.Equal(HttpStatusCode.OK, queue.StatusCode);

        var status = await ReadAsync<CapabilityQueueStatusResponse>(queue);
        Assert.Equal("N-001", status.TicketCode);
        Assert.Equal("aguardando_triagem", status.Stage);
    }

    [Fact]
    public async Task InvalidToken_ReturnsNeutralNotFound()
    {
        using var anonymous = CreateSpaClient();

        var response = await anonymous.GetAsync(
            new Uri("/api/v1/public/capabilities/token-invalido", UriKind.Relative));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.EndsWith("capability-token-rejected", await ReadProblemTypeAsync(response), StringComparison.Ordinal);
    }

    private static async Task<IssueCapabilityLinkResponse> IssueLinkAsync(
        HttpClient client,
        string scope,
        Guid appointmentId)
    {
        var response = await client.PostAsJsonAsync(
            "/api/v1/public/links",
            new { scope, appointmentId, createdBy = "recepcao-teste" });

        response.EnsureSuccessStatusCode();

        return await ReadAsync<IssueCapabilityLinkResponse>(response);
    }

    /// <summary>Cliente sem sessão, como o navegador do paciente: sem cookie, mas com o cabeçalho anti-CSRF da SPA.</summary>
    private HttpClient CreateSpaClient()
    {
        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Canamed-Requested-With", "canamed-spa");
        return client;
    }
}
