using Canamed.Api.Authorization;
using Canamed.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

/// <summary>Administração de usuários da clínica ativa (F-005 da SPEC-0003), restrita a <c>users:manage</c>.</summary>
public static class UserEndpoints
{
    /// <summary>Mapeia as rotas de usuários.</summary>
    public static RouteGroupBuilder MapUserEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var users = api.MapGroup("/users");

        users.MapGet(string.Empty, ListAsync)
            .WithName("ListUsers")
            .Produces<IReadOnlyList<UserResponse>>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.UsersManage);

        users.MapPost(string.Empty, CreateAsync)
            .WithName("CreateUser")
            .Produces<UserResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.UsersManage);

        users.MapPost("/{id:guid}/password", ResetPasswordAsync)
            .WithName("ResetUserPassword")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequirePermissions(Permissions.UsersManage);

        users.MapPost("/{id:guid}/deactivate", DeactivateAsync)
            .WithName("DeactivateUser")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.UsersManage);

        users.MapPost("/{id:guid}/sessions/revoke", RevokeSessionsAsync)
            .WithName("RevokeUserSessions")
            .Produces(StatusCodes.Status204NoContent)
            .RequirePermissions(Permissions.UsersManage);

        return api;
    }

    private static async Task<IResult> ListAsync(
        UserService userService,
        CancellationToken cancellationToken) =>
        Results.Ok(await userService.ListAsync(cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> CreateAsync(
        UserService userService,
        [FromBody] CreateUserRequest request,
        CancellationToken cancellationToken) =>
        Results.Ok(await userService.CreateAsync(request, cancellationToken).ConfigureAwait(false));

    private static async Task<IResult> ResetPasswordAsync(
        UserService userService,
        Guid id,
        [FromBody] ResetUserPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await userService.ResetPasswordAsync(id, request, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }

    private static async Task<IResult> DeactivateAsync(
        UserService userService,
        Guid id,
        CancellationToken cancellationToken)
    {
        await userService.DeactivateAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }

    private static async Task<IResult> RevokeSessionsAsync(
        UserService userService,
        Guid id,
        CancellationToken cancellationToken)
    {
        await userService.RevokeSessionsAsync(id, cancellationToken).ConfigureAwait(false);

        return Results.NoContent();
    }
}
