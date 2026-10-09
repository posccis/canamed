using System.Security.Cryptography;
using System.Text;
using Canamed.Domain.Common;

namespace Canamed.Domain.Portal;

/// <summary>Escopos de um token de capacidade de link compartilhável (SPEC-0026/RN-004).</summary>
public enum CapabilityScope
{
    /// <summary>Confirmação de presença em um clique.</summary>
    Confirm,

    /// <summary>Cancelamento autônomo com política e desafio.</summary>
    Cancel,

    /// <summary>Reagendamento autônomo com disponibilidade em tempo real.</summary>
    Reschedule,

    /// <summary>Check-in digital por link/QR Code.</summary>
    CheckIn,

    /// <summary>Acompanhamento da fila e da etapa do atendimento.</summary>
    Queue,

    /// <summary>Cadastro completo com validação da recepção.</summary>
    Registration,

    /// <summary>Acesso a um documento clínico específico.</summary>
    Document,

    /// <summary>Aceite de uma vaga ofertada pela lista de espera.</summary>
    WaitlistOffer,
}

/// <summary>Ciclo de vida de um token de capacidade (SPEC-0026/RN-004 e RN-007).</summary>
public enum CapabilityTokenStatus
{
    Active,
    Used,
    Revoked,
    Expired,
}

/// <summary>Conversão entre o enum de código e o valor persistido (RN-014 da SPEC-0001).</summary>
public static class CapabilityMap
{
    private static readonly Dictionary<CapabilityScope, string> Scopes = new()
    {
        [CapabilityScope.Confirm] = "confirm",
        [CapabilityScope.Cancel] = "cancel",
        [CapabilityScope.Reschedule] = "reschedule",
        [CapabilityScope.CheckIn] = "check_in",
        [CapabilityScope.Queue] = "queue",
        [CapabilityScope.Registration] = "registration",
        [CapabilityScope.Document] = "document",
        [CapabilityScope.WaitlistOffer] = "waitlist_offer",
    };

    private static readonly Dictionary<CapabilityTokenStatus, string> Statuses = new()
    {
        [CapabilityTokenStatus.Active] = "active",
        [CapabilityTokenStatus.Used] = "used",
        [CapabilityTokenStatus.Revoked] = "revoked",
        [CapabilityTokenStatus.Expired] = "expired",
    };

    private static readonly Dictionary<string, CapabilityScope> ScopesByValue =
        Scopes.ToDictionary(pair => pair.Value, pair => pair.Key, StringComparer.Ordinal);

    private static readonly Dictionary<string, CapabilityTokenStatus> StatusesByValue =
        Statuses.ToDictionary(pair => pair.Value, pair => pair.Key, StringComparer.Ordinal);

    public static IReadOnlyList<string> ScopeValues { get; } = [.. Scopes.Values];

    public static IReadOnlyList<string> StatusValues { get; } = [.. Statuses.Values];

    public static string ToStoredValue(this CapabilityScope scope) =>
        Scopes.TryGetValue(scope, out var value)
            ? value
            : throw new ArgumentOutOfRangeException(nameof(scope), scope, "Escopo desconhecido.");

    public static string ToStoredValue(this CapabilityTokenStatus status) =>
        Statuses.TryGetValue(status, out var value)
            ? value
            : throw new ArgumentOutOfRangeException(nameof(status), status, "Status de token desconhecido.");

    public static CapabilityScope ScopeFromStoredValue(string? value) =>
        value is not null && ScopesByValue.TryGetValue(value, out var scope)
            ? scope
            : throw new ArgumentOutOfRangeException(nameof(value), value, "Escopo desconhecido.");

    public static CapabilityTokenStatus StatusFromStoredValue(string? value) =>
        value is not null && StatusesByValue.TryGetValue(value, out var status)
            ? status
            : throw new ArgumentOutOfRangeException(nameof(value), value, "Status de token desconhecido.");
}

