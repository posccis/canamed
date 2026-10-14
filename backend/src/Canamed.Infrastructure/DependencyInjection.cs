using Canamed.Application.Configuration;
using Canamed.Application.Abstractions;
using Canamed.Application.Identity;
using Canamed.Infrastructure.Identity;
using Canamed.Infrastructure.Persistence;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Canamed.Infrastructure;

/// <summary>Registro dos serviços de infraestrutura no contêiner de injeção de dependência.</summary>
public static class DependencyInjection
{
    public static IServiceCollection AddCanamedInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);

        var connectionString = configuration.GetConnectionString(StartupRequirements.DatabaseConnectionStringName)
            ?? throw new InvalidOperationException(
                $"Configuração ausente: ConnectionStrings:{StartupRequirements.DatabaseConnectionStringName}.");

        services.AddDbContext<CanamedDbContext>(options => options.UseNpgsql(connectionString));
        // Fábrica com o mesmo tempo de vida das opções registradas por AddDbContext (escopo de requisição);
        // é usada pela trilha de auditoria para escrever fora da transação corrente.
        services.AddDbContextFactory<CanamedDbContext>(
            options => options.UseNpgsql(connectionString),
            ServiceLifetime.Scoped);

        // Chaves de proteção de dados em diretório do projeto, ignorado pelo Git (RN-012).
        var keyRingPath = configuration["Canamed:Security:KeyRingPath"]
            ?? Path.Combine(environment.ContentRootPath, "artifacts", "dataprotection-keys");

        Directory.CreateDirectory(keyRingPath);

        var dataProtection = services.AddDataProtection()
            .SetApplicationName("Canamed")
            .PersistKeysToFileSystem(new DirectoryInfo(keyRingPath));

        // Em Windows, o chaveiro é protegido pelo DPAPI do próprio usuário; em Linux, a proteção das
        // chaves depende da etapa de hospedagem (pendência P-006 da SPEC-0003).
        if (OperatingSystem.IsWindows())
        {
            dataProtection.ProtectKeysWithDpapi();
        }

        services.AddHttpContextAccessor();
        services.AddSingleton<IPasswordHasher, Argon2PasswordHasher>();
        services.AddSingleton<ITotpService, TotpService>();
        services.AddSingleton<ISecretProtector, DataProtectionSecretProtector>();
        services.AddSingleton<IMfaPolicy, ConfigurationMfaPolicy>();
        services.AddSingleton<IFileStorage, Canamed.Infrastructure.Storage.LocalFileStorage>();
        services.AddSingleton<IAccountLockoutPolicy, ConfigurationAccountLockoutPolicy>();
        services.AddScoped<ICurrentActorAccessor, CurrentActorAccessor>();
        services.AddScoped<IAgendaRepository, AgendaRepository>();
        services.AddScoped<IQueueRepository, QueueRepository>();
        services.AddScoped<ICatalogRepository, CatalogRepository>();
        services.AddScoped<IClinicOperationRepository, ClinicOperationRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<ITriageRepository, TriageRepository>();
        services.AddScoped<Canamed.Application.MedicalRecords.IMedicalRecordRepository, MedicalRecordRepository>();
        services.AddScoped<Canamed.Application.MedicalDocuments.IMedicalDocumentRepository, MedicalDocumentRepository>();
        services.AddSingleton<Canamed.Domain.MedicalDocuments.IDigitalSignatureProvider, Canamed.Infrastructure.DigitalSignature.SimulatedSignatureProvider>();
        services.AddScoped<Canamed.Application.Notifications.INotificationRepository, NotificationRepository>();
        services.AddSingleton<Canamed.Domain.Notifications.ISmsWhatsAppProvider, Canamed.Infrastructure.Notifications.SimulatedSmsWhatsAppProvider>();
        services.AddScoped<Canamed.Application.Portal.IPortalRepository, PortalRepository>();
        services.AddScoped<Canamed.Application.Portal.IPublicPortalRepository, PublicPortalRepository>();
        services.AddScoped<Canamed.Application.Privacy.IPrivacyRepository, PrivacyRepository>();
        services.AddScoped<Canamed.Application.CashRegister.ICashSessionRepository, CashSessionRepository>();
        services.AddScoped<Canamed.Application.Queue.IQueueCallRepository, QueueCallRepository>();
        services.AddScoped<Canamed.Application.Financial.IFinancialRepository, FinancialRepository>();
        services.AddScoped<Canamed.Application.Inventory.IInventoryRepository, InventoryRepository>();
        services.AddScoped<Canamed.Application.Clinics.IClinicPolicyRepository, ClinicPolicyRepository>();
        services.AddScoped<IAuditRepository, AuditRepository>();
        services.AddScoped<IAuditTrail, AuditTrail>();
        services.AddScoped<IIdentityRepository, IdentityRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        return services;
    }
}
