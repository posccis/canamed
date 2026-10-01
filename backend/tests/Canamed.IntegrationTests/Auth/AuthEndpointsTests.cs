using System.Net;
using Canamed.Application.Agenda;
using Canamed.Application.Identity;
using Canamed.IntegrationTests.Agenda;

namespace Canamed.IntegrationTests.Auth;

/// <summary>
/// Critérios de aceitação CA-001 a CA-012 da SPEC-0003, verificados contra a API e o banco de testes.
/// </summary>
[Collection(CanamedCollection.Name)]
public sealed class AuthEndpointsTests(CanamedApiFactory factory) : AuthTestBase(factory)
{
    [Fact]
    public async Task CA001_Login_DeveCriarSessaoComPapelEClinicaAtiva()
    {
        var user = Factory.SeedUser(Roles.Receptionist);

        var (client, login) = await SignInAsync(user.Email, user.Password);

        Assert.False(login.MfaRequired);
        Assert.NotNull(login.Session);
        Assert.Equal("recepcionista", login.Session.Role);
        Assert.Equal(CanamedApiFactory.ClinicAId, login.Session.ClinicId);
        Assert.Contains(Permissions.AgendaWrite, login.Session.Permissions);
        Assert.DoesNotContain(Permissions.UsersManage, login.Session.Permissions);

        var session = await ReadAsync<SessionResponse>(
            await client.GetAsync(new Uri("/api/v1/auth/session", UriKind.Relative)));

        Assert.Equal(user.Email, session.User.Email);
        Assert.False(session.MfaPending);
    }

    [Fact]
    public async Task CA002_CredencialInvalida_DeveResponderGenericoEAuditar()
    {
        var user = Factory.SeedUser(Roles.Receptionist);
        using var client = CreateClient();

        var wrongPassword = await PostAsync(client, "/api/v1/auth/login", new { email = user.Email, password = "senha-errada-123456" });
        var unknownEmail = await PostAsync(client, "/api/v1/auth/login", new { email = "nao-existe@canamed.local", password = "senha-errada-123456" });

        Assert.Equal(HttpStatusCode.Unauthorized, wrongPassword.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknownEmail.StatusCode);
        Assert.Equal("https://canamed.local/problems/invalid-credentials", await ReadProblemTypeAsync(wrongPassword));
        Assert.Equal("https://canamed.local/problems/invalid-credentials", await ReadProblemTypeAsync(unknownEmail));

        var failed = await ReadProblemTypeAsync(wrongPassword);
        var unknown = await ReadProblemTypeAsync(unknownEmail);

        // Mensagem idêntica nos dois casos: não há indicação de que o e-mail existe (RN-005).
        Assert.Equal(failed, unknown);
        Assert.Contains("auth.login_failed", await ReadAuditActionsAsync(user.Id.ToString()));
    }

    [Fact]
    public async Task CA003_CincoTentativas_DevemBloquearAConta()
    {
        var user = Factory.SeedUser(Roles.Receptionist);
        using var client = CreateClient();

        for (var attempt = 0; attempt < 5; attempt++)
        {
            var failed = await PostAsync(client, "/api/v1/auth/login", new { email = user.Email, password = "senha-errada-123456" });
            Assert.Equal(HttpStatusCode.Unauthorized, failed.StatusCode);
        }

        var blocked = await PostAsync(client, "/api/v1/auth/login", new { email = user.Email, password = user.Password });

        Assert.Equal(HttpStatusCode.Unauthorized, blocked.StatusCode);
        Assert.Equal("https://canamed.local/problems/account-locked", await ReadProblemTypeAsync(blocked));
        Assert.Contains("auth.login_blocked", await ReadAuditActionsAsync(user.Id.ToString()));
    }

    [Fact]
    public async Task CA004_LoginComMfa_DeveExigirCodigoValido()
    {
        var user = Factory.SeedUser(Roles.Manager, mfaEnabled: true);
        using var client = CreateClient();

        var firstStep = await PostAsync<LoginResponse>(
            client,
            "/api/v1/auth/login",
            new { email = user.Email, password = user.Password });

        Assert.True(firstStep.MfaRequired);
        Assert.NotNull(firstStep.ChallengeId);
        Assert.Null(firstStep.SessionToken);
        Assert.Contains("auth.mfa_challenge_issued", await ReadAuditActionsAsync(user.Id.ToString()));

        var invalid = await PostAsync(
            client,
            "/api/v1/auth/login/mfa",
            new { challengeId = firstStep.ChallengeId, code = "000000" });

        Assert.Equal(HttpStatusCode.Unauthorized, invalid.StatusCode);
        Assert.Equal("https://canamed.local/problems/mfa-invalid-code", await ReadProblemTypeAsync(invalid));

        var session = await PostAsync<LoginResponse>(
            client,
            "/api/v1/auth/login/mfa",
            new { challengeId = firstStep.ChallengeId, code = Factory.ComputeTotp(user.MfaSecret) });

        Assert.False(session.MfaRequired);
        Assert.NotNull(session.Session);
        Assert.True(session.Session.MfaEnabled);

        var current = await ReadAsync<SessionResponse>(
            await client.GetAsync(new Uri("/api/v1/auth/session", UriKind.Relative)));

        Assert.Equal(user.Email, current.User.Email);
    }

