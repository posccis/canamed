using Canamed.Api.Authorization;
using Canamed.Application.Abstractions;
using Canamed.Application.Identity;
using Canamed.Application.MedicalDocuments;
using Canamed.Domain.MedicalDocuments;
using Microsoft.AspNetCore.Mvc;

namespace Canamed.Api.Endpoints;

public static class MedicalDocumentEndpoints
{
    public static RouteGroupBuilder MapMedicalDocumentEndpoints(this RouteGroupBuilder api)
    {
        ArgumentNullException.ThrowIfNull(api);

        var documents = api.MapGroup("/medical-documents");

        documents.MapPost(string.Empty, CreateDraftAsync)
            .WithName("CreateMedicalDocumentDraft")
            .Produces<MedicalDocumentResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permissions.DocumentsCreate);

        documents.MapPut("/{id:guid}", UpdateDraftAsync)
            .WithName("UpdateMedicalDocumentDraft")
            .Produces<MedicalDocumentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.DocumentsCreate);

        documents.MapPost("/{id:guid}/sign", SignDocumentAsync)
            .WithName("SignMedicalDocument")
            .Produces<MedicalDocumentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.DocumentsSign);

        documents.MapPost("/{id:guid}/cancel", CancelDocumentAsync)
            .WithName("CancelMedicalDocument")
            .Produces<MedicalDocumentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .RequirePermissions(Permissions.DocumentsCancel);

        documents.MapGet("/{id:guid}", GetByIdAsync)
            .WithName("GetMedicalDocumentById")
            .Produces<MedicalDocumentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        api.MapGet("/patients/{patientId:guid}/medical-documents", GetByPatientIdAsync)
            .WithName("GetPatientMedicalDocuments")
            .Produces<IReadOnlyList<MedicalDocumentResponse>>(StatusCodes.Status200OK)
            .RequirePermissions(Permissions.DocumentsRead);

        api.MapGet("/public/validate-document/{publicToken}", ValidatePublicDocumentAsync)
            .WithName("ValidatePublicMedicalDocument")
            .Produces<PublicDocumentValidationResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AllowAnonymous();

        api.MapPost("/public/validate-document/{publicToken}/unlock", UnlockPublicDocumentAsync)
            .WithName("UnlockPublicMedicalDocument")
            .Produces<MedicalDocumentResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AllowAnonymous();

        api.MapGet("/public/validate-document/{publicToken}/download", DownloadPublicDocumentAsync)
            .WithName("DownloadPublicMedicalDocument")
            .Produces(StatusCodes.Status200OK, contentType: "application/pdf")
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AllowAnonymous();

        return api;
    }

    private static async Task<IResult> CreateDraftAsync(
        MedicalDocumentService service,
        [FromBody] CreateMedicalDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.CreateDraftAsync(request, cancellationToken).ConfigureAwait(false);
        return Results.Created($"/api/v1/medical-documents/{result.Id}", result);
    }

    private static async Task<IResult> UpdateDraftAsync(
        MedicalDocumentService service,
        Guid id,
        [FromBody] UpdateMedicalDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.UpdateDraftAsync(id, request, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> SignDocumentAsync(
        MedicalDocumentService service,
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await service.SignDocumentAsync(id, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> CancelDocumentAsync(
        MedicalDocumentService service,
        Guid id,
        [FromBody] CancelMedicalDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.CancelDocumentAsync(id, request, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetByIdAsync(
        MedicalDocumentService service,
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await service.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetByPatientIdAsync(
        MedicalDocumentService service,
        Guid patientId,
        CancellationToken cancellationToken)
    {
        var result = await service.GetByPatientIdAsync(patientId, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> ValidatePublicDocumentAsync(
        MedicalDocumentService service,
        string publicToken,
        CancellationToken cancellationToken)
    {
        var result = await service.ValidatePublicTokenAsync(publicToken, cancellationToken).ConfigureAwait(false);
        return Results.Ok(result);
    }

    private static async Task<IResult> UnlockPublicDocumentAsync(
        IMedicalDocumentRepository documentRepository,
        ICatalogRepository catalogRepository,
        string publicToken,
        [FromBody] UnlockChallengeRequest challenge,
        HttpContext httpContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var doc = await documentRepository.GetByPublicTokenAsync(publicToken.Trim(), cancellationToken);
        if (doc is null)
        {
            return Results.NotFound(new { message = "Documento não encontrado." });
        }

        var patient = await catalogRepository.FindPatientAsync(doc.PatientId, doc.ClinicId, cancellationToken);
        if (patient is null)
        {
            return Results.NotFound(new { message = "Paciente associado não encontrado." });
        }

        var birthYearMatch = patient.BirthDate.HasValue &&
            challenge.Answer.Trim() == patient.BirthDate.Value.Year.ToString();

        var cpfMatch = !string.IsNullOrEmpty(patient.Document) &&
            challenge.Answer.Trim() == new string(patient.Document.Where(char.IsDigit).Take(3).ToArray());

        if (!birthYearMatch && !cpfMatch)
        {
            return Results.BadRequest(new { message = "Resposta do desafio de segurança incorreta." });
        }

        var ip = httpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = httpContext.Request.Headers.UserAgent.ToString();
        await documentRepository.LogAccessAsync(
            MedicalDocumentAccessLog.Record(doc.Id, "challenge_unlocked", timeProvider.GetUtcNow(), ip, userAgent),
            cancellationToken);

        return Results.Ok(new MedicalDocumentResponse(
            doc.Id,
            doc.ClinicId,
            doc.PatientId,
            doc.DoctorId,
            doc.MedicalRecordId,
            doc.DocumentType,
            doc.Status,
            doc.ContentPayload,
            doc.Cid10Code,
            doc.PatientConsentedCid,
            doc.SignatureHash,
            doc.PublicToken,
            doc.CancellationReason,
            doc.SignedAt,
            doc.CancelledAt,
            doc.CreatedAt));
    }

    private static async Task<IResult> DownloadPublicDocumentAsync(
        IMedicalDocumentRepository documentRepository,
        ICatalogRepository catalogRepository,
        string publicToken,
        HttpContext httpContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var doc = await documentRepository.GetByPublicTokenAsync(publicToken.Trim(), cancellationToken);
        if (doc is null)
        {
            return Results.NotFound();
        }

        var patient = await catalogRepository.FindPatientAsync(doc.PatientId, doc.ClinicId, cancellationToken);
        var doctor = await catalogRepository.FindProfessionalAsync(doc.ClinicId, doc.DoctorId, cancellationToken);

        var ip = httpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = httpContext.Request.Headers.UserAgent.ToString();
        await documentRepository.LogAccessAsync(
            MedicalDocumentAccessLog.Record(doc.Id, "pdf_downloaded", timeProvider.GetUtcNow(), ip, userAgent),
            cancellationToken);

        var pdfBytes = GenerateStandardPdf(doc, patient, doctor);

        return Results.File(pdfBytes, "application/pdf", $"canamed-{doc.DocumentType.ToLowerInvariant()}-{doc.PublicToken[..8]}.pdf");
    }

    private static byte[] GenerateStandardPdf(
        MedicalDocument doc,
        Canamed.Domain.Agenda.Patient? patient,
        Canamed.Domain.Agenda.Professional? doctor)
    {
        var title = doc.DocumentType switch
        {
            MedicalDocumentType.ReceitaSimples => "RECEITUARIO MEDICO",
            MedicalDocumentType.ReceitaControleEspecial => "RECEITUARIO DE CONTROLE ESPECIAL",
            MedicalDocumentType.AtestadoMedico => "ATESTADO MEDICO",
            MedicalDocumentType.SolicitacaoExames => "SOLICITACAO DE EXAMES COMPLEMENTARES",
            _ => "DOCUMENTO MEDICO"
        };

        var dateStr = doc.SignedAt?.ToString("dd/MM/yyyy HH:mm:ss") ?? DateTimeOffset.UtcNow.ToString("dd/MM/yyyy");
        var tokenStr = doc.PublicToken;
        var hashStr = doc.SignatureHash ?? "VALIDADO-DIGITALMENTE";
        var patientName = patient?.Name ?? "Paciente Cadastrado";
        var patientDob = patient?.BirthDate?.ToString("dd/MM/yyyy") ?? "-";
        var doctorName = doctor?.Name ?? "Dr(a). Medico Assistente";
        var doctorCrm = doctor?.RegistrationNumber ?? "CRM";

        var sbStream = new System.Text.StringBuilder();

        // Linhas decorativas superiores (Verde Cana Med: #00695c -> 0 0.412 0.361 rg)
        sbStream.Append("0 0.412 0.361 rg\n");
        sbStream.Append("50 788 495 2 re f\n");

        // Cabeçalho da Clínica
        sbStream.Append("BT\n");
        sbStream.Append("/F2 16 Tf\n");
        sbStream.Append("0 0.412 0.361 rg\n");
        sbStream.Append("50 765 Td\n");
        sbStream.Append("(CANAMED - CLINICA GINECOLOGICA) Tj\n");

        sbStream.Append("0 -15 Td\n");
        sbStream.Append("/F1 9 Tf\n");
        sbStream.Append("0.3 0.3 0.3 rg\n");
        sbStream.Append("(Av. Engenheiro Domingos Ferreira, 1000 - Boa Viagem, Recife - PE | Tel: (81) 3000-0000) Tj\n");

        // Dados do Médico no cabeçalho à direita
        sbStream.Append("0 -13 Td\n");
        sbStream.Append("/F1 9 Tf\n");
        sbStream.Append("0.2 0.2 0.2 rg\n");
        sbStream.Append("(").Append(EscapePdf(SanitizeText(doctorName))).Append(" - ").Append(EscapePdf(SanitizeText(doctorCrm))).Append(") Tj\n");

        // Título do Documento
        sbStream.Append("0 -34 Td\n");
        sbStream.Append("/F2 14 Tf\n");
        sbStream.Append("0.06 0.09 0.16 rg\n");
        sbStream.Append("(").Append(EscapePdf(title)).Append(") Tj\n");

        // Identificação do Paciente
        sbStream.Append("0 -24 Td\n");
        sbStream.Append("/F2 10 Tf\n");
        sbStream.Append("0.1 0.1 0.1 rg\n");
        sbStream.Append("(Paciente: ").Append(EscapePdf(SanitizeText(patientName))).Append(") Tj\n");

        sbStream.Append("0 -14 Td\n");
        sbStream.Append("/F1 9 Tf\n");
        sbStream.Append("0.3 0.3 0.3 rg\n");
        sbStream.Append("(Data de Nascimento: ").Append(EscapePdf(patientDob)).Append("   |   ID Doc: ").Append(EscapePdf(doc.PublicToken[..8].ToUpperInvariant())).Append(") Tj\n");

        // Linha divisória
        sbStream.Append("0 -18 Td\n");
        sbStream.Append("/F1 9 Tf\n");
        sbStream.Append("0.6 0.6 0.6 rg\n");
        sbStream.Append("(------------------------------------------------------------------------------------------------------------------------) Tj\n");

        // Conteúdo estruturado
        sbStream.Append("0 -22 Td\n");
        sbStream.Append("0.1 0.1 0.1 rg\n");

        try
        {
            using var jsonDoc = System.Text.Json.JsonDocument.Parse(doc.ContentPayload);
            var root = jsonDoc.RootElement;

            if (root.TryGetProperty("items", out var items) && items.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                var idx = 1;
                foreach (var item in items.EnumerateArray())
                {
                    var medName = item.TryGetProperty("medication", out var m) ? m.GetString() ?? "" : "";
                    var dose = item.TryGetProperty("concentration", out var c) ? c.GetString() ?? "" : "";
                    var route = item.TryGetProperty("route", out var r) ? r.GetString() ?? "" : "";
                    var qty = item.TryGetProperty("quantity", out var q) ? q.GetString() ?? "" : "";
                    var instr = item.TryGetProperty("instructions", out var i) ? i.GetString() ?? "" : "";

                    sbStream.Append("/F2 10 Tf\n");
                    sbStream.Append("0.0 0.412 0.361 rg\n");
                    sbStream.Append("(").Append(idx).Append(". ").Append(EscapePdf(SanitizeText(medName))).Append(" ").Append(EscapePdf(SanitizeText(dose)));
                    if (!string.IsNullOrWhiteSpace(qty))
                    {
                        sbStream.Append(" [Qtd: ").Append(EscapePdf(SanitizeText(qty))).Append("]");
                    }
                    sbStream.Append(") Tj\n");

                    sbStream.Append("0 -14 Td\n");
                    sbStream.Append("/F1 9 Tf\n");
                    sbStream.Append("0.2 0.2 0.2 rg\n");
                    sbStream.Append("(   Uso: ").Append(EscapePdf(SanitizeText(route))).Append(" - ").Append(EscapePdf(SanitizeText(instr))).Append(") Tj\n");
                    sbStream.Append("0 -18 Td\n");
                    idx++;
                }

                if (root.TryGetProperty("generalInstructions", out var genInstr) && !string.IsNullOrWhiteSpace(genInstr.GetString()))
                {
                    sbStream.Append("0 -8 Td\n");
                    sbStream.Append("/F2 9 Tf\n");
                    sbStream.Append("0.0 0.412 0.361 rg\n");
                    sbStream.Append("(ORIENTACOES COMPLEMENTARES:) Tj\n");
                    sbStream.Append("0 -14 Td\n");
                    sbStream.Append("/F1 9 Tf\n");
                    sbStream.Append("0.25 0.25 0.25 rg\n");
                    sbStream.Append("(").Append(EscapePdf(SanitizeText(genInstr.GetString()!))).Append(") Tj\n");
                }
            }
            else if (root.TryGetProperty("justificationText", out var justText))
            {
                var leaveDays = root.TryGetProperty("leaveDays", out var ld) ? ld.GetInt32().ToString() : "1";
                sbStream.Append("/F1 10 Tf\n");
                sbStream.Append("(").Append(EscapePdf(SanitizeText(justText.GetString() ?? ""))).Append(") Tj\n");
                sbStream.Append("0 -20 Td\n");
                sbStream.Append("/F2 10 Tf\n");
                sbStream.Append("(Periodo de afastamento recomendado: ").Append(leaveDays).Append(" dia(s).) Tj\n");
            }
            else if (root.TryGetProperty("exams", out var exams))
            {
                sbStream.Append("/F2 10 Tf\n");
                sbStream.Append("0.0 0.412 0.361 rg\n");
                sbStream.Append("(EXAMES SOLICITADOS:) Tj\n");
                sbStream.Append("0 -16 Td\n");
                sbStream.Append("/F1 9 Tf\n");
                sbStream.Append("0.2 0.2 0.2 rg\n");

                var examLines = (exams.GetString() ?? "").Split('\n', StringSplitOptions.RemoveEmptyEntries);
                foreach (var line in examLines)
                {
                    sbStream.Append("(").Append(EscapePdf(SanitizeText(line.Trim()))).Append(") Tj\n");
                    sbStream.Append("0 -14 Td\n");
                }

                if (root.TryGetProperty("indication", out var ind) && !string.IsNullOrWhiteSpace(ind.GetString()))
                {
                    sbStream.Append("0 -8 Td\n");
                    sbStream.Append("/F2 9 Tf\n");
                    sbStream.Append("0.0 0.412 0.361 rg\n");
                    sbStream.Append("(INDICACAO CLINICA:) Tj\n");
                    sbStream.Append("0 -14 Td\n");
                    sbStream.Append("/F1 9 Tf\n");
                    sbStream.Append("0.25 0.25 0.25 rg\n");
                    sbStream.Append("(").Append(EscapePdf(SanitizeText(ind.GetString()!))).Append(") Tj\n");
                }
            }
        }
        catch
        {
            // Em caso de payload simplificado
            sbStream.Append("/F1 10 Tf\n");
            sbStream.Append("(").Append(EscapePdf(SanitizeText(doc.ContentPayload))).Append(") Tj\n");
        }

        if (!string.IsNullOrWhiteSpace(doc.Cid10Code) && doc.PatientConsentedCid)
        {
            sbStream.Append("0 -22 Td\n");
            sbStream.Append("/F1 9 Tf\n");
            sbStream.Append("0.3 0.3 0.3 rg\n");
            sbStream.Append("(CID-10: ").Append(EscapePdf(doc.Cid10Code)).Append(" - Consentimento informado da paciente nos termos do Art. 73 do CEM) Tj\n");
        }

        // Rodapé e Validação ICP-Brasil
        sbStream.Append("0 -50 Td\n");
        sbStream.Append("/F2 9 Tf\n");
        sbStream.Append("0.2 0.2 0.2 rg\n");
        sbStream.Append("____________________________________________________ Tj\n");
        sbStream.Append("0 -13 Td\n");
        sbStream.Append("(").Append(EscapePdf(SanitizeText(doctorName))).Append(") Tj\n");
        sbStream.Append("0 -11 Td\n");
        sbStream.Append("/F1 8 Tf\n");
        sbStream.Append("0.4 0.4 0.4 rg\n");
        sbStream.Append("(").Append(EscapePdf(SanitizeText(doctorCrm))).Append(" - Assinado Digitalmente nos Termos da MP 2.200-2/2001 e Lei 13.787/2018) Tj\n");

        sbStream.Append("0 -24 Td\n");
        sbStream.Append("/F2 8 Tf\n");
        sbStream.Append("0.0 0.412 0.361 rg\n");
        sbStream.Append("(AUTENTICACAO PUBLICA CANAMED) Tj\n");
        sbStream.Append("0 -12 Td\n");
        sbStream.Append("/F1 8 Tf\n");
        sbStream.Append("0.3 0.3 0.3 rg\n");
        sbStream.Append("(Codigo Verificador: ").Append(EscapePdf(tokenStr)).Append("   |   Emissao: ").Append(EscapePdf(dateStr)).Append(") Tj\n");
        sbStream.Append("0 -11 Td\n");
        sbStream.Append("(Hash SHA-256: ").Append(EscapePdf(hashStr.Length > 40 ? hashStr[..40] + "..." : hashStr)).Append(") Tj\n");

        sbStream.Append("ET");

        var streamBytes = System.Text.Encoding.Latin1.GetBytes(sbStream.ToString().Replace("\r\n", "\n"));

        var header = System.Text.Encoding.Latin1.GetBytes("%PDF-1.4\n");
        var obj1 = System.Text.Encoding.Latin1.GetBytes("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        var obj2 = System.Text.Encoding.Latin1.GetBytes("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
        var obj3 = System.Text.Encoding.Latin1.GetBytes("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n");
        var obj4Head = System.Text.Encoding.Latin1.GetBytes($"4 0 obj\n<< /Length {streamBytes.Length} >>\nstream\n");
        var obj4Foot = System.Text.Encoding.Latin1.GetBytes("\nendstream\nendobj\n");
        var obj5 = System.Text.Encoding.Latin1.GetBytes("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
        var obj6 = System.Text.Encoding.Latin1.GetBytes("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");

        long off1 = header.Length;
        long off2 = off1 + obj1.Length;
        long off3 = off2 + obj2.Length;
        long off4 = off3 + obj3.Length;
        long off5 = off4 + obj4Head.Length + streamBytes.Length + obj4Foot.Length;
        long off6 = off5 + obj5.Length;
        long startXref = off6 + obj6.Length;

        var xref = System.Text.Encoding.Latin1.GetBytes(
            $"xref\n0 7\n0000000000 65535 f \n{off1:D10} 00000 n \n{off2:D10} 00000 n \n{off3:D10} 00000 n \n{off4:D10} 00000 n \n{off5:D10} 00000 n \n{off6:D10} 00000 n \n");
        var trailer = System.Text.Encoding.Latin1.GetBytes(
            $"trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n{startXref}\n%%EOF\n");

        using var ms = new System.IO.MemoryStream();
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
        var normalized = input.Normalize(System.Text.NormalizationForm.FormD);
        var sb = new System.Text.StringBuilder();
        foreach (var c in normalized)
        {
            var uc = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (uc != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }
        return sb.ToString().Normalize(System.Text.NormalizationForm.FormC);
    }
}

public sealed record UnlockChallengeRequest(string Answer);
