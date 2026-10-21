using Canamed.Application.Abstractions;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Canamed.Infrastructure.Persistence.Converters;

/// <summary>
/// Conversor de valor do EF Core que aplica criptografia em repouso com prefixo "ENC:v1:"
/// sobre campos íntimos e sensíveis de saúde da mulher (LGPD Art. 11 e RN-004 da SPEC-0034).
/// Possui fallback retrocompatível que lê campos legados em texto claro sem lançar exceção.
/// </summary>
public sealed class EncryptedStringConverter : ValueConverter<string?, string?>
{
    public const string Prefix = "ENC:v1:";

    private static ISecretProtector? _ambientProtector;

    public static ISecretProtector? AmbientProtector
    {
        get => _ambientProtector;
        set => _ambientProtector = value;
    }

    public EncryptedStringConverter()
        : this(AmbientProtector)
    {
    }

    public EncryptedStringConverter(ISecretProtector? protector)
        : base(
            plain => Encrypt(plain, protector),
            cipher => Decrypt(cipher, protector))
    {
    }

    public static string? Encrypt(string? plain, ISecretProtector? protector = null)
    {
        if (string.IsNullOrEmpty(plain))
        {
            return plain;
        }

        if (plain.StartsWith(Prefix, StringComparison.Ordinal))
        {
            return plain;
        }

        var activeProtector = protector ?? AmbientProtector;
        if (activeProtector is null)
        {
            return plain;
        }

        return Prefix + activeProtector.Protect(plain);
    }

    public static string? Decrypt(string? cipher, ISecretProtector? protector = null)
    {
        if (string.IsNullOrEmpty(cipher))
        {
            return cipher;
        }

        if (!cipher.StartsWith(Prefix, StringComparison.Ordinal))
        {
            // Fallback retrocompatível: texto plano legado sem prefixo não lança exceção
            return cipher;
        }

        var activeProtector = protector ?? AmbientProtector;
        if (activeProtector is null)
        {
            return cipher;
        }

        var cipherPayload = cipher[Prefix.Length..];
        return activeProtector.Unprotect(cipherPayload);
    }
}
