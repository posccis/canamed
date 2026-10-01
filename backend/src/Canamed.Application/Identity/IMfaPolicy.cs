namespace Canamed.Application.Identity;

/// <summary>
/// Política de exigência do segundo fator (RN-010 da SPEC-0003). A implementação de produção exige MFA
/// do gestor; em ambientes de desenvolvimento a exigência pode ser suspensa por configuração explícita,
/// sempre com falha fechada fora de DEV/TEST.
/// </summary>
public interface IMfaPolicy
{
    /// <summary>Indica se o papel exige segundo fator neste ambiente.</summary>
    bool IsRequiredFor(string? role);
}
