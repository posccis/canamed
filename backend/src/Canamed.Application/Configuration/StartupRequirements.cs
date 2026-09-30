using Microsoft.Extensions.Configuration;

namespace Canamed.Application.Configuration;

/// <summary>
/// Configuração obrigatória avaliada na inicialização da aplicação.
/// A ausência de qualquer item impede a aplicação de iniciar, evitando subir com valores padrão inseguros.
/// </summary>
public static class StartupRequirements
{
    /// <summary>Nome da connection string do banco principal, em <c>ConnectionStrings</c>.</summary>
    public const string DatabaseConnectionStringName = "Canamed";

    /// <summary>Retorna as chaves de configuração obrigatórias que estão ausentes ou em branco.</summary>
    public static IReadOnlyList<string> FindMissing(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        var missing = new List<string>();

        if (string.IsNullOrWhiteSpace(configuration.GetConnectionString(DatabaseConnectionStringName)))
        {
            missing.Add($"ConnectionStrings:{DatabaseConnectionStringName}");
        }

        return missing;
    }

    /// <summary>Lanca <see cref="InvalidOperationException"/> listando as chaves ausentes, sem expor valores.</summary>
    public static void EnsureSatisfied(IConfiguration configuration)
    {
        var missing = FindMissing(configuration);

        if (missing.Count > 0)
        {
            throw new InvalidOperationException(
                $"Configuração ausente: {string.Join(", ", missing)}. "
                + "Defina as variáveis de ambiente correspondentes conforme o .env.example.");
        }
    }
}
