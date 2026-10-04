using Canamed.Api.Authorization;
using Canamed.Application.Identity;
using Canamed.Application.Portal;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Canamed.Api.Endpoints;

/// <summary>
/// Superfície pública do paciente (`/p`) e emissão de links pela recepção (SPEC-0026).
/// Nenhuma rota devolve dado clínico e nenhuma aceita dado sensível na URL (RN-006).
/// </summary>
public static class PublicPortalEndpoints
{
    /// <summary>Política de limitação de requisições das rotas públicas (SPEC-0026/13).</summary>
    public const string PublicRateLimitPolicy = "public-surface";

    public static RouteGroupBuilder MapPublicPortalEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var group = api.MapGroup("/public").RequireRateLimiting(PublicRateLimitPolicy);

        group.MapGet("/clinics/{slug}/meta", GetClinicBySlugAsync)
            .WithName("PublicGetClinicMetaBySlug")
            .Produces<PublicClinicMetaResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AllowAnonymous();

        group.MapGet("/capabilities/{token}", ResolveCapabilityAsync)
            .WithName("PublicResolveCapability")
            .Produces<CapabilityResolutionResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AllowAnonymous();

        group.MapPost("/capabilities/{token}/confirm", ConfirmAsync)
            .WithName("PublicConfirmByLink")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AllowAnonymous();

        group.MapPost("/capabilities/{token}/cancel", CancelAsync)
            .WithName("PublicCancelByLink")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AllowAnonymous();

        group.MapGet("/capabilities/{token}/queue", GetQueueStatusAsync)
            .WithName("PublicGetQueueByLink")
            .Produces<CapabilityQueueStatusResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AllowAnonymous();

        group.MapPost("/check-in/{token}", CheckInAsync)
            .WithName("PublicCheckInByLink")
            .Produces<CapabilityCheckInResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AllowAnonymous();

        // Emissão de link pela recepção/gestão: exige sessão e permissão de agenda (RN-018).
        group.MapPost("/links", IssueLinkAsync)
            .WithName("PublicIssueCapabilityLink")
            .Produces<IssueCapabilityLinkResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .RequirePermissions(Permissions.AgendaWrite, Permissions.ClinicManage);

        return api;
    }

    private static async Task<IResult> GetClinicBySlugAsync(
        PublicPortalService service,
        string slug,
        CancellationToken cancellationToken)
        => Results.Ok(await service.GetClinicBySlugAsync(slug, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> ResolveCapabilityAsync(
        PublicPortalService service,
        string token,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
        => Results.Ok(await service.ResolveAsync(token, timeProvider.GetUtcNow(), cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> ConfirmAsync(
        PublicPortalService service,
        string token,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        await service.ConfirmAsync(token, timeProvider.GetUtcNow(), cancellationToken).ConfigureAwait(false);
        return Results.Ok(new { message = "Presença confirmada. Obrigado!" });
    }

    private static async Task<IResult> CancelAsync(
        PublicPortalService service,
        string token,
        [FromBody] CancelCapabilityPayload? payload,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        await service
            .CancelAsync(token, payload?.Reason, payload?.Answer, timeProvider.GetUtcNow(), cancellationToken)
            .ConfigureAwait(false);
        return Results.Ok(new { message = "Consulta cancelada." });
    }

    private static async Task<IResult> GetQueueStatusAsync(
        PublicPortalService service,
        string token,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
        => Results.Ok(await service.GetQueueStatusAsync(token, timeProvider.GetUtcNow(), cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> CheckInAsync(
        PublicPortalService service,
        string token,
        [FromBody] PublicCheckInPayload? payload,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var result = await service
            .CheckInAsync(token, payload?.IsPreferential ?? false, timeProvider.GetUtcNow(), cancellationToken)
            .ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> IssueLinkAsync(
        PublicPortalService service,
        [FromBody] IssueCapabilityLinkRequest request,
        TimeProvider timeProvider,
        ICurrentActorAccessor actorAccessor,
        CancellationToken cancellationToken)
    {
        if (!actorAccessor.TryGetActor(out var actor))
        {
            return Results.Unauthorized();
        }

        var withAuthor = request with { CreatedBy = actor.UserId };
        var result = await service
            .IssueLinkAsync(actor.ClinicId, withAuthor, timeProvider.GetUtcNow(), cancellationToken)
            .ConfigureAwait(false);

        return Results.Created(result.Path, result);
    }
}

public sealed record CancelCapabilityPayload(string? Reason, string? Answer);

public sealed record PublicCheckInPayload(bool IsPreferential);
