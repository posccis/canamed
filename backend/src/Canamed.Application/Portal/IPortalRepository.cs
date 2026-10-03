using Canamed.Domain.Agenda;
using Canamed.Domain.Portal;

namespace Canamed.Application.Portal;

public interface IPortalRepository
{
    Task SaveOtpAsync(PatientOtpCode code, CancellationToken cancellationToken = default);
    Task<PatientOtpCode?> GetLatestValidOtpAsync(string phone, string cpf, DateTimeOffset now, CancellationToken cancellationToken = default);
    Task SaveSessionAsync(PatientPortalSession session, CancellationToken cancellationToken = default);
    Task<PatientPortalSession?> GetSessionAsync(string sessionToken, DateTimeOffset now, CancellationToken cancellationToken = default);
    Task<Patient?> GetPatientByCpfOrPhoneAsync(string cpf, string phone, CancellationToken cancellationToken = default);
    Task<int> GetPatientActiveAppointmentsCountAsync(Guid patientId, DateTimeOffset now, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Appointment>> GetPatientAppointmentsAsync(Guid patientId, CancellationToken cancellationToken = default);
}
