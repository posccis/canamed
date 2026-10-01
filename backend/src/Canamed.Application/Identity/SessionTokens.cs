using System.Security.Cryptography;
using System.Text;

namespace Canamed.Application.Identity;

/// <summary>
/// Geração e verificação do token de sessão (RN-006): token aleatório de 256 bits entregue ao navegador
/// e apenas o hash SHA-256 persistido no banco.
/// </summary>
public static class SessionTokens
{
    /// <summary>Cria um novo par (token, hash).</summary>
    public static (string Token, string Hash) Create()
    {
        var token = Base64UrlEncode(RandomNumberGenerator.GetBytes(32));

        return (token, Hash(token));
    }

    /// <summary>Calcula o hash SHA-256 do token, em hexadecimal minúsculo.</summary>
    public static string Hash(string token)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(token);

        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
    }

    private static string Base64UrlEncode(byte[] value) =>
        Convert.ToBase64String(value).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
