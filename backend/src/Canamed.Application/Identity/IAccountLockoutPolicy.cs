namespace Canamed.Application.Identity;

/// <summary>
/// Política de bloqueio temporário de conta por excesso de tentativas inválidas (RN-004 da SPEC-0003).
/// Em produção é sempre ativa (falha fechada); em Development/Testing pode ser suspensa temporariamente
/// pela configuração <c>Canamed:Security:EnableAccountLockout</c>.
/// </summary>
public interface IAccountLockoutPolicy
{
    /// <summary>Indica se o bloqueio de conta por tentativas inválidas está ativo neste ambiente.</summary>
    bool IsLockoutEnabled();
}
