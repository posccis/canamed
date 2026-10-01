using Canamed.Application.Identity;
using Canamed.Infrastructure.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.FileProviders;

namespace Canamed.UnitTests.Identity;

/// <summary>
/// Política de exigência do segundo fator (RN-010 da SPEC-0003): a suspensão só vale em DEV/TEST e
/// precisa ser explícita. Em produção a configuração é ignorada (falha fechada).
/// </summary>
public sealed class MfaPolicyTests
{
    [Fact]
    public void Gestor_DeveExigirMfa_EmProducaoMesmoComSuspensaoConfigurada()
    {
        var policy = BuildPolicy("Production", "false");

        Assert.True(policy.IsRequiredFor(Roles.Manager));
    }

    [Fact]
    public void Gestor_DeveExigirMfa_EmDesenvolvimentoSemSuspensaoExplicita()
    {
        var policy = BuildPolicy("Development", configuredValue: null);

        Assert.True(policy.IsRequiredFor(Roles.Manager));
        Assert.True(BuildPolicy("Development", "true").IsRequiredFor(Roles.Manager));
    }

    [Fact]
    public void Gestor_NaoDeveExigirMfa_QuandoSuspensoEmDesenvolvimento()
    {
        Assert.False(BuildPolicy("Development", "false").IsRequiredFor(Roles.Manager));
        Assert.False(BuildPolicy("Testing", "false").IsRequiredFor(Roles.Manager));
    }

    [Theory]
    [InlineData(Roles.Receptionist)]
    [InlineData(Roles.Professional)]
    public void DemaisPapeis_NaoExigemMfa(string role)
    {
        Assert.False(BuildPolicy("Production", configuredValue: null).IsRequiredFor(role));
    }

    private static ConfigurationMfaPolicy BuildPolicy(string environmentName, string? configuredValue)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Canamed:Security:RequireMfaForManagers"] = configuredValue,
            })
            .Build();

        return new ConfigurationMfaPolicy(new FakeEnvironment(environmentName), configuration);
    }

    private sealed class FakeEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;

        public string ApplicationName { get; set; } = "Canamed.UnitTests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
