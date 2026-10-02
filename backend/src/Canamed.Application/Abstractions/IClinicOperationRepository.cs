using Canamed.Domain.Clinics;

namespace Canamed.Application.Abstractions;

/// <summary>
/// Acesso aos dados operacionais da clínica — convênios, salas, funcionamento e feriados
/// (SPEC-0006), sempre no escopo de uma clínica.
/// </summary>
public interface IClinicOperationRepository
{
    Task<IReadOnlyList<HealthPlan>> ListHealthPlansAsync(Guid clinicId, CancellationToken cancellationToken);

    Task<HealthPlan?> FindHealthPlanAsync(Guid clinicId, Guid healthPlanId, CancellationToken cancellationToken);

    Task<bool> HealthPlanNameExistsAsync(
        Guid clinicId,
        string name,
        Guid? exceptHealthPlanId,
        CancellationToken cancellationToken);

    /// <summary>Indica se há paciente ativo vinculado ao convênio (RN-003).</summary>
    Task<bool> HealthPlanHasActivePatientsAsync(Guid clinicId, Guid healthPlanId, CancellationToken cancellationToken);

    void AddHealthPlan(HealthPlan healthPlan);

    Task<IReadOnlyList<Room>> ListRoomsAsync(Guid clinicId, CancellationToken cancellationToken);

    Task<Room?> FindRoomAsync(Guid clinicId, Guid roomId, CancellationToken cancellationToken);

    Task<bool> RoomNameExistsAsync(Guid clinicId, string name, Guid? exceptRoomId, CancellationToken cancellationToken);

    /// <summary>Indica se há agendamento ativo futuro na sala (RN-004).</summary>
    Task<bool> RoomHasFutureAppointmentsAsync(
        Guid clinicId,
        Guid roomId,
        DateTimeOffset fromUtc,
        CancellationToken cancellationToken);

    void AddRoom(Room room);

    Task<IReadOnlyList<OperatingHour>> ListOperatingHoursAsync(Guid clinicId, CancellationToken cancellationToken);

    void RemoveOperatingHours(IEnumerable<OperatingHour> hours);

    void AddOperatingHour(OperatingHour operatingHour);

    Task<IReadOnlyList<ClinicClosure>> ListClosuresAsync(Guid clinicId, CancellationToken cancellationToken);

    Task<ClinicClosure?> FindClosureAsync(Guid clinicId, Guid closureId, CancellationToken cancellationToken);

    Task<bool> ClosureDateExistsAsync(Guid clinicId, DateOnly date, CancellationToken cancellationToken);

    void AddClosure(ClinicClosure closure);

    void RemoveClosure(ClinicClosure closure);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
