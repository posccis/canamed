using Canamed.Api.Authorization;
using Canamed.Application.Identity;
using Canamed.Application.Privacy;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class PrivacyEndpoints
{
    public static RouteGroupBuilder MapPrivacyEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var group = api.MapGroup("/privacy");

        group.MapPost("/requests", OpenRequestAsync)
            .WithName("OpenPrivacyRequest")
            .Produces<PrivacyRequestResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .AllowAnonymous();

        group.MapGet("/requests/protocol/{protocol}", GetByProtocolAsync)
            .WithName("GetPrivacyRequestByProtocol")
            .Produces<PrivacyRequestResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AllowAnonymous();

        group.MapGet("/my-data", ExportMyDataAsync)
            .WithName("ExportMyPrivacyData")
            .Produces<PatientDataExportDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .AllowAnonymous();

        group.MapGet("/consents", GetMyConsentsAsync)
            .WithName("GetMyPrivacyConsents")
            .Produces<IReadOnlyList<ConsentItemDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .AllowAnonymous();

        group.MapPost("/consents", UpdateConsentAsync)
            .WithName("UpdatePrivacyConsent")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .AllowAnonymous();

        group.MapGet("/clinic/{clinicId:guid}/requests", ListClinicRequestsAsync)
            .WithName("ListClinicPrivacyRequests")
            .Produces<IReadOnlyList<PrivacyRequestResponse>>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.PrivacyManage);

        group.MapPost("/requests/{requestId:guid}/respond", DpoRespondAsync)
            .WithName("DpoRespondPrivacyRequest")
            .Produces<PrivacyRequestResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.PrivacyManage);

        return api;
    }

    private static async Task<IResult> OpenRequestAsync(
        PrivacyService privacyService,
        [FromBody] CreatePrivacyRequestInput input,
        [FromHeader(Name = "X-Patient-Token")] string? sessionToken,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            return Results.Unauthorized();
        }

        try
        {
            var result = await privacyService.OpenPrivacyRequestAsync(sessionToken, input, timeProvider.GetUtcNow(), cancellationToken);
            return Results.Created($"/api/v1/privacy/requests/protocol/{result.Protocol}", result);
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    }

    private static async Task<IResult> GetByProtocolAsync(
        PrivacyService privacyService,
        string protocol,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await privacyService.GetRequestByProtocolAsync(protocol, cancellationToken);
            return Results.Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return Results.NotFound(new { message = "Protocolo não encontrado." });
        }
    }

    private static async Task<IResult> ExportMyDataAsync(
        PrivacyService privacyService,
        [FromHeader(Name = "X-Patient-Token")] string? sessionToken,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            return Results.Unauthorized();
        }

        try
        {
            var data = await privacyService.ExportMyDataAsync(sessionToken, timeProvider.GetUtcNow(), cancellationToken);
            return Results.Ok(data);
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
    }

    private static async Task<IResult> GetMyConsentsAsync(
        PrivacyService privacyService,
        [FromHeader(Name = "X-Patient-Token")] string? sessionToken,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            return Results.Unauthorized();
        }

        try
        {
            var consents = await privacyService.GetMyConsentsAsync(sessionToken, timeProvider.GetUtcNow(), cancellationToken);
            return Results.Ok(consents);
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
    }

    private static async Task<IResult> UpdateConsentAsync(
        PrivacyService privacyService,
        [FromBody] UpdateConsentInput input,
        [FromHeader(Name = "X-Patient-Token")] string? sessionToken,
        HttpContext httpContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            return Results.Unauthorized();
        }

        try
        {
            var ip = httpContext.Connection.RemoteIpAddress?.ToString();
            await privacyService.UpdateConsentAsync(sessionToken, input, ip, timeProvider.GetUtcNow(), cancellationToken);
            return Results.Ok(new { message = "Consentimento atualizado com sucesso." });
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
    }

    private static async Task<IResult> ListClinicRequestsAsync(
        PrivacyService privacyService,
        Guid clinicId,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var list = await privacyService.ListRequestsForClinicAsync(clinicId, status, cancellationToken);
        return Results.Ok(list);
    }

    private static async Task<IResult> DpoRespondAsync(
        PrivacyService privacyService,
        Guid requestId,
        [FromBody] DpoRespondPrivacyRequestInput input,
        ICurrentActorAccessor actorAccessor,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        Guid.TryParse(actor.UserId, out var dpoUserId);

        try
        {
            var result = await privacyService.DpoRespondRequestAsync(requestId, input, dpoUserId, timeProvider.GetUtcNow(), cancellationToken);
            return Results.Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return Results.NotFound(new { message = "Solicitação não encontrada." });
        }
    }
}
