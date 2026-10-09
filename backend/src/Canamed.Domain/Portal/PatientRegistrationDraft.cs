using Canamed.Domain.Common;

namespace Canamed.Domain.Portal;

/// <summary>Status do fluxo de cadastro completo (SPEC-0026/RN-015, RN-016 e seção 7.3).</summary>
public enum RegistrationDraftStatus
{
    Draft,
    PendingReview,
    Approved,
    Returned,
}

public static class RegistrationDraftMap
{
    public static string ToStoredValue(this RegistrationDraftStatus status) => status switch
    {
        RegistrationDraftStatus.Draft => "draft",
        RegistrationDraftStatus.PendingReview => "pending_review",
        RegistrationDraftStatus.Approved => "approved",
        RegistrationDraftStatus.Returned => "returned",
        _ => throw new ArgumentOutOfRangeException(nameof(status), status, "Status de rascunho inválido."),
    };

    public static RegistrationDraftStatus FromStoredValue(string value) => value switch
    {
        "draft" => RegistrationDraftStatus.Draft,
        "pending_review" => RegistrationDraftStatus.PendingReview,
        "approved" => RegistrationDraftStatus.Approved,
        "returned" => RegistrationDraftStatus.Returned,
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, $"Status '{value}' não suportado."),
    };
}

/// <summary>
/// Rascunho de cadastro completo do paciente para validação pela recepção (SPEC-0026/F-004).
/// Não altera diretamente a entidade Patient enquanto estiver em rascunho ou pendente de revisão.
/// </summary>
public sealed class PatientRegistrationDraft : Entity
{
    private PatientRegistrationDraft()
    {
    }

    public Guid ClinicId { get; private set; }

    public Guid PatientId { get; private set; }

    /// <summary>Token de capacidade de escopo registration vinculado ao rascunho.</summary>
    public Guid? CapabilityTokenId { get; private set; }

    /// <summary>Payload com dados cadastrais, endereço, convênio e anamnese em JSON.</summary>
    public string PayloadJson { get; private set; } = "{}";

    public RegistrationDraftStatus Status { get; private set; }

    public string? ReviewNote { get; private set; }

    public DateTimeOffset? SubmittedAt { get; private set; }

    public DateTimeOffset? ReviewedAt { get; private set; }

    public Guid? ReviewedBy { get; private set; }

    public static PatientRegistrationDraft Create(
        Guid clinicId,
        Guid patientId,
        string payloadJson,
        DateTimeOffset now,
        Guid? capabilityTokenId = null,
        Guid? id = null)
    {
        var draft = new PatientRegistrationDraft
        {
            Id = id ?? Guid.NewGuid(),
            ClinicId = clinicId,
            PatientId = patientId,
            CapabilityTokenId = capabilityTokenId,
            PayloadJson = string.IsNullOrWhiteSpace(payloadJson) ? "{}" : payloadJson.Trim(),
            Status = RegistrationDraftStatus.Draft,
        };

        draft.MarkCreated(now);
        return draft;
    }

    public void UpdateDraft(string payloadJson, DateTimeOffset now)
    {
        if (Status is RegistrationDraftStatus.Approved)
        {
            throw new InvalidOperationException("Um cadastro já aprovado não pode ser alterado em rascunho.");
        }

        PayloadJson = string.IsNullOrWhiteSpace(payloadJson) ? "{}" : payloadJson.Trim();
        MarkUpdated(now);
    }

    public void SubmitForReview(DateTimeOffset now)
    {
        if (Status is RegistrationDraftStatus.Approved)
        {
            throw new InvalidOperationException("O cadastro já foi aprovado.");
        }

        Status = RegistrationDraftStatus.PendingReview;
        SubmittedAt = now;
        ReviewNote = null;
        MarkUpdated(now);
    }

    public void Approve(Guid? reviewerId, DateTimeOffset now)
    {
        if (Status is not RegistrationDraftStatus.PendingReview)
        {
            throw new InvalidOperationException("Apenas cadastros pendentes de revisão podem ser aprovados.");
        }

        Status = RegistrationDraftStatus.Approved;
        ReviewedBy = reviewerId;
        ReviewedAt = now;
        MarkUpdated(now);
    }

    public void Return(Guid? reviewerId, string note, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(note);

        if (Status is not RegistrationDraftStatus.PendingReview)
        {
            throw new InvalidOperationException("Apenas cadastros pendentes de revisão podem ser devolvidos.");
        }

        Status = RegistrationDraftStatus.Returned;
        ReviewedBy = reviewerId;
        ReviewedAt = now;
        ReviewNote = note.Trim();
        MarkUpdated(now);
    }
}
