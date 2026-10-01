namespace Canamed.Application.Identity;

/// <summary>
/// Fornece o usuário autenticado da requisição corrente.
/// Enquanto a SPEC de autenticação e auditoria não existir (ADR-0008), a implementação de
/// desenvolvimento resolve o ator por cabeçalho e falha fechado fora de DEV/TEST (ADR-0009).
/// </summary>
public interface ICurrentActorAccessor
{
    /// <summary>Tenta obter o usuário autenticado da requisição corrente.</summary>
    bool TryGetActor(out CurrentActor actor);
}
