using Canamed.Application.Abstractions;
using Canamed.Application.Identity;
using Canamed.Domain.Agenda;
using Canamed.Domain.Clinics;
using Canamed.Domain.Identity;
using Canamed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Canamed.Infrastructure.Development;

/// <summary>
/// Cria dados sintéticos de demonstração no ambiente de desenvolvimento (ADR-0003), permitindo operar
/// a agenda imediatamente após a primeira execução. Nunca é executado fora de Development e nunca usa
/// dados reais. A senha do primeiro gestor vem da configuração de ambiente, jamais do código (RN-019).
/// </summary>
public static class DevelopmentDataSeeder
{
    /// <summary>Semeia catálogo mínimo e o primeiro usuário gestor, quando ainda não existirem.</summary>
    public static async Task SeedAsync(
        IServiceProvider services,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(logger);

        using var scope = services.CreateScope();

        try
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<CanamedDbContext>();
            var now = TimeProvider.System.GetUtcNow();

            await SeedCatalogAsync(dbContext, now, logger, cancellationToken).ConfigureAwait(false);
            await SeedFirstUserAsync(scope.ServiceProvider, dbContext, now, logger, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            // A ausência de banco não impede a API de subir em desenvolvimento; o endpoint de
            // prontidão continua reportando a indisponibilidade.
            logger.LogWarning(exception, "Não foi possível semear os dados sintéticos de desenvolvimento.");
        }
    }

    private static async Task SeedCatalogAsync(
        CanamedDbContext dbContext,
        DateTimeOffset now,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var existingClinic = await dbContext.Clinics
            .OrderBy(item => item.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        if (existingClinic is not null)
        {
            // Bancos já existentes recebem apenas o que falta da classificação assistencial
            // (SPEC-0004), sem duplicar catálogo nem sobrescrever dados do desenvolvedor.
            await EnsureDemoClassificationAsync(dbContext, existingClinic.Id, now, cancellationToken)
                .ConfigureAwait(false);

            return;
        }

        dbContext.Clinics.Add(Clinic.Create(
            "Clínica Demonstração (dados sintéticos)",
            now,
            DevelopmentDefaults.DemoClinicId));

        dbContext.Professionals.Add(Professional.Create(
            DevelopmentDefaults.DemoClinicId,
            "Dra. Ana Ribeiro (sintética)",
            now,
            DevelopmentDefaults.DemoProfessionalId,
            DevelopmentDefaults.DemoGeneralPracticeSpecialtyId));

        dbContext.Patients.Add(Patient.Create(
            DevelopmentDefaults.DemoClinicId,
            "Paciente Sintético Um",
            "(81) 90000-0001",
            now,
            DevelopmentDefaults.DemoPatientId,
            "paciente.sintetico@canamed.local",
            new DateOnly(1988, 5, 20)));

        dbContext.AppointmentTypes.AddRange(
            AppointmentType.Create(
                DevelopmentDefaults.DemoClinicId,
                "Consulta avulsa",
                AppointmentCategory.Single,
                AppointmentCoverage.Private,
                30,
                now,
                id: DevelopmentDefaults.DemoConsultationTypeId),
            AppointmentType.Create(
                DevelopmentDefaults.DemoClinicId,
                "Retorno",
                AppointmentCategory.FollowUp,
                AppointmentCoverage.Private,
                15,
                now,
                id: DevelopmentDefaults.DemoFollowUpTypeId),
            AppointmentType.Create(
                DevelopmentDefaults.DemoClinicId,
                "Avaliação",
                AppointmentCategory.Single,
                AppointmentCoverage.Private,
                60,
                now,
                id: DevelopmentDefaults.DemoAssessmentTypeId));

        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await EnsureDemoClassificationAsync(dbContext, DevelopmentDefaults.DemoClinicId, now, cancellationToken)
            .ConfigureAwait(false);

        logger.LogInformation(
            "Dados sintéticos de desenvolvimento criados para a clínica {ClinicId}.",
            DevelopmentDefaults.DemoClinicId);
    }

    /// <summary>Garante as especialidades e tipos classificados de demonstração (SPEC-0004).</summary>
    private static async Task EnsureDemoClassificationAsync(
        CanamedDbContext dbContext,
        Guid clinicId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var existingSpecialties = await dbContext.Specialties
            .Where(specialty => specialty.ClinicId == clinicId)
            .Select(specialty => specialty.Id)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var specialties = new (Guid Id, string Name)[]
        {
            (DevelopmentDefaults.DemoGeneralPracticeSpecialtyId, "Clínica Geral"),
            (DevelopmentDefaults.DemoOrthopedicsSpecialtyId, "Ortopedia"),
            (DevelopmentDefaults.DemoGynecologySpecialtyId, "Ginecologia"),
        };

        var missingSpecialties = specialties.Where(item => !existingSpecialties.Contains(item.Id)).ToArray();

        foreach (var (id, name) in missingSpecialties)
        {
            dbContext.Specialties.Add(Specialty.Create(clinicId, name, now, id));
        }

        if (missingSpecialties.Length > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        if (await dbContext.AppointmentTypes
                .AnyAsync(
                    type => type.ClinicId == clinicId && type.Id == DevelopmentDefaults.DemoFollowUpHealthPlanTypeId,
                    cancellationToken)
                .ConfigureAwait(false))
        {
            return;
        }

        dbContext.AppointmentTypes.AddRange(
            AppointmentType.Create(
                clinicId,
                "Acompanhamento por convênio",
                AppointmentCategory.FollowUp,
                AppointmentCoverage.HealthPlan,
                30,
                now,
                id: DevelopmentDefaults.DemoFollowUpHealthPlanTypeId),
            AppointmentType.Create(
                clinicId,
                "Avaliação ortopédica",
                AppointmentCategory.Single,
                AppointmentCoverage.Private,
                60,
                now,
                specialtyId: DevelopmentDefaults.DemoOrthopedicsSpecialtyId,
                id: DevelopmentDefaults.DemoOrthopedicAssessmentTypeId));

        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedFirstUserAsync(
        IServiceProvider services,
        CanamedDbContext dbContext,
        DateTimeOffset now,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        if (await dbContext.Users.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            return;
        }

        var configuration = services.GetRequiredService<IConfiguration>();
        var email = configuration["Canamed:Development:SeedUserEmail"];
        var password = configuration["Canamed:Development:SeedUserPassword"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password) || !User.IsValidEmail(email))
        {
            logger.LogWarning(
                "Nenhum usuário cadastrado. Defina Canamed__Development__SeedUserEmail e "
                + "Canamed__Development__SeedUserPassword no .env para criar o primeiro gestor.");

            return;
        }

        var clinic = await dbContext.Clinics
            .OrderBy(item => item.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        if (clinic is null)
        {
            return;
        }

        var professional = await dbContext.Professionals
            .Where(item => item.ClinicId == clinic.Id)
            .OrderBy(item => item.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        var hasher = services.GetRequiredService<IPasswordHasher>();
        var user = User.Create("Gestor (desenvolvimento)", email, hasher.Hash(password), now);

        dbContext.Users.Add(user);
        dbContext.ClinicMemberships.Add(ClinicMembership.Create(
            user.Id,
            clinic.Id,
            Roles.Manager,
            professional?.Id,
            now));

        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        logger.LogInformation("Primeiro usuário gestor de desenvolvimento criado para {Email}.", email);
    }
}
