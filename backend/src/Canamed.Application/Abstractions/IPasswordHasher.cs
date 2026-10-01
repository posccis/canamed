namespace Canamed.Application.Abstractions;

/// <summary>Proteção de credenciais (RN-002): hash moderno com salt embutido no valor codificado.</summary>
public interface IPasswordHasher
{
    /// <summary>Gera o hash codificado da senha.</summary>
    string Hash(string password);

    /// <summary>Verifica a senha contra o hash armazenado.</summary>
    bool Verify(string password, string encodedHash);
}
