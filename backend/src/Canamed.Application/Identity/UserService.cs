using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Domain.Auditing;
using Canamed.Domain.Identity;

namespace Canamed.Application.Identity;

/// <summary>
/// Administração de usuários da clínica ativa (F-005), restrita ao gestor pela permissão
/// <c>users:manage</c>. Toda operação é limitada ao <c>clinic_id</c> da sessão (ADR-0008).
/// </summary>
public sealed class UserService(
    IIdentityRepository identityRepository,
    IAgendaRepository agendaRepository,
    IPasswordHasher passwordHasher,
    IAuditRepository auditRepository,
    IAuditTrail auditTrail,
    IUnitOfWork unitOfWork,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    /// <summary>Lista os usuários vinculados à clínica ativa.</summary>
    public async Task<IReadOnlyList<UserResponse>> ListAsync(CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();

        var memberships = await identityRepository
            .ListMembershipsByClinicAsync(actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        if (memberships.Count is 0)
        {
            return [];
        }

        var userIds = memberships.Select(static membership => membership.UserId).Distinct().ToArray();

        var users = await identityRepository
            .ListUsersByIdsAsync(userIds, cancellationToken)
            .ConfigureAwait(false);

        var sessions = await identityRepository
            .ListSessionsByUsersAsync(userIds, cancellationToken)
            .ConfigureAwait(false);

        var now = timeProvider.GetUtcNow();
        var usersById = users.ToDictionary(static user => user.Id);

        return
        [
            .. memberships
                .Where(membership => usersById.ContainsKey(membership.UserId))
                .Select(membership =>
                {
                    var user = usersById[membership.UserId];
                    var activeSessions = sessions.Count(session =>
                        session.UserId == user.Id && session.IsActive(now));

                    return Map(user, membership, activeSessions);
                }),
        ];
    }

    /// <summary>Cria um usuário e o vincula à clínica ativa.</summary>
    public async Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var name = RequireName(request.Name);

        if (!User.IsValidEmail(request.Email ?? string.Empty))
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "E-mail inválido",
                "Informe um e-mail válido.",
                "invalid-email");
        }

        var email = User.NormalizeEmail(request.Email!);

        if (!Roles.Exists(request.Role))
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Papel inválido",
                $"Papéis aceitos: {string.Join(", ", Roles.All)}.",
                "invalid-role");
        }

        var professionalId = await ValidateProfessionalLinkAsync(actor.ClinicId, request.Role, request.ProfessionalId, cancellationToken)
            .ConfigureAwait(false);

        PasswordPolicy.Validate(request.Password, email, name);

        if (await identityRepository.EmailExistsAsync(email, cancellationToken).ConfigureAwait(false))
        {
            throw new CanamedException(
                ProblemKind.Conflict,
                "E-mail já cadastrado",
                "Já existe um usuário com este e-mail.",
                "email-already-registered");
        }

        var now = timeProvider.GetUtcNow();
        var user = User.Create(name, email, passwordHasher.Hash(request.Password), now);
        var membership = ClinicMembership.Create(user.Id, actor.ClinicId, request.Role, professionalId, now);

        identityRepository.AddUser(user);
        identityRepository.AddMembership(membership);

        await unitOfWork.ExecuteInTransactionAsync<object?>(
            async token =>
            {
                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.UserCreated,
                    AuditResources.Users,
                    user.Id.ToString(),
                    now,
                    $"{{\"role\":\"{membership.Role}\"}}"));

                await identityRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return null;
            },
            cancellationToken).ConfigureAwait(false);

        return Map(user, membership, activeSessions: 0);
    }

    /// <summary>Redefine a senha de um usuário da clínica e revoga as sessões dele.</summary>
    public async Task ResetPasswordAsync(
        Guid userId,
        ResetUserPasswordRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var (user, membership) = await RequireMemberAsync(actor, userId, cancellationToken).ConfigureAwait(false);

        PasswordPolicy.Validate(request.NewPassword, user.Email, user.Name);

        var now = timeProvider.GetUtcNow();
        var newHash = passwordHasher.Hash(request.NewPassword);

        await unitOfWork.ExecuteInTransactionAsync<object?>(
            async token =>
            {
                user.ChangePassword(newHash, now);

                var sessions = await identityRepository
                    .ListSessionsByUsersAsync([user.Id], token)
                    .ConfigureAwait(false);

                var revoked = 0;

                foreach (var session in sessions.Where(item => item.RevokedAt is null))
                {
                    session.Revoke(now, "senha redefinida pelo gestor");
                    revoked++;
                }

                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.UserPasswordReset,
                    AuditResources.Users,
                    user.Id.ToString(),
                    now,
                    $"{{\"role\":\"{membership.Role}\",\"revokedSessions\":{revoked}}}"));

                await identityRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return null;
            },
            cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Desativa um usuário da clínica e revoga as sessões dele (RN-013).</summary>
    public async Task DeactivateAsync(Guid userId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();

        if (Guid.TryParse(actor.UserId, out var actorId) && actorId == userId)
        {
            throw new CanamedException(
                ProblemKind.Conflict,
                "Operação não permitida",
                "Você não pode desativar o seu próprio usuário.",
                "self-deactivation");
        }

        var (user, membership) = await RequireMemberAsync(actor, userId, cancellationToken).ConfigureAwait(false);
        var now = timeProvider.GetUtcNow();

        await unitOfWork.ExecuteInTransactionAsync<object?>(
            async token =>
            {
                user.Deactivate(now);

                var sessions = await identityRepository
                    .ListSessionsByUsersAsync([user.Id], token)
                    .ConfigureAwait(false);

                foreach (var session in sessions.Where(item => item.RevokedAt is null))
                {
                    session.Revoke(now, "usuário desativado");
                }

                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.UserDeactivated,
                    AuditResources.Users,
                    user.Id.ToString(),
                    now,
                    $"{{\"role\":\"{membership.Role}\"}}"));

                await identityRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return null;
            },
            cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Revoga todas as sessões de um usuário da clínica (F-004).</summary>
    public async Task RevokeSessionsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var (user, _) = await RequireMemberAsync(actor, userId, cancellationToken).ConfigureAwait(false);
        var now = timeProvider.GetUtcNow();

        await unitOfWork.ExecuteInTransactionAsync<object?>(
            async token =>
            {
                var sessions = await identityRepository
                    .ListSessionsByUsersAsync([user.Id], token)
                    .ConfigureAwait(false);

                var revoked = 0;

                foreach (var session in sessions.Where(item => item.RevokedAt is null))
                {
                    session.Revoke(now, "revogação solicitada pelo gestor");
                    revoked++;
                }

                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.UserSessionsRevoked,
                    AuditResources.UserSessions,
                    user.Id.ToString(),
                    now,
                    $"{{\"revokedSessions\":{revoked}}}"));

                await identityRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return null;
            },
            cancellationToken).ConfigureAwait(false);
    }

    private async Task<(User User, ClinicMembership Membership)> RequireMemberAsync(
        CurrentActor actor,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var membership = await identityRepository
            .FindMembershipAsync(userId, actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        if (membership is null)
        {
            // ER-010: usuário de outra clínica responde 404 e a tentativa fica registrada.
            await auditTrail.RecordAsync(
                AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.ClinicAccessDenied,
                    AuditResources.Users,
                    userId.ToString(),
                    timeProvider.GetUtcNow(),
                    "{\"reason\":\"usuário fora do escopo da clínica\"}"),
                cancellationToken).ConfigureAwait(false);

            throw new CanamedException(
                ProblemKind.NotFound,
                "Registro não encontrado",
                "Registro não encontrado.",
                "resource-not-found");
        }

        var user = await identityRepository
            .FindUserByIdAsync(userId, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new CanamedException(
                ProblemKind.NotFound,
                "Registro não encontrado",
                "Registro não encontrado.",
                "resource-not-found");

        return (user, membership);
    }

    private async Task<Guid?> ValidateProfessionalLinkAsync(
        Guid clinicId,
        string role,
        Guid? professionalId,
        CancellationToken cancellationToken)
    {
        if (professionalId is null)
        {
            return null;
        }

        if (!string.Equals(role, Roles.Professional, StringComparison.Ordinal))
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Vínculo não permitido",
                "Somente usuários com o papel de profissional podem ser vinculados a um profissional da agenda.",
                "professional-link-not-allowed");
        }

        if (!await agendaRepository.ProfessionalExistsAsync(clinicId, professionalId.Value, cancellationToken)
                .ConfigureAwait(false))
        {
            throw new CanamedException(
                ProblemKind.NotFound,
                "Registro não encontrado",
                "Registro não encontrado.",
                "resource-not-found");
        }

        return professionalId;
    }

    private static UserResponse Map(User user, ClinicMembership membership, int activeSessions) =>
        new(
            user.Id,
            user.Name,
            user.Email,
            membership.Role,
            membership.ProfessionalId,
            user.IsActive,
            user.HasMfaEnabled,
            activeSessions);

    private static string RequireName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Nome obrigatório",
                "Informe o nome do usuário.",
                "name-required");
        }

        return name.Trim();
    }
}
