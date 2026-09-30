using System.Diagnostics;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Canamed.Api.Health;

/// <summary>Escreve o relatório de prontidão no formato Problem Details (RFC 7807).</summary>
public static class ReadinessResponseWriter
{
    private const string ProblemJsonContentType = "application/problem+json";

    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public static async Task WriteAsync(HttpContext context, HealthReport report)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(report);

        var healthy = report.Status == HealthStatus.Healthy;

        var problem = new ProblemDetails
        {
            Status = context.Response.StatusCode,
            Title = healthy ? "Serviço pronto" : "Serviço indisponível",
            Detail = healthy
                ? "Todas as dependências obrigatórias estão acessíveis."
                : "Uma ou mais dependências obrigatórias estão inacessíveis.",
            Instance = context.Request.Path,
            Extensions = { ["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier },
        };

        context.Response.ContentType = ProblemJsonContentType;

        await context.Response.WriteAsync(JsonSerializer.Serialize(problem, SerializerOptions));
    }
}
