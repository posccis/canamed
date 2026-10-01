using System.Security.Cryptography;
using System.Text;
using Canamed.Application.Abstractions;
using Konscious.Security.Cryptography;

namespace Canamed.Infrastructure.Identity;

/// <summary>
/// Proteção de senhas com Argon2id (RN-002). O valor codificado carrega os parâmetros e o salt,
/// permitindo evoluir o custo sem invalidar credenciais existentes.
/// </summary>
public sealed class Argon2PasswordHasher : IPasswordHasher
{
    private const string Algorithm = "argon2id";
    private const int Iterations = 3;
    private const int MemoryKibibytes = 65536;
    private const int Parallelism = 1;
    private const int SaltBytes = 16;
    private const int HashBytes = 32;

    public string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrEmpty(password);

        var salt = RandomNumberGenerator.GetBytes(SaltBytes);
        var hash = Derive(password, salt, Iterations, MemoryKibibytes, Parallelism);

        return string.Join(
            '$',
            Algorithm,
            Iterations,
            MemoryKibibytes,
            Parallelism,
            Convert.ToBase64String(salt),
            Convert.ToBase64String(hash));
    }

    public bool Verify(string password, string encodedHash)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrWhiteSpace(encodedHash))
        {
            return false;
        }

        var parts = encodedHash.Split('$');

        if (parts.Length is not 6 || !string.Equals(parts[0], Algorithm, StringComparison.Ordinal))
        {
            return false;
        }

        if (!int.TryParse(parts[1], out var iterations)
            || !int.TryParse(parts[2], out var memory)
            || !int.TryParse(parts[3], out var parallelism))
        {
            return false;
        }

        byte[] salt;
        byte[] expected;

        try
        {
            salt = Convert.FromBase64String(parts[4]);
            expected = Convert.FromBase64String(parts[5]);
        }
        catch (FormatException)
        {
            return false;
        }

        var actual = Derive(password, salt, iterations, memory, parallelism, expected.Length);

        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    private static byte[] Derive(
        string password,
        byte[] salt,
        int iterations,
        int memory,
        int parallelism,
        int outputBytes = HashBytes)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            Iterations = iterations,
            MemorySize = memory,
            DegreeOfParallelism = parallelism,
        };

        return argon2.GetBytes(outputBytes);
    }
}
