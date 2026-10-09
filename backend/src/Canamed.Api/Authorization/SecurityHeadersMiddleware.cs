namespace Canamed.Api.Authorization;

/// <summary>Cabeçalhos de segurança mínimos para respostas da API (SPEC-0003, seção 13).</summary>
public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            headers["X-Content-Type-Options"] = "nosniff";
            headers["Referrer-Policy"] = "no-referrer";
            headers["X-Frame-Options"] = "DENY";
            headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";

            // Rotas públicas com dado pessoal não devem ser indexadas nem armazenadas em cache
            // (SPEC-0026/13 — CA-013). O índice é por prefixo da superfície do paciente.
            var path = context.Request.Path;
            if (path.StartsWithSegments("/p") || path.StartsWithSegments("/api/v1/public"))
            {
                headers["X-Robots-Tag"] = "noindex, nofollow";
                headers["Cache-Control"] = "no-store";
            }

            return Task.CompletedTask;
        });

        await next(context).ConfigureAwait(false);
    }
}
