using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;

namespace Canamed.Application.Catalog;

/// <summary>
/// Catálogo assistencial da clínica (SPEC-0004): especialidades, tipos de consulta com natureza e
/// custeio, profissionais e pacientes. O cadastro completo depende da SPEC-0006.
/// </summary>
public sealed class CatalogService(
    ICatalogRepository catalogRepository,
    IAuditRepository auditRepository,
    IUnitOfWork unitOfWork,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    // ---------- Especialidades ----------

    /// <summary>Lista as especialidades da clínica (ativas e inativas).</summary>
    public async Task<IReadOnlyList<SpecialtyResponse>> ListSpecialtiesAsync(CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();

        var specialties = await catalogRepository
            .ListSpecialtiesAsync(actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        return
        [
            .. specialties.Select(static specialty => new SpecialtyResponse(specialty.Id, specialty.Name, specialty.IsActive)),
        ];
    }

    /// <summary>Cria uma especialidade (RN-010).</summary>
    public async Task<SpecialtyResponse> CreateSpecialtyAsync(
        CreateSpecialtyRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var name = RequireName(request.Name, "Informe o nome da especialidade.");

        await EnsureSpecialtyNameIsFreeAsync(actor.ClinicId, name, null, cancellationToken).ConfigureAwait(false);

        var now = timeProvider.GetUtcNow();
        var specialty = Specialty.Create(actor.ClinicId, name, now);

        catalogRepository.AddSpecialty(specialty);

        await CommitAsync(actor, specialty.Id, AuditActions.SpecialtyCreated, AuditResources.Specialties, now, cancellationToken)
            .ConfigureAwait(false);

        return new SpecialtyResponse(specialty.Id, specialty.Name, specialty.IsActive);
    }

    /// <summary>Renomeia uma especialidade.</summary>
    public async Task<SpecialtyResponse> RenameSpecialtyAsync(
        Guid specialtyId,
        RenameSpecialtyRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var specialty = await RequireSpecialtyAsync(actor.ClinicId, specialtyId, cancellationToken).ConfigureAwait(false);
        var name = RequireName(request.Name, "Informe o nome da especialidade.");

        await EnsureSpecialtyNameIsFreeAsync(actor.ClinicId, name, specialtyId, cancellationToken).ConfigureAwait(false);

        var now = timeProvider.GetUtcNow();

        specialty.Rename(name, now);

        await CommitAsync(actor, specialty.Id, AuditActions.SpecialtyUpdated, AuditResources.Specialties, now, cancellationToken)
            .ConfigureAwait(false);

        return new SpecialtyResponse(specialty.Id, specialty.Name, specialty.IsActive);
    }

    /// <summary>Desativa uma especialidade, bloqueando quando houver vínculo ativo (RN-004).</summary>
    public async Task DeactivateSpecialtyAsync(Guid specialtyId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var specialty = await RequireSpecialtyAsync(actor.ClinicId, specialtyId, cancellationToken).ConfigureAwait(false);

        if (await catalogRepository
                .SpecialtyHasActiveLinksAsync(actor.ClinicId, specialtyId, cancellationToken)
                .ConfigureAwait(false))
        {
            throw new CanamedException(
                ProblemKind.Conflict,
                "Especialidade em uso",
                "Esta especialidade está em uso por profissional ou tipo de consulta ativo.",
                "specialty-in-use");
        }

        var now = timeProvider.GetUtcNow();

        specialty.Deactivate(now);

        await CommitAsync(actor, specialty.Id, AuditActions.SpecialtyDeactivated, AuditResources.Specialties, now, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>Reativa uma especialidade.</summary>
    public async Task ActivateSpecialtyAsync(Guid specialtyId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var specialty = await RequireSpecialtyAsync(actor.ClinicId, specialtyId, cancellationToken).ConfigureAwait(false);
        var now = timeProvider.GetUtcNow();

        specialty.Activate(now);

        await CommitAsync(actor, specialty.Id, AuditActions.SpecialtyActivated, AuditResources.Specialties, now, cancellationToken)
            .ConfigureAwait(false);
    }

    // ---------- Profissionais ----------

    /// <summary>Lista os profissionais da clínica.</summary>
    public async Task<IReadOnlyList<ProfessionalResponse>> ListProfessionalsAsync(CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();

        var professionals = await catalogRepository
            .ListProfessionalsAsync(actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        var names = await LoadSpecialtyNamesAsync(
            actor.ClinicId,
            professionals.Select(static professional => professional.SpecialtyId),
            cancellationToken).ConfigureAwait(false);

        return [.. professionals.Select(professional => Map(professional, names))];
    }

    /// <summary>Cadastra um profissional na clínica.</summary>
    public async Task<ProfessionalResponse> CreateProfessionalAsync(
        CreateProfessionalRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var name = RequireName(request.Name, "Informe o nome do profissional.");
        var specialtyId = await ValidateSpecialtyAsync(actor.ClinicId, request.SpecialtyId, cancellationToken)
            .ConfigureAwait(false);

        var now = timeProvider.GetUtcNow();
        var professional = Professional.Create(actor.ClinicId, name, now, specialtyId: specialtyId);

        catalogRepository.AddProfessional(professional);

        await CommitAsync(actor, professional.Id, AuditActions.ProfessionalCreated, AuditResources.Professionals, now, cancellationToken)
            .ConfigureAwait(false);

        var names = await LoadSpecialtyNamesAsync(actor.ClinicId, [specialtyId], cancellationToken).ConfigureAwait(false);

        return Map(professional, names);
    }

    /// <summary>Altera nome e especialidade do profissional.</summary>
    public async Task<ProfessionalResponse> UpdateProfessionalAsync(
        Guid professionalId,
        UpdateProfessionalRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var professional = await RequireProfessionalAsync(actor.ClinicId, professionalId, cancellationToken)
            .ConfigureAwait(false);
        var name = RequireName(request.Name, "Informe o nome do profissional.");
        var specialtyId = await ValidateSpecialtyAsync(actor.ClinicId, request.SpecialtyId, cancellationToken)
            .ConfigureAwait(false);

        var now = timeProvider.GetUtcNow();

        professional.Update(name, specialtyId, now);

        await CommitAsync(actor, professional.Id, AuditActions.ProfessionalUpdated, AuditResources.Professionals, now, cancellationToken)
            .ConfigureAwait(false);

        var names = await LoadSpecialtyNamesAsync(actor.ClinicId, [specialtyId], cancellationToken).ConfigureAwait(false);

        return Map(professional, names);
    }

    /// <summary>Desativa o profissional (RN-005).</summary>
    public async Task DeactivateProfessionalAsync(Guid professionalId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var professional = await RequireProfessionalAsync(actor.ClinicId, professionalId, cancellationToken)
            .ConfigureAwait(false);
        var now = timeProvider.GetUtcNow();

        professional.Deactivate(now);

        await CommitAsync(actor, professional.Id, AuditActions.ProfessionalDeactivated, AuditResources.Professionals, now, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>Reativa o profissional.</summary>
    public async Task ActivateProfessionalAsync(Guid professionalId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var professional = await RequireProfessionalAsync(actor.ClinicId, professionalId, cancellationToken)
            .ConfigureAwait(false);
        var now = timeProvider.GetUtcNow();

        professional.Activate(now);

        await CommitAsync(actor, professional.Id, AuditActions.ProfessionalActivated, AuditResources.Professionals, now, cancellationToken)
            .ConfigureAwait(false);
    }

    // ---------- Pacientes ----------

    /// <summary>Lista os pacientes da clínica.</summary>
    public async Task<IReadOnlyList<PatientResponse>> ListPatientsAsync(CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();

        var patients = await catalogRepository
            .ListPatientsAsync(actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        return [.. patients.Select(Map)];
    }

    /// <summary>Cadastra um paciente na clínica.</summary>
    public async Task<PatientResponse> CreatePatientAsync(
        CreatePatientRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var name = RequireName(request.Name, "Informe o nome do paciente.");
        var phone = RequirePhone(request.Phone);
        var email = ValidateEmail(request.Email);
        var now = timeProvider.GetUtcNow();

        Patient patient;

        try
        {
            patient = Patient.Create(actor.ClinicId, name, phone, now, email: email, birthDate: request.BirthDate);
        }
        catch (ArgumentException exception)
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Data de nascimento inválida",
                exception.Message,
                "invalid-birth-date");
        }

        catalogRepository.AddPatient(patient);

        await CommitAsync(actor, patient.Id, AuditActions.PatientCreated, AuditResources.Patients, now, cancellationToken)
            .ConfigureAwait(false);

        return Map(patient);
    }

    /// <summary>Edita os dados cadastrais do paciente (RN-009).</summary>
    public async Task<PatientResponse> UpdatePatientAsync(
        Guid patientId,
        UpdatePatientRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var patient = await RequirePatientAsync(actor.ClinicId, patientId, cancellationToken).ConfigureAwait(false);
        var name = RequireName(request.Name, "Informe o nome do paciente.");
        var phone = RequirePhone(request.Phone);
        var email = ValidateEmail(request.Email);
        var now = timeProvider.GetUtcNow();

        try
        {
            patient.Update(name, phone, email, request.BirthDate, now);
        }
        catch (ArgumentException exception)
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Data de nascimento inválida",
                exception.Message,
                "invalid-birth-date");
        }

        await CommitAsync(actor, patient.Id, AuditActions.PatientUpdated, AuditResources.Patients, now, cancellationToken)
            .ConfigureAwait(false);

        return Map(patient);
    }

    /// <summary>Desativa o paciente (RN-006).</summary>
    public async Task DeactivatePatientAsync(Guid patientId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var patient = await RequirePatientAsync(actor.ClinicId, patientId, cancellationToken).ConfigureAwait(false);
        var now = timeProvider.GetUtcNow();

        patient.Deactivate(now);

        await CommitAsync(actor, patient.Id, AuditActions.PatientDeactivated, AuditResources.Patients, now, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>Reativa o paciente.</summary>
    public async Task ActivatePatientAsync(Guid patientId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var patient = await RequirePatientAsync(actor.ClinicId, patientId, cancellationToken).ConfigureAwait(false);
        var now = timeProvider.GetUtcNow();

        patient.Activate(now);

        await CommitAsync(actor, patient.Id, AuditActions.PatientActivated, AuditResources.Patients, now, cancellationToken)
            .ConfigureAwait(false);
    }

    // ---------- Tipos de consulta ----------

    /// <summary>Lista os tipos de consulta da clínica (ativos e inativos).</summary>
    public async Task<IReadOnlyList<AppointmentTypeResponse>> ListAppointmentTypesAsync(
        CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();

        var appointmentTypes = await catalogRepository
            .ListAppointmentTypesAsync(actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        var names = await LoadSpecialtyNamesAsync(
            actor.ClinicId,
            appointmentTypes.Select(static type => type.SpecialtyId),
            cancellationToken).ConfigureAwait(false);

        return [.. appointmentTypes.Select(type => Map(type, names))];
    }

    /// <summary>Cria um tipo de consulta com natureza, custeio e duração (RN-001).</summary>
    public async Task<AppointmentTypeResponse> CreateAppointmentTypeAsync(
        CreateAppointmentTypeRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var name = RequireName(request.Name, "Informe o nome do tipo de consulta.");
        var category = ParseCategory(request.Category);
        var coverage = ParseCoverage(request.Coverage);
        var specialtyId = await ValidateSpecialtyAsync(actor.ClinicId, request.SpecialtyId, cancellationToken)
            .ConfigureAwait(false);

        await EnsureAppointmentTypeNameIsFreeAsync(actor.ClinicId, name, null, cancellationToken).ConfigureAwait(false);

        var now = timeProvider.GetUtcNow();
        AppointmentType appointmentType;

        try
        {
            appointmentType = AppointmentType.Create(
                actor.ClinicId,
                name,
                category,
                coverage,
                request.DurationMinutes,
                now,
                specialtyId);
        }
        catch (ArgumentOutOfRangeException exception)
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Duração inválida",
                exception.Message,
                "invalid-duration");
        }

        catalogRepository.AddAppointmentType(appointmentType);

        await CommitAsync(actor, appointmentType.Id, AuditActions.AppointmentTypeCreated, AuditResources.AppointmentTypes, now, cancellationToken)
            .ConfigureAwait(false);

        var names = await LoadSpecialtyNamesAsync(actor.ClinicId, [specialtyId], cancellationToken).ConfigureAwait(false);

        return Map(appointmentType, names);
    }

    /// <summary>Altera um tipo de consulta (o histórico dos agendamentos é preservado).</summary>
    public async Task<AppointmentTypeResponse> UpdateAppointmentTypeAsync(
        Guid appointmentTypeId,
        UpdateAppointmentTypeRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var appointmentType = await RequireAppointmentTypeAsync(actor.ClinicId, appointmentTypeId, cancellationToken)
            .ConfigureAwait(false);
        var name = RequireName(request.Name, "Informe o nome do tipo de consulta.");
        var category = ParseCategory(request.Category);
        var coverage = ParseCoverage(request.Coverage);
        var specialtyId = await ValidateSpecialtyAsync(actor.ClinicId, request.SpecialtyId, cancellationToken)
            .ConfigureAwait(false);

        await EnsureAppointmentTypeNameIsFreeAsync(actor.ClinicId, name, appointmentTypeId, cancellationToken)
            .ConfigureAwait(false);

        var now = timeProvider.GetUtcNow();

        try
        {
            appointmentType.Update(name, category, coverage, request.DurationMinutes, specialtyId, now);
        }
        catch (ArgumentOutOfRangeException exception)
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Duração inválida",
                exception.Message,
                "invalid-duration");
        }

        await CommitAsync(actor, appointmentType.Id, AuditActions.AppointmentTypeUpdated, AuditResources.AppointmentTypes, now, cancellationToken)
            .ConfigureAwait(false);

        var names = await LoadSpecialtyNamesAsync(actor.ClinicId, [specialtyId], cancellationToken).ConfigureAwait(false);

        return Map(appointmentType, names);
    }

    /// <summary>Desativa o tipo de consulta (RN-003).</summary>
    public async Task DeactivateAppointmentTypeAsync(Guid appointmentTypeId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var appointmentType = await RequireAppointmentTypeAsync(actor.ClinicId, appointmentTypeId, cancellationToken)
            .ConfigureAwait(false);
        var now = timeProvider.GetUtcNow();

        appointmentType.Deactivate(now);

        await CommitAsync(actor, appointmentType.Id, AuditActions.AppointmentTypeDeactivated, AuditResources.AppointmentTypes, now, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>Reativa o tipo de consulta.</summary>
    public async Task ActivateAppointmentTypeAsync(Guid appointmentTypeId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var appointmentType = await RequireAppointmentTypeAsync(actor.ClinicId, appointmentTypeId, cancellationToken)
            .ConfigureAwait(false);
        var now = timeProvider.GetUtcNow();

        appointmentType.Activate(now);

        await CommitAsync(actor, appointmentType.Id, AuditActions.AppointmentTypeActivated, AuditResources.AppointmentTypes, now, cancellationToken)
            .ConfigureAwait(false);
    }

    // ---------- Auxiliares ----------

    private async Task CommitAsync(
        CurrentActor actor,
        Guid resourceId,
        string action,
        string resourceType,
        DateTimeOffset now,
        CancellationToken cancellationToken) =>
        await unitOfWork.ExecuteInTransactionAsync<object?>(
            async token =>
            {
                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    action,
                    resourceType,
                    resourceId.ToString(),
                    now));

                await catalogRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return null;
            },
            cancellationToken).ConfigureAwait(false);

    private async Task<Specialty> RequireSpecialtyAsync(
        Guid clinicId,
        Guid specialtyId,
        CancellationToken cancellationToken) =>
        await catalogRepository.FindSpecialtyAsync(clinicId, specialtyId, cancellationToken).ConfigureAwait(false)
        ?? throw NotFound();

    private async Task<Professional> RequireProfessionalAsync(
        Guid clinicId,
        Guid professionalId,
        CancellationToken cancellationToken) =>
        await catalogRepository.FindProfessionalAsync(clinicId, professionalId, cancellationToken).ConfigureAwait(false)
        ?? throw NotFound();

    private async Task<Patient> RequirePatientAsync(
        Guid clinicId,
        Guid patientId,
        CancellationToken cancellationToken) =>
        await catalogRepository.FindPatientAsync(patientId, clinicId, cancellationToken).ConfigureAwait(false)
        ?? throw NotFound();

    private async Task<AppointmentType> RequireAppointmentTypeAsync(
        Guid clinicId,
        Guid appointmentTypeId,
        CancellationToken cancellationToken) =>
        await catalogRepository.FindAppointmentTypeAsync(clinicId, appointmentTypeId, cancellationToken)
            .ConfigureAwait(false)
        ?? throw NotFound();

    private async Task<Guid?> ValidateSpecialtyAsync(
        Guid clinicId,
        Guid? specialtyId,
        CancellationToken cancellationToken)
    {
        if (specialtyId is null)
        {
            return null;
        }

        var specialty = await catalogRepository
            .FindSpecialtyAsync(clinicId, specialtyId.Value, cancellationToken)
            .ConfigureAwait(false);

        if (specialty is null || !specialty.IsActive)
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Especialidade inválida",
                "A especialidade informada não está disponível nesta clínica.",
                "invalid-specialty");
        }

        return specialty.Id;
    }

    private async Task EnsureSpecialtyNameIsFreeAsync(
        Guid clinicId,
        string name,
        Guid? exceptSpecialtyId,
        CancellationToken cancellationToken)
    {
        if (await catalogRepository
                .SpecialtyNameExistsAsync(clinicId, name, exceptSpecialtyId, cancellationToken)
                .ConfigureAwait(false))
        {
            throw Duplicated();
        }
    }

    private async Task EnsureAppointmentTypeNameIsFreeAsync(
        Guid clinicId,
        string name,
        Guid? exceptAppointmentTypeId,
        CancellationToken cancellationToken)
    {
        if (await catalogRepository
                .AppointmentTypeNameExistsAsync(clinicId, name, exceptAppointmentTypeId, cancellationToken)
                .ConfigureAwait(false))
        {
            throw Duplicated();
        }
    }

    private async Task<IReadOnlyDictionary<Guid, string>> LoadSpecialtyNamesAsync(
        Guid clinicId,
        IEnumerable<Guid?> specialtyIds,
        CancellationToken cancellationToken)
    {
        var ids = specialtyIds.Where(static id => id is not null).Select(static id => id!.Value).Distinct().ToArray();

        if (ids.Length is 0)
        {
            return new Dictionary<Guid, string>();
        }

        var specialties = await catalogRepository
            .ListSpecialtiesByIdsAsync(clinicId, ids, cancellationToken)
            .ConfigureAwait(false);

        return specialties.ToDictionary(static specialty => specialty.Id, static specialty => specialty.Name);
    }

    private static ProfessionalResponse Map(Professional professional, IReadOnlyDictionary<Guid, string> names) =>
        new(
            professional.Id,
            professional.Name,
            professional.SpecialtyId,
            professional.SpecialtyId is not null && names.TryGetValue(professional.SpecialtyId.Value, out var name)
                ? name
                : null,
            professional.IsActive);

    private static PatientResponse Map(Patient patient) =>
        new(patient.Id, patient.Name, patient.Phone, patient.Email, patient.BirthDate, patient.IsActive);

    private static AppointmentTypeResponse Map(AppointmentType type, IReadOnlyDictionary<Guid, string> names) =>
        new(
            type.Id,
            type.Name,
            type.Category.ToStoredValue(),
            type.Coverage.ToStoredValue(),
            type.SpecialtyId,
            type.SpecialtyId is not null && names.TryGetValue(type.SpecialtyId.Value, out var name) ? name : null,
            type.DurationMinutes,
            type.IsActive);

    private static AppointmentCategory ParseCategory(string? value)
    {
        try
        {
            return AppointmentClassificationMap.CategoryFromStoredValue(value?.Trim().ToLowerInvariant());
        }
        catch (ArgumentOutOfRangeException)
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Classificação inválida",
                $"A natureza da consulta deve ser {string.Join(" ou ", AppointmentClassificationMap.CategoryValues)}.",
                "invalid-category");
        }
    }

    private static AppointmentCoverage ParseCoverage(string? value)
    {
        try
        {
            return AppointmentClassificationMap.CoverageFromStoredValue(value?.Trim().ToLowerInvariant());
        }
        catch (ArgumentOutOfRangeException)
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Classificação inválida",
                $"O custeio deve ser {string.Join(" ou ", AppointmentClassificationMap.CoverageValues)}.",
                "invalid-coverage");
        }
    }

    private static string RequirePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Telefone obrigatório",
                "Informe o telefone de contato do paciente.",
                "phone-required");
        }

        return phone.Trim();
    }

    private static string? ValidateEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var trimmed = email.Trim();

        if (!trimmed.Contains('@', StringComparison.Ordinal) || trimmed.StartsWith('@') || trimmed.EndsWith('@'))
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "E-mail inválido",
                "Informe um e-mail válido ou deixe o campo em branco.",
                "invalid-email");
        }

        return trimmed.ToLowerInvariant();
    }

    private static string RequireName(string? name, string message)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new CanamedException(ProblemKind.Validation, "Nome obrigatório", message, "name-required");
        }

        return name.Trim();
    }

    private static CanamedException NotFound() =>
        new(ProblemKind.NotFound, "Registro não encontrado", "Registro não encontrado.", "resource-not-found");

    private static CanamedException Duplicated() =>
        new(
            ProblemKind.Conflict,
            "Nome já cadastrado",
            "Já existe um registro com este nome.",
            "duplicated-name");
}
