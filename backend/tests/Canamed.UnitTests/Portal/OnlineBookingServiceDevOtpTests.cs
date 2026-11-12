using Canamed.Application.Abstractions;
using Canamed.Application.Agenda;
using Canamed.Application.Auditing;
using Canamed.Application.Clinics;
using Canamed.Application.Notifications;
using Canamed.Application.Portal;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;
using Canamed.Domain.Clinics;
using Canamed.Domain.Notifications;
using Canamed.Domain.Portal;
using Canamed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace Canamed.UnitTests.Portal;

public sealed class OnlineBookingServiceDevOtpTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;

    [Fact]
    public async Task VerifyOtp_InDevelopment_AcceptsAnyCode_EvenWhenIncorrect()
    {
        var devEnv = new StubHostEnvironment(Environments.Development);
        var clinicId = Guid.NewGuid();

        var (otp, realPlainCode) = PatientOtpCode.Create("81999998888", "12345678900", _now);

        var portalRepo = new FakePortalRepository
        {
            ClinicId = clinicId,
            LatestOtp = otp,
            ExistingPatient = Patient.Create(clinicId, "Maria Silva", "81999998888", _now, document: "12345678900")
        };

        var service = CreateService(portalRepo, devEnv);

        var result = await service.VerifyOtpAsync(
            new VerifyOtpRequest("81999998888", "12345678900", "000000", clinicId),
            "127.0.0.1",
            "TestAgent",
            _now.AddMinutes(1));

        Assert.True(result.Success);
        Assert.NotNull(result.SessionToken);
        Assert.Equal("Autenticado com sucesso.", result.Message);
    }

    [Fact]
    public async Task VerifyOtp_InDevelopment_AcceptsAnyCode_EvenWhenNoOtpExists()
    {
        var devEnv = new StubHostEnvironment(Environments.Development);
        var clinicId = Guid.NewGuid();

        var portalRepo = new FakePortalRepository
        {
            ClinicId = clinicId,
            LatestOtp = null
        };

        var service = CreateService(portalRepo, devEnv);

        var result = await service.VerifyOtpAsync(
            new VerifyOtpRequest("81999998888", "12345678900", "999999", clinicId),
            "127.0.0.1",
            "TestAgent",
            _now);

        Assert.True(result.Success);
        Assert.NotNull(result.SessionToken);
        Assert.Equal("Autenticado com sucesso.", result.Message);
    }

    [Fact]
    public async Task VerifyOtp_InProduction_RejectsIncorrectCode()
    {
        var prodEnv = new StubHostEnvironment(Environments.Production);
        var clinicId = Guid.NewGuid();

        var (otp, realPlainCode) = PatientOtpCode.Create("81999998888", "12345678900", _now);

        var portalRepo = new FakePortalRepository
        {
            ClinicId = clinicId,
            LatestOtp = otp
        };

        var service = CreateService(portalRepo, prodEnv);

        var result = await service.VerifyOtpAsync(
            new VerifyOtpRequest("81999998888", "12345678900", "000000", clinicId),
            "127.0.0.1",
            "TestAgent",
            _now.AddMinutes(1));

        Assert.False(result.Success);
        Assert.Null(result.SessionToken);
        Assert.Equal("Código inválido ou expirado.", result.Message);
    }

    [Fact]
    public async Task VerifyOtp_WhenCpfExistsWithDifferentPhone_RejectsLoginAndDoesNotIssueSession()
    {
        var prodEnv = new StubHostEnvironment(Environments.Production);
        var clinicId = Guid.NewGuid();

        var options = new DbContextOptionsBuilder<CanamedDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new CanamedDbContext(options);

        var victimPatient = Patient.Create(clinicId, "Maria Silva", "(81) 99999-8888", _now, document: "123.456.789-00");
        dbContext.Patients.Add(victimPatient);

        var (otp, plainCode) = PatientOtpCode.Create("81977776666", "12345678900", _now);
        dbContext.PatientOtpCodes.Add(otp);
        await dbContext.SaveChangesAsync();

        var realPortalRepo = new PortalRepository(dbContext);
        var service = new OnlineBookingService(
            portalRepository: realPortalRepo,
            agendaRepository: null!,
            catalogRepository: new DummyCatalogRepository(),
            clinicOperationRepository: null!,
            messagingProvider: null!,
            auditRepository: new DummyAuditRepository(),
            unitOfWork: new PassThroughUnitOfWork(),
            environment: prodEnv);

        var result = await service.VerifyOtpAsync(
            new VerifyOtpRequest("81977776666", "12345678900", plainCode, clinicId),
            "127.0.0.1",
            "TestAgent",
            _now.AddMinutes(1));

        Assert.False(result.Success);
        Assert.Null(result.SessionToken);
        Assert.Null(result.PatientId);
        Assert.Equal(
            "O telefone informado não corresponde ao cadastro deste CPF. Utilize o telefone cadastrado ou contate a recepção da clínica.",
            result.Message);
    }

    [Fact]
    public async Task VerifyOtp_WhenPhoneExistsWithDifferentCpf_RejectsLoginAndDoesNotIssueSession()
    {
        var prodEnv = new StubHostEnvironment(Environments.Production);
        var clinicId = Guid.NewGuid();

        var options = new DbContextOptionsBuilder<CanamedDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new CanamedDbContext(options);

        var existingPatient = Patient.Create(clinicId, "Maria Silva", "(81) 99999-8888", _now, document: "123.456.789-00");
        dbContext.Patients.Add(existingPatient);

        var (otp, plainCode) = PatientOtpCode.Create("81999998888", "99988877766", _now);
        dbContext.PatientOtpCodes.Add(otp);
        await dbContext.SaveChangesAsync();

        var realPortalRepo = new PortalRepository(dbContext);
        var service = new OnlineBookingService(
            portalRepository: realPortalRepo,
            agendaRepository: null!,
            catalogRepository: new DummyCatalogRepository(),
            clinicOperationRepository: null!,
            messagingProvider: null!,
            auditRepository: new DummyAuditRepository(),
            unitOfWork: new PassThroughUnitOfWork(),
            environment: prodEnv);

        var result = await service.VerifyOtpAsync(
            new VerifyOtpRequest("81999998888", "99988877766", plainCode, clinicId),
            "127.0.0.1",
            "TestAgent",
            _now.AddMinutes(1));

        Assert.False(result.Success);
        Assert.Null(result.SessionToken);
        Assert.Null(result.PatientId);
        Assert.Equal("Este telefone já está vinculado a outro CPF cadastrado.", result.Message);
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_With60MinuteAppointmentType_Returns60MinSlotsAndBlocksOverlappingStartAt0930()
    {
        var clinicId = Guid.NewGuid();
        var specialtyId = Guid.NewGuid();
        var targetDate = new DateOnly(2026, 11, 10); // Tuesday
        var requestNow = new DateTimeOffset(2026, 11, 9, 12, 0, 0, TimeSpan.FromHours(-3));

        var options = new DbContextOptionsBuilder<CanamedDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new CanamedDbContext(options);

        var prof = Professional.Create(clinicId, "Dra. Helena", requestNow, specialtyId: specialtyId);
        var type60 = AppointmentType.Create(
            clinicId,
            "Inserção de DIU",
            AppointmentCategory.Single,
            AppointmentCoverage.Private,
            durationMinutes: 60,
            now: requestNow,
            specialtyId: specialtyId);

        var operatingHour = OperatingHour.Create(
            clinicId,
            targetDate.DayOfWeek,
            new TimeOnly(8, 0),
            new TimeOnly(12, 0),
            requestNow);

        // Existing appointment occupied from 10:00 to 10:30 (-03:00)
        var occupiedStart = new DateTimeOffset(targetDate.ToDateTime(new TimeOnly(10, 0)), TimeSpan.FromHours(-3));
        var existingAppointment = Appointment.Schedule(
            clinicId,
            prof.Id,
            Guid.NewGuid(),
            type60.Id,
            occupiedStart,
            durationMinutes: 30,
            now: requestNow);

        dbContext.Professionals.Add(prof);
        dbContext.AppointmentTypes.Add(type60);
        dbContext.OperatingHours.Add(operatingHour);
        dbContext.Appointments.Add(existingAppointment);
        await dbContext.SaveChangesAsync();

        var service = new OnlineBookingService(
            portalRepository: new PortalRepository(dbContext),
            agendaRepository: new AgendaRepository(dbContext),
            catalogRepository: new CatalogRepository(dbContext),
            clinicOperationRepository: new ClinicOperationRepository(dbContext),
            messagingProvider: null!,
            auditRepository: new DummyAuditRepository(),
            unitOfWork: new PassThroughUnitOfWork());

        var slots = await service.GetAvailableSlotsAsync(
            clinicId,
            specialtyId,
            prof.Id,
            targetDate,
            requestNow,
            CancellationToken.None,
            type60.Id);

        Assert.NotEmpty(slots);
        Assert.All(slots, s =>
        {
            Assert.Equal(60, s.DurationMinutes);
            Assert.Equal(TimeSpan.FromMinutes(60), s.EndsAt - s.StartsAt);
        });

        // 09:00 -> 10:00 is allowed (does not overlap 10:00 -> 10:30)
        var slot0900 = new DateTimeOffset(targetDate.ToDateTime(new TimeOnly(9, 0)), TimeSpan.FromHours(-3));
        Assert.Contains(slots, s => s.StartsAt == slot0900);

        // 09:30 -> 10:30 overlaps 10:00 -> 10:30, so it MUST be blocked
        var slot0930 = new DateTimeOffset(targetDate.ToDateTime(new TimeOnly(9, 30)), TimeSpan.FromHours(-3));
        Assert.DoesNotContain(slots, s => s.StartsAt == slot0930);

        // 10:00 -> 11:00 overlaps 10:00 -> 10:30, so it MUST be blocked
        var slot1000 = new DateTimeOffset(targetDate.ToDateTime(new TimeOnly(10, 0)), TimeSpan.FromHours(-3));
        Assert.DoesNotContain(slots, s => s.StartsAt == slot1000);

        // 10:30 -> 11:30 is allowed
        var slot1030 = new DateTimeOffset(targetDate.ToDateTime(new TimeOnly(10, 30)), TimeSpan.FromHours(-3));
        Assert.Contains(slots, s => s.StartsAt == slot1030);

        // 11:30 -> 12:30 exceeds 12:00 operating hours end, so it MUST NOT be returned
        var slot1130 = new DateTimeOffset(targetDate.ToDateTime(new TimeOnly(11, 30)), TimeSpan.FromHours(-3));
        Assert.DoesNotContain(slots, s => s.StartsAt == slot1130);
    }

    private static OnlineBookingService CreateService(FakePortalRepository portalRepo, IHostEnvironment env)
    {
        return new OnlineBookingService(
            portalRepository: portalRepo,
            agendaRepository: null!,
            catalogRepository: new DummyCatalogRepository(),
            clinicOperationRepository: null!,
            messagingProvider: null!,
            auditRepository: new DummyAuditRepository(),
            unitOfWork: new PassThroughUnitOfWork(),
            environment: env);
    }

    private sealed class StubHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "Canamed";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }

    private sealed class PassThroughUnitOfWork : IUnitOfWork
    {
        public Task<T> ExecuteInTransactionAsync<T>(Func<CancellationToken, Task<T>> operation, CancellationToken cancellationToken = default)
            => operation(cancellationToken);
    }

    private sealed class FakePortalRepository : IPortalRepository
    {
        public Guid ClinicId { get; set; }
        public PatientOtpCode? LatestOtp { get; set; }
        public Patient? ExistingPatient { get; set; }

        public Task SaveOtpAsync(PatientOtpCode code, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<PatientOtpCode?> GetLatestValidOtpAsync(string phone, string cpf, DateTimeOffset now, CancellationToken cancellationToken = default)
            => Task.FromResult(LatestOtp);
        public Task SaveSessionAsync(PatientPortalSession session, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<PatientPortalSession?> GetSessionAsync(string sessionToken, DateTimeOffset now, CancellationToken cancellationToken = default) => Task.FromResult<PatientPortalSession?>(null);
        public Task<Patient?> GetPatientByCpfOrPhoneAsync(string cpf, string phone, Guid? clinicId = null, CancellationToken cancellationToken = default)
            => Task.FromResult(ExistingPatient);
        public Task<Guid?> ResolveClinicIdAsync(Guid? preferred, CancellationToken cancellationToken = default) => Task.FromResult<Guid?>(ClinicId);
        public Task<int> GetPatientActiveAppointmentsCountAsync(Guid patientId, DateTimeOffset now, CancellationToken cancellationToken = default) => Task.FromResult(0);
        public Task<IReadOnlyList<Appointment>> GetPatientAppointmentsAsync(Guid patientId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<Appointment>>([]);
    }

    private sealed class DummyCatalogRepository : ICatalogRepository
    {
        public Task<IReadOnlyList<Professional>> ListProfessionalsAsync(Guid clinicId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Professional>>([]);
        public Task<Professional?> FindProfessionalAsync(Guid clinicId, Guid professionalId, CancellationToken cancellationToken) => Task.FromResult<Professional?>(null);
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
        public Task<Patient?> FindPatientAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken) => Task.FromResult<Patient?>(null);
        public Task<AppointmentType?> FindAppointmentTypeAsync(Guid clinicId, Guid appointmentTypeId, CancellationToken cancellationToken) => Task.FromResult<AppointmentType?>(null);
        public void AddProfessional(Professional professional) { }
        public void AddPatient(Patient patient) { }
        public void AddAppointmentType(AppointmentType appointmentType) { }
        public void AddSpecialty(Specialty specialty) { }
        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class DummyAuditRepository : IAuditRepository
    {
        public void Add(AuditEvent auditEvent) { }
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
