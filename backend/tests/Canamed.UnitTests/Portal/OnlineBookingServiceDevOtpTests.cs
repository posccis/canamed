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
