using System.Data.Common;
using Canamed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Canamed.Infrastructure.Health;

/// <summary>Verifica se o banco de dados principal está acessível (usado pelo endpoint de prontidão).</summary>
public sealed class DatabaseHealthCheck(CanamedDbContext dbContext) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        try
        {
            var canConnect = await dbContext.Database
                .CanConnectAsync(cancellationToken)
                .ConfigureAwait(false);

            return canConnect
                ? HealthCheckResult.Healthy("Banco de dados acessível.")
                : HealthCheckResult.Unhealthy("Banco de dados inacessível.");
        }
        catch (Exception exception) when (exception is DbException or InvalidOperationException or ArgumentException)
        {
            return HealthCheckResult.Unhealthy("Falha ao verificar o banco de dados.", exception);
        }
    }
}
