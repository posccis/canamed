using Canamed.Domain.Common;

namespace Canamed.Domain.Privacy;

public enum PrivacyRequestType
{
    DataAccess,
    Rectification,
    Deletion,
    ConsentRevocation,
}

public enum PrivacyRequestStatus
{
    Pending,
    UnderReview,
    Completed,
    Rejected,
}

/// <summary>
/// Solicitação formal de exercício dos direitos do titular de dados (Art. 18 da LGPD - SPEC-0018).
/// </summary>
public sealed class PrivacyRequest : Entity
{
    private PrivacyRequest()
    {
    }

    public string Protocol { get; private set; } = string.Empty;
    public Guid ClinicId { get; private set; }
    public Guid PatientId { get; private set; }
    public PrivacyRequestType RequestType { get; private set; }
    public string? Details { get; private set; }
    public PrivacyRequestStatus Status { get; private set; }
    public string? ResponseNotes { get; private set; }
    public DateTimeOffset DueDate { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }

    public static PrivacyRequest Open(
        Guid clinicId,
        Guid patientId,
        PrivacyRequestType requestType,
        string? details,
        DateTimeOffset now)
    {
        var randomSuffix = Random.Shared.Next(1000, 9999);
        var protocol = $"LGPD-{now:yyyyMMdd}-{randomSuffix}";

        return new PrivacyRequest
        {
            Id = Guid.NewGuid(),
            Protocol = protocol,
            ClinicId = clinicId,
            PatientId = patientId,
            RequestType = requestType,
            Details = details?.Trim(),
            Status = PrivacyRequestStatus.Pending,
            DueDate = now.AddDays(15), // Prazo legal de 15 dias (Art. 19 da LGPD)
            CreatedAt = now,
        };
    }

    public void Respond(string responseNotes, PrivacyRequestStatus finalStatus, DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(responseNotes))
            throw new ArgumentException("A resposta do DPO não pode ser vazia.", nameof(responseNotes));

        ResponseNotes = responseNotes.Trim();
        Status = finalStatus;
        CompletedAt = now;
    }
}
