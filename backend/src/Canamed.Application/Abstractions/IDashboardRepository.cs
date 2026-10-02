using Canamed.Application.Dashboard;

namespace Canamed.Application.Abstractions;

/// <summary>
/// Acesso a dados agregados do painel gerencial da clínica (SPEC-0007).
/// </summary>
public interface IDashboardRepository
{
    Task<DashboardSummaryResponse> GetSummaryAsync(
        Guid clinicId,
        DateOnly date,
        CancellationToken cancellationToken);
}