    [Fact]
    public async Task CA005_GestorSemMfa_DeveConcluirCadastroAntesDeOperar()
    {
        var user = Factory.SeedUser(Roles.Manager);
        var (client, login) = await SignInAsync(user.Email, user.Password);

        Assert.True(login.Session!.MfaPending);

        var blocked = await client.GetAsync(new Uri("/api/v1/appointments?date=2026-10-10", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Forbidden, blocked.StatusCode);
        Assert.Equal("https://canamed.local/problems/mfa-enrollment-required", await ReadProblemTypeAsync(blocked));

        var enrollment = await PostAsync<MfaEnrollResponse>(client, "/api/v1/auth/mfa/enroll", null);

        Assert.StartsWith("otpauth://totp/", enrollment.OtpAuthUri, StringComparison.Ordinal);

        var activated = await PostAsync<SessionResponse>(
            client,
            "/api/v1/auth/mfa/activate",
            new { code = Factory.ComputeTotp(enrollment.Secret) });

        Assert.False(activated.MfaPending);
        Assert.True(activated.MfaEnabled);

        var allowed = await client.GetAsync(new Uri("/api/v1/appointments?date=2026-10-10", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
        Assert.Contains("auth.mfa_enabled", await ReadAuditActionsAsync(user.Id.ToString()));
    }

    [Fact]
    public async Task CA006_Recepcao_NaoPodeAdministrarUsuarios()
    {
        var user = Factory.SeedUser(Roles.Receptionist);
        var (client, _) = await SignInAsync(user.Email, user.Password);

        var response = await PostAsync(
            client,
            "/api/v1/users",
            new { name = "Indevido", email = "indevido@canamed.local", password = "senha-bem-longa-123", role = Roles.Receptionist, professionalId = (Guid?)null });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/permission-denied", await ReadProblemTypeAsync(response));
        Assert.Contains("clinic.access_denied", await ReadAuditActionsAsync());
    }

    [Fact]
    public async Task CA007_Logout_DeveRevogarASessao()
    {
        var user = Factory.SeedUser(Roles.Receptionist);
        var (client, _) = await SignInAsync(user.Email, user.Password);

        var logout = await PostAsync(client, "/api/v1/auth/logout", null);

        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);

        var session = await client.GetAsync(new Uri("/api/v1/auth/session", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Unauthorized, session.StatusCode);
        Assert.Contains("auth.logout", await ReadAuditActionsAsync());
    }

    [Fact]
    public async Task CA008_TrocaDeSenha_DeveRevogarAsOutrasSessoes()
    {
        var user = Factory.SeedUser(Roles.Receptionist);
        var (first, _) = await SignInAsync(user.Email, user.Password);
        var (second, _) = await SignInAsync(user.Email, user.Password);
        const string newPassword = "frase secreta bem longa 2026";

        var changed = await PostAsync(
            first,
            "/api/v1/auth/password",
            new { currentPassword = user.Password, newPassword });

        Assert.Equal(HttpStatusCode.NoContent, changed.StatusCode);

        var otherSession = await second.GetAsync(new Uri("/api/v1/auth/session", UriKind.Relative));
        var currentSession = await first.GetAsync(new Uri("/api/v1/auth/session", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Unauthorized, otherSession.StatusCode);
        Assert.Equal(HttpStatusCode.OK, currentSession.StatusCode);

        using var oldCredentials = CreateClient();
        var refused = await PostAsync(oldCredentials, "/api/v1/auth/login", new { email = user.Email, password = user.Password });

        Assert.Equal(HttpStatusCode.Unauthorized, refused.StatusCode);

        var (_, accepted) = await SignInAsync(user.Email, newPassword);

        Assert.NotNull(accepted.Session);
    }

    [Fact]
    public async Task CA009_UsuarioDeOutraClinica_NaoEnxergaDadosDaClínica()
    {
        var receptionistA = Factory.SeedUser(Roles.Receptionist, CanamedApiFactory.ClinicAId);
        var (clientA, _) = await SignInAsync(receptionistA.Email, receptionistA.Password);

        var created = await PostAsync<AppointmentResponse>(
            clientA,
            "/api/v1/appointments",
            new
            {
                professionalId = CanamedApiFactory.ProfessionalAId,
                patientId = CanamedApiFactory.PatientAId,
                appointmentTypeId = CanamedApiFactory.AppointmentTypeAId,
                startsAt = DateTimeOffset.UtcNow.AddDays(30),
            });

        var receptionistB = Factory.SeedUser(Roles.Receptionist, CanamedApiFactory.ClinicBId);
        var (clientB, _) = await SignInAsync(receptionistB.Email, receptionistB.Password);

        var foreign = await clientB.GetAsync(new Uri($"/api/v1/appointments/{created.Id}", UriKind.Relative));

        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);
        Assert.Equal("https://canamed.local/problems/resource-not-found", await ReadProblemTypeAsync(foreign));
    }

    [Fact]
    public async Task CA010_UsuarioDesativado_NaoDeveAutenticar()
    {
        var manager = Factory.SeedUser(Roles.Manager);
        var (managerClient, _) = await SignInAsync(manager.Email, manager.Password);
        var enrollment = await PostAsync<MfaEnrollResponse>(managerClient, "/api/v1/auth/mfa/enroll", null);

        await PostAsync<SessionResponse>(
            managerClient,
            "/api/v1/auth/mfa/activate",
            new { code = Factory.ComputeTotp(enrollment.Secret) });

        var target = Factory.SeedUser(Roles.Receptionist);

        var created = await PostAsync(
            managerClient,
            "/api/v1/users",
            new
            {
                name = "Usuário a desativar",
                email = target.Email,
                password = "outra-frase-bem-longa-2026",
                role = Roles.Receptionist,
                professionalId = (Guid?)null,
            });

        // O e-mail já existe: a API recusa com 409 e o cenário segue pela desativação do alvo original.
        Assert.Equal(HttpStatusCode.Conflict, created.StatusCode);

        var deactivated = await PostAsync(managerClient, $"/api/v1/users/{target.Id}/deactivate", null);

        Assert.Equal(HttpStatusCode.NoContent, deactivated.StatusCode);

        using var targetClient = CreateClient();
        var refused = await PostAsync(
            targetClient,
            "/api/v1/auth/login",
            new { email = target.Email, password = target.Password });

        Assert.Equal(HttpStatusCode.Unauthorized, refused.StatusCode);
        Assert.Contains("user.deactivated", await ReadAuditActionsAsync(target.Id.ToString()));
    }

    [Fact]
    public async Task CA011_Gestor_DeveAdministrarUsuariosEAuditar()
    {
        var manager = Factory.SeedUser(Roles.Manager);
        var (managerClient, _) = await SignInAsync(manager.Email, manager.Password);
        var enrollment = await PostAsync<MfaEnrollResponse>(managerClient, "/api/v1/auth/mfa/enroll", null);

        await PostAsync<SessionResponse>(
            managerClient,
            "/api/v1/auth/mfa/activate",
            new { code = Factory.ComputeTotp(enrollment.Secret) });

        const string initialPassword = "primeira senha bem longa";
        var newUserEmail = $"{Guid.NewGuid():N}@canamed.local";

        var created = await PostAsync<UserResponse>(
            managerClient,
            "/api/v1/users",
            new
            {
                name = "Novo Usuário Teste",
                email = newUserEmail,
                password = initialPassword,
                role = Roles.Receptionist,
                professionalId = (Guid?)null,
            });

        Assert.Equal("recepcionista", created.Role);
        Assert.True(created.IsActive);

        var list = await ReadAsync<IReadOnlyList<UserResponse>>(
            await managerClient.GetAsync(new Uri("/api/v1/users", UriKind.Relative)));

        Assert.Contains(list, user => user.Id == created.Id);

        var reset = await PostAsync(
            managerClient,
            $"/api/v1/users/{created.Id}/password",
            new { newPassword = "segunda senha bem longa" });

        Assert.Equal(HttpStatusCode.NoContent, reset.StatusCode);

        var revoke = await PostAsync(managerClient, $"/api/v1/users/{created.Id}/sessions/revoke", null);

        Assert.Equal(HttpStatusCode.NoContent, revoke.StatusCode);

        var actions = await ReadAuditActionsAsync(created.Id.ToString());

        Assert.Contains("user.created", actions);
        Assert.Contains("user.password_reset", actions);
        Assert.Contains("user.sessions_revoked", actions);

        // A nova senha funciona; a anterior não.
        var (_, signedIn) = await SignInAsync(newUserEmail, "segunda senha bem longa");

        Assert.NotNull(signedIn.Session);
    }

    [Fact]
    public async Task CA012_SemCabecalhoAntiCsrf_DeveRecusar()
    {
        using var client = Factory.CreateClient();

        var response = await client.PostAsync(
            new Uri("/api/v1/auth/logout", UriKind.Relative),
            JsonBody(null));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/csrf-validation-failed", await ReadProblemTypeAsync(response));
    }

    [Fact]
    public async Task Sessao_DeveSerExigida_QuandoNaoHaCookieNemCabecalhos()
    {
        // A conveniência de desenvolvimento (ADR-0010) não pode valer para um cliente anônimo:
        // sem cookie e sem cabeçalhos, a resposta é 401 e a SPA mostra a tela de login.
        using var client = Factory.CreateClient();

        var response = await client.GetAsync(new Uri("/api/v1/auth/session", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("https://canamed.local/problems/authentication-required", await ReadProblemTypeAsync(response));
    }
}
