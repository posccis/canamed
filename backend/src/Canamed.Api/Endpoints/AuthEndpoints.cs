using Canamed.Api.Authorization;
using Canamed.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

/// <summary>
/// Rotas de autenticação e sessão (seção 8 da SPEC-0003). As rotas públicas de login são limitadas
/// por taxa de requisições; as demais exigem sessão válida.
/// </summary>
public static class AuthEndpoints
{
    /// <summary>Nome da política de limitação de requisições do login.</summary>
    public const string LoginRateLimitPolicy = "auth-login";

    /// <summary>Mapeia as rotas de autenticação.</summary>
    public static RouteGroupBuilder MapAuthEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var auth = api.MapGroup("/auth");

        auth.MapPost("/login", LoginAsync)
            .WithName("Login")
            .Produces<LoginResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .RequireRateLimiting(LoginRateLimitPolicy);

        auth.MapPost("/login/mfa", CompleteMfaLoginAsync)
            .WithName("LoginWithMfa")
            .Produces<LoginResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .RequireRateLimiting(LoginRateLimitPolicy);

        auth.MapPost("/logout", LogoutAsync)
            .WithName("Logout")
            .Produces(StatusCodes.Status204NoContent);

        auth.MapGet("/session", GetSessionAsync)
            .WithName("GetSession")
            .Produces<SessionResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        auth.MapPost("/clinic", SwitchClinicAsync)
            .WithName("SwitchClinic")
            .Produces<SessionResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        auth.MapPost("/password", ChangePasswordAsync)
            .WithName("ChangePassword")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        auth.MapPost("/mfa/enroll", EnrollMfaAsync)
            .WithName("EnrollMfa")
            .Produces<MfaEnrollResponse>(StatusCodes.Status200OK);

        auth.MapPost("/mfa/activate", ActivateMfaAsync)
            .WithName("ActivateMfa")
            .Produces<SessionResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        auth.MapPost("/mfa/disable", DisableMfaAsync)
            .WithName("DisableMfa")
            .Produces<SessionResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict);

        return api;
    }

    private static async Task<IResult> LoginAsync(
        AuthService authService,
        HttpContext httpContext,
        TimeProvider timeProvider,
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var response = await authService.LoginAsync(request, cancellationToken).ConfigureAwait(false);

        return CompleteLogin(httpContext, response, timeProvider);
    }

    private static async Task<IResult> CompleteMfaLoginAsync(
        AuthService authService,
        HttpContext httpContext,
        TimeProvider timeProvider,
        [FromBody] MfaLoginRequest request,
        CancellationToken cancellationToken)
    {
        var response = await authService.CompleteMfaLoginAsync(request, cancellationToken).ConfigureAwait(false);

        return CompleteLogin(httpContext, response, timeProvider);
    }

    private static IResult CompleteLogin(HttpContext httpContext, LoginResponse response, TimeProvider timeProvider)
    {
        if (response.SessionToken is not null && response.Session is not null)
        {
            SessionCookies.Write(httpContext, response.SessionToken, response.Session.ExpiresAt, timeProvider);
        }

        return Results.Ok(response);
    }

    private static async Task<IResult> LogoutAsync(
        AuthService authService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var token = httpContext.Request.Cookies[SessionAuthenticationMiddleware.CookieName];

        await authService.LogoutAsync(token, cancellationToken).ConfigureAwait(false);
        SessionCookies.Clear(httpContext);

        return Results.NoContent();
    }

    private static async Task<IResult> GetSessionAsync(
        AuthService authService,
        CancellationToken cancellationToken) =>
        Results.Ok(await authService.GetSessionAsync(cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> SwitchClinicAsync(
        AuthService authService,
        [FromBody] SwitchClinicRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await authService.SwitchClinicAsync(request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> ChangePasswordAsync(
        AuthService authService,
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        await authService.ChangePasswordAsync(request, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }

    private static async Task<IResult> EnrollMfaAsync(
        AuthService authService,
        CancellationToken cancellationToken) =>
        Results.Ok(await authService.EnrollMfaAsync(cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> ActivateMfaAsync(
        AuthService authService,
        [FromBody] MfaActivateRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await authService.ActivateMfaAsync(request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> DisableMfaAsync(
        AuthService authService,
        [FromBody] MfaDisableRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await authService.DisableMfaAsync(request, cancellationToken).ConfigureAwait(false));
}
