using Canamed.Application.Abstractions;
using Canamed.Domain.Identity;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

/// <summary>Acesso a usuários, vínculos por clínica, sessões e desafios de segundo fator.</summary>
public sealed class IdentityRepository(CanamedDbContext dbContext) : IIdentityRepository
{
    public Task<User?> FindUserByEmailAsync(string normalizedEmail, CancellationToken cancellationToken) =>
        dbContext.Users.FirstOrDefaultAsync(user => user.Email == normalizedEmail, cancellationToken);

    public Task<User?> FindUserByIdAsync(Guid userId, CancellationToken cancellationToken) =>
        dbContext.Users.FirstOrDefaultAsync(user => user.Id == userId, cancellationToken);

    public async Task<IReadOnlyList<User>> ListUsersByIdsAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(userIds);

        if (userIds.Count is 0)
        {
            return [];
        }

        return await dbContext.Users
            .AsNoTracking()
            .Where(user => userIds.Contains(user.Id))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<ClinicMembership>> ListMembershipsByUserAsync(
        Guid userId,
        CancellationToken cancellationToken) =>
        await dbContext.ClinicMemberships
            .AsNoTracking()
            .Where(membership => membership.UserId == userId)
            .OrderBy(membership => membership.CreatedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<ClinicMembership>> ListMembershipsByClinicAsync(
        Guid clinicId,
        CancellationToken cancellationToken) =>
        await dbContext.ClinicMemberships
            .AsNoTracking()
            .Where(membership => membership.ClinicId == clinicId)
            .OrderBy(membership => membership.CreatedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public Task<ClinicMembership?> FindMembershipAsync(
        Guid userId,
        Guid clinicId,
        CancellationToken cancellationToken) =>
        dbContext.ClinicMemberships.FirstOrDefaultAsync(
            membership => membership.UserId == userId && membership.ClinicId == clinicId,
            cancellationToken);

    public Task<UserSession?> FindSessionByIdAsync(Guid sessionId, CancellationToken cancellationToken) =>
        dbContext.UserSessions.FirstOrDefaultAsync(session => session.Id == sessionId, cancellationToken);

    public Task<UserSession?> FindSessionByTokenHashAsync(
        string tokenHash,
        CancellationToken cancellationToken) =>
        dbContext.UserSessions.FirstOrDefaultAsync(session => session.TokenHash == tokenHash, cancellationToken);

    public async Task<IReadOnlyList<UserSession>> ListSessionsByUsersAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(userIds);

        if (userIds.Count is 0)
        {
            return [];
        }

        return await dbContext.UserSessions
            .Where(session => userIds.Contains(session.UserId))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public Task<LoginChallenge?> FindChallengeAsync(Guid challengeId, CancellationToken cancellationToken) =>
        dbContext.LoginChallenges.FirstOrDefaultAsync(challenge => challenge.Id == challengeId, cancellationToken);

    public Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken) =>
        dbContext.Users.AnyAsync(user => user.Email == normalizedEmail, cancellationToken);

    public async Task<string?> FindClinicNameAsync(Guid clinicId, CancellationToken cancellationToken)
    {
        var clinic = await dbContext.Clinics
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == clinicId, cancellationToken)
            .ConfigureAwait(false);

        return clinic?.Name;
    }

    public void AddUser(User user) => dbContext.Users.Add(user);

    public void AddMembership(ClinicMembership membership) => dbContext.ClinicMemberships.Add(membership);

    public void AddSession(UserSession session) => dbContext.UserSessions.Add(session);

    public void AddChallenge(LoginChallenge challenge) => dbContext.LoginChallenges.Add(challenge);

    public async Task SaveChangesAsync(CancellationToken cancellationToken) =>
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
}
