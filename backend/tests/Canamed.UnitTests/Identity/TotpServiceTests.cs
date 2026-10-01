using Canamed.Infrastructure.Identity;

namespace Canamed.UnitTests.Identity;

/// <summary>
/// Segundo fator TOTP validado com os vetores de teste da RFC 6238 (SHA-1, 30 s), truncados em 6 dígitos
/// conforme a configuração do produto (RN-010).
/// </summary>
public sealed class TotpServiceTests
{
    // Vetor oficial da RFC 6238: segredo ASCII "12345678901234567890".
    private const string RfcSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

    private readonly TotpService service = new();

    [Theory]
    [InlineData(59, "287082")]
    [InlineData(1111111109, "081804")]
    [InlineData(1111111111, "050471")]
    [InlineData(1234567890, "005924")]
    [InlineData(2000000000, "279037")]
    [InlineData(20000000000, "353130")]
    public void Verify_DeveAceitarOsVetoresDaRfc6238(long unixTime, string expectedCode)
    {
        var moment = DateTimeOffset.FromUnixTimeSeconds(unixTime);

        Assert.True(service.Verify(RfcSecret, expectedCode, moment));
    }

    [Fact]
    public void Verify_DeveAceitarCodigoDoPassoAnterior()
    {
        // Janela de ±1 passo tolera pequena diferença de relógio entre servidor e aplicativo.
        var moment = DateTimeOffset.FromUnixTimeSeconds(1111111109);

        Assert.True(service.Verify(RfcSecret, "081804", moment.AddSeconds(-30)));
    }

    [Theory]
    [InlineData("000000")]
    [InlineData("12345")]
    [InlineData("1234567")]
    [InlineData("abcdef")]
    [InlineData("")]
    public void Verify_DeveRecusarCodigoInvalido(string code)
    {
        Assert.False(service.Verify(RfcSecret, code, DateTimeOffset.FromUnixTimeSeconds(1111111109)));
    }

    [Fact]
    public void Verify_DeveRecusarSegredoInvalido()
    {
        Assert.False(service.Verify("nao-e-base32!", "081804", DateTimeOffset.FromUnixTimeSeconds(1111111109)));
    }

    [Fact]
    public void GenerateSecret_DeveGerarSegredosDistintos()
    {
        var first = service.GenerateSecret();
        var second = service.GenerateSecret();

        Assert.NotEqual(first, second);
        Assert.Equal(32, first.Length);
    }

    [Fact]
    public void BuildOtpAuthUri_DeveConterEmissorEAlgoritmo()
    {
        var uri = service.BuildOtpAuthUri("pessoa@canamed.local", RfcSecret);

        Assert.StartsWith("otpauth://totp/CANAMED:", uri, StringComparison.Ordinal);
        Assert.Contains("issuer=CANAMED", uri, StringComparison.Ordinal);
        Assert.Contains("algorithm=SHA1", uri, StringComparison.Ordinal);
        Assert.Contains("digits=6", uri, StringComparison.Ordinal);
    }
}
