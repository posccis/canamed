using Canamed.Application.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Canamed.Infrastructure.Identity;

/// <summary>
/// Exigência do segundo fator definida por papel, com suspensão temporária permitida apenas em
/// Development/Testing pela configuração <c>Canamed:Security:RequireMfaForManagers</c>.
///
/// Fora desses ambientes o valor da configuração é **ignorado** (falha fechada): produção sempre exige
/// o segundo fator dos papéis que a regra de negócio determina.
/// </summary>
public sealed class ConfigurationMfaPolicy(
    IHostEnvironment environment,
    IConfiguration configuration) : IMfaPolicy
{
    public bool IsRequiredFor(string? role)
    {
        if (!Roles.RequiresMfa(role))
        {
            return false;
        }

        return !IsSuspendedInDevelopment();
    }

    private bool IsSuspendedInDevelopment()
    {
        if (!environment.IsDevelopment() && !environment.IsEnvironment("Testing"))
        {
            return false;
        }

        // A suspensão precisa ser explícita: ausência da chave mantém a exigência.
        return !configuration.GetValue("Canamed:Security:RequireMfaForManagers", true);
    }
}
