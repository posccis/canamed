namespace Canamed.Application.Abstractions;

/// <summary>
/// Abstração para armazenamento seguro de arquivos e laudos de saúde (SPEC-0028).
/// Garante isolamento fora do webroot e acesso restrito por autorização e auditoria.
/// </summary>
public interface IFileStorage
{
    Task<string> SaveFileAsync(
        string relativePath,
        Stream contentStream,
        CancellationToken cancellationToken = default);

    Task<Stream?> GetFileAsync(
        string relativePath,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteFileAsync(
        string relativePath,
        CancellationToken cancellationToken = default);
}
