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
public sealed class CanamedDbContext(DbContextOptions<CanamedDbContext> options) : DbContext(options)
{
    public DbSet<Clinic> Clinics => Set<Clinic>();

    public DbSet<Professional> Professionals => Set<Professional>();

    public DbSet<Patient> Patients => Set<Patient>();

    public DbSet<AppointmentType> AppointmentTypes => Set<AppointmentType>();

    public DbSet<Specialty> Specialties => Set<Specialty>();

    public DbSet<Appointment> Appointments => Set<Appointment>();

    public DbSet<ProfessionalBlock> ProfessionalBlocks => Set<ProfessionalBlock>();

    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    public DbSet<User> Users => Set<User>();

    public DbSet<ClinicMembership> ClinicMemberships => Set<ClinicMembership>();

    public DbSet<UserSession> UserSessions => Set<UserSession>();

    public DbSet<LoginChallenge> LoginChallenges => Set<LoginChallenge>();

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
