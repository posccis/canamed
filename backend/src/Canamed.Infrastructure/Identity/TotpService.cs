using System.Security.Cryptography;
using System.Text;
using Canamed.Application.Abstractions;

namespace Canamed.Infrastructure.Identity;

/// <summary>
/// Segundo fator TOTP conforme a RFC 6238 (SHA-1, 30 segundos, 6 dígitos) com janela de ±1 passo,
/// aceitando pequena diferença de relógio entre servidor e aplicativo autenticador (RN-010).
/// </summary>
public sealed class TotpService : ITotpService
{
    private const int StepSeconds = 30;
    private const int Digits = 6;
    private const int SecretBytes = 20;
    private const string Issuer = "CANAMED";

    public string GenerateSecret() => Base32Encode(RandomNumberGenerator.GetBytes(SecretBytes));

    public string BuildOtpAuthUri(string accountName, string secret) =>
        $"otpauth://totp/{Issuer}:{Uri.EscapeDataString(accountName)}"
        + $"?secret={secret}&issuer={Issuer}&algorithm=SHA1&digits={Digits}&period={StepSeconds}";

    public bool Verify(string secret, string? code, DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(code))
        {
            return false;
        }

        var normalized = code.Trim().Replace(" ", string.Empty, StringComparison.Ordinal);

        if (normalized.Length != Digits || !normalized.All(char.IsAsciiDigit))
        {
            return false;
        }

        byte[] key;

        try
        {
            key = Base32Decode(secret);
        }
        catch (FormatException)
        {
            return false;
        }

        var counter = now.ToUnixTimeSeconds() / StepSeconds;
        var expected = Encoding.ASCII.GetBytes(normalized);

        for (var offset = -1; offset <= 1; offset++)
        {
            var candidate = Encoding.ASCII.GetBytes(ComputeCode(key, counter + offset));

            if (CryptographicOperations.FixedTimeEquals(candidate, expected))
            {
                return true;
            }
        }

        return false;
    }

    public string ComputeCode(string secret, DateTimeOffset moment)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(secret);

        return ComputeCode(Base32Decode(secret), moment.ToUnixTimeSeconds() / StepSeconds);
    }

    private static string ComputeCode(byte[] key, long counter)
    {
        Span<byte> counterBytes = stackalloc byte[8];
        BitConverter.TryWriteBytes(counterBytes, counter);

        if (BitConverter.IsLittleEndian)
        {
            counterBytes.Reverse();
        }

        var hash = HMACSHA1.HashData(key, counterBytes);
        var offset = hash[^1] & 0x0F;
        var binary = ((hash[offset] & 0x7F) << 24)
            | ((hash[offset + 1] & 0xFF) << 16)
            | ((hash[offset + 2] & 0xFF) << 8)
            | (hash[offset + 3] & 0xFF);

        return (binary % (int)Math.Pow(10, Digits)).ToString($"D{Digits}", System.Globalization.CultureInfo.InvariantCulture);
    }

    private const string Base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    private static string Base32Encode(byte[] data)
    {
        var builder = new StringBuilder((data.Length * 8 + 4) / 5);
        var buffer = 0;
        var bitsLeft = 0;

        foreach (var value in data)
        {
            buffer = (buffer << 8) | value;
            bitsLeft += 8;

            while (bitsLeft >= 5)
            {
                builder.Append(Base32Alphabet[(buffer >> (bitsLeft - 5)) & 0x1F]);
                bitsLeft -= 5;
            }
        }

        if (bitsLeft > 0)
        {
            builder.Append(Base32Alphabet[(buffer << (5 - bitsLeft)) & 0x1F]);
        }

        return builder.ToString();
    }

    private static byte[] Base32Decode(string value)
    {
        var normalized = value.Trim().TrimEnd('=').ToUpperInvariant();
        var output = new List<byte>(normalized.Length * 5 / 8);
        var buffer = 0;
        var bitsLeft = 0;

        foreach (var character in normalized)
        {
            var index = Base32Alphabet.IndexOf(character, StringComparison.Ordinal);

            if (index < 0)
            {
                throw new FormatException("Segredo em Base32 inválido.");
            }

            buffer = (buffer << 5) | index;
            bitsLeft += 5;

            if (bitsLeft >= 8)
            {
                output.Add((byte)((buffer >> (bitsLeft - 8)) & 0xFF));
                bitsLeft -= 8;
            }
        }

        return [.. output];
    }
}
