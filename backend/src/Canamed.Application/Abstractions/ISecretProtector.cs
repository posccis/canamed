namespace Canamed.Application.Abstractions;

/// <summary>Proteção de segredos em repouso (RN-012), usada pelo segredo de segundo fator.</summary>
public interface ISecretProtector
{
    /// <summary>Cifra o valor informado.</summary>
    string Protect(string plainText);

    /// <summary>Decifra o valor previamente protegido.</summary>
    string Unprotect(string protectedValue);
}
