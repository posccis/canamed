using Canamed.Domain.Agenda;

namespace Canamed.Application.Abstractions;

/// <summary>Cadastro mínimo de profissionais, pacientes e tipos de atendimento (SPEC-0002, seção 3.1).</summary>
public interface ICatalogRepository
{
    /// <summary>Lista os profissionais da clínica, em ordem alfabética.</summary>
    Task<IReadOnlyList<Professional>> ListProfessionalsAsync(Guid clinicId, CancellationToken cancellationToken);

    /// <summary>Obtém um profissional da clínica, rastreado para alteração.</summary>
    Task<Professional?> FindProfessionalAsync(Guid clinicId, Guid professionalId, CancellationToken cancellationToken);

    /// <summary>Lista as especialidades da clínica, em ordem alfabética.</summary>
    Task<IReadOnlyList<Specialty>> ListSpecialtiesAsync(Guid clinicId, CancellationToken cancellationToken);

    /// <summary>Lista especialidades específicas da clínica.</summary>
    Task<IReadOnlyList<Specialty>> ListSpecialtiesByIdsAsync(
        Guid clinicId,
        IReadOnlyCollection<Guid> specialtyIds,
        CancellationToken cancellationToken);

    /// <summary>Obtém uma especialidade da clínica, rastreada para alteração.</summary>
    Task<Specialty?> FindSpecialtyAsync(Guid clinicId, Guid specialtyId, CancellationToken cancellationToken);

    /// <summary>Indica se já existe especialidade com o mesmo nome na clínica (RN-010).</summary>
    Task<bool> SpecialtyNameExistsAsync(
        Guid clinicId,
        string name,
        Guid? exceptSpecialtyId,
        CancellationToken cancellationToken);

    /// <summary>Indica se já existe tipo de consulta com o mesmo nome na clínica (RN-010).</summary>
    Task<bool> AppointmentTypeNameExistsAsync(
        Guid clinicId,
        string name,
        Guid? exceptAppointmentTypeId,
        CancellationToken cancellationToken);

    /// <summary>Indica se a especialidade está em uso por profissional ou tipo de consulta ativos (RN-004).</summary>
    Task<bool> SpecialtyHasActiveLinksAsync(Guid clinicId, Guid specialtyId, CancellationToken cancellationToken);

    /// <summary>Lista os pacientes da clínica, em ordem alfabética.</summary>
    Task<IReadOnlyList<Patient>> ListPatientsAsync(Guid clinicId, CancellationToken cancellationToken);

    /// <summary>Lista pacientes específicos da clínica.</summary>
    Task<IReadOnlyList<Patient>> ListPatientsByIdsAsync(
        Guid clinicId,
        IReadOnlyCollection<Guid> patientIds,
        CancellationToken cancellationToken);

    /// <summary>Lista os tipos de atendimento da clínica, em ordem alfabética.</summary>
    Task<IReadOnlyList<AppointmentType>> ListAppointmentTypesAsync(Guid clinicId, CancellationToken cancellationToken);

    /// <summary>Lista tipos de atendimento específicos da clínica.</summary>
    Task<IReadOnlyList<AppointmentType>> ListAppointmentTypesByIdsAsync(
        Guid clinicId,
        IReadOnlyCollection<Guid> appointmentTypeIds,
        CancellationToken cancellationToken);

    /// <summary>Obtém um paciente da clínica, ou <c>null</c> quando não existir no escopo.</summary>
    Task<Patient?> FindPatientAsync(Guid patientId, Guid clinicId, CancellationToken cancellationToken);

    /// <summary>Obtém um tipo de atendimento da clínica, ou <c>null</c> quando não existir no escopo.</summary>
    Task<AppointmentType?> FindAppointmentTypeAsync(Guid clinicId, Guid appointmentTypeId, CancellationToken cancellationToken);

    /// <summary>Adiciona um profissional ao contexto de persistência.</summary>
    void AddProfessional(Professional professional);

    /// <summary>Adiciona um paciente ao contexto de persistência.</summary>
    void AddPatient(Patient patient);

    /// <summary>Adiciona um tipo de atendimento ao contexto de persistência.</summary>
    void AddAppointmentType(AppointmentType appointmentType);

    /// <summary>Adiciona uma especialidade ao contexto de persistência.</summary>
    void AddSpecialty(Specialty specialty);

    /// <summary>Confirma as alterações pendentes no contexto de persistência.</summary>
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
