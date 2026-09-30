using System.Diagnostics;
using Canamed.Application.Configuration;
using Canamed.Infrastructure;
using Canamed.Infrastructure.Health;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// Logs estruturados em JSON (RN-009).
builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole();

// Falha rápida quando falta configuração obrigatória (RN-006, ER-002).
StartupRequirements.EnsureSatisfied(builder.Configuration);

builder.Services.AddCanamedInfrastructure(builder.Configuration);
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database");

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

var api = app.MapGroup("/api/v1");

api.MapGet("/health/live", () => Results.Ok(new HealthResponse("healthy")))
    .WithName("HealthLive");

api.MapHealthChecks("/health/ready", new HealthCheckOptions { ResponseWriter = WriteReadinessAsync })
    .WithName("HealthReady");

static async Task WriteReadinessAsync(HttpContext context, HealthReport report)
{
    var healthy = report.Status == HealthStatus.Healthy;

    context.Response.ContentType = "application/problem+json";

    await context.Response.WriteAsJsonAsync(new ProblemDetails
    {
        Status = context.Response.StatusCode,
        Title = healthy ? "Serviço pronto" : "Serviço indisponível",
        Detail = healthy
            ? "Todas as dependências obrigatórias estão acessíveis."
            : "Uma ou mais dependências obrigatórias estão inacessíveis.",
        Instance = context.Request.Path,
        Extensions = { ["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier },
    });
}

app.Run();

/// <summary>Resposta do endpoint de liveness.</summary>
public sealed record HealthResponse(string Status);

/// <summary>Exposto para os testes de integração (<c>WebApplicationFactory</c>).</summary>
public partial class Program;
