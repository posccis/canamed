using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Identity;
using Canamed.Domain.Auditing;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Authorization;

/// <summary>
/// Verificação de permissões no backend, por rota (ADR-0008). A interface nunca é a única barreira:
/// toda rota declara as permissões aceitas e o acesso negado é auditado.
/// </summary>
public sealed class PermissionFilter(string[] acceptedPermissions) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(next);

        var services = context.HttpContext.RequestServices;
        var accessor = services.GetRequiredService<ICurrentActorAccessor>();

        if (!accessor.TryGetActor(out var actor))
        {
            return Problem(
                StatusCodes.Status401Unauthorized,
                "Autenticação necessária",
                "Sua sessão expirou ou você ainda não entrou. Autentique-se para continuar.",
                "authentication-required");
        }

        if (!actor.HasAny(acceptedPermissions))
        {
            await RecordDeniedAccessAsync(services, actor).ConfigureAwait(false);

            return Problem(
                StatusCodes.Status403Forbidden,
                "Acesso negado",
                "Você não tem permissão para executar esta operação.",
                "permission-denied");
        }

        // RN-011 da SPEC-0003: perfil que exige segundo fator só opera após concluir o cadastro.
        if (actor.MfaPending)
        {
            return Problem(
                StatusCodes.Status403Forbidden,
                "Verificação em duas etapas pendente",
                "Ative a verificação em duas etapas para continuar.",
                "mfa-enrollment-required");
        }

        return await next(context).ConfigureAwait(false);
    }

    private static async Task RecordDeniedAccessAsync(IServiceProvider services, CurrentActor actor)
    {
        var auditTrail = services.GetRequiredService<IAuditTrail>();
        var timeProvider = services.GetRequiredService<TimeProvider>();

        await auditTrail.RecordAsync(AuditEvent.Record(
            actor.ClinicId,
            actor.UserId,
            actor.Name,
            AuditActions.ClinicAccessDenied,
            AuditResources.Authorization,
            null,
            timeProvider.GetUtcNow(),
            "{\"reason\":\"permissão insuficiente\"}"), CancellationToken.None).ConfigureAwait(false);
    }

    private static IResult Problem(int status, string title, string detail, string problemType) =>
        Results.Problem(
            statusCode: status,
            title: title,
            detail: detail,
            type: Errors.ProblemTypeUri.From(problemType));
}

/// <summary>Extensões para declarar permissões exigidas por rota.</summary>
public static class PermissionFilterExtensions
{
    /// <summary>Exige que o usuário possua ao menos uma das permissões informadas.</summary>
    public static RouteHandlerBuilder RequirePermissions(this RouteHandlerBuilder builder, params string[] permissions)
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentNullException.ThrowIfNull(permissions);

        return builder.AddEndpointFilter(new PermissionFilter(permissions));
    }
}
