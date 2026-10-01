using Canamed.Application.Identity;
using Canamed.Infrastructure.Development;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Canamed.Infrastructure.Identity;

/// <summary>
/// Resolve o usuário corrente. A fonte primária é a sessão autenticada, carregada pelo middleware de
/// sessão e publicada em <see cref="HttpContext.Items"/>. Em DEV/TEST, e apenas quando a configuração
/// permite, cabeçalhos podem ser usados como conveniência de desenvolvimento (RN-017 do ADR-0010).
/// </summary>
public sealed class CurrentActorAccessor(
    IHttpContextAccessor httpContextAccessor,
    IHostEnvironment environment,
    IConfiguration configuration) : ICurrentActorAccessor
{
    /// <summary>Chave em <see cref="HttpContext.Items"/> com o ator resolvido pela sessão.</summary>
    public const string ActorItemKey = "canamed.current-actor";

    /// <summary>Cabeçalho com o identificador do usuário (apenas DEV/TEST).</summary>
    public const string ActorIdHeader = "X-Canamed-Actor-Id";

    /// <summary>Cabeçalho com o nome do usuário (apenas DEV/TEST).</summary>
    public const string ActorNameHeader = "X-Canamed-Actor-Name";

    /// <summary>Cabeçalho com a clínica ativa (apenas DEV/TEST).</summary>
    public const string ClinicIdHeader = "X-Canamed-Clinic-Id";

    /// <summary>Cabeçalho com as permissões separadas por vírgula (apenas DEV/TEST).</summary>
    public const string PermissionsHeader = "X-Canamed-Permissions";

    /// <summary>Cabeçalho com o profissional vinculado ao usuário (apenas DEV/TEST).</summary>
    public const string ProfessionalIdHeader = "X-Canamed-Professional-Id";

    public bool TryGetActor(out CurrentActor actor)
    {
        actor = null!;

        var httpContext = httpContextAccessor.HttpContext;

        if (httpContext is null)
        {
            return false;
        }

        if (httpContext.Items.TryGetValue(ActorItemKey, out var resolved) && resolved is CurrentActor sessionActor)
        {
            actor = sessionActor;

            return true;
        }

        if (!TrustsActorHeaders())
        {
            return false;
        }

        var request = httpContext.Request;

        // A conveniência só é aplicada quando a requisição realmente se identifica por cabeçalho.
        // Assim, um navegador sem sessão continua recebendo 401 (e a tela de login), sem bypass acidental.
        if (!HasAnyIdentityHeader(request))
        {
            return false;
        }

        actor = new CurrentActor(
            ReadHeader(request, ActorIdHeader) ?? "dev-user",
            ReadHeader(request, ActorNameHeader) ?? "Usuário de desenvolvimento",
            ReadGuid(request, ClinicIdHeader) ?? DevelopmentDefaults.DemoClinicId,
            ParsePermissions(ReadHeader(request, PermissionsHeader)),
            ReadGuid(request, ProfessionalIdHeader),
            "desenvolvimento");

        return true;
    }

    private bool TrustsActorHeaders() =>
        (environment.IsDevelopment() || environment.IsEnvironment("Testing"))
        && !string.Equals(
            configuration["Canamed:Development:TrustActorHeaders"],
            "false",
            StringComparison.OrdinalIgnoreCase);

    private static bool HasAnyIdentityHeader(HttpRequest request) =>
        !string.IsNullOrWhiteSpace(request.Headers[ActorIdHeader].ToString())
        || !string.IsNullOrWhiteSpace(request.Headers[ClinicIdHeader].ToString())
        || !string.IsNullOrWhiteSpace(request.Headers[PermissionsHeader].ToString())
        || !string.IsNullOrWhiteSpace(request.Headers[ProfessionalIdHeader].ToString());

    private static string? ReadHeader(HttpRequest request, string headerName)
    {
        var value = request.Headers[headerName].ToString();

        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static Guid? ReadGuid(HttpRequest request, string headerName)
    {
        var value = ReadHeader(request, headerName);

        return Guid.TryParse(value, out var parsed) ? parsed : null;
    }

    private static IReadOnlySet<string> ParsePermissions(string? headerValue)
    {
        // Sem cabeçalho, o ambiente de desenvolvimento recebe todas as permissões para permitir a
        // operação completa. Com cabeçalho, valem apenas as permissões informadas.
        if (headerValue is null)
        {
            return Permissions.All.ToHashSet(StringComparer.Ordinal);
        }

        return headerValue
            .Split([',', ';', ' '], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet(StringComparer.Ordinal);
    }
}
