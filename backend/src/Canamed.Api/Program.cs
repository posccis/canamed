using Canamed.Api.Endpoints;
using Canamed.Api.Errors;
using Canamed.Api.Health;
using Canamed.Api.Configuration;
using Canamed.Api.Authorization;
using Canamed.Application;
using Canamed.Application.Configuration;
using Canamed.Infrastructure;
using Canamed.Infrastructure.Development;
using Canamed.Infrastructure.Health;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Conveniência local: lê o .env não versionado em Development (ADR-0004).
builder.Configuration.AddLocalEnvFile(builder.Environment);

// Logs estruturados em JSON (RN-009).
builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole();

// Falha rápida quando falta configuração obrigatória (RN-006, ER-002).
StartupRequirements.EnsureSatisfied(builder.Configuration);

builder.Services.AddCanamedInfrastructure(builder.Configuration, builder.Environment);
builder.Services.AddCanamedApplication();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<CanamedExceptionHandler>();
builder.Services.AddOpenApi("v1");
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database");

// CORS restrito com credenciais: a sessão viaja em cookie, então origem curinga é proibida (RN-016).
var allowedOrigins = (builder.Configuration["Canamed:Cors:AllowedOrigins"] ?? "http://localhost:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options => options.AddPolicy(
    "canamed-spa",
    policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

// Limitação de requisições no login (RN-015).
var loginPermitLimit = builder.Configuration.GetValue("Canamed:RateLimiting:LoginPermitLimit", 10);
var loginWindowSeconds = builder.Configuration.GetValue("Canamed:RateLimiting:LoginWindowSeconds", 60);

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(
        AuthEndpoints.LoginRateLimitPolicy,
        context => RateLimitPartition.GetFixedWindowLimiter(
            // Limite por origem; o bloqueio por conta (RN-004) cobre o ataque distribuído.
            context.Connection.RemoteIpAddress?.ToString() ?? "origem-desconhecida",
            _ => new FixedWindowRateLimiterOptions
            {
                Window = TimeSpan.FromSeconds(loginWindowSeconds),
                PermitLimit = loginPermitLimit,
                QueueLimit = 0,
            }));

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/problem+json";

        await context.HttpContext.Response.WriteAsJsonAsync(
            new
            {
                type = ProblemTypeUri.From("too-many-requests"),
                title = "Muitas tentativas",
                status = StatusCodes.Status429TooManyRequests,
                detail = "Muitas tentativas. Aguarde um instante e tente novamente.",
                traceId = context.HttpContext.TraceIdentifier,
            },
            cancellationToken);
    };
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseCors("canamed-spa");
app.UseRateLimiter();
app.UseMiddleware<CsrfProtectionMiddleware>();
app.UseMiddleware<SessionAuthenticationMiddleware>();

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

api.MapCatalogEndpoints();
api.MapClinicOperationEndpoints();
api.MapAgendaEndpoints();
api.MapQueueEndpoints();
api.MapDashboardEndpoints();
api.MapPaymentEndpoints();
api.MapAuthEndpoints();
api.MapUserEndpoints();

// Dados sintéticos de demonstração, apenas em desenvolvimento (ADR-0003).
// Pode ser desativado com Canamed:SeedDevelopmentData=false (usado pelos testes de integração).
if (app.Environment.IsDevelopment() && app.Configuration.GetValue("Canamed:SeedDevelopmentData", true))
{
    await DevelopmentDataSeeder.SeedAsync(
        app.Services,
        app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Canamed.DevelopmentDataSeeder"));
}

app.Run();

/// <summary>Resposta do endpoint de liveness.</summary>
public sealed record HealthResponse(string Status);

/// <summary>Exposto para os testes de integração (<c>WebApplicationFactory</c>).</summary>
public partial class Program;
