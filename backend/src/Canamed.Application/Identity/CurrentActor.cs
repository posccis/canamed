namespace Canamed.Application.Identity;

/// <summary>
/// Identidade do usuário autenticado e clínica ativa. O isolamento por <c>clinic_id</c> parte daqui
/// (ADR-0008): nenhum dado de outra clínica é acessível.
/// </summary>
public sealed record CurrentActor(
    string UserId,
    string Name,
    Guid ClinicId,
    IReadOnlySet<string> Permissions,
    Guid? ProfessionalId = null,
    string? Role = null,
    Guid? SessionId = null,
    bool MfaPending = false)
{
    /// <summary>Indica se o usuário possui a permissão informada.</summary>
    public bool Has(string permission) => Permissions.Contains(permission);

    /// <summary>Indica se o usuário possui ao menos uma das permissões informadas.</summary>
    public bool HasAny(params string[] permissions) => permissions.Any(Has);

    /// <summary>Garante que o usuário possui a permissão informada ou lança exceção de acesso proibido.</summary>
    public void EnsurePermission(string permission)
    {
        if (!Has(permission))
        {
            throw new Errors.CanamedException(
                Errors.ProblemKind.Forbidden,
                "Acesso negado",
                $"O usuário não possui a permissão necessária: {permission}.",
                "permission-denied");
        }
    }
}
