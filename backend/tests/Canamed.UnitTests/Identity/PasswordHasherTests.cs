using Canamed.Infrastructure.Identity;

namespace Canamed.UnitTests.Identity;

/// <summary>Proteção de credenciais com Argon2id (RN-002).</summary>
public sealed class PasswordHasherTests
{
    private readonly Argon2PasswordHasher hasher = new();

    [Fact]
    public void Hash_NaoDeveArmazenarASenhaEmTextoPuro()
    {
        var hash = hasher.Hash("uma-senha-bem-longa-123");

        Assert.DoesNotContain("uma-senha-bem-longa-123", hash, StringComparison.Ordinal);
        Assert.StartsWith("argon2id$", hash, StringComparison.Ordinal);
    }

    [Fact]
    public void Verify_DeveAceitarASenhaCorreta()
    {
        const string password = "uma-senha-bem-longa-123";

        Assert.True(hasher.Verify(password, hasher.Hash(password)));
    }

    [Fact]
    public void Verify_DeveRecusarSenhaDiferente()
    {
        Assert.False(hasher.Verify("outra-senha-qualquer-1", hasher.Hash("uma-senha-bem-longa-123")));
    }

    [Fact]
    public void Hash_DeveGerarValoresDiferentesParaAMesmaSenha()
    {
        const string password = "uma-senha-bem-longa-123";

        Assert.NotEqual(hasher.Hash(password), hasher.Hash(password));
    }

    [Theory]
    [InlineData("")]
    [InlineData("texto-sem-formato")]
    [InlineData("argon2id$3$65536$1$invalido$invalido")]
    [InlineData("bcrypt$3$65536$1$c2FsdA==$aGFzaA==")]
    public void Verify_DeveRecusarHashInvalido(string encodedHash)
    {
        Assert.False(hasher.Verify("uma-senha-bem-longa-123", encodedHash));
    }
}
