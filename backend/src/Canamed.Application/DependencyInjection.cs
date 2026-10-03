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
        services.AddScoped<Canamed.Application.MedicalRecords.MedicalRecordService>();
        services.AddScoped<Canamed.Application.MedicalDocuments.MedicalDocumentService>();
        services.AddScoped<Canamed.Application.DoctorWorkspace.DoctorWorkspaceService>();
        services.AddScoped<Canamed.Application.Notifications.NotificationService>();
        services.AddScoped<Canamed.Application.Portal.OnlineBookingService>();
        services.AddScoped<Canamed.Application.Kiosk.KioskCheckInService>();
        services.AddScoped<Canamed.Application.Privacy.PrivacyService>();
        services.AddScoped<Canamed.Application.CashRegister.CashRegisterService>();
        services.AddScoped<Canamed.Application.Queue.QueueCallService>();
        services.AddScoped<Canamed.Application.Financial.FinancialService>();
        services.AddScoped<Canamed.Application.Inventory.InventoryService>();
        services.AddScoped<Canamed.Application.DpoGovernance.DpoGovernanceService>();
        services.AddScoped<Canamed.Application.Clinics.ClinicPolicyService>();

        return services;
    }
}
