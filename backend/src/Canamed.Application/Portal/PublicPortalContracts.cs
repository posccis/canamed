using Canamed.Domain.Clinics;
using Canamed.Domain.Portal;

namespace Canamed.Application.Portal;

/// <summary>Repositório da superfície pública: clínicas por slug e tokens de capacidade.</summary>
public interface IPublicPortalRepository
{
    /// <summary>Obtém a clínica pelo slug público, ou <c>null</c> quando não existir (ER-009).</summary>
    Task<Clinic?> FindClinicBySlugAsync(string slug, CancellationToken cancellationToken = default);

    /// <summary>Obtém a clínica pelo identificador.</summary>
    Task<Clinic?> FindClinicAsync(Guid clinicId, CancellationToken cancellationToken = default);

    /// <summary>Adiciona um token de capacidade ao contexto de persistência.</summary>
    void AddToken(PatientCapabilityToken token);

    /// <summary>Localiza um token pelo hash SHA-256 (o valor em claro nunca é persistido).</summary>
    Task<PatientCapabilityToken?> FindTokenByHashAsync(string tokenHash, CancellationToken cancellationToken = default);

    /// <summary>Lista tokens ativos vinculados a um agendamento, para revogação em cascata (RN-008).</summary>
    Task<IReadOnlyList<PatientCapabilityToken>> ListActiveTokensForAppointmentAsync(
        Guid clinicId,
        Guid appointmentId,
        CancellationToken cancellationToken = default);

    /// <summary>Confirma as alterações pendentes no contexto de persistência.</summary>
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

/// <summary>Metadados públicos de uma clínica, resolvidos pelo slug.</summary>
public sealed record PublicClinicMetaResponse(
    Guid ClinicId,
    string Slug,
    string Name,
    string PublicName,
    string? HelpPhone,
    bool AllowWaitlist,
    bool AllowSelfReschedule,
    IReadOnlyList<PublicSpecialtyItem> Specialties,
    IReadOnlyList<PublicProfessionalItem> Professionals,
    IReadOnlyList<PublicAppointmentTypeItem> AppointmentTypes);

public sealed record PublicSpecialtyItem(Guid Id, string Name);

public sealed record PublicProfessionalItem(Guid Id, string Name, Guid? SpecialtyId);

public sealed record PublicAppointmentTypeItem(Guid Id, string Name, int DurationMinutes);

/// <summary>Resumo mínimo e mascarado de um link tokenizado (SPEC-0026/RN-006).</summary>
public sealed record CapabilityResolutionResponse(
    string Scope,
    string Status,
    Guid ClinicId,
    string ClinicSlug,
    string ClinicName,
    string? PatientNameMasked,
    DateTimeOffset ExpiresAt,
    CapabilityAppointmentSummary? Appointment,
    string? TicketCode,
    string? DocumentType);

public sealed record CapabilityAppointmentSummary(
    DateTimeOffset StartsAt,
    string ProfessionalName,
    string SpecialtyName,
    string Status);

/// <summary>Etapa do atendimento exibida ao paciente (SPEC-0026/9.3).</summary>
public sealed record CapabilityQueueStatusResponse(
    string TicketCode,
    string Stage,
    string StageLabel,
    string Message,
    int PositionInQueue,
    int EstimatedWaitMinutes,
    string? ProfessionalName,
    string? RoomName,
    DateTimeOffset UpdatedAt);

/// <summary>Resultado do check-in digital por link, com o link da fila já emitido.</summary>
public sealed record CapabilityCheckInResponse(
    string TicketCode,
    string Priority,
    int PositionInQueue,
    string ProfessionalName,
    string? QueuePath);

/// <summary>Pedido de emissão de link pela recepção (Central de Links / mensageria).</summary>
public sealed record IssueCapabilityLinkRequest(
    string Scope,
    Guid? AppointmentId = null,
    Guid? PatientId = null,
    Guid? QueueEntryId = null,
    Guid? MedicalDocumentId = null,
    int? ExpiresInHours = null,
    string? CreatedBy = null);

public sealed record IssueCapabilityLinkResponse(
    string Token,
    string Path,
    string Scope,
    DateTimeOffset ExpiresAt);
