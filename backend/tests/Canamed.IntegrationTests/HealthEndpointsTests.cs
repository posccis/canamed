using System.Net;

namespace Canamed.IntegrationTests;

public sealed class HealthEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Liveness_DeveResponderOk()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync(new Uri("/api/v1/health/live", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task RotaInexistente_DeveResponderProblemDetails()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync(new Uri("/api/v1/rota-inexistente", UriKind.Relative));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Readiness_DeveResponderProblemDetails_QuandoBancoIndisponivel()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync(new Uri("/api/v1/health/ready", UriKind.Relative));

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task ContratoOpenApi_DeveEstarPublicado()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync(new Uri("/api/v1/openapi.json", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("openapi", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }
}
