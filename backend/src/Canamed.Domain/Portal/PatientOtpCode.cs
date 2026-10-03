using System.Security.Cryptography;
using System.Text;
using Canamed.Domain.Common;

namespace Canamed.Domain.Portal;

/// <summary>
/// Código de autenticação temporária (One-Time Password) para login sem senha do paciente (SPEC-0015).
/// </summary>
public sealed class PatientOtpCode : Entity
{
    private PatientOtpCode()
    {
    }

    public string Phone { get; private set; } = string.Empty;
    public string Cpf { get; private set; } = string.Empty;
    public string CodeHash { get; private set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; private set; }
    public int AttemptsCount { get; private set; }
    public DateTimeOffset? VerifiedAt { get; private set; }

    public static (PatientOtpCode Entity, string PlainCode) Create(
        string phone,
        string cpf,
        DateTimeOffset now,
        TimeSpan? validity = null)
    {
        if (string.IsNullOrWhiteSpace(phone))
            throw new ArgumentException("Telefone é obrigatório.", nameof(phone));

        if (string.IsNullOrWhiteSpace(cpf))
            throw new ArgumentException("CPF é obrigatório.", nameof(cpf));

        // Código numérico aleatório de 6 dígitos
        var codeNumber = RandomNumberGenerator.GetInt32(100000, 999999);
        var plainCode = codeNumber.ToString("D6");
        var hash = ComputeHash(plainCode);

        var entity = new PatientOtpCode
        {
            Id = Guid.NewGuid(),
            Phone = phone.Trim(),
            Cpf = cpf.Trim(),
            CodeHash = hash,
            ExpiresAt = now.Add(validity ?? TimeSpan.FromMinutes(5)),
            AttemptsCount = 0,
            CreatedAt = now,
        };

        return (entity, plainCode);
    }

    public bool Verify(string plainCode, DateTimeOffset now)
    {
        if (VerifiedAt is not null)
            return false; // já utilizado

        if (now > ExpiresAt)
            return false; // expirado

        if (AttemptsCount >= 3)
            return false; // excedeu tentativas

        AttemptsCount++;

        var inputHash = ComputeHash(plainCode.Trim());
        if (!CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(inputHash),
            Encoding.UTF8.GetBytes(CodeHash)))
        {
            return false;
        }

        VerifiedAt = now;
        return true;
    }

    public static string ComputeHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
