using Canamed.Application.Configuration;
using Microsoft.Extensions.Configuration;

namespace Canamed.UnitTests;

public sealed class StartupRequirementsTests
{
    [Fact]
    public void FindMissing_DeveApontarConnectionString_QuandoAusente()
    {
        var configuration = new ConfigurationBuilder().Build();

        var missing = StartupRequirements.FindMissing(configuration);

        Assert.Contains("ConnectionStrings:Canamed", missing);
    }

    [Fact]
    public void FindMissing_DeveApontarConnectionString_QuandoEmBranco()
    {
        var configuration = Build("   ");

        var missing = StartupRequirements.FindMissing(configuration);

        Assert.Contains("ConnectionStrings:Canamed", missing);
    }

    [Fact]
    public void FindMissing_DeveSerVazio_QuandoConfiguracaoEstaCompleta()
    {
        var configuration = Build("Host=localhost;Database=canamed_test");

        var missing = StartupRequirements.FindMissing(configuration);

        Assert.Empty(missing);
    }

    [Fact]
    public void EnsureSatisfied_DeveFalharSemExporValores()
    {
        var configuration = new ConfigurationBuilder().Build();

        var exception = Assert.Throws<InvalidOperationException>(
            () => StartupRequirements.EnsureSatisfied(configuration));

        Assert.Contains("ConnectionStrings:Canamed", exception.Message);
    }

    private static IConfiguration Build(string connectionString) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Canamed"] = connectionString,
            })
            .Build();
}
