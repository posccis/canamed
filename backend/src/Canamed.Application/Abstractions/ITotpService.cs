namespace Canamed.Application.Abstractions;

/// <summary>Segundo fator baseado em tempo (TOTP), conforme a RFC 6238 (RN-010).</summary>
public interface ITotpService
{
    /// <summary>Gera um segredo novo, em Base32.</summary>
    string GenerateSecret();

    /// <summary>Monta a URI <c>otpauth://</c> para leitura pelo aplicativo autenticador.</summary>
    string BuildOtpAuthUri(string accountName, string secret);

    /// <summary>Valida um código de 6 dígitos, aceitando uma janela de ±1 passo.</summary>
    bool Verify(string secret, string? code, DateTimeOffset now);

    /// <summary>Calcula o código válido para o instante informado (usado em testes e diagnóstico).</summary>
    string ComputeCode(string secret, DateTimeOffset moment);
}
