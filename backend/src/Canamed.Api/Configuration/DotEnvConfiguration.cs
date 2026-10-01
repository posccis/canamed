using Microsoft.Extensions.Configuration;

namespace Canamed.Api.Configuration;

/// <summary>
/// Carrega o arquivo <c>.env</c> local em Development, conforme o provisionamento descrito no README
/// e no ADR-0004. Variáveis de ambiente reais sempre prevalecem sobre o arquivo, e segredos continuam
/// fora do repositório.
/// </summary>
internal static class DotEnvConfiguration
{
    private const string FileName = ".env";

    public static void AddLocalEnvFile(this ConfigurationManager configuration, IWebHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);

        if (!environment.IsDevelopment())
        {
            return;
        }

        var path = FindFile(environment.ContentRootPath, Directory.GetCurrentDirectory());

        if (path is null)
        {
            return;
        }

        // O separador "__" representa ":" nas chaves hierárquicas, igual às variáveis de ambiente do .NET.
        var values = Parse(path)
            .Select(pair => new KeyValuePair<string, string>(
                pair.Key.Replace("__", ":", StringComparison.Ordinal),
                pair.Value))
            .Where(pair => configuration[pair.Key] is null)
            .ToDictionary(
                pair => pair.Key,
                pair => (string?)pair.Value,
                StringComparer.OrdinalIgnoreCase);

        if (values.Count > 0)
        {
            configuration.AddInMemoryCollection(values);
        }
    }

    private static string? FindFile(params string[] startDirectories)
    {
        foreach (var startDirectory in startDirectories)
        {
            var directory = new DirectoryInfo(startDirectory);

            while (directory is not null)
            {
                var candidate = Path.Combine(directory.FullName, FileName);

                if (File.Exists(candidate))
                {
                    return candidate;
                }

                directory = directory.Parent;
            }
        }

        return null;
    }

    private static IEnumerable<KeyValuePair<string, string>> Parse(string path)
    {
        foreach (var rawLine in File.ReadLines(path))
        {
            var line = rawLine.Trim();

            if (line.Length is 0 || line.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = line.IndexOf('=', StringComparison.Ordinal);

            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            var value = line[(separatorIndex + 1)..].Trim().Trim('"');

            if (key.Length > 0)
            {
                yield return new KeyValuePair<string, string>(key, value);
            }
        }
    }
}
