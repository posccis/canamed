using Canamed.Application.Portal;
using Canamed.Domain.Agenda;
using Canamed.Domain.Portal;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

public sealed class PortalRepository(CanamedDbContext dbContext) : IPortalRepository
{
    public async Task SaveOtpAsync(PatientOtpCode code, CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.PatientOtpCodes.FirstOrDefaultAsync(o => o.Id == code.Id, cancellationToken);
        if (existing is null)
        {
            await dbContext.PatientOtpCodes.AddAsync(code, cancellationToken);
        }
        else
        {
            dbContext.PatientOtpCodes.Update(code);
        }
    }

    public async Task<PatientOtpCode?> GetLatestValidOtpAsync(
        string phone,
        string cpf,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var phoneDigits = new string(phone.Where(char.IsDigit).ToArray());
        var cpfDigits = new string(cpf.Where(char.IsDigit).ToArray());

        return await dbContext.PatientOtpCodes
            .Where(o => o.Phone == phoneDigits && o.Cpf == cpfDigits && o.ExpiresAt > now && o.VerifiedAt == null)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task SaveSessionAsync(PatientPortalSession session, CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.PatientPortalSessions.FirstOrDefaultAsync(s => s.Id == session.Id, cancellationToken);
        if (existing is null)
        {
            await dbContext.PatientPortalSessions.AddAsync(session, cancellationToken);
        }
        else
        {
            dbContext.PatientPortalSessions.Update(session);
        }
    }

    public async Task<PatientPortalSession?> GetSessionAsync(
        string sessionToken,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.PatientPortalSessions
            .FirstOrDefaultAsync(s => s.SessionToken == sessionToken && s.ExpiresAt > now, cancellationToken);
    }

    public async Task<Patient?> GetPatientByCpfOrPhoneAsync(
        string cpf,
        string phone,
        CancellationToken cancellationToken = default)
    {
        var cpfDigits = new string(cpf.Where(char.IsDigit).ToArray());
        var phoneDigits = new string(phone.Where(char.IsDigit).ToArray());

        var patients = await dbContext.Patients.ToListAsync(cancellationToken);

        return patients.FirstOrDefault(p =>
            (!string.IsNullOrEmpty(cpfDigits) && !string.IsNullOrEmpty(p.Document) &&
             new string(p.Document.Where(char.IsDigit).ToArray()) == cpfDigits) ||
            (!string.IsNullOrEmpty(phoneDigits) &&
             new string(p.Phone.Where(char.IsDigit).ToArray()) == phoneDigits));
    }

    public async Task<int> GetPatientActiveAppointmentsCountAsync(
        Guid patientId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Appointments
            .CountAsync(a => a.PatientId == patientId &&
                             a.StartsAt >= now &&
                             (a.Status == AppointmentStatus.Scheduled || a.Status == AppointmentStatus.Confirmed) &&
                             a.DeletedAt == null,
                        cancellationToken);
    }

    public async Task<IReadOnlyList<Appointment>> GetPatientAppointmentsAsync(
        Guid patientId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Appointments
            .Where(a => a.PatientId == patientId && a.DeletedAt == null)
            .OrderByDescending(a => a.StartsAt)
            .ToListAsync(cancellationToken);
    }
}
