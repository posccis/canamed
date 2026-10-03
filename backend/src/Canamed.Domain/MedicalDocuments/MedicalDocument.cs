using System.Security.Cryptography;
using Canamed.Domain.Common;

namespace Canamed.Domain.MedicalDocuments;

public sealed class MedicalDocument : Entity
{
    private MedicalDocument()
    {
    }

    public Guid ClinicId { get; private set; }

    public Guid PatientId { get; private set; }

    public Guid DoctorId { get; private set; }

    public Guid? MedicalRecordId { get; private set; }

    public string DocumentType { get; private set; } = MedicalDocumentType.ReceitaSimples;

    public string Status { get; private set; } = MedicalDocumentStatus.Rascunho;

    public string ContentPayload { get; private set; } = "{}";

    public string? Cid10Code { get; private set; }

    public bool PatientConsentedCid { get; private set; }

    public string? SignatureHash { get; private set; }

    public string PublicToken { get; private set; } = string.Empty;

    public string? CancellationReason { get; private set; }

    public DateTimeOffset? SignedAt { get; private set; }

    public DateTimeOffset? CancelledAt { get; private set; }

    public static MedicalDocument CreateDraft(
        Guid clinicId,
        Guid patientId,
        Guid doctorId,
        Guid? medicalRecordId,
        string documentType,
        string contentPayload,
        string? cid10Code,
        bool patientConsentedCid,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("A clínica é obrigatória.", nameof(clinicId));
        }

        if (patientId == Guid.Empty)
        {
            throw new ArgumentException("O paciente é obrigatório.", nameof(patientId));
        }

        if (doctorId == Guid.Empty)
        {
            throw new ArgumentException("O médico emissor é obrigatório.", nameof(doctorId));
        }

        var normalizedType = documentType?.Trim().ToLowerInvariant() ?? string.Empty;
        if (!MedicalDocumentType.All.Contains(normalizedType))
        {
            throw new ArgumentException($"Tipo de documento inválido: '{documentType}'.", nameof(documentType));
        }

        if (string.IsNullOrWhiteSpace(contentPayload))
        {
            throw new ArgumentException("O conteúdo do documento não pode ser vazio.", nameof(contentPayload));
        }

        if (!string.IsNullOrWhiteSpace(cid10Code) && !patientConsentedCid)
        {
            throw new InvalidOperationException("A inclusão de diagnóstico CID exige confirmação expressa de consentimento do paciente conforme o Código de Ética Médica.");
        }

        var token = GeneratePublicToken();

        var document = new MedicalDocument
        {
            ClinicId = clinicId,
            PatientId = patientId,
            DoctorId = doctorId,
            MedicalRecordId = medicalRecordId,
            DocumentType = normalizedType,
            Status = MedicalDocumentStatus.Rascunho,
            ContentPayload = contentPayload.Trim(),
            Cid10Code = string.IsNullOrWhiteSpace(cid10Code) ? null : cid10Code.Trim().ToUpperInvariant(),
            PatientConsentedCid = patientConsentedCid,
            PublicToken = token
        };

        document.MarkCreated(now);
        return document;
    }

    public void UpdateDraft(string contentPayload, string? cid10Code, bool patientConsentedCid, DateTimeOffset now)
    {
        if (Status != MedicalDocumentStatus.Rascunho)
        {
            throw new InvalidOperationException("Apenas documentos no status de rascunho podem ser alterados.");
        }

        if (string.IsNullOrWhiteSpace(contentPayload))
        {
            throw new ArgumentException("O conteúdo do documento não pode ser vazio.", nameof(contentPayload));
        }

        if (!string.IsNullOrWhiteSpace(cid10Code) && !patientConsentedCid)
        {
            throw new InvalidOperationException("A inclusão de diagnóstico CID exige confirmação expressa de consentimento do paciente conforme o Código de Ética Médica.");
        }

        ContentPayload = contentPayload.Trim();
        Cid10Code = string.IsNullOrWhiteSpace(cid10Code) ? null : cid10Code.Trim().ToUpperInvariant();
        PatientConsentedCid = patientConsentedCid;
        MarkUpdated(now);
    }

    public void Sign(string signatureHash, DateTimeOffset signedAt)
    {
        if (Status != MedicalDocumentStatus.Rascunho)
        {
            throw new InvalidOperationException("Apenas documentos em rascunho podem ser assinados.");
        }

        if (string.IsNullOrWhiteSpace(signatureHash))
        {
            throw new ArgumentException("O hash da assinatura digital é obrigatório.", nameof(signatureHash));
        }

        SignatureHash = signatureHash.Trim();
        SignedAt = signedAt.ToUniversalTime();
        Status = MedicalDocumentStatus.Assinado;
        MarkUpdated(signedAt);
    }

    public void Cancel(string reason, DateTimeOffset cancelledAt)
    {
        if (Status == MedicalDocumentStatus.Cancelado)
        {
            throw new InvalidOperationException("O documento já se encontra cancelado.");
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("Informe a justificativa detalhada para o cancelamento do documento médico.", nameof(reason));
        }

        CancellationReason = reason.Trim();
        CancelledAt = cancelledAt.ToUniversalTime();
        Status = MedicalDocumentStatus.Cancelado;
        MarkUpdated(cancelledAt);
    }

    private static string GeneratePublicToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(16);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
