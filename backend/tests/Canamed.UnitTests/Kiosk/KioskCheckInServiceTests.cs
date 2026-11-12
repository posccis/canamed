using Canamed.Application.Abstractions;
using Canamed.Application.Kiosk;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;
using Canamed.Domain.Clinics;
using Xunit;

namespace Canamed.UnitTests.Kiosk;

public sealed class KioskCheckInServiceTests
{
    private readonly DateTimeOffset _now = new(2026, 10, 26, 14, 0, 0, TimeSpan.FromHours(-3));
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _profId = Guid.NewGuid();
    private readonly Guid _patientId = Guid.NewGuid();

    [Theory]
    [InlineData("Maria")]
    [InlineData("123")]
    [InlineData("123456")] // 6 digits without birth date
    [InlineData("")]
    [InlineData("   ")]
    public async Task SearchTodayAppointmentsAsync_WithGenericTermOrMissingFactors_ThrowsArgumentException(string term)
    {
        var (service, auditRepo, _) = CreateService();

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.SearchTodayAppointmentsAsync(_clinicId, term, _now));

        Assert.Contains("Para sua segurança, digite seu CPF completo de 11 dígitos ou informe sua data de nascimento.", ex.Message);
        Assert.Contains(auditRepo.Events, e => e.Action == "KioskSearchDenied" && e.Details != null && e.Details.Contains("MissingRequiredFactors"));
    }

    [Fact]
    public async Task SearchTodayAppointmentsAsync_WithValid11DigitCpf_ReturnsMaskedPatientName()
    {
        var (service, _, _) = CreateService(patientName: "Maria Silva Santos", patientCpf: "12345678901", birthDate: new DateOnly(1994, 5, 18));

        var results = await service.SearchTodayAppointmentsAsync(_clinicId, "123.456.789-01", _now);

        Assert.Single(results);
        Assert.Equal("M**** S****", results[0].PatientMaskedName);
        Assert.DoesNotContain("Maria", results[0].PatientMaskedName);
        Assert.DoesNotContain("12345678901", results[0].PatientMaskedCpf);
    }

    [Fact]
    public async Task SearchTodayAppointmentsAsync_With6DigitCpfAndBirthDate_ReturnsMatchingAppointment()
    {
        var (service, _, _) = CreateService(patientName: "Maria Silva Santos", patientCpf: "12345678901", birthDate: new DateOnly(1994, 5, 18));

        var results = await service.SearchTodayAppointmentsAsync(
            _clinicId,
            cpf: null,
            cpfPartial: "123456",
            birthDate: new DateOnly(1994, 5, 18),
            _now);

        Assert.Single(results);
        Assert.Equal("M**** S****", results[0].PatientMaskedName);
    }

    private (KioskCheckInService Service, FakeAuditRepo AuditRepo, FakeAgendaRepo AgendaRepo) CreateService(
        string patientName = "Maria Silva Santos",
        string patientCpf = "12345678901",
        DateOnly? birthDate = null)
    {
        var patient = Patient.Create(
            _clinicId,
            patientName,
            "(81) 98888-7777",
            _now,
            id: _patientId,
            document: patientCpf,
            birthDate: birthDate ?? new DateOnly(1994, 5, 18));

        var prof = Professional.Create(
            _clinicId,
            "Dra. Helena Martins",
            _now,
            id: _profId,
            registrationNumber: "CRM/PE 12345");

        var apt = Appointment.Schedule(
            _clinicId,
            _profId,
            _patientId,
            Guid.NewGuid(),
            _now,
            30,
            _now);

        var agendaRepo = new FakeAgendaRepo([apt]);
        var catalogRepo = new FakeCatalogRepo([patient], [prof]);
        var queueRepo = new FakeQueueRepo();
        var auditRepo = new FakeAuditRepo();
        var unitOfWork = new FakeUnitOfWork();

        var service = new KioskCheckInService(queueRepo, agendaRepo, catalogRepo, auditRepo, unitOfWork);
        return (service, auditRepo, agendaRepo);
    }

    private sealed class FakeAgendaRepo(List<Appointment> appointments) : IAgendaRepository
    {
        public Task<IReadOnlyList<Appointment>> ListAppointmentsAsync(Guid clinicId, Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<Appointment>>(appointments);

        public Task<IReadOnlyList<ProfessionalBlock>> ListBlocksAsync(Guid clinicId, Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<ProfessionalBlock>>([]);

        public Task<Appointment?> FindAppointmentAsync(Guid appointmentId, Guid clinicId, CancellationToken cancellationToken)
            => Task.FromResult(appointments.FirstOrDefault(a => a.Id == appointmentId && a.ClinicId == clinicId));

        public Task<IReadOnlyList<Appointment>> ListAppointmentsByIdsAsync(Guid clinicId, IReadOnlyCollection<Guid> appointmentIds, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<Appointment>>(appointments.Where(a => appointmentIds.Contains(a.Id)).ToList());

        public Task<IReadOnlyList<Appointment>> ListAppointmentsByPatientAsync(Guid clinicId, Guid patientId, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<Appointment>>(appointments.Where(a => a.PatientId == patientId).ToList());

        public Task<IReadOnlyList<Appointment>> ListAppointmentsForUpdateAsync(Guid clinicId, Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<Appointment>>(appointments);

        public Task<bool> ProfessionalExistsAsync(Guid clinicId, Guid professionalId, CancellationToken cancellationToken) => Task.FromResult(true);

        public Task<bool> RoomHasOverlappingAppointmentAsync(Guid clinicId, Guid roomId, DateTimeOffset fromUtc, DateTimeOffset toUtc, Guid? exceptAppointmentId, CancellationToken cancellationToken)
            => Task.FromResult(false);

        public Task<bool> ProfessionalHasOverlappingAppointmentAsync(Guid clinicId, Guid professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, Guid? exceptAppointmentId, CancellationToken cancellationToken)
            => Task.FromResult(false);

        public void AddAppointment(Appointment appointment) => appointments.Add(appointment);
        public void AddBlock(ProfessionalBlock block) {}
        public Task<ProfessionalBlock?> FindBlockAsync(Guid clinicId, Guid professionalId, Guid blockId, CancellationToken cancellationToken) => Task.FromResult<ProfessionalBlock?>(null);
        public void RemoveBlock(ProfessionalBlock block) {}
        public Task LockProfessionalAgendaAsync(Guid professionalId, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class FakeCatalogRepo(List<Patient> patients, List<Professional> professionals) : ICatalogRepository
    {
        public Task<IReadOnlyList<Professional>> ListProfessionalsAsync(Guid clinicId, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<Professional>>(professionals);

        public Task<Professional?> FindProfessionalAsync(Guid clinicId, Guid professionalId, CancellationToken cancellationToken)
            => Task.FromResult(professionals.FirstOrDefault(p => p.Id == professionalId));

        public Task<IReadOnlyList<Specialty>> ListSpecialtiesAsync(Guid clinicId, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<Specialty>>([]);

        public Task<IReadOnlyList<Specialty>> ListSpecialtiesByIdsAsync(Guid clinicId, IReadOnlyCollection<Guid> specialtyIds, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<Specialty>>([]);

        public Task<Specialty?> FindSpecialtyAsync(Guid clinicId, Guid specialtyId, CancellationToken cancellationToken) => Task.FromResult<Specialty?>(null);

        public Task<bool> SpecialtyNameExistsAsync(Guid clinicId, string name, Guid? exceptSpecialtyId, CancellationToken cancellationToken) => Task.FromResult(false);

        public Task<bool> AppointmentTypeNameExistsAsync(Guid clinicId, string name, Guid? exceptAppointmentTypeId, CancellationToken cancellationToken) => Task.FromResult(false);

        public Task<bool> SpecialtyHasActiveLinksAsync(Guid clinicId, Guid specialtyId, CancellationToken cancellationToken) => Task.FromResult(false);

        public Task<IReadOnlyList<Patient>> ListPatientsAsync(Guid clinicId, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<Patient>>(patients);

        public Task<IReadOnlyList<Patient>> ListPatientsByIdsAsync(Guid clinicId, IReadOnlyCollection<Guid> patientIds, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<Patient>>(patients.Where(p => patientIds.Contains(p.Id)).ToList());

        public Task<Patient?> FindPatientAsync(Guid clinicId, Guid patientId, CancellationToken cancellationToken)
            => Task.FromResult(patients.FirstOrDefault(p => p.Id == patientId));

        public Task<bool> PatientPhoneExistsAsync(Guid clinicId, string phone, Guid? exceptPatientId, CancellationToken cancellationToken) => Task.FromResult(false);

        public Task<bool> PatientDocumentExistsAsync(Guid clinicId, string document, Guid? exceptPatientId, CancellationToken cancellationToken) => Task.FromResult(false);

        public Task<IReadOnlyList<AppointmentType>> ListAppointmentTypesAsync(Guid clinicId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<AppointmentType>>([]);

        public Task<IReadOnlyList<AppointmentType>> ListAppointmentTypesByIdsAsync(Guid clinicId, IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<AppointmentType>>([]);

        public Task<AppointmentType?> FindAppointmentTypeAsync(Guid clinicId, Guid id, CancellationToken cancellationToken) => Task.FromResult<AppointmentType?>(null);

        public Task<IReadOnlyList<Room>> ListRoomsAsync(Guid clinicId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Room>>([]);

        public Task<Room?> FindRoomAsync(Guid clinicId, Guid id, CancellationToken cancellationToken) => Task.FromResult<Room?>(null);

        public Task<bool> RoomNameExistsAsync(Guid clinicId, string name, Guid? exceptRoomId, CancellationToken cancellationToken) => Task.FromResult(false);

        public Task<IReadOnlyList<HealthPlan>> ListHealthPlansAsync(Guid clinicId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<HealthPlan>>([]);

        public Task<HealthPlan?> FindHealthPlanAsync(Guid clinicId, Guid id, CancellationToken cancellationToken) => Task.FromResult<HealthPlan?>(null);

        public Task<bool> HealthPlanNameExistsAsync(Guid clinicId, string name, Guid? exceptHealthPlanId, CancellationToken cancellationToken) => Task.FromResult(false);

        public void AddProfessional(Professional professional) => professionals.Add(professional);
        public void AddPatient(Patient patient) => patients.Add(patient);
        public void AddAppointmentType(AppointmentType appointmentType) {}
        public void AddSpecialty(Specialty specialty) {}
        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class FakeQueueRepo : IQueueRepository
    {
        public Task<IReadOnlyList<QueueEntry>> ListAsync(Guid clinicId, DateOnly date, Guid? professionalId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<QueueEntry>>([]);
        public Task<QueueEntry?> FindAsync(Guid clinicId, Guid entryId, CancellationToken cancellationToken) => Task.FromResult<QueueEntry?>(null);
        public Task<QueueEntry?> FindOpenByAppointmentAsync(Guid clinicId, Guid appointmentId, CancellationToken cancellationToken) => Task.FromResult<QueueEntry?>(null);
        public Task<IReadOnlyList<QueueEntry>> ListInServiceAsync(Guid clinicId, Guid? professionalId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<QueueEntry>>([]);
        public void Add(QueueEntry entry) {}
        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class FakeAuditRepo : IAuditRepository
    {
        public List<AuditEvent> Events { get; } = [];
        public void Add(AuditEvent auditEvent) => Events.Add(auditEvent);
        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        public Task<T> ExecuteInTransactionAsync<T>(Func<CancellationToken, Task<T>> operation, CancellationToken cancellationToken = default) => operation(cancellationToken);
    }
}
