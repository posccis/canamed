using Canamed.Domain.Agenda;
using Canamed.Domain.MedicalRecords;
using System.Globalization;
using System.Text;

namespace Canamed.Application.MedicalRecords.Services;

/// <summary>
/// Gerador de Cartão da Gestante em formato PDF segundo as diretrizes da FEBRASGO / Ministério da Saúde (RN-007).
/// </summary>
public static class PrenatalCardPdfGenerator
{
    public static byte[] Generate(
        Patient patient,
        GynecologicalProfile? gynProfile,
        IReadOnlyList<PrenatalVisitRecord> visits,
        string clinicName = "CANA MED MULHER")
    {
        ArgumentNullException.ThrowIfNull(patient);
        visits ??= [];

        var sbStream = new StringBuilder();

        // Operações de desenho e texto do PDF
        sbStream.Append("BT\n");
        sbStream.Append("50 800 Td\n");

        // Cabeçalho da Clínica
        sbStream.Append("/F2 16 Tf\n");
        sbStream.Append("0.282 0.075 0.380 rg\n"); // #481361 (roxo ameixa Cana Med Mulher)
        sbStream.Append("(").Append(EscapePdf(SanitizeText(clinicName))).Append(") Tj\n");

        sbStream.Append("0 -18 Td\n");
        sbStream.Append("/F2 12 Tf\n");
        sbStream.Append("0.522 0.165 0.569 rg\n"); // #852A91 (roxo vibrante)
        sbStream.Append("(CARTAO DA GESTANTE - ACOMPANHAMENTO PRE-NATAL) Tj\n");

        // Linha divisória
        sbStream.Append("0 -12 Td\n");
        sbStream.Append("/F1 8 Tf\n");
        sbStream.Append("0.7 0.7 0.7 rg\n");
        sbStream.Append("_________________________________________________________________________________ Tj\n");

        // Dados da Paciente e Identificação Obstétrica
        sbStream.Append("0 -20 Td\n");
        sbStream.Append("/F2 10 Tf\n");
        sbStream.Append("0.125 0.149 0.192 rg\n"); // #202631 (texto escuro)
        sbStream.Append("(DADOS DA GESTANTE) Tj\n");

        sbStream.Append("0 -14 Td\n");
        sbStream.Append("/F1 9 Tf\n");
        sbStream.Append("0.2 0.2 0.2 rg\n");
        sbStream.Append("(Nome: ").Append(EscapePdf(SanitizeText(patient.Name))).Append(") Tj\n");

        var birthStr = patient.BirthDate?.ToString("dd/MM/yyyy") ?? "Nao informada";
        var bloodStr = $"{patient.BloodType ?? "Nao inf."} Rh {patient.RhFactor ?? "Nao inf."}";
        sbStream.Append("0 -13 Td\n");
        sbStream.Append("(Data de Nasc.: ").Append(EscapePdf(birthStr))
                .Append("   |   Tipagem Sanguinea: ").Append(EscapePdf(bloodStr)).Append(") Tj\n");

        var gpa = gynProfile is not null
            ? $"G{gynProfile.Gravida} P{gynProfile.Para} C{gynProfile.Cesareans} A{gynProfile.Abortions} (Filhos vivos: {gynProfile.LivingChildren})"
            : "Nao informado";
        sbStream.Append("0 -13 Td\n");
        sbStream.Append("(Historico Obstetrico: ").Append(EscapePdf(gpa)).Append(") Tj\n");

        // Linha divisória da Tabela
        sbStream.Append("0 -14 Td\n");
        sbStream.Append("/F1 8 Tf\n");
        sbStream.Append("0.7 0.7 0.7 rg\n");
        sbStream.Append("_________________________________________________________________________________ Tj\n");

        // Cabeçalho da Tabela Cronológica de Consultas
        sbStream.Append("0 -20 Td\n");
        sbStream.Append("/F2 10 Tf\n");
        sbStream.Append("0.125 0.149 0.192 rg\n");
        sbStream.Append("(REGISTRO CRONOLOGICO DE CONSULTAS DE PRE-NATAL) Tj\n");

        sbStream.Append("0 -16 Td\n");
        sbStream.Append("/F2 8 Tf\n");
        sbStream.Append("0.3 0.3 0.3 rg\n");
        sbStream.Append("(Data       IG (sem/d)   Peso (kg)   PA (mmHg)   AU (cm)   BCF (bpm)   Mov. Fetal   Edema) Tj\n");

        sbStream.Append("0 -8 Td\n");
        sbStream.Append("/F1 7 Tf\n");
        sbStream.Append("0.75 0.75 0.75 rg\n");
        sbStream.Append("------------------------------------------------------------------------------------------------------------------------ Tj\n");

        // Linhas de consultas
        if (visits.Count == 0)
        {
            sbStream.Append("0 -14 Td\n");
            sbStream.Append("/F1 9 Tf\n");
            sbStream.Append("0.5 0.5 0.5 rg\n");
            sbStream.Append("(Nenhuma consulta pre-natal registrada ate o momento.) Tj\n");
        }
        else
        {
            foreach (var visit in visits)
            {
                var dt = visit.VisitDate.ToString("dd/MM/yyyy");
                var ig = $"{visit.GestationalAgeWeeks}s {visit.GestationalAgeDays}d";
                var peso = visit.WeightKg.ToString("F1", CultureInfo.InvariantCulture);
                var pa = visit.BloodPressure;
                var au = visit.UterineHeightCm?.ToString("F0", CultureInfo.InvariantCulture) ?? "-";
                var bcf = visit.FetalHeartRateBpm?.ToString() ?? "-";
                var mf = visit.FetalMovementPresent == true ? "Presente" : (visit.FetalMovementPresent == false ? "Ausente" : "-");
                var edema = visit.EdemaClassification ?? "Ausente";

                var line = $"{dt,-10}  {ig,-11}  {peso,-9}  {pa,-10}  {au,-7}  {bcf,-9}  {mf,-10}  {edema}";

                sbStream.Append("0 -13 Td\n");
                sbStream.Append("/F1 8 Tf\n");
                sbStream.Append("0.2 0.2 0.2 rg\n");
                sbStream.Append("(").Append(EscapePdf(line)).Append(") Tj\n");
            }
        }

        // Rodapé de Autenticação e Diretrizes FEBRASGO
        sbStream.Append("0 -40 Td\n");
        sbStream.Append("/F1 8 Tf\n");
        sbStream.Append("0.4 0.4 0.4 rg\n");
        sbStream.Append("(Documento gerado eletronicamente em conformidade com as diretrizes do Ministerio da Saude e FEBRASGO.) Tj\n");
        sbStream.Append("0 -11 Td\n");
        sbStream.Append("(Cana Med Mulher - Plataforma de Gestao Clinica e Saude da Mulher | Lei 13.787/2018 e CFM) Tj\n");

        sbStream.Append("ET");

        var streamBytes = Encoding.Latin1.GetBytes(sbStream.ToString().Replace("\r\n", "\n"));

        var header = Encoding.Latin1.GetBytes("%PDF-1.4\n");
        var obj1 = Encoding.Latin1.GetBytes("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        var obj2 = Encoding.Latin1.GetBytes("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
        var obj3 = Encoding.Latin1.GetBytes("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n");
        var obj4Head = Encoding.Latin1.GetBytes($"4 0 obj\n<< /Length {streamBytes.Length} >>\nstream\n");
        var obj4Foot = Encoding.Latin1.GetBytes("\nendstream\nendobj\n");
        var obj5 = Encoding.Latin1.GetBytes("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
        var obj6 = Encoding.Latin1.GetBytes("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");

        long off1 = header.Length;
        long off2 = off1 + obj1.Length;
        long off3 = off2 + obj2.Length;
        long off4 = off3 + obj3.Length;
        long off5 = off4 + obj4Head.Length + streamBytes.Length + obj4Foot.Length;
        long off6 = off5 + obj5.Length;
        long startXref = off6 + obj6.Length;

        var xref = Encoding.Latin1.GetBytes(
            $"xref\n0 7\n0000000000 65535 f \n{off1:D10} 00000 n \n{off2:D10} 00000 n \n{off3:D10} 00000 n \n{off4:D10} 00000 n \n{off5:D10} 00000 n \n{off6:D10} 00000 n \n");
        var trailer = Encoding.Latin1.GetBytes(
            $"trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n{startXref}\n%%EOF\n");

        using var ms = new MemoryStream();
        ms.Write(header);
        ms.Write(obj1);
        ms.Write(obj2);
        ms.Write(obj3);
        ms.Write(obj4Head);
        ms.Write(streamBytes);
        ms.Write(obj4Foot);
        ms.Write(obj5);
        ms.Write(obj6);
        ms.Write(xref);
        ms.Write(trailer);

        return ms.ToArray();
    }

    private static string EscapePdf(string input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        return input.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");
    }

    private static string SanitizeText(string input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        var normalized = input.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized)
        {
            var uc = CharUnicodeInfo.GetUnicodeCategory(c);
            if (uc != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }
        return sb.ToString().Normalize(NormalizationForm.FormC);
    }
}
