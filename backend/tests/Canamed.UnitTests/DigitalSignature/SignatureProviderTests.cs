using Canamed.Domain.MedicalDocuments;
using Canamed.Infrastructure.DigitalSignature;
using Xunit;

namespace Canamed.UnitTests.DigitalSignature;

public sealed class SignatureProviderTests
{
    [Fact]
    public async Task CloudCertificateSignatureProvider_DeveGerarHashPAdESComPrefixoAdequado()
    {
        var provider = new CloudCertificateSignatureProvider(useSimulatedFallback: true);

        var clinicId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var doctorId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        var document = MedicalDocument.CreateDraft(
            clinicId,
            patientId,
            doctorId,
            null,
            MedicalDocumentType.ReceitaSimples,
            "{\"medicamento\":\"Etinilestradiol 0.03mg + Levonorgestrel 0.15mg\"}",
            null,
            false,
            now);

        var signatureHash = await provider.ComputeSignatureHashAsync(document);

        Assert.NotNull(signatureHash);
        Assert.StartsWith("ICP-BRASIL-PADES-LOCAL:", signatureHash);
    }
}
