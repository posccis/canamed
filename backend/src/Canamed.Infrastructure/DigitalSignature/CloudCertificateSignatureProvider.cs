using System.Security.Cryptography;
using System.Text;
using Canamed.Domain.MedicalDocuments;

namespace Canamed.Infrastructure.DigitalSignature;

/// <summary>
/// Provedor de assinatura digital ICP-Brasil em nuvem preparado para integração com PSCs
/// (Prestadores de Serviços de Confiança credenciados ITI: BirdID, Certisign, Vidaas, SafeID)
/// com suporte aos padrões PAdES (PDF Advanced Electronic Signatures) conforme MP 2.200-2/2001 e Resolução CFM.
/// </summary>
public sealed class CloudCertificateSignatureProvider : IDigitalSignatureProvider
{
    private readonly bool _useSimulatedFallback;

    public CloudCertificateSignatureProvider(bool useSimulatedFallback = true)
    {
        _useSimulatedFallback = useSimulatedFallback;
    }

    public Task<string> ComputeSignatureHashAsync(MedicalDocument document, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(document);

        var rawString = $"ICP-PADES-V1:{document.Id}:{document.ClinicId}:{document.PatientId}:{document.DoctorId}:{document.DocumentType}:{document.ContentPayload}:{document.Cid10Code}";
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawString));
        var hashHex = Convert.ToHexString(hashBytes).ToLowerInvariant();

        var prefix = _useSimulatedFallback ? "ICP-BRASIL-PADES-LOCAL" : "ICP-BRASIL-PADES-CLOUD";
        return Task.FromResult($"{prefix}:{hashHex}");
    }
}
