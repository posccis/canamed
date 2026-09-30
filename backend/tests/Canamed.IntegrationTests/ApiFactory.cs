using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Canamed.IntegrationTests;

/// <summary>
/// Fábrica da API para os testes de integração.
/// A connection string abaixo é sintética e não é segredo (ADR-0004): nenhum banco real é acessado.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private const string SyntheticConnectionString =
        "Host=localhost;Port=5432;Database=canamed_test;Username=canamed_test;Password=credencial-sintetica";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.UseSetting("ConnectionStrings:Canamed", SyntheticConnectionString);
    }
}
