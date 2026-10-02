using Canamed.Application.Abstractions;
using Canamed.Domain.Agenda;
using Canamed.Domain.Clinics;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

/// <summary>Acesso a convênios, salas, funcionamento e feriados (SPEC-0006).</summary>
public sealed class ClinicOperationRepository(CanamedDbContext dbContext) : IClinicOperationRepository
{
    public async Task<IReadOnlyList<HealthPlan>> ListHealthPlansAsync(
        Guid clinicId,
        CancellationToken cancellationToken) =>
        await dbContext.HealthPlans
            .AsNoTracking()
            .Where(plan => plan.ClinicId == clinicId)
            .OrderBy(plan => plan.Name)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public Task<HealthPlan?> FindHealthPlanAsync(
        Guid clinicId,
        Guid healthPlanId,
        CancellationToken cancellationToken) =>
        dbContext.HealthPlans.FirstOrDefaultAsync(
            plan => plan.Id == healthPlanId && plan.ClinicId == clinicId,
            cancellationToken);

    public Task<bool> HealthPlanNameExistsAsync(
        Guid clinicId,
        string name,
        Guid? exceptHealthPlanId,
        CancellationToken cancellationToken)
    {
        var normalized = name.Trim().ToLowerInvariant();

        return dbContext.HealthPlans.AnyAsync(
            plan => plan.ClinicId == clinicId
                && plan.Name.ToLower() == normalized
                && (exceptHealthPlanId == null || plan.Id != exceptHealthPlanId),
            cancellationToken);
    }

    public Task<bool> HealthPlanHasActivePatientsAsync(
        Guid clinicId,
        Guid healthPlanId,
        CancellationToken cancellationToken) =>
        dbContext.Patients.AnyAsync(
            patient => patient.ClinicId == clinicId && patient.HealthPlanId == healthPlanId && patient.IsActive,
            cancellationToken);

    public void AddHealthPlan(HealthPlan healthPlan) => dbContext.HealthPlans.Add(healthPlan);

    public async Task<IReadOnlyList<Room>> ListRoomsAsync(Guid clinicId, CancellationToken cancellationToken) =>
        await dbContext.Rooms
            .AsNoTracking()
            .Where(room => room.ClinicId == clinicId)
            .OrderBy(room => room.Name)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public Task<Room?> FindRoomAsync(Guid clinicId, Guid roomId, CancellationToken cancellationToken) =>
        dbContext.Rooms.FirstOrDefaultAsync(room => room.Id == roomId && room.ClinicId == clinicId, cancellationToken);

    public Task<bool> RoomNameExistsAsync(
        Guid clinicId,
        string name,
        Guid? exceptRoomId,
        CancellationToken cancellationToken)
    {
        var normalized = name.Trim().ToLowerInvariant();

        return dbContext.Rooms.AnyAsync(
            room => room.ClinicId == clinicId
                && room.Name.ToLower() == normalized
                && (exceptRoomId == null || room.Id != exceptRoomId),
            cancellationToken);
    }

    public Task<bool> RoomHasFutureAppointmentsAsync(
        Guid clinicId,
        Guid roomId,
        DateTimeOffset fromUtc,
        CancellationToken cancellationToken) =>
        dbContext.Appointments.AnyAsync(
            appointment => appointment.ClinicId == clinicId
                && appointment.RoomId == roomId
                && appointment.DeletedAt == null
                && appointment.StartsAt >= fromUtc
                && (appointment.Status == AppointmentStatus.Scheduled || appointment.Status == AppointmentStatus.Confirmed),
            cancellationToken);

    public void AddRoom(Room room) => dbContext.Rooms.Add(room);

    public async Task<IReadOnlyList<OperatingHour>> ListOperatingHoursAsync(
        Guid clinicId,
        CancellationToken cancellationToken) =>
        await dbContext.OperatingHours
            .Where(hour => hour.ClinicId == clinicId)
            .OrderBy(hour => hour.DayOfWeek)
            .ThenBy(hour => hour.StartsAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public void RemoveOperatingHours(IEnumerable<OperatingHour> hours) => dbContext.OperatingHours.RemoveRange(hours);

    public void AddOperatingHour(OperatingHour operatingHour) => dbContext.OperatingHours.Add(operatingHour);

    public async Task<IReadOnlyList<ClinicClosure>> ListClosuresAsync(
        Guid clinicId,
        CancellationToken cancellationToken) =>
        await dbContext.ClinicClosures
            .AsNoTracking()
            .Where(closure => closure.ClinicId == clinicId)
            .OrderBy(closure => closure.Date)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public Task<ClinicClosure?> FindClosureAsync(
        Guid clinicId,
        Guid closureId,
        CancellationToken cancellationToken) =>
        dbContext.ClinicClosures.FirstOrDefaultAsync(
            closure => closure.Id == closureId && closure.ClinicId == clinicId,
            cancellationToken);

    public Task<bool> ClosureDateExistsAsync(Guid clinicId, DateOnly date, CancellationToken cancellationToken) =>
        dbContext.ClinicClosures.AnyAsync(
            closure => closure.ClinicId == clinicId && closure.Date == date,
            cancellationToken);

    public void AddClosure(ClinicClosure closure) => dbContext.ClinicClosures.Add(closure);

    public void RemoveClosure(ClinicClosure closure) => dbContext.ClinicClosures.Remove(closure);

    public async Task SaveChangesAsync(CancellationToken cancellationToken) =>
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
}
