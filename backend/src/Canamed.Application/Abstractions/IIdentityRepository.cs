using Canamed.Domain.Identity;

namespace Canamed.Application.Abstractions;

/// <summary>Acesso aos dados de identidade, sessão e vínculos por clínica (SPEC-0003, seção 7).</summary>
public interface IIdentityRepository
{
    /// <summary>Busca o usuário pelo e-mail já normalizado.</summary>
    Task<User?> FindUserByEmailAsync(string normalizedEmail, CancellationToken cancellationToken);

    /// <summary>Busca o usuário pelo identificador.</summary>
    Task<User?> FindUserByIdAsync(Guid userId, CancellationToken cancellationToken);

    /// <summary>Lista usuários por identificador.</summary>
    Task<IReadOnlyList<User>> ListUsersByIdsAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken cancellationToken);

    /// <summary>Lista os vínculos do usuário com clínicas.</summary>
    Task<IReadOnlyList<ClinicMembership>> ListMembershipsByUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    /// <summary>Lista os vínculos de uma clínica.</summary>
    Task<IReadOnlyList<ClinicMembership>> ListMembershipsByClinicAsync(
        Guid clinicId,
        CancellationToken cancellationToken);

    /// <summary>Obtém o vínculo de um usuário com uma clínica.</summary>
    Task<ClinicMembership?> FindMembershipAsync(
        Guid userId,
        Guid clinicId,
        CancellationToken cancellationToken);

    /// <summary>Obtém a sessão pelo identificador.</summary>
    Task<UserSession?> FindSessionByIdAsync(Guid sessionId, CancellationToken cancellationToken);

    /// <summary>Obtém a sessão pelo hash do token.</summary>
    Task<UserSession?> FindSessionByTokenHashAsync(string tokenHash, CancellationToken cancellationToken);

    /// <summary>Lista sessões de um conjunto de usuários.</summary>
    Task<IReadOnlyList<UserSession>> ListSessionsByUsersAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken cancellationToken);

    /// <summary>Obtém o desafio de segundo fator.</summary>
    Task<LoginChallenge?> FindChallengeAsync(Guid challengeId, CancellationToken cancellationToken);

    /// <summary>Indica se o e-mail já está cadastrado.</summary>
    Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken);

    /// <summary>Obtém o nome da clínica.</summary>
    Task<string?> FindClinicNameAsync(Guid clinicId, CancellationToken cancellationToken);

    /// <summary>Adiciona um usuário.</summary>
    void AddUser(User user);

    /// <summary>Adiciona um vínculo por clínica.</summary>
    void AddMembership(ClinicMembership membership);

    /// <summary>Adiciona uma sessão.</summary>
    void AddSession(UserSession session);

    /// <summary>Adiciona um desafio de segundo fator.</summary>
    void AddChallenge(LoginChallenge challenge);

    /// <summary>Confirma as alterações pendentes.</summary>
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
