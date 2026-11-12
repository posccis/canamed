using Canamed.Application.Abstractions;
using Canamed.Application.MedicalRecords;
using Canamed.Application.Portal;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;
using Canamed.Domain.Clinics;
using Canamed.Domain.MedicalRecords;
using Canamed.Domain.Notifications;
using Canamed.Domain.Portal;
using Xunit;

namespace Canamed.UnitTests.Portal;

public sealed class PortalServiceTests
{
    [Fact]
    public async Task GetPrenatalSummaryAsync_WhenPatientIsRhNegative_ShouldReturnSummaryWithDumDppAndRhNegativeFlag()
    {
        // Arrange
        var now = new DateTimeOffset(2026, 10, 28, 12, 0, 0, TimeSpan.Zero);
        var clinicId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var sessionToken = "session-test-token-123";

        var session = PatientPortalSession.Start(patientId, now);
        var patient = Patient.Create(
            clinicId,
            "Juliana Silva",
            "11999999999",
            now,
            id: patientId,
            bloodType: "A",
            rhFactor: "Negativo");

        var dum = new DateOnly(2026, 4, 15);
        var visit = PrenatalVisitRecord.Create(
            clinicId,
            patientId,
            Guid.NewGuid(),
            visitDate: new DateOnly(2026, 10, 20),
            gestationalAgeWeeks: 28,
            gestationalAgeDays: 6,
            weightKg: 68.5,
            bloodPressure: "120/80",
            uterineHeightCm: 27.0,
            fetalHeartRateBpm: 140,
            fetalMovementPresent: true,
            edemaClassification: "Ausente",
            fetalPresentation: "Cefálico",
            clinicalNotes: "Evolução fisiológica adequada",
            now: now);

        var portalRepo = new FakePortalRepository
        {
            ClinicId = clinicId,
            Session = session
        };
        var catalogRepo = new FakeCatalogRepository
        {
            Patient = patient
        };
        var medicalRecordRepo = new FakeMedicalRecordRepository
        {
            Visits = [visit]
        };

        var service = new PortalService(
            portalRepo,
            new FakeAgendaRepository(),
            catalogRepo,
            medicalRecordRepo,
            new DummyAuditRepository(),
            new PassThroughUnitOfWork());

        // Act
        var result = await service.GetPrenatalSummaryAsync(sessionToken, now, dumOverride: dum);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(patientId, result.PatientId);
        Assert.Equal("Juliana Silva", result.PatientName);
        Assert.Equal(dum, result.LastMenstrualPeriod);
        Assert.NotNull(result.EstimatedDueDate);
        Assert.True(result.IsRhNegative, "Deve indicar Rh negativo quando RhFactor for 'Negativo' ou tipagem negativa");
        Assert.Equal("A", result.BloodType);
        Assert.Equal("Negativo", result.RhFactor);
        Assert.NotEmpty(result.Visits);
        Assert.Equal(28, result.Visits[0].GestationalWeeks);
        Assert.Contains("Berinjela", result.FetalMilestoneName);
    }

