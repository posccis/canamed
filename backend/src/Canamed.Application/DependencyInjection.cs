using Canamed.Application.Agenda;
using Canamed.Application.Catalog;
using Canamed.Application.Clinics;
using Canamed.Application.Identity;
using Canamed.Application.Queue;
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
        services.AddScoped<ClinicOperationService>();
        services.AddScoped<QueueService>();
        services.AddScoped<DayClosingService>();
        services.AddScoped<AuthService>();
        services.AddScoped<UserService>();
        services.AddScoped<Canamed.Application.Dashboard.DashboardService>();
        services.AddScoped<Canamed.Application.Payments.PaymentService>();
        services.AddScoped<TriageService>();

        return services;
    }
}
