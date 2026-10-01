using Canamed.Application.Agenda;
using Canamed.Application.Catalog;
using Canamed.Application.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Canamed.Application;

/// <summary>Registro dos casos de uso da camada de aplicação.</summary>
public static class DependencyInjection
{
    /// <summary>Registra os serviços de aplicação e o provedor de tempo.</summary>
    public static IServiceCollection AddCanamedApplication(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddSingleton(TimeProvider.System);
        services.AddScoped<AgendaService>();
        services.AddScoped<CatalogService>();
        services.AddScoped<AuthService>();
        services.AddScoped<UserService>();

        return services;
    }
}
