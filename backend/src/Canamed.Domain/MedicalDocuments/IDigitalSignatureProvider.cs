namespace Canamed.Domain.MedicalDocuments;

public interface IDigitalSignatureProvider
{
    Task<string> ComputeSignatureHashAsync(MedicalDocument document, CancellationToken cancellationToken = default);
}
