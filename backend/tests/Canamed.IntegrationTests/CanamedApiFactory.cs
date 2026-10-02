using Canamed.Application.Abstractions;
using Canamed.Application.Identity;
using Canamed.Domain.Agenda;
using Canamed.Domain.Clinics;
using Canamed.Domain.Identity;
using Canamed.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Canamed.IntegrationTests;

/// <summary>
/// Fábrica da API para os testes de integração, apontando para o banco `canamed_test` com dados
/// sintéticos (ADR-0003). As senhas são geradas em tempo de execução — nenhuma credencial existe no
/// código (RN-019).
/// </summary>
public sealed class CanamedApiFactory : WebApplicationFactory<Program>
{
    /// <summary>Clínica A — usada nos cenários de agenda e identidade.</summary>
    public static Guid ClinicAId { get; } = Guid.Parse("aaaaaaaa-0000-4000-8000-000000000001");

    /// <summary>Clínica B — usada nos cenários de isolamento multi-clínica (CA-005 e CA-009).</summary>
    public static Guid ClinicBId { get; } = Guid.Parse("bbbbbbbb-0000-4000-8000-000000000001");

    /// <summary>Profissional da clínica A.</summary>
    public static Guid ProfessionalAId { get; } = Guid.Parse("aaaaaaaa-0000-4000-8000-000000000002");

    /// <summary>Profissional da clínica B.</summary>
    public static Guid ProfessionalBId { get; } = Guid.Parse("bbbbbbbb-0000-4000-8000-000000000002");

    /// <summary>Paciente sintético da clínica A.</summary>
    public static Guid PatientAId { get; } = Guid.Parse("aaaaaaaa-0000-4000-8000-000000000003");

    /// <summary>Tipo de atendimento de 30 minutos da clínica A.</summary>
    public static Guid AppointmentTypeAId { get; } = Guid.Parse("aaaaaaaa-0000-4000-8000-000000000004");

    /// <summary>Especialidade sintética da clínica A.</summary>
    public static Guid SpecialtyAId { get; } = Guid.Parse("aaaaaaaa-0000-4000-8000-000000000005");

    /// <summary>E-mail do gestor da clínica A.</summary>
    public static string ManagerEmail { get; } = "gestor.teste@canamed.local";

    /// <summary>E-mail da recepção da clínica A.</summary>
    public static string ReceptionistEmail { get; } = "recepcao.teste@canamed.local";

    /// <summary>E-mail do profissional da clínica A.</summary>
    public static string ProfessionalEmail { get; } = "profissional.teste@canamed.local";

    /// <summary>E-mail do gestor da clínica B.</summary>
    public static string ManagerBEmail { get; } = "gestor.b@canamed.local";

    /// <summary>Senha do gestor da clínica A (gerada por execução, nunca versionada).</summary>
    public static string ManagerPassword { get; } = TestCredentials.CreatePassword();

    /// <summary>Senha da recepção da clínica A.</summary>
    public static string ReceptionistPassword { get; } = TestCredentials.CreatePassword();

    /// <summary>Senha do profissional da clínica A.</summary>
    public static string ProfessionalPassword { get; } = TestCredentials.CreatePassword();

    /// <summary>Senha do gestor da clínica B.</summary>
    public static string ManagerBPassword { get; } = TestCredentials.CreatePassword();

