using Canamed.Domain.Common;

namespace Canamed.Domain.Agenda;

/// <summary>
/// Paciente com o cadastro mínimo necessário para agendar (SPEC-0002, seção 3.1).
/// <see cref="Name"/> e <see cref="Phone"/> são dados pessoais (LGPD) e nunca são registrados em log.
/// </summary>
public sealed class Patient : Entity
{
    private Patient()
    {
    }

    public Guid ClinicId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public string Phone { get; private set; } = string.Empty;

    /// <summary>E-mail de contato, opcional.</summary>
    public string? Email { get; private set; }

    /// <summary>Data de nascimento, opcional. Dado pessoal; nunca aparece em log.</summary>
    public DateOnly? BirthDate { get; private set; }

    /// <summary>Documento (CPF), opcional. Dado pessoal; nunca aparece em log (RN-014).</summary>
    public string? Document { get; private set; }

    /// <summary>Convênio do paciente, opcional (SPEC-0006).</summary>
    public Guid? HealthPlanId { get; private set; }

    /// <summary>Tipo sanguíneo (A, B, AB, O), opcional (SPEC-0035 / RN-008).</summary>
    public string? BloodType { get; private set; }

    /// <summary>Fator Rh ('Positivo' ou 'Negativo'), opcional (SPEC-0035 / RN-008).</summary>
    public string? RhFactor { get; private set; }

    /// <summary>Paciente inativo não recebe novos agendamentos (RN-006).</summary>
    public bool IsActive { get; private set; } = true;

    /// <summary>Cria um paciente da clínica informada.</summary>
    public static Patient Create(
        Guid clinicId,
        string name,
        string phone,
        DateTimeOffset now,
        Guid? id = null,
        string? email = null,
        DateOnly? birthDate = null,
        string? document = null,
        Guid? healthPlanId = null,
        string? bloodType = null,
        string? rhFactor = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(phone);

        var patient = new Patient
        {
            ClinicId = clinicId,
            Name = name.Trim(),
            Phone = phone.Trim(),
            Email = NormalizeEmail(email),
            BirthDate = ValidateBirthDate(birthDate, now),
            Document = NormalizeDocument(document),
            HealthPlanId = healthPlanId,
            BloodType = bloodType?.Trim(),
            RhFactor = rhFactor?.Trim(),
            IsActive = true,
        };

        if (id is not null)
        {
            patient.Id = id.Value;
        }

        patient.MarkCreated(now);

        return patient;
    }

    /// <summary>Atualiza os dados cadastrais do paciente (RN-009).</summary>
    public void Update(
        string name,
        string phone,
        string? email,
        DateOnly? birthDate,
        string? document,
        Guid? healthPlanId,
        DateTimeOffset now,
        string? bloodType = null,
        string? rhFactor = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(phone);

        Name = name.Trim();
        Phone = phone.Trim();
        Email = NormalizeEmail(email);
        BirthDate = ValidateBirthDate(birthDate, now);
        Document = NormalizeDocument(document);
        HealthPlanId = healthPlanId;
        BloodType = bloodType?.Trim() ?? BloodType;
        RhFactor = rhFactor?.Trim() ?? RhFactor;
        MarkUpdated(now);
    }

    /// <summary>Desativa o paciente (RN-006).</summary>
    public void Deactivate(DateTimeOffset now)
    {
        IsActive = false;
        MarkUpdated(now);
    }

    /// <summary>Reativa o paciente.</summary>
    public void Activate(DateTimeOffset now)
    {
        IsActive = true;
        MarkUpdated(now);
    }

    /// <summary>
    /// Executa a anonimização definitiva dos dados cadastrais do paciente (LGPD Art. 18, VI e SPEC-0012).
    /// </summary>
    public void Anonymize(DateTimeOffset now)
    {
        Name = "[TITULAR ANONIMIZADO - LGPD]";
        Phone = "(00) 00000-0000";
        Email = null;
        BirthDate = null;
        Document = null;
        IsActive = false;
        MarkUpdated(now);
    }

    private static string? NormalizeEmail(string? email) =>
        string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();

    /// <summary>Mantém apenas dígitos do documento e devolve <c>null</c> quando vazio.</summary>
    private static string? NormalizeDocument(string? document)
    {
        if (string.IsNullOrWhiteSpace(document))
        {
            return null;
        }

        var digits = new string([.. document.Where(char.IsAsciiDigit)]);

        return digits.Length is 0 ? null : digits;
    }

    private static DateOnly? ValidateBirthDate(DateOnly? birthDate, DateTimeOffset now)
    {
        if (birthDate is null)
        {
            return null;
        }

        if (birthDate > DateOnly.FromDateTime(now.UtcDateTime))
        {
            throw new ArgumentException("A data de nascimento deve estar no passado.", nameof(birthDate));
        }

        return birthDate;
    }
}
