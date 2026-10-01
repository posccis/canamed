using Canamed.Domain.Agenda;

namespace Canamed.UnitTests.Catalog;

/// <summary>Classificação das consultas: natureza, custeio e regras de catálogo (SPEC-0004).</summary>
public sealed class AppointmentClassificationTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 1, 12, 0, 0, TimeSpan.Zero);
    private static readonly Guid ClinicId = Guid.NewGuid();

    [Theory]
    [InlineData("avulsa", AppointmentCategory.Single)]
    [InlineData("acompanhamento", AppointmentCategory.FollowUp)]
    public void CategoryFromStoredValue_DeveConverterValoresValidos(string value, AppointmentCategory expected)
    {
        Assert.Equal(expected, AppointmentClassificationMap.CategoryFromStoredValue(value));
        Assert.Equal(value, expected.ToStoredValue());
    }

    [Theory]
    [InlineData("particular", AppointmentCoverage.Private)]
    [InlineData("plano_saude", AppointmentCoverage.HealthPlan)]
    public void CoverageFromStoredValue_DeveConverterValoresValidos(string value, AppointmentCoverage expected)
    {
        Assert.Equal(expected, AppointmentClassificationMap.CoverageFromStoredValue(value));
        Assert.Equal(value, expected.ToStoredValue());
    }

    [Theory]
    [InlineData("urgente")]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("AVULSA ")]
    public void CategoryFromStoredValue_DeveRecusarValorDesconhecido(string? value)
    {
        // A conversão nunca deve assumir um valor padrão: classificação inválida é erro (ER-004).
        Assert.Throws<ArgumentOutOfRangeException>(() => AppointmentClassificationMap.CategoryFromStoredValue(value));
    }

    [Theory]
    [InlineData("convenio")]
    [InlineData("")]
    [InlineData(null)]
    public void CoverageFromStoredValue_DeveRecusarValorDesconhecido(string? value)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => AppointmentClassificationMap.CoverageFromStoredValue(value));
    }

    [Fact]
    public void AppointmentType_DeveGuardarClassificacaoEDesativar()
    {
        var type = AppointmentType.Create(
            ClinicId,
            "Avaliação ortopédica",
            AppointmentCategory.Single,
            AppointmentCoverage.HealthPlan,
            45,
            Now);

        Assert.True(type.IsActive);
        Assert.Equal(45, type.DurationMinutes);
        Assert.Equal(AppointmentCoverage.HealthPlan, type.Coverage);

        type.Deactivate(Now);

        Assert.False(type.IsActive);

        type.Activate(Now);

        Assert.True(type.IsActive);
    }

    [Fact]
    public void AppointmentType_DeveRecusarDuracaoInvalidaNaAlteracao()
    {
        var type = AppointmentType.Create(
            ClinicId,
            "Consulta",
            AppointmentCategory.Single,
            AppointmentCoverage.Private,
            30,
            Now);

        Assert.Throws<ArgumentOutOfRangeException>(() => type.Update(
            "Consulta",
            AppointmentCategory.Single,
            AppointmentCoverage.Private,
            0,
            null,
            Now));
    }

    [Fact]
    public void Patient_DeveRecusarDataDeNascimentoNoFuturo()
    {
        var future = DateOnly.FromDateTime(Now.UtcDateTime.AddDays(1));

        Assert.Throws<ArgumentException>(() =>
            Patient.Create(ClinicId, "Paciente", "(81) 90000-0000", Now, birthDate: future));
    }

    [Fact]
    public void Patient_DeveNormalizarEmailEOpcionais()
    {
        var patient = Patient.Create(
            ClinicId,
            "Paciente",
            "(81) 90000-0000",
            Now,
            email: "  Paciente@Canamed.Local ",
            birthDate: new DateOnly(1990, 4, 12));

        Assert.Equal("paciente@canamed.local", patient.Email);
        Assert.Equal(new DateOnly(1990, 4, 12), patient.BirthDate);
        Assert.True(patient.IsActive);

        patient.Deactivate(Now);

        Assert.False(patient.IsActive);
    }
}
