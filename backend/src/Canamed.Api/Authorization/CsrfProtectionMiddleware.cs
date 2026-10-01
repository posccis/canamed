using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Authorization;

/// <summary>
/// Proteção CSRF para sessão em cookie (RN-016): métodos que alteram estado exigem o cabeçalho
/// <c>X-Canamed-Requested-With</c> — que um formulário HTML de outro site não consegue definir — e,
/// quando o navegador envia <c>Origin</c>, ele precisa constar entre as origens permitidas.
/// </summary>
public sealed class CsrfProtectionMiddleware(RequestDelegate next, IConfiguration configuration)
{
    /// <summary>Cabeçalho exigido nas requisições que alteram estado.</summary>
    public const string RequiredHeader = "X-Canamed-Requested-With";

    /// <summary>Valor esperado do cabeçalho.</summary>
    public const string RequiredValue = "canamed-spa";

    private readonly string[] allowedOrigins = (configuration["Canamed:Cors:AllowedOrigins"]
            ?? "http://localhost:5173")
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    public async Task InvokeAsync(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        if (RequiresProtection(context) && !IsRequestTrusted(context))
        {
            await WriteRejectionAsync(context).ConfigureAwait(false);

            return;
        }

        await next(context).ConfigureAwait(false);
    }

    private static bool RequiresProtection(HttpContext context) =>
        context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase)
        && !HttpMethods.IsGet(context.Request.Method)
        && !HttpMethods.IsHead(context.Request.Method)
        && !HttpMethods.IsOptions(context.Request.Method)
        && !HttpMethods.IsTrace(context.Request.Method);

    private bool IsRequestTrusted(HttpContext context)
    {
        var requestedWith = context.Request.Headers[RequiredHeader].ToString();

        if (!string.Equals(requestedWith, RequiredValue, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var origin = context.Request.Headers.Origin.ToString();

        // Requisições de ferramentas (sem Origin) são aceitas; navegadores sempre enviam Origin em
        // requisições com método não seguro entre origens.
        return string.IsNullOrWhiteSpace(origin)
            || allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
    }

    private static async Task WriteRejectionAsync(HttpContext context)
    {
        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Requisição inválida",
            Detail = "Requisição rejeitada pela proteção contra CSRF.",
            Type = Errors.ProblemTypeUri.From("csrf-validation-failed"),
        };

        problem.Extensions.TryAdd("traceId", context.TraceIdentifier);

        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsJsonAsync(problem, context.RequestAborted).ConfigureAwait(false);
    }
}
