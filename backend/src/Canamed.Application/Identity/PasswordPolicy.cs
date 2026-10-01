using Canamed.Application.Errors;

namespace Canamed.Application.Identity;

/// <summary>
/// Política de senha (RN-003): comprimento mínimo, sem exigência de composição artificial,
/// recusando senhas notoriamente fracas e valores derivados do próprio usuário.
/// </summary>
public static class PasswordPolicy
{
    /// <summary>Comprimento mínimo aceito.</summary>
    public const int MinimumLength = 12;

    /// <summary>Comprimento máximo aceito, para limitar o custo do hash.</summary>
    public const int MaximumLength = 200;

    private static readonly HashSet<string> BlockedPasswords = new(StringComparer.OrdinalIgnoreCase)
    {
        "senha1234567",
        "senha12345678",
        "senha123456789",
        "password12345",
        "password123456",
        "123456789012",
        "1234567890123",
        "qwertyuiop12",
        "canamed12345",
        "canamed123456",
        "administrador",
        "administrator",
        "mudar essa senha",
    };

    /// <summary>Valida a senha e lança <see cref="CanamedException"/> quando a política não é atendida.</summary>
    public static void Validate(string? password, string? userEmail = null, string? userName = null)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < MinimumLength)
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Senha inválida",
                $"A senha deve ter pelo menos {MinimumLength} caracteres.",
                "password-too-short");
        }

        if (password.Length > MaximumLength)
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Senha inválida",
                $"A senha deve ter no máximo {MaximumLength} caracteres.",
                "password-too-long");
        }

        if (BlockedPasswords.Contains(password))
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Senha inválida",
                "Esta senha é muito comum. Escolha uma senha diferente.",
                "password-too-common");
        }

        var normalizedPassword = password.ToLowerInvariant();

        if (!string.IsNullOrWhiteSpace(userEmail))
        {
            var localPart = userEmail.Split('@')[0].Trim().ToLowerInvariant();

            if (localPart.Length >= 4 && normalizedPassword.Contains(localPart, StringComparison.Ordinal))
            {
                throw new CanamedException(
                    ProblemKind.Validation,
                    "Senha inválida",
                    "A senha não pode conter o seu e-mail.",
                    "password-contains-email");
            }
        }

        if (!string.IsNullOrWhiteSpace(userName)
            && userName.Trim().Length >= 4
            && normalizedPassword.Contains(userName.Trim().ToLowerInvariant(), StringComparison.Ordinal))
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Senha inválida",
                "A senha não pode conter o seu nome.",
                "password-contains-name");
        }
    }
}
