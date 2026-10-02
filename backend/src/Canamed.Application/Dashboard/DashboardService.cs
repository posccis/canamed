using Canamed.Application.Abstractions;
using Canamed.Application.Agenda;
using Canamed.Application.Identity;

namespace Canamed.Application.Dashboard;

/// <summary>
/// Serviço de indicadores e resumo operacional da clínica (SPEC-0007).
/// </summary>
public sealed class DashboardService(
    IDashboardRepository repository,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    /// <summary>Consulta o resumo operacional consolidado para uma data (F-001).</summary>
    public async Task<DashboardSummaryResponse> GetSummaryAsync(
        DateOnly? date,
        CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();

        var targetDate = date
            ?? DateOnly.FromDateTime(AgendaTimeZone.ToLocal(timeProvider.GetUtcNow()).DateTime);

        return await repository.GetSummaryAsync(actor.ClinicId, targetDate, cancellationToken)
            .ConfigureAwait(false);
    }
}
