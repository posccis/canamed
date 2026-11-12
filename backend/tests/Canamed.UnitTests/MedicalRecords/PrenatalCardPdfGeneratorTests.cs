using Canamed.Application.MedicalRecords.Services;
using Canamed.Domain.Agenda;
using Canamed.Domain.MedicalRecords;
using System.Text;
using Xunit;

namespace Canamed.UnitTests.MedicalRecords;

public sealed class PrenatalCardPdfGeneratorTests
{
    [Fact]
    public void Generate_DeveRetornarBytesValidosDePdfComCabecalhoEPaciente_PaletaRoxosECarteiraVacinas()
    {
        var clinicId = Guid.NewGuid();
        var patient = Patient.Create(
            clinicId,
            "Maria Eduarda Souza",
            "81999998888",
            DateTimeOffset.UtcNow,
            birthDate: new DateOnly(1996, 4, 15),
            bloodType: "O",
            rhFactor: "Negativo");

        var visits = new List<PrenatalVisitRecord>
        {
            PrenatalVisitRecord.Create(
                clinicId,
                patient.Id,
                Guid.NewGuid(),
                new DateOnly(2026, 8, 10),
                12,
                3,
                62.5,
                "110/70",
                12.0,
                150,
                true,
                "Ausente",
                "Cefalica",
                "Paciente assintomatica",
                DateTimeOffset.UtcNow,
                bmi: 23.3)
        };

        var pdfBytes = PrenatalCardPdfGenerator.Generate(patient, null, visits);

        Assert.NotNull(pdfBytes);
        Assert.NotEmpty(pdfBytes);

        var pdfString = Encoding.Latin1.GetString(pdfBytes);
        Assert.StartsWith("%PDF-1.4", pdfString);
        Assert.Contains("CARTAO DA GESTANTE", pdfString);
        Assert.Contains("Maria Eduarda Souza", pdfString);
        Assert.Contains("12s 3d", pdfString);
        Assert.Contains("110/70", pdfString);
        Assert.Contains("FEBRASGO", pdfString);

        // Paleta oficial de roxos Cana Med Mulher (#6F217B, #852A91, #D83C91)
        Assert.Contains("0.435 0.129 0.482 rg", pdfString); // #6F217B
        Assert.Contains("0.522 0.165 0.569 rg", pdfString); // #852A91
        Assert.Contains("0.847 0.235 0.569 rg", pdfString); // #D83C91

        // Proibição de cores antigas petróleo / teal
        Assert.DoesNotContain("0.000 0.373 0.416 rg", pdfString);
        Assert.DoesNotContain("0.000 0.502 0.502 rg", pdfString);

        // Página Exclusiva Dedicada de Vacinas da Gestante (SBIm / FEBRASGO / MS)
        Assert.Contains("CARTEIRA DE IMUNIZACAO DA GESTANTE", pdfString);
        Assert.Contains("dTpa", pdfString);
        Assert.Contains("Influenza", pdfString);
        Assert.Contains("Hepatite B", pdfString);
        Assert.Contains("COVID-19", pdfString);
        Assert.Contains("Virus Sincicial Respiratorio", pdfString);
        Assert.Contains("Anti-D", pdfString);
        Assert.Contains("CONTRAINDICACOES FORMAIS NA GESTACAO", pdfString);
        Assert.Contains("Triplice Viral", pdfString);

        // Paginação: 1 página de consulta + 1 página de vacinas = 2 páginas (/Count 2)
        Assert.Contains("/Count 2", pdfString);
    }

    [Fact]
    public void Generate_ComMaisDe10Consultas_GeraColunaApresentacaoFetalEPaginacaoComPaginaDeVacinas()
    {
        var clinicId = Guid.NewGuid();
        var patient = Patient.Create(
            clinicId,
            "Juliana Paes Gestante",
            "81999997777",
            DateTimeOffset.UtcNow,
            birthDate: new DateOnly(1994, 2, 20),
            bloodType: "A",
            rhFactor: "Positivo");

        var visits = new List<PrenatalVisitRecord>();
        for (int i = 1; i <= 15; i++)
        {
            visits.Add(PrenatalVisitRecord.Create(
                clinicId,
                patient.Id,
                Guid.NewGuid(),
                new DateOnly(2026, 1, 1).AddDays(i * 14),
                10 + (i * 2),
                0,
                60.0 + i,
                "120/80",
                10.0 + i,
                140 + (i % 10),
                true,
                "Ausente",
                i >= 12 ? "Cefalica" : "Pelvica",
                $"Consulta {i} de rotina",
                DateTimeOffset.UtcNow,
                bmi: 22.0 + (i * 0.2)));
        }

        var pdfBytes = PrenatalCardPdfGenerator.Generate(patient, null, visits);
        var pdfString = Encoding.Latin1.GetString(pdfBytes);

        // Deve conter cabeçalho da coluna de IMC e Apresentação Fetal
        Assert.Contains("IMC", pdfString);
        Assert.Contains("Apres. Fetal", pdfString);
        Assert.Contains("Cefalica", pdfString);
        Assert.Contains("Pelvica", pdfString);

        // Com 15 consultas (2 páginas de consultas) + 1 página de vacinas = 3 páginas (/Count 3)
        Assert.Contains("/Count 3", pdfString);
        Assert.Contains("CARTEIRA DE IMUNIZACAO DA GESTANTE", pdfString);
    }
}
