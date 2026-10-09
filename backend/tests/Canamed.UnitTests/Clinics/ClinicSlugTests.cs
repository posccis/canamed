using Canamed.Domain.Clinics;
using Xunit;

namespace Canamed.UnitTests.Clinics;

public sealed class ClinicSlugTests
{
    private readonly DateTimeOffset _now = new(2026, 10, 3, 12, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData("Cana Med", "cana-med")]
    [InlineData("Clínica São João", "clinica-sao-joao")]
    [InlineData("  Ortopedia & Fisio  ", "ortopedia-fisio")]
    [InlineData("Clínica Teste A (sintética)", "clinica-teste-a-sintetica")]
    public void Slugify_NormalizesNames(string name, string expected)
    {
        Assert.Equal(expected, Clinic.Slugify(name));
    }

    [Fact]
    public void Slugify_PadsVeryShortNames()
    {
        Assert.Equal(3, Clinic.Slugify("ab").Length);
    }

    [Fact]
    public void Create_UsesExplicitSlugAndPublicName()
    {
        var clinic = Clinic.Create("Clínica Demonstração", _now, null, "cana-med", "Cana Med");

        Assert.Equal("cana-med", clinic.Slug);
        Assert.Equal("Cana Med", clinic.DisplayName);
        Assert.True(clinic.AllowSelfReschedule);
        Assert.False(clinic.AllowWaitlist);
        Assert.Equal(2, clinic.MaxOnlineAppointments);
    }

    [Fact]
    public void Create_FallsBackToNameWhenPublicNameIsEmpty()
    {
        var clinic = Clinic.Create("Clínica Central", _now);

        Assert.Equal("clinica-central", clinic.Slug);
        Assert.Equal("Clínica Central", clinic.DisplayName);
    }

    [Theory]
    [InlineData("Cana Med")]
    [InlineData("cana_med")]
    [InlineData("-cana-med")]
    [InlineData("ca")]
    public void ChangeSlug_RejectsInvalidFormats(string slug)
    {
        var clinic = Clinic.Create("Clínica Central", _now);

        Assert.Throws<ArgumentException>(() => clinic.ChangeSlug(slug, _now));
    }

    [Fact]
    public void UpdatePublicSettings_ValidatesLimits()
    {
        var clinic = Clinic.Create("Clínica Central", _now);

        clinic.UpdatePublicSettings("Central", allowWaitlist: true, allowSelfReschedule: false, maxOnlineAppointments: 3, _now);

        Assert.Equal("Central", clinic.DisplayName);
        Assert.True(clinic.AllowWaitlist);
        Assert.False(clinic.AllowSelfReschedule);
        Assert.Equal(3, clinic.MaxOnlineAppointments);

        Assert.Throws<ArgumentOutOfRangeException>(() =>
            clinic.UpdatePublicSettings(null, false, true, -1, _now));
    }
}
