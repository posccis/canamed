using Canamed.Domain.Common;

namespace Canamed.Domain.Clinics;

/// <summary>
/// Parâmetros e políticas operacionais da clínica para encaixes (overbooking) e cancelamento (SPEC-0025).
/// </summary>
public sealed class ClinicPolicy : Entity
{
    private ClinicPolicy()
    {
    }

    public Guid ClinicId { get; private set; }
    public int MaxDailyOverbookingPerDoctor { get; private set; } = 3;
    public int MinHoursNoticeForOnlineBooking { get; private set; } = 2;
    public int MinHoursNoticeForFreeCancellation { get; private set; } = 24;

    public static ClinicPolicy CreateDefault(Guid clinicId, DateTimeOffset now)
    {
        var policy = new ClinicPolicy
        {
            ClinicId = clinicId,
            MaxDailyOverbookingPerDoctor = 3,
            MinHoursNoticeForOnlineBooking = 2,
            MinHoursNoticeForFreeCancellation = 24
        };
        policy.MarkCreated(now);
        return policy;
    }

    public void Update(
        int maxDailyOverbookingPerDoctor,
        int minHoursNoticeForOnlineBooking,
        int minHoursNoticeForFreeCancellation,
        DateTimeOffset now)
    {
        if (maxDailyOverbookingPerDoctor < 0) throw new ArgumentOutOfRangeException(nameof(maxDailyOverbookingPerDoctor), "Limite de encaixe não pode ser negativo.");
        if (minHoursNoticeForOnlineBooking < 0) throw new ArgumentOutOfRangeException(nameof(minHoursNoticeForOnlineBooking), "Horas mínimas de antecedência não podem ser negativas.");
        if (minHoursNoticeForFreeCancellation < 0) throw new ArgumentOutOfRangeException(nameof(minHoursNoticeForFreeCancellation), "Horas de cancelamento não podem ser negativas.");

        MaxDailyOverbookingPerDoctor = maxDailyOverbookingPerDoctor;
        MinHoursNoticeForOnlineBooking = minHoursNoticeForOnlineBooking;
        MinHoursNoticeForFreeCancellation = minHoursNoticeForFreeCancellation;
        MarkUpdated(now);
    }
}
