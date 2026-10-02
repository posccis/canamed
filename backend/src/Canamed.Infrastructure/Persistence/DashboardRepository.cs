using Canamed.Application.Abstractions;
using Canamed.Application.Agenda;
using Canamed.Application.Dashboard;
using Canamed.Domain.Agenda;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

/// <summary>Implementação do repositório de resumo operacional do dashboard (SPEC-0007).</summary>
public sealed class DashboardRepository(CanamedDbContext dbContext) : IDashboardRepository
{
    public async Task<DashboardSummaryResponse> GetSummaryAsync(
        Guid clinicId,
        DateOnly date,
        CancellationToken cancellationToken)
    {
        var (startUtc, endUtc) = AgendaTimeZone.LocalDayToUtcRange(date);

        var appointments = await dbContext.Appointments
            .AsNoTracking()
            .Where(a => a.ClinicId == clinicId
                && a.DeletedAt == null
                && a.StartsAt >= startUtc
                && a.StartsAt < endUtc)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var queueEntries = await dbContext.QueueEntries
            .AsNoTracking()
            .Where(q => q.ClinicId == clinicId && q.QueueDate == date)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var totalAppointments = appointments.Count;
        var scheduledCount = appointments.Count(a => a.Status == AppointmentStatus.Scheduled);
        var confirmedCount = appointments.Count(a => a.Status == AppointmentStatus.Confirmed);
        var attendedCount = appointments.Count(a => a.Status == AppointmentStatus.Attended);
        var noShowCount = appointments.Count(a => a.Status == AppointmentStatus.NoShow);
        var cancelledCount = appointments.Count(a => a.Status == AppointmentStatus.Cancelled);

        var nonCancelledCount = totalAppointments - cancelledCount;
        var attendanceRate = nonCancelledCount > 0
            ? Math.Round((double)attendedCount / nonCancelledCount * 100.0, 1)
            : 0.0;

        var queueWaitingCount = queueEntries.Count(q => q.Status is QueueStatus.Waiting or QueueStatus.Called);
        var queueInServiceCount = queueEntries.Count(q => q.Status == QueueStatus.InService);
        var queueCompletedCount = queueEntries.Count(q => q.Status == QueueStatus.Completed);

        var waitTimes = queueEntries
            .Where(q => q.CalledAt.HasValue && q.Status is QueueStatus.InService or QueueStatus.Completed)
            .Select(q => (q.CalledAt!.Value - q.ArrivedAt).TotalMinutes)
            .Where(m => m >= 0)
            .ToList();

        var averageWaitMinutes = waitTimes.Count > 0 ? Math.Round(waitTimes.Average(), 1) : 0.0;

        var professionals = await dbContext.Professionals
            .AsNoTracking()
            .Where(p => p.ClinicId == clinicId)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var rooms = await dbContext.Rooms
            .AsNoTracking()
            .Where(r => r.ClinicId == clinicId)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var professionalMetrics = professionals
            .Select(p =>
            {
                var pAppts = appointments.Where(a => a.ProfessionalId == p.Id).ToList();
                return new ProfessionalMetricResponse(
                    p.Id,
                    p.Name,
                    pAppts.Count,
                    pAppts.Count(a => a.Status == AppointmentStatus.Attended),
                    pAppts.Count(a => a.Status == AppointmentStatus.NoShow));
            })
            .Where(m => m.TotalAppointments > 0)
            .OrderByDescending(m => m.TotalAppointments)
            .ToList();

        var roomMetrics = rooms
            .Select(r => new RoomMetricResponse(
                r.Id,
                r.Name,
                appointments.Count(a => a.RoomId == r.Id && a.Status != AppointmentStatus.Cancelled)))
            .Where(r => r.AppointmentsCount > 0)
            .OrderByDescending(r => r.AppointmentsCount)
            .ToList();

        var patientIds = appointments.Select(a => a.PatientId).Distinct().ToList();
        var appointmentTypeIds = appointments.Select(a => a.AppointmentTypeId).Distinct().ToList();

        var patients = await dbContext.Patients
            .AsNoTracking()
            .Where(p => patientIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken)
            .ConfigureAwait(false);

        var typeNames = await dbContext.AppointmentTypes
            .AsNoTracking()
            .Where(t => appointmentTypeIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, t => t.Name, cancellationToken)
            .ConfigureAwait(false);

        var profDict = professionals.ToDictionary(p => p.Id, p => p.Name);
        var roomDict = rooms.ToDictionary(r => r.Id, r => r.Name);

        var upcomingAppointments = appointments
            .OrderBy(a => a.StartsAt)
            .Take(8)
            .Select(a => new UpcomingAppointmentResponse(
                a.Id,
                patients.GetValueOrDefault(a.PatientId, "Paciente"),
                profDict.GetValueOrDefault(a.ProfessionalId, "Profissional"),
                typeNames.GetValueOrDefault(a.AppointmentTypeId, "Consulta"),
                a.StartsAt,
                a.EndsAt,
                a.RoomId.HasValue ? roomDict.GetValueOrDefault(a.RoomId.Value) : null,
                a.Status.ToStoredValue()))
            .ToList();

        return new DashboardSummaryResponse(
            date,
            totalAppointments,
            scheduledCount,
            confirmedCount,
            attendedCount,
            noShowCount,
            cancelledCount,
            attendanceRate,
            queueWaitingCount,
            queueInServiceCount,
            queueCompletedCount,
            averageWaitMinutes,
            professionalMetrics,
            roomMetrics,
            upcomingAppointments);
    }
}
