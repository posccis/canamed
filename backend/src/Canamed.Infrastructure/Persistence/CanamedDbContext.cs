using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;
using Canamed.Domain.Clinics;
using Canamed.Domain.Identity;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

/// <summary>
/// Contexto de acesso a dados do CANAMED. As tabelas seguem as convenções da seção 7 da SPEC-0001:
/// nomes em <c>snake_case</c>, chave primária <c>id</c> (UUID) e carimbos de tempo em UTC.
/// </summary>
public sealed class CanamedDbContext : DbContext
{
    public CanamedDbContext(
        DbContextOptions<CanamedDbContext> options,
        Canamed.Application.Abstractions.ISecretProtector? secretProtector = null)
        : base(options)
    {
        if (secretProtector is not null)
        {
            Canamed.Infrastructure.Persistence.Converters.EncryptedStringConverter.AmbientProtector ??= secretProtector;
        }
    }
    public DbSet<Clinic> Clinics => Set<Clinic>();

    public DbSet<Professional> Professionals => Set<Professional>();

    public DbSet<Patient> Patients => Set<Patient>();

    public DbSet<AppointmentType> AppointmentTypes => Set<AppointmentType>();

    public DbSet<Specialty> Specialties => Set<Specialty>();

    public DbSet<HealthPlan> HealthPlans => Set<HealthPlan>();

    public DbSet<Room> Rooms => Set<Room>();

    public DbSet<OperatingHour> OperatingHours => Set<OperatingHour>();

    public DbSet<ClinicClosure> ClinicClosures => Set<ClinicClosure>();

    public DbSet<Appointment> Appointments => Set<Appointment>();

    public DbSet<ProfessionalBlock> ProfessionalBlocks => Set<ProfessionalBlock>();

    public DbSet<QueueEntry> QueueEntries => Set<QueueEntry>();

    public DbSet<Canamed.Domain.Payments.PaymentTransaction> PaymentTransactions => Set<Canamed.Domain.Payments.PaymentTransaction>();

    public DbSet<Canamed.Domain.Queue.TriageRecord> TriageRecords => Set<Canamed.Domain.Queue.TriageRecord>();

    public DbSet<Canamed.Domain.MedicalRecords.MedicalRecord> MedicalRecords => Set<Canamed.Domain.MedicalRecords.MedicalRecord>();

    public DbSet<Canamed.Domain.MedicalRecords.MedicalRecordAddendum> MedicalRecordAddenda => Set<Canamed.Domain.MedicalRecords.MedicalRecordAddendum>();

    public DbSet<Canamed.Domain.MedicalRecords.GynecologicalProfile> GynecologicalProfiles => Set<Canamed.Domain.MedicalRecords.GynecologicalProfile>();

    public DbSet<Canamed.Domain.MedicalRecords.PreventiveScreeningRecord> PreventiveScreeningRecords => Set<Canamed.Domain.MedicalRecords.PreventiveScreeningRecord>();

    public DbSet<Canamed.Domain.MedicalRecords.GynecologicalConsultationData> GynecologicalConsultationData => Set<Canamed.Domain.MedicalRecords.GynecologicalConsultationData>();
    public DbSet<Canamed.Domain.MedicalRecords.PrenatalVisitRecord> PrenatalVisitRecords => Set<Canamed.Domain.MedicalRecords.PrenatalVisitRecord>();

    public DbSet<Canamed.Domain.MedicalRecords.PatientExamAttachment> PatientExamAttachments => Set<Canamed.Domain.MedicalRecords.PatientExamAttachment>();

    public DbSet<Canamed.Domain.MedicalDocuments.MedicalDocument> MedicalDocuments => Set<Canamed.Domain.MedicalDocuments.MedicalDocument>();

    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    public DbSet<User> Users => Set<User>();

    public DbSet<ClinicMembership> ClinicMemberships => Set<ClinicMembership>();

    public DbSet<UserSession> UserSessions => Set<UserSession>();

