using Canamed.Domain.Agenda;

namespace Canamed.UnitTests.Catalog;

public sealed class PatientAnonymizationTests
{
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly DateTimeOffset _now = new(2026, 10, 2, 9, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Anonymize_ErasesPersonalDirectIdentifiers_AndDeactivatesPatient()
    {
        var patient = Patient.Create(
            _clinicId,
            "Maria de Lourdes Santos",
            "(81) 98765-4321",
            _now,
            email: "maria.santos@email.com",
            birthDate: new DateOnly(1985, 4, 15),
            document: "123.456.789-00");

        Assert.Equal("Maria de Lourdes Santos", patient.Name);
        Assert.True(patient.IsActive);

        var anonymizeTime = _now.AddDays(30);
        patient.Anonymize(anonymizeTime);

        Assert.Equal("[TITULAR ANONIMIZADO - LGPD]", patient.Name);
        Assert.Equal("(00) 00000-0000", patient.Phone);
        Assert.Null(patient.Email);
        Assert.Null(patient.BirthDate);
        Assert.Null(patient.Document);
        Assert.False(patient.IsActive);
        Assert.Equal(anonymizeTime, patient.UpdatedAt);
    }
}
