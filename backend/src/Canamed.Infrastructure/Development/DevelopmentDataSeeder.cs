using Canamed.Application.Abstractions;
using Canamed.Application.Identity;
using Canamed.Domain.Agenda;
using Canamed.Domain.CashRegister;
using Canamed.Domain.Clinics;
using Canamed.Domain.Financial;
using Canamed.Domain.Identity;
using Canamed.Domain.Inventory;
using Canamed.Domain.MedicalDocuments;
using Canamed.Domain.MedicalRecords;
using Canamed.Domain.Notifications;
using Canamed.Domain.Payments;
using Canamed.Domain.Portal;
using Canamed.Domain.Privacy;
using Canamed.Domain.Queue;
using Canamed.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Canamed.Infrastructure.Development;

/// <summary>
/// Cria e complementa dados sintéticos de demonstração no ambiente de desenvolvimento (ADR-0003),
/// garantindo que TODAS as telas (Administrativo, Consultório Médico Ginecológico, Recepção e Portal do Paciente)
/// contenham registros ricos de exemplo. Nunca é executado fora de Development e nunca usa dados reais.
/// </summary>
public static class DevelopmentDataSeeder
{
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

            if (dbContext.Database.IsRelational())
            {
                await dbContext.Database.MigrateAsync(cancellationToken).ConfigureAwait(false);
            }

            await SeedCatalogAsync(dbContext, now, logger, cancellationToken).ConfigureAwait(false);
            await SeedFirstUserAsync(scope.ServiceProvider, dbContext, now, logger, cancellationToken).ConfigureAwait(false);
            await SeedComprehensiveDemoDataAsync(scope.ServiceProvider, dbContext, now, logger, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
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
            if (existingClinic.Slug.StartsWith("clinic-", StringComparison.Ordinal))
            {
                existingClinic.ChangeSlug(DevelopmentDefaults.DemoClinicSlug, now);
            }

            await EnsureDemoClassificationAsync(dbContext, existingClinic.Id, now, cancellationToken).ConfigureAwait(false);
            return;
        }

        dbContext.Clinics.Add(Clinic.Create(
            "Cana Med Mulher • Clínica Integrada",
            now,
            DevelopmentDefaults.DemoClinicId,
            DevelopmentDefaults.DemoClinicSlug,
            "Cana Med"));

        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await EnsureDemoClassificationAsync(dbContext, DevelopmentDefaults.DemoClinicId, now, cancellationToken).ConfigureAwait(false);

        dbContext.Professionals.Add(Professional.Create(
            DevelopmentDefaults.DemoClinicId,
            "Dra. Camila Vasconcelos",
            now,
            DevelopmentDefaults.DemoProfessionalId,
            DevelopmentDefaults.DemoGynecologySpecialtyId,
            "CRM-PE 19284"));

        dbContext.Patients.Add(Patient.Create(
            DevelopmentDefaults.DemoClinicId,
            "Mariana Alencar Fontes",
            "(81) 98877-6655",
            now,
            DevelopmentDefaults.DemoPatientId,
            "mariana.fontes@canamed.local",
            new DateOnly(1992, 4, 18),
            "123.456.789-00"));

