using Canamed.Application.Errors;
using Canamed.Application.Identity;

namespace Canamed.UnitTests.Identity;

/// <summary>Política de senha (RN-003).</summary>
public sealed class PasswordPolicyTests
{
    [Fact]
    public void Validate_DeveAceitarSenhaLongaSemComposicaoArtificial()
    {
        PasswordPolicy.Validate("frase de acesso bem longa");
    }

    [Theory]
    [InlineData("curta123")]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_DeveRecusarSenhaCurta(string? password)
    {
        var exception = Assert.Throws<CanamedException>(() => PasswordPolicy.Validate(password));

        Assert.Equal(ProblemKind.Validation, exception.Kind);
        Assert.Equal("password-too-short", exception.ProblemType);
    }

    [Fact]
    public void Validate_DeveRecusarSenhaComum()
    {
        var exception = Assert.Throws<CanamedException>(() => PasswordPolicy.Validate("senha123456789"));

        Assert.Equal("password-too-common", exception.ProblemType);
    }

    [Fact]
    public void Validate_DeveRecusarSenhaComOEmail()
    {
        var exception = Assert.Throws<CanamedException>(
            () => PasswordPolicy.Validate("minhasenha-joana-2026", "joana@canamed.local", "Joana"));

        Assert.Equal("password-contains-email", exception.ProblemType);
    }

    [Fact]
    public void Validate_DeveRecusarSenhaComONome()
    {
        var exception = Assert.Throws<CanamedException>(
            () => PasswordPolicy.Validate("senha-da-mariana-2026", "outra@canamed.local", "Mariana"));

        Assert.Equal("password-contains-name", exception.ProblemType);
    }
}
