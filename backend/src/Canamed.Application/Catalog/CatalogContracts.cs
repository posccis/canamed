namespace Canamed.Application.Catalog;

/// <summary>Especialidade da clínica (ortopedia, ginecologia, pediatria…).</summary>
public sealed record SpecialtyResponse(Guid Id, string Name, bool IsActive);

/// <summary>Criação de especialidade.</summary>
public sealed record CreateSpecialtyRequest(string Name);

/// <summary>Renomeação de especialidade.</summary>
public sealed record RenameSpecialtyRequest(string Name);

/// <summary>Cadastro mínimo de profissional (necessário para agendar).</summary>
public sealed record CreateProfessionalRequest(string Name, Guid? SpecialtyId);

/// <summary>Alteração de profissional.</summary>
public sealed record UpdateProfessionalRequest(string Name, Guid? SpecialtyId);

/// <summary>Profissional da clínica.</summary>
public sealed record ProfessionalResponse(
    Guid Id,
    string Name,
    Guid? SpecialtyId,
    string? SpecialtyName,
    bool IsActive);

/// <summary>Cadastro de paciente com os dados necessários para agendar e contatar.</summary>
public sealed record CreatePatientRequest(string Name, string Phone, string? Email, DateOnly? BirthDate);

/// <summary>Alteração de dados cadastrais do paciente.</summary>
public sealed record UpdatePatientRequest(string Name, string Phone, string? Email, DateOnly? BirthDate);

/// <summary>Paciente da clínica.</summary>
public sealed record PatientResponse(
    Guid Id,
    string Name,
    string Phone,
    string? Email,
    DateOnly? BirthDate,
    bool IsActive);

/// <summary>
/// Tipo de consulta do catálogo. <c>Category</c> aceita <c>avulsa</c> ou <c>acompanhamento</c>;
/// <c>Coverage</c> aceita <c>particular</c> ou <c>plano_saude</c> (RN-001 da SPEC-0004).
/// </summary>
public sealed record CreateAppointmentTypeRequest(
    string Name,
    string Category,
    string Coverage,
    int DurationMinutes,
    Guid? SpecialtyId);

/// <summary>Alteração de tipo de consulta.</summary>
public sealed record UpdateAppointmentTypeRequest(
    string Name,
    string Category,
    string Coverage,
    int DurationMinutes,
    Guid? SpecialtyId);

/// <summary>Tipo de consulta da clínica.</summary>
public sealed record AppointmentTypeResponse(
    Guid Id,
    string Name,
    string Category,
    string Coverage,
    Guid? SpecialtyId,
    string? SpecialtyName,
    int DurationMinutes,
    bool IsActive);
