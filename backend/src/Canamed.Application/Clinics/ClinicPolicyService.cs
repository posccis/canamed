using Canamed.Application.Abstractions;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Auditing;
using Canamed.Domain.Clinics;

namespace Canamed.Application.Clinics;

public sealed class ClinicPolicyService
{
    private readonly IClinicPolicyRepository _policyRepository;
    private readonly IAgendaRepository _agendaRepository;
    private readonly IAuditRepository _auditRepository;
    private readonly ICurrentActorAccessor _actorAccessor;
    private readonly TimeProvider _timeProvider;
    private readonly IUnitOfWork _unitOfWork;

    public ClinicPolicyService(
        IClinicPolicyRepository policyRepository,
        IAgendaRepository agendaRepository,
        IAuditRepository auditRepository,
        ICurrentActorAccessor actorAccessor,
        TimeProvider timeProvider,
        IUnitOfWork unitOfWork)
    {
        _policyRepository = policyRepository;
        _agendaRepository = agendaRepository;
        _auditRepository = auditRepository;
        _actorAccessor = actorAccessor;
        _timeProvider = timeProvider;
        _unitOfWork = unitOfWork;
    }

    public async Task<ClinicPolicyDto> GetPolicyAsync(
        Guid clinicId,
        CancellationToken cancellationToken = default)
    {
        var now = _timeProvider.GetUtcNow();
        var policy = await _policyRepository.GetByClinicIdAsync(clinicId, cancellationToken);
        if (policy is null)
        {
            policy = ClinicPolicy.CreateDefault(clinicId, now);
            await _policyRepository.UpsertAsync(policy, cancellationToken);
        }

        return new ClinicPolicyDto(
            policy.Id,
            policy.ClinicId,
            policy.MaxDailyOverbookingPerDoctor,
            policy.MinHoursNoticeForOnlineBooking,
            policy.MinHoursNoticeForFreeCancellation);
    }

    public async Task<ClinicPolicyDto> UpdatePolicyAsync(
        Guid clinicId,
        UpdateClinicPolicyRequest request,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var policy = await _policyRepository.GetByClinicIdAsync(clinicId, ct)
                ?? ClinicPolicy.CreateDefault(clinicId, now);

            policy.Update(
                request.MaxDailyOverbookingPerDoctor,
                request.MinHoursNoticeForOnlineBooking,
                request.MinHoursNoticeForFreeCancellation,
                now);

            await _policyRepository.UpsertAsync(policy, ct);
            _auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name ?? "Gestor",
                "ClinicPolicyUpdated",
                "ClinicPolicy",
                policy.Id.ToString(),
                now,
                $"{{\"maxOverbooking\":{policy.MaxDailyOverbookingPerDoctor}}}"));

            return new ClinicPolicyDto(
                policy.Id,
                policy.ClinicId,
                policy.MaxDailyOverbookingPerDoctor,
                policy.MinHoursNoticeForOnlineBooking,
                policy.MinHoursNoticeForFreeCancellation);
        }, cancellationToken);
    }

    public async Task<(bool Allowed, int CurrentCount, int MaxAllowed, string? Message)> CheckOverbookingQuotaAsync(
        Guid clinicId,
        Guid professionalId,
        DateTimeOffset targetDate,
        CancellationToken cancellationToken = default)
    {
        var policy = await GetPolicyAsync(clinicId, cancellationToken);

        var startOfDay = new DateTimeOffset(targetDate.Year, targetDate.Month, targetDate.Day, 0, 0, 0, targetDate.Offset);
        var endOfDay = startOfDay.AddDays(1);

        var appointments = await _agendaRepository.ListAppointmentsAsync(
            clinicId,
            professionalId,
            startOfDay,
            endOfDay,
            cancellationToken);

        var currentOverbookingCount = appointments.Count(a => a.IsOverbooking && a.DeletedAt is null);

        if (currentOverbookingCount >= policy.MaxDailyOverbookingPerDoctor)
        {
            return (
                false,
                currentOverbookingCount,
                policy.MaxDailyOverbookingPerDoctor,
                $"Limite diário de encaixes atingido ({currentOverbookingCount}/{policy.MaxDailyOverbookingPerDoctor}). Apenas gestor pode autorizar encaixe excedente.");
        }

        return (true, currentOverbookingCount, policy.MaxDailyOverbookingPerDoctor, null);
    }
}