    public CanamedApiFactory()
    {
        TestDatabase.Migrate();
        TestDatabase.ClearAllData();

        var hasher = Services.GetRequiredService<IPasswordHasher>();

        Seed(hasher);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:Canamed", TestDatabase.ConnectionString);
        builder.UseSetting("Canamed:SeedDevelopmentData", "false");

        // A suíte valida a regra de produção (MFA obrigatório para gestor), independentemente de o
        // desenvolvedor ter suspendido a exigência no .env local para testar.
        builder.UseSetting("Canamed:Security:RequireMfaForManagers", "true");

        // A suíte faz muitas tentativas de login; o limite de produção é validado por critério próprio.
        builder.UseSetting("Canamed:RateLimiting:LoginPermitLimit", "1000");

        // Relógio fixo no início do dia local: torna determinísticos os cenários que dependem do dia
        // (fila de espera, fechamento do dia) em qualquer horário de execução.
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<TimeProvider>();
            services.AddSingleton(TestClock.Instance);
        });
    }

    /// <summary>Instante fixo usado pela suíte: 00:00 (America/Fortaleza) do dia da execução.</summary>
    public static DateTimeOffset FixedNow { get; } =
        Canamed.Application.Agenda.AgendaTimeZone
            .LocalDayToUtcRange(DateOnly.FromDateTime(DateTime.Now))
            .StartUtc;

    /// <summary>Cria um contexto apontando para o banco de testes.</summary>
    public static CanamedDbContext CreateDbContext() => new(TestDatabase.Options);

    /// <summary>
    /// Cria um usuário sintético isolado para o cenário em execução. Cada teste recebe credenciais
    /// próprias, evitando que um cenário interfira no outro.
    /// </summary>
    public TestUser SeedUser(
        string role,
        Guid? clinicId = null,
        bool mfaEnabled = false,
        Guid? professionalId = null,
        string? name = null)
    {
        var targetClinic = clinicId ?? ClinicAId;
        var password = TestCredentials.CreatePassword();
        var email = $"{Guid.NewGuid():N}@canamed.local";
        var now = DateTimeOffset.UtcNow;

        var hasher = Services.GetRequiredService<IPasswordHasher>();
        var protector = Services.GetRequiredService<ISecretProtector>();
        var secret = TestCredentials.CreateBase32Secret();

        using var context = CreateDbContext();

        var user = User.Create(name ?? $"Usuário {role}", email, hasher.Hash(password), now);

        if (mfaEnabled)
        {
            user.SetMfaSecret(protector.Protect(secret));
            user.EnableMfa(now);
        }

        context.Users.Add(user);
        context.ClinicMemberships.Add(ClinicMembership.Create(user.Id, targetClinic, role, professionalId, now));
        context.SaveChanges();

        return new TestUser(user.Id, email, password, secret, targetClinic, role);
    }

    /// <summary>
    /// Calcula o código TOTP correspondente ao segredo, no instante informado. O padrão é o relógio fixo
    /// da suíte, que é o mesmo usado pela API em teste.
    /// </summary>
    public string ComputeTotp(string secret, DateTimeOffset? moment = null) =>
        Services.GetRequiredService<ITotpService>()
            .ComputeCode(secret, moment ?? FixedNow);

    private static void Seed(IPasswordHasher hasher)
    {
        using var context = CreateDbContext();
        var now = DateTimeOffset.UtcNow;

        context.Clinics.AddRange(
            Clinic.Create("Clínica Teste A (sintética)", now, ClinicAId),
            Clinic.Create("Clínica Teste B (sintética)", now, ClinicBId));

        context.Professionals.AddRange(
            Professional.Create(ClinicAId, "Profissional Teste A (sintético)", now, ProfessionalAId),
            Professional.Create(ClinicBId, "Profissional Teste B (sintético)", now, ProfessionalBId));

        context.Patients.Add(Patient.Create(
            ClinicAId,
            "Paciente Teste A",
            "(81) 90000-0000",
            now,
            PatientAId));

        context.Specialties.Add(Specialty.Create(ClinicAId, "Ortopedia Teste", now, SpecialtyAId));

        context.AppointmentTypes.Add(AppointmentType.Create(
            ClinicAId,
            "Consulta Teste",
            AppointmentCategory.Single,
            AppointmentCoverage.Private,
            30,
            now,
            specialtyId: null,
            id: AppointmentTypeAId));

        AddUser(context, hasher, "Gestor Teste A", ManagerEmail, ManagerPassword, ClinicAId, Roles.Manager, now);
        AddUser(context, hasher, "Recepção Teste A", ReceptionistEmail, ReceptionistPassword, ClinicAId, Roles.Receptionist, now);
        AddUser(
            context,
            hasher,
            "Profissional Teste A",
            ProfessionalEmail,
            ProfessionalPassword,
            ClinicAId,
            Roles.Professional,
            now,
            ProfessionalAId);
        AddUser(context, hasher, "Gestor Teste B", ManagerBEmail, ManagerBPassword, ClinicBId, Roles.Manager, now, ProfessionalBId);

        context.SaveChanges();
    }

    private static void AddUser(
        CanamedDbContext context,
        IPasswordHasher hasher,
        string name,
        string email,
        string password,
        Guid clinicId,
        string role,
        DateTimeOffset now,
        Guid? professionalId = null)
    {
        var user = User.Create(name, email, hasher.Hash(password), now);

        context.Users.Add(user);
        context.ClinicMemberships.Add(ClinicMembership.Create(user.Id, clinicId, role, professionalId, now));
    }
}

/// <summary>Define a coleção que compartilha a fábrica e serializa os testes de integração.</summary>
[CollectionDefinition(Name)]
public sealed class CanamedCollection : ICollectionFixture<CanamedApiFactory>
{
    /// <summary>Nome da coleção de testes de integração.</summary>
    public const string Name = "Canamed";
}

/// <summary>Geração de credenciais sintéticas para os testes (nunca versionadas — RN-019).</summary>
internal static class TestCredentials
{
    /// <summary>Cria uma senha aleatória que atende à política de senha do produto.</summary>
    public static string CreatePassword() =>
        Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(18))
            .TrimEnd('=')
            .Replace('+', 'A')
            .Replace('/', 'b');

    /// <summary>Gera um segredo TOTP sintético em Base32.</summary>
    public static string CreateBase32Secret() =>
        Services_Base32Encode(System.Security.Cryptography.RandomNumberGenerator.GetBytes(20));

    private static string Services_Base32Encode(byte[] data)
    {
        const string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var builder = new System.Text.StringBuilder((data.Length * 8 + 4) / 5);
        var buffer = 0;
        var bitsLeft = 0;

        foreach (var value in data)
        {
            buffer = (buffer << 8) | value;
            bitsLeft += 8;

            while (bitsLeft >= 5)
            {
                builder.Append(alphabet[(buffer >> (bitsLeft - 5)) & 0x1F]);
                bitsLeft -= 5;
            }
        }

        if (bitsLeft > 0)
        {
            builder.Append(alphabet[(buffer << (5 - bitsLeft)) & 0x1F]);
        }

        return builder.ToString();
    }
}

/// <summary>Usuário sintético criado por um cenário de teste.</summary>
public sealed record TestUser(
    Guid Id,
    string Email,
    string Password,
    string MfaSecret,
    Guid ClinicId,
    string Role);