    [Fact]
    public async Task GetPrenatalSummaryAsync_WhenPatientIsRhPositive_ShouldNotBeRhNegative()
    {
        // Arrange
        var now = new DateTimeOffset(2026, 10, 28, 12, 0, 0, TimeSpan.Zero);
        var clinicId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var sessionToken = "session-test-token-pos";

        var session = PatientPortalSession.Start(patientId, now);
        var patient = Patient.Create(
            clinicId,
            "Larissa Manoela",
            "11988887777",
            now,
            id: patientId,
            bloodType: "O+",
            rhFactor: "Positivo");

        var portalRepo = new FakePortalRepository { ClinicId = clinicId, Session = session };
        var catalogRepo = new FakeCatalogRepository { Patient = patient };
        var medicalRecordRepo = new FakeMedicalRecordRepository { Visits = [] };

        var service = new PortalService(
            portalRepo,
            new FakeAgendaRepository(),
            catalogRepo,
            medicalRecordRepo,
            new DummyAuditRepository(),
            new PassThroughUnitOfWork());

        // Act
        var result = await service.GetPrenatalSummaryAsync(sessionToken, now);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.IsRhNegative);
        Assert.Equal("O+", result.BloodType);
    }

    [Fact]
    public async Task BookGuestAppointmentAsync_ShouldRecordSymptomsAllergiesAndPregnancyStatus()
    {
        // Arrange
        var now = new DateTimeOffset(2026, 10, 28, 12, 0, 0, TimeSpan.Zero);
        var clinicId = Guid.NewGuid();
        var professionalId = Guid.NewGuid();
        var appointmentTypeId = Guid.NewGuid();
        var startsAt = now.AddHours(3);

        var doctor = Professional.Create(clinicId, "Dra. Camila Santos", now, id: professionalId, registrationNumber: "CRM/SP 123456");
        var apptType = AppointmentType.Create(clinicId, "Consulta Avulsa Telemedicina", AppointmentCategory.Single, AppointmentCoverage.Private, 30, now, id: appointmentTypeId);

        var portalRepo = new FakePortalRepository { ClinicId = clinicId };
        var catalogRepo = new FakeCatalogRepository
        {
            Professional = doctor,
            AppointmentType = apptType
        };
        var agendaRepo = new FakeAgendaRepository();

        var service = new PortalService(
            portalRepo,
            agendaRepo,
            catalogRepo,
            new FakeMedicalRecordRepository(),
            new DummyAuditRepository(),
            new PassThroughUnitOfWork());

        var request = new BookGuestAppointmentRequest(
            ClinicId: clinicId,
            ProfessionalId: professionalId,
            StartsAt: startsAt,
            PatientName: "Mariana Costa",
            Cpf: "123.456.789-00",
            Phone: "(11) 98765-4321",
            BirthDate: new DateOnly(1994, 5, 12),
            Symptoms: "Cólicas leves e náusea matinal",
            Allergies: "Dipirona, Anti-inflamatórios (AINEs)",
            IsPregnant: true,
            WantsInvoice: true,
            AppointmentTypeId: appointmentTypeId);

        // Act
        var response = await service.BookGuestAppointmentAsync(request, now);

        // Assert
        Assert.NotNull(response);
        Assert.NotEqual(Guid.Empty, response.AppointmentId);
        Assert.Equal("Dra. Camila Santos", response.DoctorName);
        Assert.NotNull(agendaRepo.AddedAppointment);
        Assert.Equal("guest", agendaRepo.AddedAppointment.Origin);
        Assert.NotNull(agendaRepo.AddedAppointment.ClinicalPreAnamnesis);
        Assert.Contains("Dipirona", agendaRepo.AddedAppointment.ClinicalPreAnamnesis);
        Assert.Contains("Gestante: Sim", agendaRepo.AddedAppointment.ClinicalPreAnamnesis);
        Assert.Contains("Cólicas leves", agendaRepo.AddedAppointment.ClinicalPreAnamnesis);
        Assert.Contains("Nota Fiscal Solicitada: Sim", agendaRepo.AddedAppointment.ClinicalPreAnamnesis);
    }

    [Fact]
    public async Task DownloadPrenatalCardPdfAsync_ShouldReturnPdfByteArray()
    {
        // Arrange
        var now = new DateTimeOffset(2026, 10, 28, 12, 0, 0, TimeSpan.Zero);
        var clinicId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var sessionToken = "session-pdf-token";

        var session = PatientPortalSession.Start(patientId, now);
        var patient = Patient.Create(clinicId, "Juliana Silva", "11999999999", now, id: patientId);

        var portalRepo = new FakePortalRepository { ClinicId = clinicId, Session = session };
        var catalogRepo = new FakeCatalogRepository { Patient = patient };
        var medicalRecordRepo = new FakeMedicalRecordRepository { Visits = [] };

        var service = new PortalService(
            portalRepo,
            new FakeAgendaRepository(),
            catalogRepo,
            medicalRecordRepo,
            new DummyAuditRepository(),
            new PassThroughUnitOfWork());

        // Act
        var pdfBytes = await service.DownloadPrenatalCardPdfAsync(sessionToken, now);

        // Assert
        Assert.NotNull(pdfBytes);
        Assert.True(pdfBytes.Length > 0);
    }

    // --- Test Doubles & Fakes ---

    private sealed class PassThroughUnitOfWork : IUnitOfWork
    {
        public Task<T> ExecuteInTransactionAsync<T>(Func<CancellationToken, Task<T>> operation, CancellationToken cancellationToken = default)
            => operation(cancellationToken);
    }

    private sealed class FakePortalRepository : IPortalRepository
    {
        public Guid ClinicId { get; set; }
        public PatientPortalSession? Session { get; set; }
        public Patient? Patient { get; set; }

        public Task SaveOtpAsync(PatientOtpCode code, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<PatientOtpCode?> GetLatestValidOtpAsync(string phone, string cpf, DateTimeOffset now, CancellationToken cancellationToken = default) => Task.FromResult<PatientOtpCode?>(null);
        public Task SaveSessionAsync(PatientPortalSession session, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<PatientPortalSession?> GetSessionAsync(string sessionToken, DateTimeOffset now, CancellationToken cancellationToken = default) => Task.FromResult(Session);
        public Task<Patient?> GetPatientByCpfOrPhoneAsync(string cpf, string phone, Guid? clinicId = null, CancellationToken cancellationToken = default) => Task.FromResult(Patient);
        public Task<Guid?> ResolveClinicIdAsync(Guid? preferred, CancellationToken cancellationToken = default) => Task.FromResult<Guid?>(ClinicId);
        public Task<int> GetPatientActiveAppointmentsCountAsync(Guid patientId, DateTimeOffset now, CancellationToken cancellationToken = default) => Task.FromResult(0);
        public Task<IReadOnlyList<Appointment>> GetPatientAppointmentsAsync(Guid patientId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<Appointment>>([]);
    }

    private sealed class FakeCatalogRepository : ICatalogRepository
    {
        public Professional? Professional { get; set; }
        public AppointmentType? AppointmentType { get; set; }
        public Patient? Patient { get; set; }

        public Task<IReadOnlyList<Professional>> ListProfessionalsAsync(Guid clinicId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Professional>>([]);
        public Task<Professional?> FindProfessionalAsync(Guid clinicId, Guid professionalId, CancellationToken cancellationToken) => Task.FromResult(Professional);
        public Task<IReadOnlyList<Specialty>> ListSpecialtiesAsync(Guid clinicId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Specialty>>([]);
        public Task<IReadOnlyList<Specialty>> ListSpecialtiesByIdsAsync(Guid clinicId, IReadOnlyCollection<Guid> specialtyIds, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Specialty>>([]);
        public Task<Specialty?> FindSpecialtyAsync(Guid clinicId, Guid specialtyId, CancellationToken cancellationToken) => Task.FromResult<Specialty?>(null);
        public Task<bool> SpecialtyNameExistsAsync(Guid clinicId, string name, Guid? exceptSpecialtyId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> AppointmentTypeNameExistsAsync(Guid clinicId, string name, Guid? exceptAppointmentTypeId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> SpecialtyHasActiveLinksAsync(Guid clinicId, Guid specialtyId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<IReadOnlyList<Patient>> ListPatientsAsync(Guid clinicId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Patient>>([]);
        public Task<IReadOnlyList<Patient>> ListPatientsByIdsAsync(Guid clinicId, IReadOnlyCollection<Guid> patientIds, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Patient>>([]);
        public Task<IReadOnlyList<AppointmentType>> ListAppointmentTypesAsync(Guid clinicId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<AppointmentType>>([]);
        public Task<IReadOnlyList<AppointmentType>> ListAppointmentTypesByIdsAsync(Guid clinicId, IReadOnlyCollection<Guid> appointmentTypeIds, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<AppointmentType>>([]);
        public Task<Patient?> FindPatientAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken) => Task.FromResult(Patient);
        public Task<AppointmentType?> FindAppointmentTypeAsync(Guid clinicId, Guid appointmentTypeId, CancellationToken cancellationToken) => Task.FromResult(AppointmentType);
        public void AddProfessional(Professional professional) { }
        public void AddPatient(Patient patient) { Patient = patient; }
        public void AddAppointmentType(AppointmentType appointmentType) { }
        public void AddSpecialty(Specialty specialty) { }
        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class FakeAgendaRepository : IAgendaRepository
    {
        public Appointment? AddedAppointment { get; private set; }

        public Task<IReadOnlyList<Appointment>> ListAppointmentsAsync(Guid clinicId, Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Appointment>>([]);
        public Task<IReadOnlyList<ProfessionalBlock>> ListBlocksAsync(Guid clinicId, Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<ProfessionalBlock>>([]);
        public Task<Appointment?> FindAppointmentAsync(Guid appointmentId, Guid clinicId, CancellationToken cancellationToken) => Task.FromResult<Appointment?>(null);
        public Task<IReadOnlyList<Appointment>> ListAppointmentsByIdsAsync(Guid clinicId, IReadOnlyCollection<Guid> appointmentIds, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Appointment>>([]);
        public Task<IReadOnlyList<Appointment>> ListAppointmentsByPatientAsync(Guid clinicId, Guid patientId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Appointment>>([]);
        public Task<IReadOnlyList<Appointment>> ListAppointmentsForUpdateAsync(Guid clinicId, Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Appointment>>([]);
        public Task<bool> ProfessionalExistsAsync(Guid clinicId, Guid professionalId, CancellationToken cancellationToken) => Task.FromResult(true);
        public Task<bool> RoomHasOverlappingAppointmentAsync(Guid clinicId, Guid roomId, DateTimeOffset fromUtc, DateTimeOffset toUtc, Guid? exceptAppointmentId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> ProfessionalHasOverlappingAppointmentAsync(Guid clinicId, Guid professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, Guid? exceptAppointmentId, CancellationToken cancellationToken) => Task.FromResult(false);
        public void AddAppointment(Appointment appointment) { AddedAppointment = appointment; }
        public void AddBlock(ProfessionalBlock block) { }
        public Task<ProfessionalBlock?> FindBlockAsync(Guid clinicId, Guid professionalId, Guid blockId, CancellationToken cancellationToken) => Task.FromResult<ProfessionalBlock?>(null);
        public void RemoveBlock(ProfessionalBlock block) { }
        public Task LockProfessionalAgendaAsync(Guid professionalId, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class FakeMedicalRecordRepository : IMedicalRecordRepository
    {
        public IReadOnlyList<PrenatalVisitRecord> Visits { get; set; } = [];
        public GynecologicalProfile? GynProfile { get; set; }

        public Task<MedicalRecord?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default) => Task.FromResult<MedicalRecord?>(null);
        public Task<MedicalRecord?> GetByAppointmentIdAsync(Guid appointmentId, Guid clinicId, CancellationToken cancellationToken = default) => Task.FromResult<MedicalRecord?>(null);
        public Task<IReadOnlyList<MedicalRecord>> GetHistoryByPatientIdAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<MedicalRecord>>([]);
        public Task AddAsync(MedicalRecord record, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task UpdateAsync(MedicalRecord record, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<GynecologicalProfile?> GetGynecologicalProfileAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default) => Task.FromResult(GynProfile);
        public Task SaveGynecologicalProfileAsync(GynecologicalProfile profile, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<GynecologicalConsultationData?> GetGynecologicalConsultationDataAsync(Guid medicalRecordId, CancellationToken cancellationToken = default) => Task.FromResult<GynecologicalConsultationData?>(null);
        public Task SaveGynecologicalConsultationDataAsync(GynecologicalConsultationData data, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IReadOnlyList<PreventiveScreeningRecord>> ListScreeningsByPatientAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<PreventiveScreeningRecord>>([]);
        public Task AddScreeningAsync(PreventiveScreeningRecord record, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddExamAttachmentAsync(PatientExamAttachment attachment, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<PatientExamAttachment?> GetExamAttachmentByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default) => Task.FromResult<PatientExamAttachment?>(null);
        public Task<IReadOnlyList<PatientExamAttachment>> ListExamAttachmentsByPatientAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<PatientExamAttachment>>([]);
        public Task UpdateExamAttachmentAsync(PatientExamAttachment attachment, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<int> CountPendingDraftsAsync(Guid clinicId, Guid? doctorId, CancellationToken cancellationToken = default) => Task.FromResult(0);
        public Task<IReadOnlyList<MedicalRecord>> ListPendingDraftsAsync(Guid clinicId, Guid? doctorId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<MedicalRecord>>([]);
        public Task AddPrenatalVisitAsync(PrenatalVisitRecord record, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IReadOnlyList<PrenatalVisitRecord>> ListPrenatalVisitsByPatientAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default) => Task.FromResult(Visits);
        public Task AddLarcPlacementAsync(LarcPlacementRecord record, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<LarcPlacementRecord?> GetLarcPlacementByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default) => Task.FromResult<LarcPlacementRecord?>(null);
        public Task<IReadOnlyList<LarcPlacementRecord>> ListLarcPlacementsByPatientAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<LarcPlacementRecord>>([]);
        public Task UpdateLarcPlacementAsync(LarcPlacementRecord record, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class DummyAuditRepository : IAuditRepository
    {
        public void Add(AuditEvent auditEvent) { }
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
