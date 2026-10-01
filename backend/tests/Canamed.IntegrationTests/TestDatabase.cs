using Canamed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Canamed.IntegrationTests;

/// <summary>
/// Banco de testes do CANAMED (ADR-0003: dados sintéticos, ambiente TEST isolado).
/// Por segurança, toda operação é bloqueada se a base alvo não tiver "test" no nome.
/// </summary>
internal static class TestDatabase
{
    /// <summary>Variável de ambiente que pode substituir a base de testes usada.</summary>
    public const string ConnectionStringEnvironmentVariable = "CANAMED_TEST_CONNECTION_STRING";

    private static readonly Lazy<string> LazyConnectionString = new(Resolve, isThreadSafe: true);

    public static string ConnectionString => LazyConnectionString.Value;

    public static DbContextOptions<CanamedDbContext> Options { get; } =
        new DbContextOptionsBuilder<CanamedDbContext>().UseNpgsql(ConnectionString).Options;

    /// <summary>Aplica as migrations pendentes e garante que o escopo de teste esteja íntegro.</summary>
    public static void Migrate()
    {
        using var context = new CanamedDbContext(Options);
        context.Database.Migrate();
    }

    /// <summary>Remove os dados de agenda entre execuções, preservando a trilha de auditoria (append-only).</summary>
    public static void ClearAgendaData()
    {
        using var context = new CanamedDbContext(Options);

        context.Database.ExecuteSqlRaw("DELETE FROM appointments");
        context.Database.ExecuteSqlRaw("DELETE FROM professional_blocks");
    }

    /// <summary>Força um status de agendamento diretamente no banco (cenários de ciclo de vida).</summary>
    public static void SetAppointmentStatus(Guid appointmentId, string status)
    {
        using var context = new CanamedDbContext(Options);

        context.Database.ExecuteSqlRaw(
            "UPDATE appointments SET status = {0} WHERE id = {1}",
            status,
            appointmentId);
    }

    /// <summary>Altera a duração vigente de um tipo de atendimento.</summary>
    public static void SetAppointmentTypeDuration(Guid appointmentTypeId, int durationMinutes)
    {
        using var context = new CanamedDbContext(Options);

        context.Database.ExecuteSqlRaw(
            "UPDATE appointment_types SET duration_minutes = {0} WHERE id = {1}",
            durationMinutes,
            appointmentTypeId);
    }

    /// <summary>Remove também os cadastros mínimos (usado apenas na preparação da suíte).</summary>
    public static void ClearAllData()
    {
        ClearAgendaData();

        using var context = new CanamedDbContext(Options);

        context.Database.ExecuteSqlRaw("DELETE FROM login_challenges");
        context.Database.ExecuteSqlRaw("DELETE FROM user_sessions");
        context.Database.ExecuteSqlRaw("DELETE FROM clinic_memberships");
        context.Database.ExecuteSqlRaw("DELETE FROM users");
        context.Database.ExecuteSqlRaw("DELETE FROM patients");
        context.Database.ExecuteSqlRaw("DELETE FROM appointment_types");
        context.Database.ExecuteSqlRaw("DELETE FROM professionals");
        context.Database.ExecuteSqlRaw("DELETE FROM specialties");
        context.Database.ExecuteSqlRaw("DELETE FROM clinics");
    }

    /// <summary>
    /// Limpa o estado efêmero de identidade entre testes: sessões, desafios e contadores de tentativas.
    /// Preserva usuários e vínculos, que são pré-condição dos cenários.
    /// </summary>
    public static void ResetIdentityState()
    {
        using var context = new CanamedDbContext(Options);

        context.Database.ExecuteSqlRaw("DELETE FROM login_challenges");
        context.Database.ExecuteSqlRaw("DELETE FROM user_sessions");
        context.Database.ExecuteSqlRaw(
            "UPDATE users SET failed_login_attempts = 0, locked_until = NULL");
    }

    private static string Resolve()
    {
        var configured = Environment.GetEnvironmentVariable(ConnectionStringEnvironmentVariable);

        if (string.IsNullOrWhiteSpace(configured))
        {
            configured = ReadFromEnvFile();
        }

        if (string.IsNullOrWhiteSpace(configured))
        {
            throw new InvalidOperationException(
                $"Configure a variável {ConnectionStringEnvironmentVariable} ou crie o arquivo .env na raiz "
                + "do repositório (veja docs/guia-de-uso-e-execucao.md).");
        }

        return ToTestDatabase(configured);
    }

    private static string ToTestDatabase(string connectionString)
    {
        var builder = new Npgsql.NpgsqlConnectionStringBuilder(connectionString);

        if (builder.Database is null || !builder.Database.Contains("test", StringComparison.OrdinalIgnoreCase))
        {
            builder.Database = "canamed_test";
        }

        if (!builder.Database.Contains("test", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Os testes de integração só podem ser executados contra uma base de dados de teste.");
        }

        return builder.ConnectionString;
    }

    private static string? ReadFromEnvFile()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, ".env");

            if (File.Exists(candidate))
            {
                foreach (var line in File.ReadLines(candidate))
                {
                    var trimmed = line.Trim();

                    if (trimmed.StartsWith("ConnectionStrings__Canamed=", StringComparison.OrdinalIgnoreCase))
                    {
                        return trimmed["ConnectionStrings__Canamed=".Length..].Trim().Trim('"');
                    }
                }

                return null;
            }

            directory = directory.Parent;
        }

        return null;
    }
}
