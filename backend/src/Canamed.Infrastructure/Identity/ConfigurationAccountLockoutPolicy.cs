using Canamed.Application.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Canamed.Infrastructure.Identity;

/// <summary>
/// Bloqueio por tentativas sucessivas com suspensão permitida apenas em Development/Testing
/// pela configuração <c>Canamed:Security:EnableAccountLockout</c>.
///
/// Fora desses ambientes o valor da configuração é ignorado (falha fechada): produção sempre
/// bloqueia a conta após sucessivas tentativas inválidas.
/// </summary>
public sealed class ConfigurationAccountLockoutPolicy(
    IHostEnvironment environment,
    IConfiguration configuration) : IAccountLockoutPolicy
{
    public bool IsLockoutEnabled()
    {
        if (!environment.IsDevelopment() && !environment.IsEnvironment("Testing"))
        {
            return true;
        }

        return configuration.GetValue("Canamed:Security:EnableAccountLockout", true);
    }
}
