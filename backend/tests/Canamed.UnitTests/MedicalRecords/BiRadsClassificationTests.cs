using Canamed.Domain.MedicalRecords;
using Xunit;

namespace Canamed.UnitTests.MedicalRecords;

public sealed class BiRadsClassificationTests
{
    [Theory]
    [InlineData("0", "Inconclusivo / Necessita avaliação adicional por imagem ou exames anteriores.")]
    [InlineData("1", "Negativo / Rastreamento anual de rotina conforme faixa etária.")]
    [InlineData("2", "Achados benignos / Rastreamento anual de rotina.")]
    [InlineData("3", "Provavelmente benigno (< 2% malignidade) / Controle em intervalo curto de 6 meses.")]
    [InlineData("4A", "Baixa suspeita de malignidade (2% a 10%) / Indicada biópsia percutânea (core biopsy ou mamotomia).")]
    [InlineData("4B", "Moderada suspeita de malignidade (10% a 50%) / Indicada biópsia percutânea com estudo anatomopatológico.")]
    [InlineData("4C", "Alta suspeita de malignidade (50% a 95%) / Indicada biópsia percutânea imediata.")]
    [InlineData("5", "Altamente sugestivo de malignidade (> 95%) / Indicada biópsia urgente e estadiamento oncológico.")]
    [InlineData("6", "Malignidade comprovada por biópsia prévia / Planejamento terapêutico cirúrgico/oncológico.")]
    public void GetRecommendedConduct_DeveRetornarCondutaCorretaPorCategoria(string code, string expectedConduct)
    {
        var conduct = BiRadsClassification.GetRecommendedConduct(code);

        Assert.Equal(expectedConduct, conduct);
    }
}
