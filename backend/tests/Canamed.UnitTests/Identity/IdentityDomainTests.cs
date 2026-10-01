using Canamed.Application.Identity;
using Canamed.Domain.Identity;

namespace Canamed.UnitTests.Identity;

/// <summary>Regras de identidade testadas sem banco de dados (SPEC-0003, seção 16).</summary>
public sealed class IdentityDomainTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 1, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Create_DeveNormalizarEmail()
    {
        var user = User.Create("Ana", "  ANA@Canamed.Local ", "hash", Now);

        Assert.Equal("ana@canamed.local", user.Email);
    }

    [Fact]
    public void RegisterFailedLogin_DeveBloquearNaQuintaTentativa()
    {
        var user = User.Create("Ana", "ana@canamed.local", "hash", Now);

        for (var attempt = 1; attempt < User.MaxFailedLoginAttempts; attempt++)
        {
            user.RegisterFailedLogin(Now);
            Assert.False(user.IsLocked(Now));
        }

        user.RegisterFailedLogin(Now);

        Assert.True(user.IsLocked(Now));
        Assert.True(user.IsLocked(Now.AddMinutes(14)));
        Assert.False(user.IsLocked(Now.AddMinutes(User.LockDuration.TotalMinutes + 1)));
    }

    [Fact]
    public void RegisterSuccessfulLogin_DeveLimparBloqueioETentativas()
    {
        var user = User.Create("Ana", "ana@canamed.local", "hash", Now);

        for (var attempt = 0; attempt < User.MaxFailedLoginAttempts; attempt++)
        {
            user.RegisterFailedLogin(Now);
        }

        user.RegisterSuccessfulLogin(Now);

        Assert.False(user.IsLocked(Now));
        Assert.Equal(0, user.FailedLoginAttempts);
    }

    [Fact]
    public void EnableMfa_DeveExigirSegredoCadastrado()
    {
        var user = User.Create("Ana", "ana@canamed.local", "hash", Now);

        Assert.Throws<InvalidOperationException>(() => user.EnableMfa(Now));

        user.SetMfaSecret("segredo-protegido");
        user.EnableMfa(Now);

        Assert.True(user.HasMfaEnabled);
    }

    [Fact]
    public void DisableMfa_DeveDescartarOSegredo()
    {
        var user = User.Create("Ana", "ana@canamed.local", "hash", Now);
        user.SetMfaSecret("segredo-protegido");
        user.EnableMfa(Now);

        user.DisableMfa(Now);

        Assert.False(user.HasMfaEnabled);
        Assert.Null(user.MfaSecret);
    }

    [Fact]
    public void Deactivate_DeveMarcarUsuarioComoInativo()
    {
        var user = User.Create("Ana", "ana@canamed.local", "hash", Now);

        user.Deactivate(Now);

        Assert.False(user.IsActive);
    }

    [Fact]
    public void UserSession_DeveExpirarPorInatividade()
    {
        var session = UserSession.Create(Guid.NewGuid(), Guid.NewGuid(), "hash", mfaPending: false, Now);

        Assert.True(session.IsActive(Now.AddMinutes(29)));
        Assert.False(session.IsActive(Now.AddMinutes(31)));
    }

    [Fact]
    public void UserSession_DeveExpirarNoLimiteAbsoluto()
    {
        var session = UserSession.Create(Guid.NewGuid(), Guid.NewGuid(), "hash", mfaPending: false, Now);
        var active = Now.AddMinutes(20);

        session.Touch(active);

        Assert.True(session.IsActive(active));
        Assert.False(session.IsActive(Now.AddHours(9)));
    }

    [Fact]
    public void UserSession_Revogada_NaoDeveSerReutilizada()
    {
        var session = UserSession.Create(Guid.NewGuid(), Guid.NewGuid(), "hash", mfaPending: false, Now);

        session.Revoke(Now, "logout");

        Assert.False(session.IsActive(Now));
        Assert.Equal("logout", session.RevokedReason);
    }

    [Fact]
    public void LoginChallenge_DeveExpirarEAceitarCincoTentativas()
    {
        var challenge = LoginChallenge.Create(Guid.NewGuid(), Now);

        Assert.True(challenge.IsUsable(Now.AddMinutes(4)));
        Assert.False(challenge.IsUsable(Now.AddMinutes(6)));

        for (var attempt = 0; attempt < LoginChallenge.MaxAttempts; attempt++)
        {
            challenge.RegisterFailedAttempt(Now);
        }

        Assert.False(challenge.IsUsable(Now));
    }

    [Fact]
    public void LoginChallenge_Consumido_NaoDeveSerReutilizado()
    {
        var challenge = LoginChallenge.Create(Guid.NewGuid(), Now);

        challenge.Consume(Now);

        Assert.False(challenge.IsUsable(Now));
    }

    [Fact]
    public void Roles_DevemConcederPermissoesCoerentes()
    {
        Assert.Contains(Permissions.UsersManage, Roles.PermissionsFor(Roles.Manager));
        Assert.Contains(Permissions.AgendaWrite, Roles.PermissionsFor(Roles.Receptionist));
        Assert.DoesNotContain(Permissions.UsersManage, Roles.PermissionsFor(Roles.Receptionist));
        Assert.Contains(Permissions.AgendaReadOwn, Roles.PermissionsFor(Roles.Professional));
        Assert.DoesNotContain(Permissions.AgendaWrite, Roles.PermissionsFor(Roles.Professional));
    }

    [Fact]
    public void Roles_DeveExigirMfaApenasDoGestor()
    {
        Assert.True(Roles.RequiresMfa(Roles.Manager));
        Assert.False(Roles.RequiresMfa(Roles.Receptionist));
        Assert.False(Roles.RequiresMfa(Roles.Professional));
        Assert.False(Roles.Exists("papel-inventado"));
    }

    [Fact]
    public void SessionTokens_DeveGerarTokenAleatorioEArmazenarApenasOHash()
    {
        var (firstToken, firstHash) = SessionTokens.Create();
        var (secondToken, secondHash) = SessionTokens.Create();

        Assert.NotEqual(firstToken, secondToken);
        Assert.NotEqual(firstHash, secondHash);
        Assert.Equal(SessionTokens.Hash(firstToken), firstHash);
        Assert.Equal(64, firstHash.Length);
    }
}
