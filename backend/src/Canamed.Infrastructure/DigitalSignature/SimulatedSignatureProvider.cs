using System.Security.Cryptography;
using System.Text;
using Canamed.Domain.MedicalDocuments;

namespace Canamed.Infrastructure.DigitalSignature;

public sealed class SimulatedSignatureProvider : IDigitalSignatureProvider
{
    public Task<string> ComputeSignatureHashAsync(MedicalDocument document, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(document);

        var rawString = $"{document.Id}:{document.ClinicId}:{document.PatientId}:{document.DoctorId}:{document.DocumentType}:{document.ContentPayload}:{document.Cid10Code}";
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawString));
        var hashHex = Convert.ToHexString(hashBytes).ToLowerInvariant();

        return Task.FromResult($"ICP-SIMULATED-SHA256:{hashHex}");
    }
}
