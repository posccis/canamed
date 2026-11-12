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

    [Fact]
    public void ActiveConsultationDto_IncluiTipoSanguineoEFatorRhDoPaciente()
    {
        var active = new ActiveConsultationDto(
            QueueEntryId: Guid.NewGuid(),
            PatientId: Guid.NewGuid(),
            PatientName: "Maria Clara",
            PatientBirthDate: new DateOnly(1995, 3, 10),
            Allergies: null,
            ChronicConditions: null,
            HealthPlanName: null,
            Triage: null,
            MedicalRecord: null,
            StartedAt: DateTimeOffset.UtcNow,
            PatientBloodType: "O",
            PatientRhFactor: "Negativo");

        Assert.Equal("O", active.PatientBloodType);
        Assert.Equal("Negativo", active.PatientRhFactor);
    }
    [Fact]
    public void FinishConsultationRequest_SuportaPrazoDeRetornoProgramadoCFM1958()
    {
        var recordId = Guid.NewGuid();
        var queueId = Guid.NewGuid();

        var request = new FinishConsultationRequest(
            MedicalRecordId: recordId,
            QueueEntryId: queueId,
            PlannedReturnDays: 15,
            ReturnReason: "Avaliação de laudo citopatológico oncótico");

        Assert.Equal(recordId, request.MedicalRecordId);
        Assert.Equal(queueId, request.QueueEntryId);
        Assert.Equal(15, request.PlannedReturnDays);
        Assert.Equal("Avaliação de laudo citopatológico oncótico", request.ReturnReason);
    }

    [Theory]
    [InlineData(10, 0, "1º Trimestre")]
    [InlineData(26, 3, "2º Trimestre")]
    [InlineData(36, 0, "3º Trimestre")]
    public void ObstetricProtocolsService_ClassificaTrimestreCorretamente(int weeks, int days, string expectedTrimester)
    {
        var service = new Canamed.Application.MedicalRecords.Services.ObstetricProtocolsService();
        var protocol = service.GetProtocolForGestationalAge(weeks, days);

        Assert.Equal(expectedTrimester, protocol.Trimester);
    }

    [Fact]
    public void ObstetricProtocolsService_RecomendaTOTGEm24a28SemanasEDTpaApos20Semanas()
    {
        var service = new Canamed.Application.MedicalRecords.Services.ObstetricProtocolsService();
        var protocol = service.GetProtocolForGestationalAge(26, 0);

        Assert.Contains(protocol.RecommendedExams, e => e.Contains("TOTG"));
        Assert.Contains(protocol.RecommendedVaccines, v => v.Contains("dTpa"));
    }

    [Fact]
    public void ObstetricProtocolsService_RecomendaSwabStrepBEm35a37Semanas()
    {
        var service = new Canamed.Application.MedicalRecords.Services.ObstetricProtocolsService();
        var protocol = service.GetProtocolForGestationalAge(36, 0);

        Assert.Contains(protocol.RecommendedExams, e => e.Contains("Streptococcus") || e.Contains("Strep B"));
    }

}
