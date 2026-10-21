using Canamed.Application.Abstractions;
using Canamed.Domain.MedicalRecords;
using Canamed.Infrastructure.Persistence;
using Canamed.Infrastructure.Persistence.Converters;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Canamed.UnitTests.Persistence;

public sealed class EncryptedStringConverterTests
{
    private sealed class FakeSecretProtector : ISecretProtector
    {
        public string Protect(string plainText) => $"CIPHER({plainText})";
        public string Unprotect(string protectedValue)
        {
            if (protectedValue.StartsWith("CIPHER(") && protectedValue.EndsWith(")"))
            {
                return protectedValue[7..^1];
            }
            throw new InvalidOperationException("Invalid cipher payload");
        }
    }

    [Fact]
    public void Encrypt_DeveAdicionarPrefixoENCv1ECifrar_RN_004()
    {
        var protector = new FakeSecretProtector();
        var converter = new EncryptedStringConverter(protector);

        var plain = "Antecedente de HPV de alto risco";
        var encrypted = EncryptedStringConverter.Encrypt(plain, protector);

        Assert.NotNull(encrypted);
        Assert.StartsWith("ENC:v1:", encrypted);
        Assert.Equal("ENC:v1:CIPHER(Antecedente de HPV de alto risco)", encrypted);
    }

    [Fact]
    public void Encrypt_NaoDeveDuplicarCifragemSeJaPossuirPrefixo()
    {
        var protector = new FakeSecretProtector();
        var alreadyEncrypted = "ENC:v1:CIPHER(Dado)";

        var result = EncryptedStringConverter.Encrypt(alreadyEncrypted, protector);

        Assert.Equal(alreadyEncrypted, result);
    }

    [Fact]
    public void Decrypt_DeveRemoverPrefixoEDecifrar_RN_004()
    {
        var protector = new FakeSecretProtector();
        var cipher = "ENC:v1:CIPHER(Dispareunia de profundidade)";

        var decrypted = EncryptedStringConverter.Decrypt(cipher, protector);

        Assert.Equal("Dispareunia de profundidade", decrypted);
    }

    [Fact]
    public void Decrypt_DadoLegadoSemPrefixo_DeveRetornarTextoOriginalSemLancarExcecao_RN_004()
    {
        var protector = new FakeSecretProtector();
        var legacyPlainText = "Texto plano salvo antes da migration de criptografia";

        var result = EncryptedStringConverter.Decrypt(legacyPlainText, protector);

        Assert.Equal(legacyPlainText, result);
    }

    [Fact]
    public void Converter_RoundTrip_PreservaValorOriginal()
    {
        var protector = new FakeSecretProtector();
        var plain = "Cirurgia pélvica prévia: Ooforectomia direita em 2021";

        var encrypted = EncryptedStringConverter.Encrypt(plain, protector);
        var decrypted = EncryptedStringConverter.Decrypt(encrypted, protector);

        Assert.Equal(plain, decrypted);
    }

    [Fact]
    public void Persistence_GynecologicalProfile_CifraEDecifraCamposSensíveis()
    {
        var protector = new FakeSecretProtector();
        EncryptedStringConverter.AmbientProtector = protector;

        var options = new DbContextOptionsBuilder<CanamedDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var clinicId = Guid.NewGuid();
        var patientId = Guid.NewGuid();

        using (var context = new CanamedDbContext(options, protector))
        {
            var profile = GynecologicalProfile.Create(clinicId, patientId, DateTimeOffset.UtcNow);
            profile.Update(
                menarcheAge: 12,
                sexarcheAge: 18,
                cycleIntervalDays: 28,
                cycleDurationDays: 4,
                isCycleRegular: true,
                flowIntensity: "Moderado",
                dysmenorrhea: "Leve",
                hasPms: true,
                pmsSymptoms: "Cefaleia",
                menopauseStatus: "Não",
                menopauseAge: null,
                hrtInUse: false,
                gravida: 3,
                para: 2,
                cesareans: 1,
                abortions: 0,
                livingChildren: 2,
                ectopicPregnancies: 0,
                obstetricNotes: "Parto fórceps em 2018",
                currentMethod: "DIU Cobre",
                currentMethodUsageMonths: 24,
                previousMethods: "ACO",
                reproductivePlan: "Não deseja engravidar",
                pelvicSurgeries: "Cistocele",
                stiHistory: "HPV 16",
                familyCancerHistory: "Câncer de mama materno",
                DateTimeOffset.UtcNow);

            context.GynecologicalProfiles.Add(profile);
            context.SaveChanges();
        }

        using (var context = new CanamedDbContext(options, protector))
        {
            var loaded = context.GynecologicalProfiles.First(p => p.ClinicId == clinicId && p.PatientId == patientId);
            Assert.Equal("Parto fórceps em 2018", loaded.ObstetricNotes);
            Assert.Equal("Cistocele", loaded.PelvicSurgeries);
            Assert.Equal("HPV 16", loaded.StiHistory);
            Assert.Equal("Câncer de mama materno", loaded.FamilyCancerHistory);
        }
    }
    [Fact]
    public void Persistence_GynecologicalConsultationData_CifraEDecifraCamposSensíveis()
    {
        var protector = new FakeSecretProtector();
        EncryptedStringConverter.AmbientProtector = protector;

        var options = new DbContextOptionsBuilder<CanamedDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var recordId = Guid.NewGuid();

        using (var context = new CanamedDbContext(options, protector))
        {
            var data = GynecologicalConsultationData.Create(recordId, DateTimeOffset.UtcNow);
            data.Update(
                dum: null,
                isDumUncertain: false,
                isMenopausal: false,
                chiefComplaint: "Rotina anual",
                hma: "Paciente assintomática, nega queixas urinárias",
                isSexuallyActive: true,
                dyspareunia: "Nega dor na relação",
                breastsIsNormal: true,
                breastsFindings: null,
                abdomenIsNormal: true,
                abdomenFindings: null,
                externalGenitaliaIsNormal: true,
                externalGenitaliaFindings: null,
                speculumExamIsNormal: true,
                speculumExamFindings: null,
                bimanualPalpationIsNormal: true,
                bimanualPalpationFindings: null,
                procedurePerformed: null,
                procedureBatch: null,
                procedureNotes: null,
                diagnosesJson: "[]",
                prescriptionNotes: "Prescrito polivitamínico e retorno anual",
                generalOrientationNotes: "Orientações gerais de prevenção",
                now: DateTimeOffset.UtcNow);

            context.GynecologicalConsultationData.Add(data);
            context.SaveChanges();
        }

        using (var context = new CanamedDbContext(options, protector))
        {
            var loaded = context.GynecologicalConsultationData.First(d => d.MedicalRecordId == recordId);
            Assert.Equal("Paciente assintomática, nega queixas urinárias", loaded.Hma);
            Assert.Equal("Nega dor na relação", loaded.Dyspareunia);
            Assert.Equal("Prescrito polivitamínico e retorno anual", loaded.PrescriptionNotes);
        }
    }

}
