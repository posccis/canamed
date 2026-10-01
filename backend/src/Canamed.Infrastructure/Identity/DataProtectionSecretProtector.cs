using Canamed.Application.Abstractions;
using Microsoft.AspNetCore.DataProtection;

namespace Canamed.Infrastructure.Identity;

/// <summary>
/// Cifra segredos em repouso com Data Protection (RN-012), usando chaves persistidas em diretório do
/// projeto (ignorado pelo Git).
/// </summary>
public sealed class DataProtectionSecretProtector(IDataProtectionProvider provider) : ISecretProtector
{
    private readonly IDataProtector protector = provider.CreateProtector("Canamed.Secrets.v1");

    public string Protect(string plainText)
    {
        ArgumentNullException.ThrowIfNull(plainText);

        return protector.Protect(plainText);
    }

    public string Unprotect(string protectedValue)
    {
        ArgumentNullException.ThrowIfNull(protectedValue);

        return protector.Unprotect(protectedValue);
    }
}
