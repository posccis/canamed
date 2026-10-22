using Canamed.Domain.MedicalRecords;
using Xunit;

namespace Canamed.UnitTests.MedicalRecords;

public sealed class CervicalScreeningGuidelineTests
{
    [Theory]
    [InlineData("NILM", 25, false, "Repetir exame citopatológico em 3 anos se tiver dois anuais prévios negativos.")]
    [InlineData("ASC-US", 32, false, "Repetir exame citopatológico em 6 meses.")]
    [InlineData("ASC-US", 22, false, "Repetir exame citopatológico em 12 meses (paciente jovem < 25 anos).")]
    [InlineData("ASC-US", 35, true, "Encaminhar imediatamente para Colposcopia (HPV de alto risco 16/18 positivo).")]
    [InlineData("LSIL", 28, false, "Repetir exame citopatológico em 6 meses.")]
    [InlineData("HSIL", 30, false, "Encaminhamento urgente para Colposcopia com biópsia se indicado.")]
    [InlineData("AGC", 40, false, "Encaminhamento urgente para Colposcopia e avaliação do canal endocervical / endométrio.")]
    public void DetermineConduct_DeveRetornarCondutaOficialIncaAdequada(
        string bethesdaCode,
        int patientAge,
        bool isHpvPositive,
        string expectedConductStart)
    {
        var conduct = CervicalScreeningGuidelineEngine.DetermineConduct(bethesdaCode, patientAge, isHpvPositive);

        Assert.NotNull(conduct);
        Assert.StartsWith(expectedConductStart, conduct);
    }
}
