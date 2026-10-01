namespace Canamed.Domain.Auditing;

/// <summary>
/// Evento da trilha de auditoria. Estrutura *append-only* (RN-010 da SPEC-0001): o banco impede
/// alteração e exclusão de registros já gravados.
/// </summary>
public sealed class AuditEvent
{
    private AuditEvent()
    {
    }

    public Guid Id { get; private set; } = Guid.NewGuid();

    /// <summary>Clínica do evento; <c>null</c> em eventos de sistema (ex.: falha de login sem clínica resolvida).</summary>
    public Guid? ClinicId { get; private set; }

    /// <summary>Identificador do usuário responsável pela ação.</summary>
    public string ActorId { get; private set; } = string.Empty;

    /// <summary>Nome do usuário responsável pela ação, para leitura humana da trilha.</summary>
    public string ActorName { get; private set; } = string.Empty;

    /// <summary>Ação executada (ex.: <c>appointment.created</c>).</summary>
    public string Action { get; private set; } = string.Empty;

    /// <summary>Tipo do recurso afetado (ex.: <c>appointments</c>).</summary>
    public string ResourceType { get; private set; } = string.Empty;

    /// <summary>Identificador do recurso afetado.</summary>
    public string? ResourceId { get; private set; }

    /// <summary>Momento do evento, em UTC.</summary>
    public DateTimeOffset OccurredAt { get; private set; }

    /// <summary>Detalhes adicionais em JSON, sem dados pessoais de paciente (RN-014).</summary>
    public string? Details { get; private set; }

    /// <summary>Registra um novo evento de auditoria.</summary>
    public static AuditEvent Record(
        Guid? clinicId,
        string actorId,
        string actorName,
        string action,
        string resourceType,
        string? resourceId,
        DateTimeOffset occurredAt,
        string? details = null) =>
        new()
        {
            ClinicId = clinicId,
            ActorId = string.IsNullOrWhiteSpace(actorId) ? "desconhecido" : actorId.Trim(),
            ActorName = string.IsNullOrWhiteSpace(actorName) ? "desconhecido" : actorName.Trim(),
            Action = action,
            ResourceType = resourceType,
            ResourceId = resourceId,
            OccurredAt = occurredAt.ToUniversalTime(),
            Details = details,
        };
}
