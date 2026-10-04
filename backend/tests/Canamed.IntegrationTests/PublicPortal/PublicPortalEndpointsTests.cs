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

    [Fact]
    public async Task RescheduleLink_ChangesSlot_RevokesOldToken_AndRespectsSingleReschedule()
    {
        using var reception = CreateReceptionClient();
        var originalStart = LocalStart(3, 9, 0);
        var appointment = await CreateAppointmentAsync(reception, originalStart);

        var link = await IssueLinkAsync(reception, "reschedule", appointment.Id);
        using var anonymous = CreateSpaClient();

        var localDate = DateOnly.FromDateTime(AgendaTimeZone.ToLocal(originalStart).DateTime);
        var slotsResponse = await anonymous.GetAsync(
            new Uri($"/api/v1/public/capabilities/{link.Token}/reschedule-slots?date={localDate:yyyy-MM-dd}", UriKind.Relative));
        slotsResponse.EnsureSuccessStatusCode();

        var slots = await ReadAsync<List<RescheduleSlotItem>>(slotsResponse);
        Assert.NotEmpty(slots);

        var target = slots.First(slot => AgendaTimeZone.ToLocal(slot.StartsAt).Hour == 10);
        var reschedule = await anonymous.PostAsJsonAsync(
            $"/api/v1/public/capabilities/{link.Token}/reschedule",
            new { startsAt = target.StartsAt, answer = "123" });
        reschedule.EnsureSuccessStatusCode();

        var result = await ReadAsync<CapabilityRescheduleResponse>(reschedule);
        Assert.Equal(target.StartsAt, result.StartsAt);
        Assert.NotNull(result.ConfirmPath);

        // RN-007/RN-008: o token de remarcação é consumido e não pode ser reutilizado.
        var replay = await anonymous.GetAsync(
            new Uri($"/api/v1/public/capabilities/{link.Token}", UriKind.Relative));
        Assert.Equal(HttpStatusCode.NotFound, replay.StatusCode);
    }

    [Fact]
    public async Task CancelLink_RequiresChallenge_AndCancelsWithinPolicy()
    {
        using var reception = CreateReceptionClient();
        var appointment = await CreateAppointmentAsync(reception, LocalStart(3, 14, 0));

        var link = await IssueLinkAsync(reception, "cancel", appointment.Id);
        using var anonymous = CreateSpaClient();

        var wrongAnswer = await anonymous.PostAsJsonAsync(
            $"/api/v1/public/capabilities/{link.Token}/cancel",
            new { reason = "imprevisto", answer = "000" });
        Assert.Equal(HttpStatusCode.Forbidden, wrongAnswer.StatusCode);

        var cancel = await anonymous.PostAsJsonAsync(
            $"/api/v1/public/capabilities/{link.Token}/cancel",
            new { reason = "imprevisto", answer = "1980" });
        Assert.Equal(HttpStatusCode.OK, cancel.StatusCode);

        var replay = await anonymous.GetAsync(
            new Uri($"/api/v1/public/capabilities/{link.Token}", UriKind.Relative));
        Assert.Equal(HttpStatusCode.NotFound, replay.StatusCode);
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
