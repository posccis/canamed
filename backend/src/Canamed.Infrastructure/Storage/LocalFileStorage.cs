using Canamed.Application.Abstractions;
using Microsoft.Extensions.Configuration;

namespace Canamed.Infrastructure.Storage;

/// <summary>
/// Implementação local do armazenamento privado de arquivos clínicos (SPEC-0028).
/// Os arquivos são gravados em diretório protegido fora do webroot público.
/// </summary>
public sealed class LocalFileStorage : IFileStorage
{
    private readonly string _basePath;

    public LocalFileStorage(IConfiguration configuration)
    {
        var configPath = configuration["Canamed:Storage:BasePath"];
        _basePath = !string.IsNullOrWhiteSpace(configPath)
            ? Path.GetFullPath(configPath)
            : Path.Combine(AppContext.BaseDirectory, "App_Data", "storage");

        if (!Directory.Exists(_basePath))
        {
            Directory.CreateDirectory(_basePath);
        }
    }

    public async Task<string> SaveFileAsync(
        string relativePath,
        Stream contentStream,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(relativePath);
        ArgumentNullException.ThrowIfNull(contentStream);

        var sanitizedRelative = relativePath.Replace('\\', '/').TrimStart('/');
        var targetFullPath = Path.GetFullPath(Path.Combine(_basePath, sanitizedRelative));

        if (!targetFullPath.StartsWith(_basePath, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Tentativa de gravação de arquivo fora do diretório permitido.");
        }

        var dir = Path.GetDirectoryName(targetFullPath);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
        {
            Directory.CreateDirectory(dir);
        }

        using var fileStream = new FileStream(targetFullPath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, useAsync: true);
        await contentStream.CopyToAsync(fileStream, cancellationToken).ConfigureAwait(false);

        return sanitizedRelative;
    }

    public Task<Stream?> GetFileAsync(
        string relativePath,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(relativePath);

        var sanitizedRelative = relativePath.Replace('\\', '/').TrimStart('/');
        var targetFullPath = Path.GetFullPath(Path.Combine(_basePath, sanitizedRelative));

        if (!targetFullPath.StartsWith(_basePath, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Tentativa de leitura de arquivo fora do diretório permitido.");
        }

        if (!File.Exists(targetFullPath))
        {
            return Task.FromResult<Stream?>(null);
        }

        Stream fileStream = new FileStream(targetFullPath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, useAsync: true);
        return Task.FromResult<Stream?>(fileStream);
    }

    public Task<bool> DeleteFileAsync(
        string relativePath,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(relativePath);

        var sanitizedRelative = relativePath.Replace('\\', '/').TrimStart('/');
        var targetFullPath = Path.GetFullPath(Path.Combine(_basePath, sanitizedRelative));

        if (!targetFullPath.StartsWith(_basePath, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Tentativa de remoção de arquivo fora do diretório permitido.");
        }

        if (File.Exists(targetFullPath))
        {
            File.Delete(targetFullPath);
            return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }
}
