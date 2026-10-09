using Canamed.Application.DoctorWorkspace;
using Canamed.Domain.MedicalRecords;
using Xunit;

namespace Canamed.UnitTests.MedicalRecords;

public sealed class DoctorWorkspaceTests
{
    [Fact]
    public void DoctorDashboardSummaryResponse_ConstroiCorretamenteComDadosDoDia()
    {
        var activeConsultation = new ActiveConsultationDto(
            QueueEntryId: Guid.NewGuid(),
            PatientId: Guid.NewGuid(),
            PatientName: "Dra. Maria Paciente",
            PatientBirthDate: new DateOnly(1990, 5, 20),
            Allergies: "Penicilina",
            ChronicConditions: null,
            HealthPlanName: "Unimed",
            Triage: null,
            MedicalRecord: null,
            StartedAt: DateTimeOffset.UtcNow);

        var upcomingAppointments = new List<DoctorDashboardAppointmentDto>
        {
            new(
                AppointmentId: Guid.NewGuid(),
                PatientId: Guid.NewGuid(),
                PatientName: "Ana Clara",
                StartsAt: DateTimeOffset.UtcNow.AddHours(1),
                EndsAt: DateTimeOffset.UtcNow.AddHours(1).AddMinutes(30),
                Status: "confirmado",
                AppointmentTypeName: "Consulta Ginecológica",
                ConsultationCategory: "primeira_vez",
                RoomName: "Consultório 1"),
            new(
                AppointmentId: Guid.NewGuid(),
                PatientId: Guid.NewGuid(),
                PatientName: "Juliana Mendes",
                StartsAt: DateTimeOffset.UtcNow.AddHours(2),
                EndsAt: DateTimeOffset.UtcNow.AddHours(2).AddMinutes(30),
                Status: "agendado",
                AppointmentTypeName: "Retorno",
                ConsultationCategory: "retorno",
                RoomName: "Consultório 1")
        };

        var response = new DoctorDashboardSummaryResponse(
            TodayTotalAppointments: 5,
            TodayWaitingCount: 1,
            TodayAttendedCount: 2,
            TodayNoShowCount: 0,
            PendingDraftRecordsCount: 1,
            ActiveConsultation: activeConsultation,
            UpcomingAppointments: upcomingAppointments);

        Assert.Equal(5, response.TodayTotalAppointments);
        Assert.Equal(1, response.TodayWaitingCount);
        Assert.Equal(2, response.TodayAttendedCount);
        Assert.Equal(0, response.TodayNoShowCount);
        Assert.Equal(1, response.PendingDraftRecordsCount);
        Assert.NotNull(response.ActiveConsultation);
        Assert.Equal("Dra. Maria Paciente", response.ActiveConsultation.PatientName);
        Assert.Equal(2, response.UpcomingAppointments.Count);
        Assert.Equal("primeira_vez", response.UpcomingAppointments[0].ConsultationCategory);
        Assert.Equal("retorno", response.UpcomingAppointments[1].ConsultationCategory);
    }
}
