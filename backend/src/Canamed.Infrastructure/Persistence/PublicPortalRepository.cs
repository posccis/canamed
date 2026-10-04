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

    public Task<int> CountAuditEventsAsync(
        Guid clinicId,
        string action,
        string resourceId,
        CancellationToken cancellationToken = default) =>
        dbContext.AuditEvents.CountAsync(
            auditEvent => auditEvent.ClinicId == clinicId
                && auditEvent.Action == action
                && auditEvent.ResourceId == resourceId,
            cancellationToken);

    public void AddDraft(PatientRegistrationDraft draft) => dbContext.PatientRegistrationDrafts.Add(draft);

    public async Task<PatientRegistrationDraft?> FindDraftByTokenIdAsync(
        Guid tokenId,
        CancellationToken cancellationToken = default) =>
        await dbContext.PatientRegistrationDrafts
            .FirstOrDefaultAsync(d => d.CapabilityTokenId == tokenId, cancellationToken)
            .ConfigureAwait(false);

    public async Task<PatientRegistrationDraft?> FindDraftByIdAsync(
        Guid draftId,
        CancellationToken cancellationToken = default) =>
        await dbContext.PatientRegistrationDrafts
            .FirstOrDefaultAsync(d => d.Id == draftId, cancellationToken)
            .ConfigureAwait(false);

    public async Task<PatientRegistrationDraft?> FindLatestDraftForPatientAsync(
        Guid clinicId,
        Guid patientId,
        CancellationToken cancellationToken = default) =>
        await dbContext.PatientRegistrationDrafts
            .Where(d => d.ClinicId == clinicId && d.PatientId == patientId)
            .OrderByDescending(d => d.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task<IReadOnlyList<PatientRegistrationDraft>> ListPendingReviewDraftsAsync(
        Guid clinicId,
        CancellationToken cancellationToken = default) =>
        await dbContext.PatientRegistrationDrafts
            .Where(d => d.ClinicId == clinicId && d.Status == RegistrationDraftStatus.PendingReview)
            .OrderBy(d => d.SubmittedAt ?? d.CreatedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
}
