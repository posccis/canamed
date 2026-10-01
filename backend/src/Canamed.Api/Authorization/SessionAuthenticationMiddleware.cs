using Canamed.Application.Abstractions;
using Canamed.Application.Identity;
using Canamed.Infrastructure.Identity;
using Microsoft.AspNetCore.Http;

namespace Canamed.Api.Authorization;

/// <summary>
/// Carrega a sessão a partir do cookie <c>httpOnly</c>, publica o ator corrente para o restante do
/// pipeline e aplica a expiração deslizante (RN-007). Cookie inválido, expirado ou revogado é
/// descartado e a requisição segue sem identidade (a rota decide entre 401 e acesso público).
/// </summary>
public sealed class SessionAuthenticationMiddleware(RequestDelegate next)
{
    /// <summary>Nome do cookie de sessão.</summary>
    public const string CookieName = "canamed_session";

    /// <summary>Intervalo mínimo entre atualizações de atividade, evitando escrita a cada requisição.</summary>
    public static TimeSpan TouchInterval => TimeSpan.FromMinutes(1);

    public async Task InvokeAsync(
        HttpContext context,
        IIdentityRepository identityRepository,
        TimeProvider timeProvider)
    {
        ArgumentNullException.ThrowIfNull(context);

        var token = context.Request.Cookies[CookieName];

        if (!string.IsNullOrWhiteSpace(token))
        {
            await ResolveSessionAsync(context, token, identityRepository, timeProvider).ConfigureAwait(false);
        }

        await next(context).ConfigureAwait(false);
    }

    private static async Task ResolveSessionAsync(
        HttpContext context,
        string token,
        IIdentityRepository identityRepository,
        TimeProvider timeProvider)
    {
        var now = timeProvider.GetUtcNow();
        var session = await identityRepository
            .FindSessionByTokenHashAsync(SessionTokens.Hash(token), context.RequestAborted)
            .ConfigureAwait(false);

        if (session is null || !session.IsActive(now))
        {
            ClearCookie(context);

            return;
        }

        var user = await identityRepository
            .FindUserByIdAsync(session.UserId, context.RequestAborted)
            .ConfigureAwait(false);

        if (user is null || !user.IsActive)
        {
            ClearCookie(context);

            return;
        }

        var membership = await identityRepository
            .FindMembershipAsync(session.UserId, session.ClinicId, context.RequestAborted)
            .ConfigureAwait(false);

        if (membership is null)
        {
            ClearCookie(context);

            return;
        }

        context.Items[CurrentActorAccessor.ActorItemKey] = new CurrentActor(
            user.Id.ToString(),
            user.Name,
            membership.ClinicId,
            Roles.PermissionsFor(membership.Role),
            membership.ProfessionalId,
            membership.Role,
            session.Id,
            session.MfaPending);

        if (now - session.LastSeenAt > TouchInterval)
        {
            session.Touch(now);
            await identityRepository.SaveChangesAsync(context.RequestAborted).ConfigureAwait(false);
        }
    }

    private static void ClearCookie(HttpContext context) =>
        context.Response.Cookies.Delete(CookieName, SessionCookies.BuildOptions(context));
}

/// <summary>Configuração do cookie de sessão (RN-007).</summary>
public static class SessionCookies
{
    /// <summary>Opções do cookie, coerentes com a sessão em `httpOnly` e proteção CSRF.</summary>
    public static CookieOptions BuildOptions(HttpContext context) =>
        new()
        {
            HttpOnly = true,
            Secure = context.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            IsEssential = true,
        };

    /// <summary>Grava o cookie com a expiração absoluta da sessão.</summary>
    public static void Write(HttpContext context, string token, DateTimeOffset expiresAt)
    {
        ArgumentNullException.ThrowIfNull(context);

        var options = BuildOptions(context);
        options.Expires = expiresAt;

        context.Response.Cookies.Append(SessionAuthenticationMiddleware.CookieName, token, options);
    }

    /// <summary>Remove o cookie de sessão.</summary>
    public static void Clear(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        context.Response.Cookies.Delete(SessionAuthenticationMiddleware.CookieName, BuildOptions(context));
    }
}
