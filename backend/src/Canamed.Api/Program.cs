using Canamed.Api.Health;
using Canamed.Application.Configuration;
using Canamed.Infrastructure;
using Canamed.Infrastructure.Health;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// Logs estruturados em JSON (RN-009).
builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole();

// Falha rápida quando falta configuração obrigatória (RN-006, ER-002).
StartupRequirements.EnsureSatisfied(builder.Configuration);

builder.Services.AddCanamedInfrastructure(builder.Configuration);
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi("v1");
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database");

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

// Contrato canônico da API (RN-004), disponível apenas em desenvolvimento.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi("/api/v1/openapi.json");
}

var api = app.MapGroup("/api/v1");

api.MapGet("/health/live", () => Results.Ok(new HealthResponse("healthy")))
    .WithName("HealthLive");

api.MapHealthChecks("/health/ready", new HealthCheckOptions { ResponseWriter = ReadinessResponseWriter.WriteAsync })
    .WithName("HealthReady");

app.Run();

/// <summary>Resposta do endpoint de liveness.</summary>
public sealed record HealthResponse(string Status);

/// <summary>Exposto para os testes de integração (<c>WebApplicationFactory</c>).</summary>
public partial class Program;
