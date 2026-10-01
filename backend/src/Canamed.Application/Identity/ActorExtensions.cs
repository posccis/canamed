using Canamed.Application.Errors;

namespace Canamed.Application.Identity;

/// <summary>Extensões de conveniência para leitura do ator corrente.</summary>
public static class ActorExtensions
{
    /// <summary>Obtém o ator corrente ou lança <see cref="CanamedException"/> de autenticação.</summary>
    public static CurrentActor RequireActor(this ICurrentActorAccessor accessor)
    {
        ArgumentNullException.ThrowIfNull(accessor);

        if (accessor.TryGetActor(out var actor))
        {
            return actor;
        }

        throw new CanamedException(
            ProblemKind.Unauthenticated,
            "Autenticação necessária",
            "Sua sessão expirou ou você ainda não entrou. Autentique-se para continuar.",
            "authentication-required");
    }
}
