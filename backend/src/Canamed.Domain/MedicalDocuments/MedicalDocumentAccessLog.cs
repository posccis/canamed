using Canamed.Domain.Common;

namespace Canamed.Domain.MedicalDocuments;

/// <summary>
/// Trilha de auditoria e registro de acesso a documentos clínicos emitidos (SPEC-0016).
/// </summary>
public sealed class MedicalDocumentAccessLog : Entity
{
    private MedicalDocumentAccessLog()
    {
    }

    public Guid MedicalDocumentId { get; private set; }
    public string AccessType { get; private set; } = string.Empty;
    public string? IpAddress { get; private set; }
    public string? UserAgent { get; private set; }

    public static MedicalDocumentAccessLog Record(
        Guid medicalDocumentId,
        string accessType,
        DateTimeOffset now,
        string? ipAddress = null,
        string? userAgent = null)
    {
        return new MedicalDocumentAccessLog
        {
            Id = Guid.NewGuid(),
            MedicalDocumentId = medicalDocumentId,
            AccessType = accessType,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            CreatedAt = now,
        };
    }
}
