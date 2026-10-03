using Canamed.Domain.MedicalDocuments;
using Canamed.Infrastructure.DigitalSignature;
using Xunit;

namespace Canamed.UnitTests.MedicalDocuments;

public sealed class MedicalDocumentTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _patientId = Guid.NewGuid();
    private readonly Guid _doctorId = Guid.NewGuid();

    [Fact]
    public void CreateDraft_CreatesWithUniquePublicToken()
    {
        var doc = MedicalDocument.CreateDraft(
            _clinicId,
            _patientId,
            _doctorId,
            medicalRecordId: null,
            documentType: MedicalDocumentType.ReceitaSimples,
            contentPayload: "{\"items\":[]}",
            cid10Code: null,
            patientConsentedCid: false,
            _now);

        Assert.Equal(MedicalDocumentStatus.Rascunho, doc.Status);
        Assert.False(string.IsNullOrWhiteSpace(doc.PublicToken));
        Assert.Null(doc.SignedAt);
        Assert.Null(doc.SignatureHash);
    }

    [Fact]
    public void CreateDraft_Throws_WhenCidInformedWithoutPatientConsent()
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            MedicalDocument.CreateDraft(
                _clinicId,
                _patientId,
                _doctorId,
                medicalRecordId: null,
                documentType: MedicalDocumentType.AtestadoMedico,
                contentPayload: "{\"days\":3}",
                cid10Code: "M54.5",
                patientConsentedCid: false,
                _now));

        Assert.Contains("consentimento do paciente", ex.Message);
    }

    [Fact]
    public void CreateDraft_AllowsCid_WhenPatientConsented()
    {
        var doc = MedicalDocument.CreateDraft(
            _clinicId,
            _patientId,
            _doctorId,
            medicalRecordId: null,
            documentType: MedicalDocumentType.AtestadoMedico,
            contentPayload: "{\"days\":3}",
            cid10Code: "M54.5",
            patientConsentedCid: true,
            _now);

        Assert.Equal("M54.5", doc.Cid10Code);
        Assert.True(doc.PatientConsentedCid);
    }

    [Fact]
    public void Sign_SetsAssinadoStatusAndHash()
    {
        var doc = MedicalDocument.CreateDraft(
            _clinicId,
            _patientId,
            _doctorId,
            medicalRecordId: null,
            documentType: MedicalDocumentType.ReceitaSimples,
            contentPayload: "{\"items\":[]}",
            cid10Code: null,
            patientConsentedCid: false,
            _now);

        doc.Sign("HASH-SHA256-TEST", _now.AddMinutes(5));

        Assert.Equal(MedicalDocumentStatus.Assinado, doc.Status);
        Assert.Equal("HASH-SHA256-TEST", doc.SignatureHash);
        Assert.NotNull(doc.SignedAt);
    }

    [Fact]
    public void UpdateDraft_Throws_WhenAlreadySigned()
    {
        var doc = MedicalDocument.CreateDraft(
            _clinicId,
            _patientId,
            _doctorId,
            medicalRecordId: null,
            documentType: MedicalDocumentType.ReceitaSimples,
            contentPayload: "{\"items\":[]}",
            cid10Code: null,
            patientConsentedCid: false,
            _now);

        doc.Sign("HASH-SHA256-TEST", _now);

        var ex = Assert.Throws<InvalidOperationException>(() =>
            doc.UpdateDraft("{\"items\":[\"new\"]}", null, false, _now));

        Assert.Contains("Apenas documentos no status de rascunho podem ser alterados", ex.Message);
    }

    [Fact]
    public void Cancel_SetsCanceladoStatusWithReason()
    {
        var doc = MedicalDocument.CreateDraft(
            _clinicId,
            _patientId,
            _doctorId,
            medicalRecordId: null,
            documentType: MedicalDocumentType.ReceitaSimples,
            contentPayload: "{\"items\":[]}",
            cid10Code: null,
            patientConsentedCid: false,
            _now);

        doc.Sign("HASH-SHA256-TEST", _now);
        doc.Cancel("Erro na posologia", _now.AddMinutes(10));

        Assert.Equal(MedicalDocumentStatus.Cancelado, doc.Status);
        Assert.Equal("Erro na posologia", doc.CancellationReason);
        Assert.NotNull(doc.CancelledAt);
    }

    [Fact]
    public async Task SimulatedSignatureProvider_ComputesValidDeterministicHash()
    {
        var doc = MedicalDocument.CreateDraft(
            _clinicId,
            _patientId,
            _doctorId,
            medicalRecordId: null,
            documentType: MedicalDocumentType.ReceitaSimples,
            contentPayload: "{\"items\":[{\"medication\":\"Paracetamol\"}]}",
            cid10Code: null,
            patientConsentedCid: false,
            _now);

        var provider = new SimulatedSignatureProvider();
        var hash = await provider.ComputeSignatureHashAsync(doc);

        Assert.StartsWith("ICP-SIMULATED-SHA256:", hash);
        Assert.True(hash.Length > 30);
    }
}
