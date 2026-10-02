using Canamed.Api.Authorization;
using Canamed.Application.Dashboard;
using Canamed.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

/// <summary>Rotas do painel gerencial e indicadores operacionais (seção 7 da SPEC-0007).</summary>
public static class DashboardEndpoints
{
    /// <summary>Mapeia a rota de resumo operacional do dashboard.</summary>
    public static RouteGroupBuilder MapDashboardEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var dashboard = api.MapGroup("/dashboard");

        dashboard.MapGet("/summary", GetSummaryAsync)
            .WithName("GetDashboardSummary")
            .Produces<DashboardSummaryResponse>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.DashboardRead);

        return api;
    }

    private static async Task<IResult> GetSummaryAsync(
        DashboardService dashboardService,
        CancellationToken cancellationToken,
        [FromQuery] DateOnly? date = null) =>
        Results.Ok(await dashboardService.GetSummaryAsync(date, cancellationToken).ConfigureAwait(false));
}
