using Canamed.Application.Configuration;
using Canamed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Canamed.Infrastructure;

/// <summary>Registro dos serviços de infraestrutura no contêiner de injeção de dependência.</summary>
public static class DependencyInjection
{
    public static IServiceCollection AddCanamedInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        var connectionString = configuration.GetConnectionString(StartupRequirements.DatabaseConnectionStringName)
            ?? throw new InvalidOperationException(
                $"Configuração ausente: ConnectionStrings:{StartupRequirements.DatabaseConnectionStringName}.");

        services.AddDbContext<CanamedDbContext>(options => options.UseNpgsql(connectionString));

        return services;
    }
}
