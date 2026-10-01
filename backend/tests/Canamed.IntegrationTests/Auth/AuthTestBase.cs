using System.Net;
using System.Text;
using System.Text.Json;
using Canamed.Application.Identity;
using Canamed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Canamed.IntegrationTests.Auth;

/// <summary>
/// Base dos testes de autenticação: limpa o estado efêmero de identidade entre cenários e oferece
/// clientes com cookie de sessão, além de leitura da trilha de auditoria.
/// </summary>
[Collection(CanamedCollection.Name)]
public abstract class AuthTestBase
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    protected AuthTestBase(CanamedApiFactory factory)
    {
        ArgumentNullException.ThrowIfNull(factory);

        Factory = factory;

        TestDatabase.ResetIdentityState();
    }

    protected CanamedApiFactory Factory { get; }

    /// <summary>Cria um cliente HTTP já com o cabeçalho anti-CSRF exigido pela API.</summary>
    protected HttpClient CreateClient()
    {
        var client = Factory.CreateClient();

        client.DefaultRequestHeaders.Add("X-Canamed-Requested-With", "canamed-spa");

        return client;
    }

    /// <summary>Autentica e devolve o cliente com o cookie de sessão gravado.</summary>
    protected async Task<(HttpClient Client, LoginResponse Response)> SignInAsync(
        string email,
        string password)
    {
        var client = CreateClient();
        var response = await PostAsync<LoginResponse>(client, "/api/v1/auth/login", new { email, password })
            .ConfigureAwait(false);

        return (client, response);
    }

    /// <summary>Autentica concluindo o segundo fator, quando exigido.</summary>
    protected async Task<HttpClient> SignInWithMfaAsync(TestUser user)
    {
        var client = CreateClient();
        var login = await PostAsync<LoginResponse>(
            client,
            "/api/v1/auth/login",
            new { email = user.Email, password = user.Password }).ConfigureAwait(false);

        Assert.True(login.MfaRequired);
        Assert.NotNull(login.ChallengeId);

        await PostAsync<LoginResponse>(
            client,
            "/api/v1/auth/login/mfa",
            new { challengeId = login.ChallengeId, code = Factory.ComputeTotp(user.MfaSecret) }).ConfigureAwait(false);

        return client;
    }

    protected static async Task<T> PostAsync<T>(HttpClient client, string path, object? body)
    {
        var response = await client
            .PostAsync(new Uri(path, UriKind.Relative), JsonBody(body))
            .ConfigureAwait(false);

        return await ReadAsync<T>(response).ConfigureAwait(false);
    }

    protected static Task<HttpResponseMessage> PostAsync(HttpClient client, string path, object? body) =>
        client.PostAsync(new Uri(path, UriKind.Relative), JsonBody(body));

    protected static async Task<T> ReadAsync<T>(HttpResponseMessage response)
    {
        ArgumentNullException.ThrowIfNull(response);

        var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        Assert.True(
            response.IsSuccessStatusCode,
            $"Esperado sucesso, recebido {(int)response.StatusCode}: {content}");

        return JsonSerializer.Deserialize<T>(content, SerializerOptions)
            ?? throw new InvalidOperationException($"Resposta vazia para {typeof(T).Name}.");
    }

    /// <summary>Lê o campo <c>type</c> do Problem Details devolvido.</summary>
    protected static async Task<string> ReadProblemTypeAsync(HttpResponseMessage response)
    {
        ArgumentNullException.ThrowIfNull(response);

        var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        using var document = JsonDocument.Parse(content);

        return document.RootElement.TryGetProperty("type", out var type) ? type.GetString() ?? string.Empty : string.Empty;
    }

    /// <summary>Lê as ações registradas na auditoria para um recurso.</summary>
    protected static async Task<IReadOnlyList<string>> ReadAuditActionsAsync(string? resourceId = null)
    {
        using var context = CanamedApiFactory.CreateDbContext();
        var query = context.AuditEvents.AsNoTracking();

        if (resourceId is not null)
        {
            query = query.Where(auditEvent => auditEvent.ResourceId == resourceId);
        }

        return await query
            .OrderBy(auditEvent => auditEvent.OccurredAt)
            .Select(auditEvent => auditEvent.Action)
            .ToListAsync()
            .ConfigureAwait(false);
    }

    protected static StringContent JsonBody(object? payload) =>
        new(JsonSerializer.Serialize(payload ?? new { }, SerializerOptions), Encoding.UTF8, "application/json");

}
