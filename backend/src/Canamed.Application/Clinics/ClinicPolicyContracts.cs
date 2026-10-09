using Canamed.Domain.Clinics;

namespace Canamed.Application.Clinics;

public interface IClinicPolicyRepository
{
    Task<ClinicPolicy?> GetByClinicIdAsync(Guid clinicId, CancellationToken cancellationToken = default);
    Task UpsertAsync(ClinicPolicy policy, CancellationToken cancellationToken = default);
}

public sealed record UpdateClinicPolicyRequest(
    int MaxDailyOverbookingPerDoctor,
    int MinHoursNoticeForOnlineBooking,
    int MinHoursNoticeForFreeCancellation);

public sealed record ClinicPolicyDto(
    Guid Id,
    Guid ClinicId,
    int MaxDailyOverbookingPerDoctor,
    int MinHoursNoticeForOnlineBooking,
    int MinHoursNoticeForFreeCancellation);
