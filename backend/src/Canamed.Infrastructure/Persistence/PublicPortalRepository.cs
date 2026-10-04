using Canamed.Application.Portal;
using Canamed.Domain.Clinics;
using Canamed.Domain.Portal;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

/// <summary>Acesso a dados da superfície pública do paciente (SPEC-0026).</summary>
public sealed class PublicPortalRepository(CanamedDbContext dbContext) : IPublicPortalRepository
{
    public async Task<Clinic?> FindClinicBySlugAsync(string slug, CancellationToken cancellationToken = default) =>
        await dbContext.Clinics
            .FirstOrDefaultAsync(clinic => clinic.Slug == slug, cancellationToken)
            .ConfigureAwait(false);

    public async Task<Clinic?> FindClinicAsync(Guid clinicId, CancellationToken cancellationToken = default) =>
        await dbContext.Clinics
            .FirstOrDefaultAsync(clinic => clinic.Id == clinicId, cancellationToken)
            .ConfigureAwait(false);

    public void AddToken(PatientCapabilityToken token) => dbContext.PatientCapabilityTokens.Add(token);

    public async Task<PatientCapabilityToken?> FindTokenByHashAsync(
        string tokenHash,
        CancellationToken cancellationToken = default) =>
        await dbContext.PatientCapabilityTokens
            .FirstOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<PatientCapabilityToken>> ListActiveTokensForAppointmentAsync(
        Guid clinicId,
        Guid appointmentId,
        CancellationToken cancellationToken = default) =>
        await dbContext.PatientCapabilityTokens
            .Where(token =>
                token.ClinicId == clinicId
                && token.AppointmentId == appointmentId
                && token.Status == CapabilityTokenStatus.Active)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
}