/// <summary>
/// Token de capacidade de um link compartilhável: opaco, guardado apenas como hash, com escopo,
/// validade, consumo e revogação (SPEC-0026/RN-004 a RN-008).
/// </summary>
public sealed class PatientCapabilityToken : Entity
{
    private PatientCapabilityToken()
    {
    }

    public Guid ClinicId { get; private set; }

    public Guid? PatientId { get; private set; }

    public Guid? AppointmentId { get; private set; }

    public Guid? QueueEntryId { get; private set; }

    public Guid? MedicalDocumentId { get; private set; }

    public CapabilityScope Scope { get; private set; }

    /// <summary>Hash SHA-256 (hex) do token; o valor em claro nunca é persistido (RN-004).</summary>
    public string TokenHash { get; private set; } = string.Empty;

    public CapabilityTokenStatus Status { get; private set; } = CapabilityTokenStatus.Active;

    public DateTimeOffset ExpiresAt { get; private set; }

    public DateTimeOffset? UsedAt { get; private set; }

    /// <summary>Origem do token: `system`, `reception` ou `doctor`.</summary>
    public string CreatedBy { get; private set; } = "system";

    /// <summary>
    /// Emite um novo token de capacidade. Retorna o valor em claro (para montar o link) e a entidade a
    /// persistir; o valor em claro existe apenas em memória e na mensagem enviada (RN-004, RN-006).
    /// </summary>
    public static (string Token, PatientCapabilityToken Entity) Issue(
        Guid clinicId,
        CapabilityScope scope,
        DateTimeOffset expiresAt,
        DateTimeOffset now,
        Guid? patientId = null,
        Guid? appointmentId = null,
        Guid? queueEntryId = null,
        Guid? medicalDocumentId = null,
        string createdBy = "system")
    {
        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("A clínica do token é obrigatória.", nameof(clinicId));
        }

        if (expiresAt <= now)
        {
            throw new ArgumentOutOfRangeException(nameof(expiresAt), "A validade do token deve ser futura.");
        }

        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

        var entity = new PatientCapabilityToken
        {
            ClinicId = clinicId,
            PatientId = patientId,
            AppointmentId = appointmentId,
            QueueEntryId = queueEntryId,
            MedicalDocumentId = medicalDocumentId,
            Scope = scope,
            TokenHash = Hash(rawToken),
            Status = CapabilityTokenStatus.Active,
            ExpiresAt = expiresAt,
            CreatedBy = string.IsNullOrWhiteSpace(createdBy) ? "system" : createdBy.Trim(),
        };

        entity.MarkCreated(now);

        return (rawToken, entity);
    }

    /// <summary>Hash SHA-256 em hexadecimal minúsculo; é o único valor persistido.</summary>
    public static string Hash(string rawToken) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();

    /// <summary>Indica se o token pode ser usado agora.</summary>
    public bool IsUsable(DateTimeOffset now) =>
        Status == CapabilityTokenStatus.Active && now < ExpiresAt;

    /// <summary>Marca o token de uso único como consumido (RN-007).</summary>
    public void Consume(DateTimeOffset now) =>
        TransitionTo(CapabilityTokenStatus.Used, now, static (token, moment) => token.UsedAt = moment);

    /// <summary>Revoga o token; novos links só são emitidos para o estado vigente (RN-008).</summary>
    public void Revoke(DateTimeOffset now) =>
        TransitionTo(CapabilityTokenStatus.Revoked, now, static (_, _) => { });

    /// <summary>Marca o token como expirado.</summary>
    public void Expire(DateTimeOffset now) =>
        TransitionTo(CapabilityTokenStatus.Expired, now, static (_, _) => { });

    private void TransitionTo(
        CapabilityTokenStatus target,
        DateTimeOffset now,
        Action<PatientCapabilityToken, DateTimeOffset> apply)
    {
        if (Status == target)
        {
            return;
        }

        if (Status != CapabilityTokenStatus.Active)
        {
            throw new InvalidOperationException("Este link não está mais disponível.");
        }

        Status = target;
        apply(this, now);
        MarkUpdated(now);
    }
}
