using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Domain.Auditing;
using Canamed.Domain.Identity;

namespace Canamed.Application.Identity;

/// <summary>
/// Casos de uso de autenticação e sessão (SPEC-0003): login, segundo fator, logout, troca de senha,
/// troca de clínica ativa e cadastro do segundo fator.
/// </summary>
public sealed class AuthService(
    IIdentityRepository identityRepository,
    IPasswordHasher passwordHasher,
    ITotpService totpService,
    ISecretProtector secretProtector,
    IMfaPolicy mfaPolicy,
    IAuditRepository auditRepository,
    IAuditTrail auditTrail,
    IUnitOfWork unitOfWork,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    /// <summary>F-001 — autentica por e-mail e senha, podendo exigir o segundo fator.</summary>
    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var now = timeProvider.GetUtcNow();
        var email = request.Email?.Trim() ?? string.Empty;

        if (!User.IsValidEmail(email) || string.IsNullOrEmpty(request.Password))
        {
            await RecordLoginFailureAsync(null, email, "credencial inválida", cancellationToken).ConfigureAwait(false);
            throw InvalidCredentials();
        }

        var normalizedEmail = User.NormalizeEmail(email);
        var user = await identityRepository
            .FindUserByEmailAsync(normalizedEmail, cancellationToken)
            .ConfigureAwait(false);

        // RN-005: resposta genérica, sem revelar se o e-mail existe.
        if (user is null || !user.IsActive)
        {
            await RecordLoginFailureAsync(user, normalizedEmail, "credencial inválida", cancellationToken)
                .ConfigureAwait(false);

            throw InvalidCredentials();
        }

        if (user.IsLocked(now))
        {
            await auditTrail.RecordAsync(
                AuditEvent.Record(
                    null,
                    user.Id.ToString(),
                    user.Name,
                    AuditActions.LoginBlocked,
                    AuditResources.Users,
                    user.Id.ToString(),
                    now,
                    "{\"reason\":\"conta bloqueada por tentativas inválidas\"}"),
                cancellationToken).ConfigureAwait(false);

            throw new CanamedException(
                ProblemKind.Unauthenticated,
                "Acesso temporariamente bloqueado",
                "Acesso temporariamente bloqueado por tentativas inválidas. Tente novamente em alguns minutos.",
                "account-locked");
        }

        if (!passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            user.RegisterFailedLogin(now);
            await identityRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            await RecordLoginFailureAsync(user, normalizedEmail, "credencial inválida", cancellationToken)
                .ConfigureAwait(false);

            throw InvalidCredentials();
        }

        user.RegisterSuccessfulLogin(now);

        var memberships = await identityRepository
            .ListMembershipsByUserAsync(user.Id, cancellationToken)
            .ConfigureAwait(false);

        if (memberships.Count is 0)
        {
            await identityRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            throw new CanamedException(
                ProblemKind.Forbidden,
                "Conta sem clínica",
                "Sua conta não está vinculada a nenhuma clínica. Procure o responsável pela clínica.",
                "no-clinic-membership");
        }

        if (user.HasMfaEnabled)
        {
            var challenge = LoginChallenge.Create(user.Id, now);
            identityRepository.AddChallenge(challenge);
            await identityRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            await auditTrail.RecordAsync(
                AuditEvent.Record(
                    null,
                    user.Id.ToString(),
                    user.Name,
                    AuditActions.MfaChallengeIssued,
                    AuditResources.Users,
                    user.Id.ToString(),
                    now),
                cancellationToken).ConfigureAwait(false);

            return new LoginResponse(true, challenge.Id, null, null);
        }

        var session = await CreateSessionAsync(user, memberships, now, cancellationToken).ConfigureAwait(false);

        return new LoginResponse(false, null, session.Token, session.Session);
    }

    /// <summary>F-002 — conclui o login com o código do segundo fator.</summary>
    public async Task<LoginResponse> CompleteMfaLoginAsync(
        MfaLoginRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var now = timeProvider.GetUtcNow();
        var challenge = await identityRepository
            .FindChallengeAsync(request.ChallengeId, cancellationToken)
            .ConfigureAwait(false);

        if (challenge is null || !challenge.IsUsable(now))
        {
            throw MfaInvalid();
        }

        var user = await identityRepository
            .FindUserByIdAsync(challenge.UserId, cancellationToken)
            .ConfigureAwait(false);

        if (user is null || !user.IsActive || user.MfaSecret is null)
        {
            throw MfaInvalid();
        }

        var secret = secretProtector.Unprotect(user.MfaSecret);

        if (!totpService.Verify(secret, request.Code, now))
        {
            challenge.RegisterFailedAttempt(now);
            await identityRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            await auditTrail.RecordAsync(
                AuditEvent.Record(
                    null,
                    user.Id.ToString(),
                    user.Name,
                    AuditActions.MfaFailed,
                    AuditResources.Users,
                    user.Id.ToString(),
                    now),
                cancellationToken).ConfigureAwait(false);

            throw MfaInvalid();
        }

        var memberships = await identityRepository
            .ListMembershipsByUserAsync(user.Id, cancellationToken)
            .ConfigureAwait(false);

        if (memberships.Count is 0)
        {
            throw new CanamedException(
                ProblemKind.Forbidden,
                "Conta sem clínica",
                "Sua conta não está vinculada a nenhuma clínica. Procure o responsável pela clínica.",
                "no-clinic-membership");
        }

        challenge.Consume(now);
        user.RegisterSuccessfulLogin(now);

        var session = await CreateSessionAsync(user, memberships, now, cancellationToken).ConfigureAwait(false);

        return new LoginResponse(false, null, session.Token, session.Session);
    }

    /// <summary>F-004 — revoga a sessão corrente.</summary>
    public async Task LogoutAsync(string? sessionToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            return;
        }

        var now = timeProvider.GetUtcNow();
        var session = await identityRepository
            .FindSessionByTokenHashAsync(SessionTokens.Hash(sessionToken), cancellationToken)
            .ConfigureAwait(false);

        if (session is null || session.RevokedAt is not null)
        {
            return;
        }

        await unitOfWork.ExecuteInTransactionAsync<object?>(
            async token =>
            {
                session.Revoke(now, "logout");
                auditRepository.Add(AuditEvent.Record(
                    session.ClinicId,
                    session.UserId.ToString(),
                    "sessão",
                    AuditActions.Logout,
                    AuditResources.UserSessions,
                    session.Id.ToString(),
                    now));

                await identityRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return null;
            },
            cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Estado da sessão corrente (usuário, clínica ativa, papel e permissões).</summary>
    public async Task<SessionResponse> GetSessionAsync(CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();

        if (actor.SessionId is null)
        {
            // Caminho de conveniência de desenvolvimento (RN-017): não há sessão persistida.
            return new SessionResponse(
                new SessionUserResponse(Guid.Empty, actor.Name, string.Empty),
                actor.ClinicId,
                await identityRepository.FindClinicNameAsync(actor.ClinicId, cancellationToken).ConfigureAwait(false)
                    ?? "Clínica",
                actor.Role ?? "desenvolvimento",
                [.. actor.Permissions],
                actor.ProfessionalId,
                MfaEnabled: false,
                MfaPending: actor.MfaPending,
                [new ClinicSummary(actor.ClinicId, "Clínica de desenvolvimento", actor.Role ?? "desenvolvimento")],
                timeProvider.GetUtcNow().Add(UserSession.AbsoluteLifetime));
        }

        var session = await identityRepository
            .FindSessionByIdAsync(actor.SessionId.Value, cancellationToken)
            .ConfigureAwait(false)
            ?? throw SessionExpired();

        var user = await identityRepository
            .FindUserByIdAsync(session.UserId, cancellationToken)
            .ConfigureAwait(false)
            ?? throw SessionExpired();

        var memberships = await identityRepository
            .ListMembershipsByUserAsync(user.Id, cancellationToken)
            .ConfigureAwait(false);

        return await BuildSessionResponseAsync(user, session, memberships, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>F-006 — troca a clínica ativa da sessão.</summary>
    public async Task<SessionResponse> SwitchClinicAsync(
        SwitchClinicRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var user = await RequirePersistedUserAsync(actor, cancellationToken).ConfigureAwait(false);
        var session = await RequireSessionAsync(actor, cancellationToken).ConfigureAwait(false);

        var memberships = await identityRepository
            .ListMembershipsByUserAsync(user.Id, cancellationToken)
            .ConfigureAwait(false);

        var membership = memberships.FirstOrDefault(item => item.ClinicId == request.ClinicId)
            ?? throw new CanamedException(
                ProblemKind.NotFound,
                "Registro não encontrado",
                "Registro não encontrado.",
                "resource-not-found");

        var previousClinicId = session.ClinicId;
        var now = timeProvider.GetUtcNow();

        await unitOfWork.ExecuteInTransactionAsync<object?>(
            async token =>
            {
                session.SwitchClinic(membership.ClinicId, now);
                auditRepository.Add(AuditEvent.Record(
                    membership.ClinicId,
                    user.Id.ToString(),
                    user.Name,
                    AuditActions.ClinicSwitched,
                    AuditResources.UserSessions,
                    session.Id.ToString(),
                    now,
                    $"{{\"previousClinicId\":\"{previousClinicId}\",\"clinicId\":\"{membership.ClinicId}\"}}"));

                await identityRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return null;
            },
            cancellationToken).ConfigureAwait(false);

        return await BuildSessionResponseAsync(user, session, memberships, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>RN-009 — troca a própria senha e revoga as demais sessões.</summary>
    public async Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var user = await RequirePersistedUserAsync(actor, cancellationToken).ConfigureAwait(false);

        if (!passwordHasher.Verify(request.CurrentPassword ?? string.Empty, user.PasswordHash))
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Senha atual inválida",
                "A senha atual informada não confere.",
                "invalid-current-password");
        }

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

                foreach (var other in sessions.Where(item => item.Id != actor.SessionId && item.RevokedAt is null))
                {
                    other.Revoke(now, "senha alterada");
                }

                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    user.Id.ToString(),
                    user.Name,
                    AuditActions.PasswordChanged,
                    AuditResources.Users,
                    user.Id.ToString(),
                    now));

                await identityRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return null;
            },
            cancellationToken).ConfigureAwait(false);
    }

    /// <summary>F-003 — gera o segredo do segundo fator (ainda não ativo).</summary>
    public async Task<MfaEnrollResponse> EnrollMfaAsync(CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var user = await RequirePersistedUserAsync(actor, cancellationToken).ConfigureAwait(false);

        var secret = totpService.GenerateSecret();

        user.SetMfaSecret(secretProtector.Protect(secret));
        await identityRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return new MfaEnrollResponse(secret, totpService.BuildOtpAuthUri(user.Email, secret));
    }

    /// <summary>F-003 — ativa o segundo fator após validar um código.</summary>
    public async Task<SessionResponse> ActivateMfaAsync(MfaActivateRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var user = await RequirePersistedUserAsync(actor, cancellationToken).ConfigureAwait(false);
        var session = await RequireSessionAsync(actor, cancellationToken).ConfigureAwait(false);

        if (user.MfaSecret is null)
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Segundo fator não iniciado",
                "Solicite o cadastro do segundo fator antes de ativá-lo.",
                "mfa-not-enrolled");
        }

        var now = timeProvider.GetUtcNow();
        var secret = secretProtector.Unprotect(user.MfaSecret);

        if (!totpService.Verify(secret, request.Code, now))
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Código inválido",
                "Código inválido ou expirado. Verifique o relógio do aplicativo autenticador.",
                "mfa-invalid-code");
        }

        await unitOfWork.ExecuteInTransactionAsync<object?>(
            async token =>
            {
                user.EnableMfa(now);
                session.CompleteMfaEnrollment(now);

                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    user.Id.ToString(),
                    user.Name,
                    AuditActions.MfaEnabled,
                    AuditResources.Users,
                    user.Id.ToString(),
                    now));

                await identityRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return null;
            },
            cancellationToken).ConfigureAwait(false);

        var memberships = await identityRepository
            .ListMembershipsByUserAsync(user.Id, cancellationToken)
            .ConfigureAwait(false);

        return await BuildSessionResponseAsync(user, session, memberships, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Desativa o segundo fator, quando o papel não o exige (RN-010).</summary>
    public async Task<SessionResponse> DisableMfaAsync(MfaDisableRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var user = await RequirePersistedUserAsync(actor, cancellationToken).ConfigureAwait(false);
        var session = await RequireSessionAsync(actor, cancellationToken).ConfigureAwait(false);

        if (!passwordHasher.Verify(request.Password ?? string.Empty, user.PasswordHash))
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Senha inválida",
                "A senha informada não confere.",
                "invalid-password");
        }

        var memberships = await identityRepository
            .ListMembershipsByUserAsync(user.Id, cancellationToken)
            .ConfigureAwait(false);

        if (memberships.Any(membership => mfaPolicy.IsRequiredFor(membership.Role)))
        {
            throw new CanamedException(
                ProblemKind.Conflict,
                "Segundo fator obrigatório",
                "O seu papel exige verificação em duas etapas; ela não pode ser desativada.",
                "mfa-required-by-role");
        }

        var now = timeProvider.GetUtcNow();

        await unitOfWork.ExecuteInTransactionAsync<object?>(
            async token =>
            {
                user.DisableMfa(now);
                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    user.Id.ToString(),
                    user.Name,
                    AuditActions.MfaDisabled,
                    AuditResources.Users,
                    user.Id.ToString(),
                    now));

                await identityRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return null;
            },
            cancellationToken).ConfigureAwait(false);

        return await BuildSessionResponseAsync(user, session, memberships, cancellationToken).ConfigureAwait(false);
    }

    private async Task<(string Token, SessionResponse Session)> CreateSessionAsync(
        User user,
        IReadOnlyList<ClinicMembership> memberships,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var active = memberships[0];
        var mfaPending = memberships.Any(membership => mfaPolicy.IsRequiredFor(membership.Role)) && !user.HasMfaEnabled;
        var (token, hash) = SessionTokens.Create();
        var session = UserSession.Create(user.Id, active.ClinicId, hash, mfaPending, now);

        identityRepository.AddSession(session);

        await unitOfWork.ExecuteInTransactionAsync<object?>(
            async transactionToken =>
            {
                auditRepository.Add(AuditEvent.Record(
                    active.ClinicId,
                    user.Id.ToString(),
                    user.Name,
                    AuditActions.LoginSucceeded,
                    AuditResources.UserSessions,
                    session.Id.ToString(),
                    now,
                    $"{{\"role\":\"{active.Role}\"}}"));

                await identityRepository.SaveChangesAsync(transactionToken).ConfigureAwait(false);

                return null;
            },
            cancellationToken).ConfigureAwait(false);

        var response = await BuildSessionResponseAsync(user, session, memberships, cancellationToken)
            .ConfigureAwait(false);

        return (token, response);
    }

    private async Task<SessionResponse> BuildSessionResponseAsync(
        User user,
        UserSession session,
        IReadOnlyList<ClinicMembership> memberships,
        CancellationToken cancellationToken)
    {
        var active = memberships.FirstOrDefault(membership => membership.ClinicId == session.ClinicId)
            ?? memberships[0];

        var clinics = new List<ClinicSummary>(memberships.Count);

        foreach (var membership in memberships)
        {
            var name = await identityRepository
                .FindClinicNameAsync(membership.ClinicId, cancellationToken)
                .ConfigureAwait(false);

            clinics.Add(new ClinicSummary(membership.ClinicId, name ?? "Clínica", membership.Role));
        }

        return new SessionResponse(
            new SessionUserResponse(user.Id, user.Name, user.Email),
            active.ClinicId,
            clinics.FirstOrDefault(clinic => clinic.Id == active.ClinicId)?.Name ?? "Clínica",
            active.Role,
            [.. Roles.PermissionsFor(active.Role)],
            active.ProfessionalId,
            user.HasMfaEnabled,
            session.MfaPending,
            clinics,
            session.ExpiresAt);
    }

    private async Task RecordLoginFailureAsync(
        User? user,
        string email,
        string reason,
        CancellationToken cancellationToken)
    {
        if (user is not null)
        {
            await identityRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        await auditTrail.RecordAsync(
            AuditEvent.Record(
                null,
                user?.Id.ToString() ?? "desconhecido",
                user?.Name ?? "não identificado",
                AuditActions.LoginFailed,
                AuditResources.Users,
                user?.Id.ToString(),
                timeProvider.GetUtcNow(),
                $"{{\"email\":{System.Text.Json.JsonSerializer.Serialize(email)},\"reason\":\"{reason}\",\"attempts\":{user?.FailedLoginAttempts ?? 0}}}"),
            cancellationToken).ConfigureAwait(false);
    }

    private async Task<User> RequirePersistedUserAsync(CurrentActor actor, CancellationToken cancellationToken)
    {
        if (actor.SessionId is null || !Guid.TryParse(actor.UserId, out var userId))
        {
            throw new CanamedException(
                ProblemKind.Forbidden,
                "Operação indisponível",
                "Esta operação exige autenticação com sessão. Entre com e-mail e senha.",
                "session-required");
        }

        return await identityRepository.FindUserByIdAsync(userId, cancellationToken).ConfigureAwait(false)
            ?? throw SessionExpired();
    }

    private async Task<UserSession> RequireSessionAsync(CurrentActor actor, CancellationToken cancellationToken) =>
        actor.SessionId is null
            ? throw new CanamedException(
                ProblemKind.Forbidden,
                "Operação indisponível",
                "Esta operação exige autenticação com sessão. Entre com e-mail e senha.",
                "session-required")
            : await identityRepository.FindSessionByIdAsync(actor.SessionId.Value, cancellationToken)
                .ConfigureAwait(false)
                ?? throw SessionExpired();

    private static CanamedException InvalidCredentials() =>
        new(
            ProblemKind.Unauthenticated,
            "Credenciais inválidas",
            "E-mail ou senha inválidos.",
            "invalid-credentials");

    private static CanamedException MfaInvalid() =>
        new(
            ProblemKind.Unauthenticated,
            "Código inválido",
            "Código inválido ou expirado.",
            "mfa-invalid-code");

    private static CanamedException SessionExpired() =>
        new(
            ProblemKind.Unauthenticated,
            "Sessão expirada",
            "Sua sessão expirou. Entre novamente.",
            "session-expired");
}