        dbContext.AppointmentTypes.AddRange(
            AppointmentType.Create(
                DevelopmentDefaults.DemoClinicId,
                "Consulta Ginecológica Geral",
                AppointmentCategory.Single,
                AppointmentCoverage.Private,
                30,
                now,
                specialtyId: DevelopmentDefaults.DemoGynecologySpecialtyId,
                id: DevelopmentDefaults.DemoConsultationTypeId),
            AppointmentType.Create(
                DevelopmentDefaults.DemoClinicId,
                "Retorno Pós-Exames",
                AppointmentCategory.FollowUp,
                AppointmentCoverage.Private,
                15,
                now,
                specialtyId: DevelopmentDefaults.DemoGynecologySpecialtyId,
                id: DevelopmentDefaults.DemoFollowUpTypeId),
            AppointmentType.Create(
                DevelopmentDefaults.DemoClinicId,
                "Inserção de DIU / Procedimento",
                AppointmentCategory.Single,
                AppointmentCoverage.Private,
                45,
                now,
                specialtyId: DevelopmentDefaults.DemoGynecologySpecialtyId,
                id: DevelopmentDefaults.DemoAssessmentTypeId));

        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        logger.LogInformation(
            "Dados sintéticos de desenvolvimento criados para a clínica {ClinicId}.",
            DevelopmentDefaults.DemoClinicId);
    }

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
            (DevelopmentDefaults.DemoGynecologySpecialtyId, "Ginecologia e Obstetrícia"),
            (DevelopmentDefaults.DemoGeneralPracticeSpecialtyId, "Clínica Geral"),
            (DevelopmentDefaults.DemoOrthopedicsSpecialtyId, "Mastologia"),
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

        if (!await dbContext.AppointmentTypes
                .AnyAsync(
                    type => type.ClinicId == clinicId && type.Id == DevelopmentDefaults.DemoFollowUpHealthPlanTypeId,
                    cancellationToken)
                .ConfigureAwait(false))
        {
            dbContext.AppointmentTypes.AddRange(
                AppointmentType.Create(
                    clinicId,
                    "Acompanhamento por convênio",
                    AppointmentCategory.FollowUp,
                    AppointmentCoverage.HealthPlan,
                    30,
                    now,
                    specialtyId: DevelopmentDefaults.DemoGynecologySpecialtyId,
                    id: DevelopmentDefaults.DemoFollowUpHealthPlanTypeId),
                AppointmentType.Create(
                    clinicId,
                    "Preventivo / Citopatológico",
                    AppointmentCategory.Single,
                    AppointmentCoverage.Private,
                    30,
                    now,
                    specialtyId: DevelopmentDefaults.DemoGynecologySpecialtyId,
                    id: DevelopmentDefaults.DemoOrthopedicAssessmentTypeId));

            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
    }

    private static async Task SeedFirstUserAsync(
        IServiceProvider services,
        CanamedDbContext dbContext,
        DateTimeOffset now,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var configuration = services.GetRequiredService<IConfiguration>();
        var hasher = services.GetRequiredService<IPasswordHasher>();

        var clinic = await dbContext.Clinics
            .OrderBy(item => item.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        if (clinic is null)
        {
            return;
        }

        var defaultPasswordHash = hasher.Hash("AdminCanamed2026!#");
        var managerEmail = configuration["Canamed:Development:SeedUserEmail"] ?? "gestor@canamed.local";
        var envPassword = configuration["Canamed:Development:SeedUserPassword"];
        var managerPasswordHash = string.IsNullOrWhiteSpace(envPassword)
            ? defaultPasswordHash
            : hasher.Hash(envPassword);

        // 1. Gestor
        var existingManager = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == managerEmail, cancellationToken)
            .ConfigureAwait(false);

        if (existingManager is null)
        {
            var user = User.Create("Dra. Gestora Silva", managerEmail, managerPasswordHash, now);
            dbContext.Users.Add(user);
            dbContext.ClinicMemberships.Add(ClinicMembership.Create(
                user.Id,
                clinic.Id,
                Roles.Manager,
                DevelopmentDefaults.DemoProfessionalId,
                now));
        }
        else
        {
            // Garante que a senha bate com a esperada para testes de login
            existingManager.ChangePassword(defaultPasswordHash, now);
        }

        // 2. Médico (Dra. Camila)
        var doctorEmail = "medico@canamed.local";
        var existingDoctor = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == doctorEmail, cancellationToken)
            .ConfigureAwait(false);

        if (existingDoctor is null)
        {
            var doctorUser = User.Create("Dra. Camila Vasconcelos", doctorEmail, defaultPasswordHash, now);
            dbContext.Users.Add(doctorUser);
            dbContext.ClinicMemberships.Add(ClinicMembership.Create(
                doctorUser.Id,
                clinic.Id,
                Roles.Professional,
                DevelopmentDefaults.DemoProfessionalId,
                now));
        }
        else
        {
            existingDoctor.ChangePassword(defaultPasswordHash, now);
        }

        // 3. Recepcionista
        var recepcionistaEmail = "recepcao@canamed.local";
        var existingRecepcao = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Email == recepcionistaEmail, cancellationToken)
            .ConfigureAwait(false);

        if (existingRecepcao is null)
        {
            var recepUser = User.Create("Juliana Recepção", recepcionistaEmail, defaultPasswordHash, now);
            dbContext.Users.Add(recepUser);
            dbContext.ClinicMemberships.Add(ClinicMembership.Create(
                recepUser.Id,
                clinic.Id,
                Roles.Receptionist,
                null,
                now));
        }
        else
        {
            existingRecepcao.ChangePassword(defaultPasswordHash, now);
        }

        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        logger.LogInformation("Usuários de demonstração (Gestor, Médico e Recepção) garantidos.");
    }

    private static async Task SeedComprehensiveDemoDataAsync(
        IServiceProvider services,
        CanamedDbContext dbContext,
        DateTimeOffset now,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var clinic = await dbContext.Clinics.FirstAsync(cancellationToken).ConfigureAwait(false);
        var clinicId = clinic.Id;

        // 1. Salas
        if (!await dbContext.Rooms.AnyAsync(r => r.ClinicId == clinicId, cancellationToken).ConfigureAwait(false))
        {
            dbContext.Rooms.AddRange(
                Room.Create(clinicId, "Consultório 01 — Dra. Camila", now, DevelopmentDefaults.DemoRoom1Id),
                Room.Create(clinicId, "Consultório 02 — Dr. Lucas", now, DevelopmentDefaults.DemoRoom2Id),
                Room.Create(clinicId, "Sala de Exames & Procedimentos", now, DevelopmentDefaults.DemoRoomUltrasoundId));
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        // 2. Convênios
        if (!await dbContext.HealthPlans.AnyAsync(hp => hp.ClinicId == clinicId, cancellationToken).ConfigureAwait(false))
        {
            dbContext.HealthPlans.AddRange(
                HealthPlan.Create(clinicId, "Bradesco Saúde", "005711", now, DevelopmentDefaults.DemoHealthPlanBradescoId),
                HealthPlan.Create(clinicId, "Unimed Recife", "345678", now, DevelopmentDefaults.DemoHealthPlanUnimedId),
                HealthPlan.Create(clinicId, "Sulamérica", "006246", now, DevelopmentDefaults.DemoHealthPlanSulAmericaId));
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        // 3. Profissional Adicional (Dr. Lucas Mendes)
        if (!await dbContext.Professionals.AnyAsync(p => p.Id == DevelopmentDefaults.DemoDoctorLucasId, cancellationToken).ConfigureAwait(false))
        {
            dbContext.Professionals.Add(Professional.Create(
                clinicId,
                "Dr. Lucas Mendes",
                now,
                DevelopmentDefaults.DemoDoctorLucasId,
                DevelopmentDefaults.DemoGynecologySpecialtyId,
                "CRM-PE 23419"));
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        // 4. Pacientes
        var patientsData = new (Guid Id, string Name, string Phone, string Email, DateOnly BirthDate, string Cpf)[]
        {
            (DevelopmentDefaults.DemoPatientMarianaId, "Mariana Alencar Fontes", "(81) 98877-6655", "mariana.fontes@canamed.local", new DateOnly(1994, 6, 12), "123.456.789-01"),
            (DevelopmentDefaults.DemoPatientCamilaId, "Camila Rodrigues Leite", "(81) 98765-4321", "camila.leite@canamed.local", new DateOnly(1989, 9, 25), "234.567.890-12"),
            (DevelopmentDefaults.DemoPatientBeatrizId, "Beatriz Costa Neves", "(81) 99123-4567", "beatriz.neves@canamed.local", new DateOnly(2001, 2, 14), "345.678.901-23"),
            (DevelopmentDefaults.DemoPatientJulianaId, "Juliana Paes de Barros", "(81) 99234-5678", "juliana.barros@canamed.local", new DateOnly(1978, 11, 30), "456.789.012-34"),
            (DevelopmentDefaults.DemoPatientFernandaId, "Fernanda Lima Queiroz", "(81) 99345-6789", "fernanda.queiroz@canamed.local", new DateOnly(1985, 8, 5), "567.890.123-45"),
        };

        foreach (var p in patientsData)
        {
            if (!await dbContext.Patients.AnyAsync(pt => pt.Id == p.Id, cancellationToken).ConfigureAwait(false))
            {
                dbContext.Patients.Add(Patient.Create(
                    clinicId,
                    p.Name,
                    p.Phone,
                    now,
                    p.Id,
                    p.Email,
                    p.BirthDate,
                    p.Cpf,
                    DevelopmentDefaults.DemoHealthPlanBradescoId));
            }
        }
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        // 5. Horários de Funcionamento e Políticas
        if (!await dbContext.OperatingHours.AnyAsync(oh => oh.ClinicId == clinicId, cancellationToken).ConfigureAwait(false))
        {
            for (var day = DayOfWeek.Monday; day <= DayOfWeek.Friday; day++)
            {
                dbContext.OperatingHours.Add(OperatingHour.Create(clinicId, day, new TimeOnly(8, 0), new TimeOnly(18, 0), now));
            }
            dbContext.OperatingHours.Add(OperatingHour.Create(clinicId, DayOfWeek.Saturday, new TimeOnly(8, 0), new TimeOnly(12, 0), now));
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        if (!await dbContext.ClinicPolicies.AnyAsync(cp => cp.ClinicId == clinicId, cancellationToken).ConfigureAwait(false))
        {
            dbContext.ClinicPolicies.Add(ClinicPolicy.CreateDefault(clinicId, now));
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        // 6. Sessão de Caixa Aberta com Movimentações
        if (!await dbContext.CashSessions.AnyAsync(cs => cs.ClinicId == clinicId, cancellationToken).ConfigureAwait(false))
        {
            var managerUser = await dbContext.Users.FirstAsync(u => u.Email == "gestor@canamed.local", cancellationToken).ConfigureAwait(false);
            var cashSession = CashSession.Open(clinicId, managerUser.Id, managerUser.Name, 250.00m, now.AddHours(-4));
            cashSession.RegisterPaymentReceived("pix", 350.00m, now.AddHours(-3));
            cashSession.RegisterPaymentReceived("dinheiro", 200.00m, now.AddHours(-2));
            cashSession.RegisterPaymentReceived("cartao_credito", 450.00m, now.AddHours(-1));
            dbContext.CashSessions.Add(cashSession);
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        // 7. Insumos e Estoque Clínico
        if (!await dbContext.InventoryItems.AnyAsync(ii => ii.ClinicId == clinicId, cancellationToken).ConfigureAwait(false))
        {
            var user = await dbContext.Users.FirstAsync(cancellationToken).ConfigureAwait(false);
            var item1 = InventoryItem.Create(clinicId, "Espéculo Vaginal Descartável M", "Descartáveis", "unidade", 150, 40, "LOT-ESP-2026", now.AddYears(2), now);
            var item2 = InventoryItem.Create(clinicId, "Dispositivo Intrauterino (DIU Mirena)", "Medicamentos", "unidade", 12, 5, "LOT-DIU-8891", now.AddYears(3), now);
            var item3 = InventoryItem.Create(clinicId, "Escova Cervical para Citologia", "Descartáveis", "pacote", 80, 25, "LOT-ESC-4412", now.AddYears(1), now);
            var item4 = InventoryItem.Create(clinicId, "Luvas de Procedimento Nitrílicas M", "EPIs", "caixa", 45, 15, "LOT-LUV-901", now.AddYears(2), now);
            var item5 = InventoryItem.Create(clinicId, "Gel Condutor para Ultrassonografia 5kg", "Outros", "frasco", 8, 2, "LOT-GEL-102", now.AddMonths(18), now);

            dbContext.InventoryItems.AddRange(item1, item2, item3, item4, item5);
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            dbContext.InventoryMovements.AddRange(
                InventoryMovement.Create(item1.Id, clinicId, "entrada", 150, 3.20m, "Compra mensal fornecedor MedHospital", user.Id, now.AddDays(-5)),
                InventoryMovement.Create(item2.Id, clinicId, "entrada", 15, 680.00m, "Aquisição de lote DIU hormonal", user.Id, now.AddDays(-10)),
                InventoryMovement.Create(item2.Id, clinicId, "saida", 3, null, "Aplicação em consultório", user.Id, now.AddDays(-1)));
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        // 8. Financeiro e Contratos de Repasse
        if (!await dbContext.FinancialTransactions.AnyAsync(ft => ft.ClinicId == clinicId, cancellationToken).ConfigureAwait(false))
        {
            dbContext.FinancialTransactions.AddRange(
                FinancialTransaction.Create(clinicId, "receita", "Consultas", "Recebimentos particulares da semana", 4850.00m, now, now, "pago", now, now),
                FinancialTransaction.Create(clinicId, "receita", "Procedimentos", "Inserção de DIUs e cauterizações", 3200.00m, now, now, "pago", now, now),
                FinancialTransaction.Create(clinicId, "despesa", "Aluguel", "Locação conjunto consultórios Recife", 3500.00m, now.AddDays(5), now, "pendente", null, now),
                FinancialTransaction.Create(clinicId, "despesa", "Insumos", "Reposição de descartáveis ginecológicos", 890.00m, now.AddDays(-2), now, "pago", now.AddDays(-2), now));
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        if (!await dbContext.MedicalPayoutContracts.AnyAsync(mpc => mpc.ClinicId == clinicId, cancellationToken).ConfigureAwait(false))
        {
            dbContext.MedicalPayoutContracts.AddRange(
                MedicalPayoutContract.Create(clinicId, DevelopmentDefaults.DemoProfessionalId, "percentage", 70.00m, now),
                MedicalPayoutContract.Create(clinicId, DevelopmentDefaults.DemoDoctorLucasId, "percentage", 70.00m, now));
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        // 9. Agendamentos do Dia, Fila e Atendimentos
        var today = DateOnly.FromDateTime(now.Date);
        var baseDate = now.Date;

        if (!await dbContext.Appointments.AnyAsync(a => a.ClinicId == clinicId, cancellationToken).ConfigureAwait(false))
        {
            var appType = await dbContext.AppointmentTypes.FirstAsync(cancellationToken).ConfigureAwait(false);
            var profId = DevelopmentDefaults.DemoProfessionalId;

            // Agendamento 1: Finalizado / Atendido mais cedo (Mariana)
            var app1 = Appointment.CreatePastForSeed(
                clinicId,
                profId,
                DevelopmentDefaults.DemoPatientMarianaId,
                appType.Id,
                baseDate.AddHours(9),
                30,
                now,
                DevelopmentDefaults.DemoRoom1Id);
            app1.Confirm(now.AddHours(-5));
            app1.MarkAttended(now.AddHours(-4));
            app1.MarkPaid(now.AddHours(-4));

            // Agendamento 2: Em Atendimento na Fila (Camila)
            var app2 = Appointment.CreatePastForSeed(
                clinicId,
                profId,
                DevelopmentDefaults.DemoPatientCamilaId,
                appType.Id,
                baseDate.AddHours(10),
                30,
                now,
                DevelopmentDefaults.DemoRoom1Id);
            app2.Confirm(now.AddHours(-3));
            app2.MarkPaid(now.AddHours(-2));

            // Agendamento 3: Aguardando na Sala de Espera (Beatriz)
            var app3 = Appointment.CreatePastForSeed(
                clinicId,
                profId,
                DevelopmentDefaults.DemoPatientBeatrizId,
                appType.Id,
                baseDate.AddHours(11),
                30,
                now,
                DevelopmentDefaults.DemoRoom1Id);
            app3.Confirm(now.AddHours(-1));
            app3.MarkPaid(now.AddMinutes(-30));

            // Agendamento 4: Futuro / Confirmado (Juliana)
            var app4 = Appointment.Schedule(
                clinicId,
                profId,
                DevelopmentDefaults.DemoPatientJulianaId,
                appType.Id,
                baseDate.AddHours(14),
                30,
                now,
                DevelopmentDefaults.DemoRoom1Id);
            app4.Confirm(now.AddMinutes(-10));

            // Agendamento 5: Futuro / Agendado (Fernanda)
            var app5 = Appointment.Schedule(
                clinicId,
                profId,
                DevelopmentDefaults.DemoPatientFernandaId,
                appType.Id,
                baseDate.AddHours(15),
                30,
                now,
                DevelopmentDefaults.DemoRoom1Id);

            dbContext.Appointments.AddRange(app1, app2, app3, app4, app5);
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            // Entradas na Fila
            var qEntry1 = QueueEntry.CheckIn(clinicId, profId, DevelopmentDefaults.DemoPatientMarianaId, app1.Id, today, QueuePriority.Normal, now.AddHours(-4));
            qEntry1.AssignTicket("N-001", "desk");
            qEntry1.Call(now.AddHours(-3).AddMinutes(10));
            qEntry1.Start(now.AddHours(-3).AddMinutes(15));
            qEntry1.Complete(now.AddHours(-3).AddMinutes(45));

            var qEntry2 = QueueEntry.CheckIn(clinicId, profId, DevelopmentDefaults.DemoPatientCamilaId, app2.Id, today, QueuePriority.Preferential, now.AddHours(-1).AddMinutes(-30));
            qEntry2.AssignTicket("P-001", "mobile_qrcode");
            qEntry2.Call(now.AddMinutes(-20));
            qEntry2.Start(now.AddMinutes(-10)); // Em atendimento agora!

            var qEntry3 = QueueEntry.CheckIn(clinicId, profId, DevelopmentDefaults.DemoPatientBeatrizId, app3.Id, today, QueuePriority.Normal, now.AddMinutes(-25));
            qEntry3.AssignTicket("N-002", "desk"); // Aguardando chamada

            dbContext.QueueEntries.AddRange(qEntry1, qEntry2, qEntry3);
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            // Chamada na TV do saguão
            dbContext.QueueCallEvents.Add(QueueCallEvent.Create(
                clinicId,
                qEntry2.Id,
                "P-001",
                "Camila Rodrigues Leite",
                "Consultório 01 — Dra. Camila",
                "Dra. Camila Vasconcelos",
                true,
                now.AddMinutes(-5)));

            // Triagem da paciente em atendimento
            var triageUser = await dbContext.Users.FirstAsync(cancellationToken).ConfigureAwait(false);
            dbContext.TriageRecords.Add(TriageRecord.Record(
                clinicId,
                qEntry2.Id,
                DevelopmentDefaults.DemoPatientCamilaId,
                triageUser.Id,
                triageUser.Name,
                RiskClassifications.Green,
                now.AddMinutes(-20),
                bloodPressure: "120x80",
                heartRate: 74,
                temperature: 36.5m,
                oxygenSaturation: 98,
                glucose: 88,
                weightKg: 62.5m,
                heightCm: 164m,
                chiefComplaint: "Rotina ginecológica e revisão de contracepção",
                allergies: "Nega alergias medicamentosas"));

            // Transação de pagamento
            dbContext.PaymentTransactions.Add(PaymentTransaction.Record(
                clinicId,
                app1.Id,
                DevelopmentDefaults.DemoPatientMarianaId,
                300.00m,
                "pix",
                triageUser.Id,
                now.AddHours(-4),
                notes: "Consulta particular liquidada via PIX"));

            // 10. Prontuários Médicos Ginecológicos Ricos
            var docUser = await dbContext.Users.FirstAsync(u => u.Email == "medico@canamed.local", cancellationToken).ConfigureAwait(false);

            // Prontuário 1 (Finalizado - Mariana)
            var rec1 = MedicalRecord.Create(clinicId, DevelopmentDefaults.DemoPatientMarianaId, docUser.Id, app1.Id, now.AddHours(-4));
            rec1.UpdateDraft(
                "Paciente comparece para revisão semestral. Queixa-se de cólicas de moderada intensidade no 1º dia do ciclo (EVA 5/10), com melhora após AINE. Nega corrimentos atípicos ou sinusorragia.",
                "Bom estado geral, corada, hidratada, eupneica. PA: 110x70 mmHg, FC: 72 bpm. Mamas: simétricas, sem nódulos palpáveis ou secreções papilares. Abdome: flácido, indolor, sem visceromegalias. Exame especular: colo epitelizado, secreção fisiológica clara sem odor. Toque bimanual: útero em AVF de volume habitual, anexos livres e indolores.",
                "Dismenorreia primária leve a moderada. Rotina ginecológica preventiva dentro da normalidade.",
                "Orientada manutenção do anticoncepcional oral combinado. Prescrito ácido mefenâmico 500mg para início no pródromo menstrual se necessário. Solicitada ultrassonografia transvaginal de controle e citopatológico anual.",
                "Paciente orientada sobre sinais de alerta e agendamento de retorno em 30 dias para checagem dos exames.",
                now.AddHours(-4));
            rec1.FinalizeRecord(docUser.Id, now.AddHours(-3).AddMinutes(20));

            // Dados ginecológicos da consulta 1
            var gynData1 = GynecologicalConsultationData.Create(rec1.Id, now.AddHours(-4));
            gynData1.Update(
                new DateOnly(2026, 9, 28),
                false,
                false,
                "Revisão ginecológica e dismenorreia leve",
                "Ciclos regulares 28/4 dias. Refere cólica moderada no primeiro dia.",
                true,
                "Não refere",
                true,
                null,
                true,
                null,
                true,
                null,
                true,
                null,
                true,
                null,
                "Exame preventivo citopatológico colhido",
                "LOT-CITO-2026",
                "Coleta endocervical e ectocervical sem intercorrências",
                "[\"N94.4 - Dismenorreia primária\"]",
                "Ácido mefenâmico 500mg VO 8/8h nos dias de dor",
                "Retorno em 30 dias com resultado de USG",
                now.AddHours(-4));

            // Prontuário 2 (Em Andamento - Camila)
            var rec2 = MedicalRecord.Create(clinicId, DevelopmentDefaults.DemoPatientCamilaId, docUser.Id, app2.Id, now.AddMinutes(-10));
            rec2.UpdateDraft(
                "Deseja avaliar troca do método contraceptivo para DIU hormonal (Mirena). Atualmente em uso de ACO oral há 4 anos com esquecimentos ocasionais.",
                "Exame físico em andamento no consultório. Mamas normais, abdome inocente.",
                "Planejamento reprodutivo e indicação de DIU de levonorgestrel.",
                "Explicado procedimento de inserção, taxa de eficácia, padrão de sangramento esperado nos primeiros meses.",
                "Em atendimento no consultório 01.",
                now.AddMinutes(-5));

            dbContext.MedicalRecords.AddRange(rec1, rec2);
            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            dbContext.GynecologicalConsultationData.Add(gynData1);

            // Perfil Ginecológico Longitudinal (Mariana e Camila)
            var gynProf1 = GynecologicalProfile.Create(clinicId, DevelopmentDefaults.DemoPatientMarianaId, now.AddMonths(-6));
            gynProf1.Update(
                12, 18, 28, 4, true, "moderado", "leve/moderada", true, "cefaleia e mastalgia leve",
                "não menopausada", null, false,
                0, 0, 0, 0, 0, 0, "Nuligesta",
                "Anticoncepcional Oral Combinado", 24, "Preservativo", "Sem planos para gestação nos próximos 3 anos",
                "Nega cirurgias pélvicas", "Nega histórico de IST", "Tia materna com câncer de mama aos 62 anos",
                now);

            var gynProf2 = GynecologicalProfile.Create(clinicId, DevelopmentDefaults.DemoPatientCamilaId, now.AddMonths(-3));
            gynProf2.Update(
                13, 17, 30, 5, true, "moderado", "ausente", false, null,
                "não menopausada", null, false,
                1, 1, 1, 0, 1, 0, "G1P1 (cesárea há 2 anos, sem complicações)",
                "Pílula Oral", 48, "Injetável mensal", "Deseja método de longa duração (LARC - DIU)",
                "Cesárea prévia", "Nega ISTs", "Nega histórico familiar oncológico",
                now);

            dbContext.GynecologicalProfiles.AddRange(gynProf1, gynProf2);

            // Exames Preventivos Rastreados
            dbContext.PreventiveScreeningRecords.AddRange(
                PreventiveScreeningRecord.Create(clinicId, DevelopmentDefaults.DemoPatientMarianaId, rec1.Id, "citopatologico", new DateOnly(2025, 10, 10), "Negativo para lesão intraepitelial ou malignidade", "Dentro dos limites da normalidade (Bethesda)", new DateOnly(2026, 10, 10), now),
                PreventiveScreeningRecord.Create(clinicId, DevelopmentDefaults.DemoPatientMarianaId, rec1.Id, "usg_transvaginal", new DateOnly(2025, 11, 15), "Útero e ovários com ecotextura e dimensões anatômicas preservadas", "Exame normal", new DateOnly(2026, 11, 15), now),
                PreventiveScreeningRecord.Create(clinicId, DevelopmentDefaults.DemoPatientCamilaId, null, "mamografia", new DateOnly(2025, 8, 20), "Ausência de nódulos espiculados, microcalcificações pleomórficas", "BI-RADS 2 (Achados Benignos)", new DateOnly(2027, 8, 20), now));

            // Documentos Clínicos Emitidos (Mariana)
            var docPrescricao = MedicalDocument.CreateDraft(
                clinicId,
                DevelopmentDefaults.DemoPatientMarianaId,
                docUser.Id,
                rec1.Id,
                MedicalDocumentType.ReceitaSimples,
                "{\"medicamentos\":[{\"nome\":\"Ácido Mefenâmico 500mg\",\"posologia\":\"Tomar 1 comprimido por via oral a cada 8 horas em caso de dor menstrual, por no máximo 3 dias.\"}]}",
                null,
                false,
                now.AddHours(-3));
            docPrescricao.Sign("SHA256-ASSINADO-CFM-DEMO-001", now.AddHours(-3).AddMinutes(15));

            var docAtestado = MedicalDocument.CreateDraft(
                clinicId,
                DevelopmentDefaults.DemoPatientMarianaId,
                docUser.Id,
                rec1.Id,
                MedicalDocumentType.AtestadoMedico,
                "{\"finalidade\":\"repouso\",\"dias\":1,\"texto\":\"Atesto que a paciente compareceu a consulta ginecológica de rotina nesta data necessitando de 1 (um) dia de repouso.\"}",
                "Z01.4",
                true,
                now.AddHours(-3));
            docAtestado.Sign("SHA256-ASSINADO-CFM-DEMO-002", now.AddHours(-3).AddMinutes(18));

            dbContext.MedicalDocuments.AddRange(docPrescricao, docAtestado);

            // Anexos de Exames Trazidos pela Paciente
            dbContext.PatientExamAttachments.Add(PatientExamAttachment.Create(
                clinicId,
                DevelopmentDefaults.DemoPatientMarianaId,
                rec1.Id,
                "Ultrassonografia Pélvica Transvaginal - Lab Geral",
                "usg_transvaginal",
                new DateOnly(2025, 11, 15),
                "Clínica de Imagem Boa Viagem",
                "Exame demonstrando útero em AVF medindo 65cm³ e espessura endometrial de 5mm.",
                "laudo_usg_mariana_2025.pdf",
                "application/pdf",
                245800,
                "hash-sha256-demo-usg-mariana",
                "/uploads/exames/demo-usg.pdf",
                docUser.Id.ToString(),
                docUser.Name,
                now.AddMonths(-1)));

            // Solicitação de Privacidade LGPD (Beatriz)
            dbContext.PrivacyRequests.Add(PrivacyRequest.Open(
                clinicId,
                DevelopmentDefaults.DemoPatientBeatrizId,
                PrivacyRequestType.DataAccess,
                "Gostaria de obter cópia completa dos meus dados cadastrais e histórico de agendamentos em formato PDF/JSON.",
                now.AddDays(-2)));

            dbContext.PrivacyConsents.Add(PrivacyConsent.Grant(
                DevelopmentDefaults.DemoPatientBeatrizId,
                "tratamento_dados_saude_pep",
                "2.0",
                now.AddMonths(-2),
                "187.19.20.10"));

            // Notificação de Lembrete Enviada
            dbContext.AppointmentNotifications.Add(AppointmentNotification.Create(
                clinicId,
                app4.Id,
                DevelopmentDefaults.DemoPatientJulianaId,
                NotificationChannel.WhatsApp,
                "5581992345678",
                NotificationTriggerType.Reminder24h,
                "Olá Juliana! Lembramos da sua consulta na Cana Med hoje às 14:00 com a Dra. Camila.",
                now.AddHours(-2)));

            // Rascunho de Cadastro do Paciente (Fernanda)
            var (regToken, capEntity) = PatientCapabilityToken.Issue(
                clinicId,
                CapabilityScope.Registration,
                now.AddDays(7),
                now,
                DevelopmentDefaults.DemoPatientFernandaId,
                app5.Id,
                createdBy: "reception");

            dbContext.PatientCapabilityTokens.Add(capEntity);

            var regDraft = PatientRegistrationDraft.Create(
                clinicId,
                DevelopmentDefaults.DemoPatientFernandaId,
                "{\"nome\":\"Fernanda Lima Queiroz\",\"cpf\":\"567.890.123-45\",\"endereco\":\"Rua das Graças, 412, Recife - PE\",\"contatoEmergencia\":\"Paulo Queiroz (81 9999-0000)\"}",
                now.AddHours(-1),
                capEntity.Id);
            regDraft.SubmitForReview(now.AddMinutes(-30));
            dbContext.PatientRegistrationDrafts.Add(regDraft);

            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        logger.LogInformation("Dados abrangentes de demonstração semeados com sucesso para todas as telas do sistema.");
    }
}