    public DbSet<LoginChallenge> LoginChallenges => Set<LoginChallenge>();

    public DbSet<Canamed.Domain.Notifications.AppointmentNotification> AppointmentNotifications => Set<Canamed.Domain.Notifications.AppointmentNotification>();

    public DbSet<Canamed.Domain.Notifications.PatientCommunicationPreference> PatientCommunicationPreferences => Set<Canamed.Domain.Notifications.PatientCommunicationPreference>();

    public DbSet<Canamed.Domain.Portal.PatientOtpCode> PatientOtpCodes => Set<Canamed.Domain.Portal.PatientOtpCode>();

    public DbSet<Canamed.Domain.Portal.PatientPortalSession> PatientPortalSessions => Set<Canamed.Domain.Portal.PatientPortalSession>();

    public DbSet<Canamed.Domain.Portal.PatientCapabilityToken> PatientCapabilityTokens => Set<Canamed.Domain.Portal.PatientCapabilityToken>();
    public DbSet<Canamed.Domain.Portal.PatientRegistrationDraft> PatientRegistrationDrafts => Set<Canamed.Domain.Portal.PatientRegistrationDraft>();

    public DbSet<Canamed.Domain.MedicalDocuments.MedicalDocumentAccessLog> MedicalDocumentAccessLogs => Set<Canamed.Domain.MedicalDocuments.MedicalDocumentAccessLog>();

    public DbSet<Canamed.Domain.Privacy.PrivacyRequest> PrivacyRequests => Set<Canamed.Domain.Privacy.PrivacyRequest>();

    public DbSet<Canamed.Domain.Privacy.PrivacyConsent> PrivacyConsents => Set<Canamed.Domain.Privacy.PrivacyConsent>();
    public DbSet<Canamed.Domain.CashRegister.CashSession> CashSessions => Set<Canamed.Domain.CashRegister.CashSession>();
    public DbSet<Canamed.Domain.CashRegister.CashMovement> CashMovements => Set<Canamed.Domain.CashRegister.CashMovement>();
    public DbSet<Canamed.Domain.Queue.QueueCallEvent> QueueCallEvents => Set<Canamed.Domain.Queue.QueueCallEvent>();
    public DbSet<Canamed.Domain.Financial.MedicalPayoutContract> MedicalPayoutContracts => Set<Canamed.Domain.Financial.MedicalPayoutContract>();
    public DbSet<Canamed.Domain.Financial.MedicalPayoutBatch> MedicalPayoutBatches => Set<Canamed.Domain.Financial.MedicalPayoutBatch>();
    public DbSet<Canamed.Domain.Financial.MedicalPayoutItem> MedicalPayoutItems => Set<Canamed.Domain.Financial.MedicalPayoutItem>();
    public DbSet<Canamed.Domain.Financial.FinancialTransaction> FinancialTransactions => Set<Canamed.Domain.Financial.FinancialTransaction>();
    public DbSet<Canamed.Domain.Inventory.InventoryItem> InventoryItems => Set<Canamed.Domain.Inventory.InventoryItem>();
    public DbSet<Canamed.Domain.Inventory.InventoryMovement> InventoryMovements => Set<Canamed.Domain.Inventory.InventoryMovement>();
    public DbSet<Canamed.Domain.Clinics.ClinicPolicy> ClinicPolicies => Set<Canamed.Domain.Clinics.ClinicPolicy>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        ArgumentNullException.ThrowIfNull(optionsBuilder);
        optionsBuilder.AddInterceptors(new Canamed.Infrastructure.Persistence.Interceptors.ImmutableRecordsInterceptor());
        base.OnConfiguring(optionsBuilder);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        // Necessário para a restrição de exclusão que garante RN-001 no banco.
        modelBuilder.HasPostgresExtension("btree_gist");

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CanamedDbContext).Assembly);
        modelBuilder.ApplySnakeCaseColumnNames();

        base.OnModelCreating(modelBuilder);
    }
}
