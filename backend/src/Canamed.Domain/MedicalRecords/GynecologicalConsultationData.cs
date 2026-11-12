using Canamed.Domain.Common;

namespace Canamed.Domain.MedicalRecords;

public sealed class GynecologicalConsultationData : Entity
{
    private GynecologicalConsultationData()
    {
    }

    public Guid MedicalRecordId { get; private set; }
    public DateOnly? Dum { get; private set; }
    public bool IsDumUncertain { get; private set; }
    public bool IsMenopausal { get; private set; }
    public string? ChiefComplaint { get; private set; }
    public string? Hma { get; private set; }
    public bool? IsSexuallyActive { get; private set; }
    public string? Dyspareunia { get; private set; }

    // Exame Físico Estruturado Tri-State (SPEC-0035 / RN-003)
    public string? BreastsStatus { get; private set; }
    public string? BreastsFindings { get; private set; }

    public string? AbdomenStatus { get; private set; }
    public string? AbdomenFindings { get; private set; }

    public string? ExternalGenitaliaStatus { get; private set; }
    public string? ExternalGenitaliaFindings { get; private set; }

    public string? SpeculumExamStatus { get; private set; }
    public string? SpeculumExamFindings { get; private set; }

    public string? BimanualPalpationStatus { get; private set; }
    public string? BimanualPalpationFindings { get; private set; }

    public bool BreastsIsNormal => BreastsStatus == "Normal";
    public bool AbdomenIsNormal => AbdomenStatus == "Normal";
    public bool ExternalGenitaliaIsNormal => ExternalGenitaliaStatus == "Normal";
    public bool SpeculumExamIsNormal => SpeculumExamStatus == "Normal";
    public bool BimanualPalpationIsNormal => BimanualPalpationStatus == "Normal";

    // Procedimentos & Diagnósticos & Prescrições (MED-04)
    public string? ProcedurePerformed { get; private set; }
    public string? ProcedureBatch { get; private set; }
    public string? ProcedureNotes { get; private set; }
    public string? DiagnosesJson { get; private set; }
    public string? PrescriptionNotes { get; private set; }
    public string? GeneralOrientationNotes { get; private set; }
    public string? CervicalClockFindingsJson { get; private set; }

    // Dados de Ultrassom Precoce & Referência Obstétrica (RN-005, RN-006 da SPEC-0035 / Épico 2)
    public DateOnly? FirstUltrasoundDate { get; private set; }
    public int? FirstUltrasoundWeeks { get; private set; }
    public int? FirstUltrasoundDays { get; private set; }
    public double? FirstUltrasoundCcnMm { get; private set; }
    public GestationalAgeReference? PreferredGestationalReference { get; private set; }

    public static GynecologicalConsultationData Create(Guid medicalRecordId, DateTimeOffset now)
    {
        if (medicalRecordId == Guid.Empty)
        {
            throw new ArgumentException("O prontuário é obrigatório.", nameof(medicalRecordId));
        }

        var data = new GynecologicalConsultationData
        {
            MedicalRecordId = medicalRecordId,
            BreastsStatus = null,
            AbdomenStatus = null,
            ExternalGenitaliaStatus = null,
            SpeculumExamStatus = null,
            BimanualPalpationStatus = null
        };

        data.MarkCreated(now);
        return data;
    }

    private static string? NormalizeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status) || string.Equals(status, "NotEvaluated", StringComparison.OrdinalIgnoreCase) || string.Equals(status, "nao_avaliado", StringComparison.OrdinalIgnoreCase))
            return null;
        if (string.Equals(status, "Normal", StringComparison.OrdinalIgnoreCase))
            return "Normal";
        if (string.Equals(status, "Abnormal", StringComparison.OrdinalIgnoreCase) || string.Equals(status, "Alterado", StringComparison.OrdinalIgnoreCase))
            return "Abnormal";
        return status;
    }

    public void UpdateTriState(
        DateOnly? dum,
        bool isDumUncertain,
        bool isMenopausal,
        string? chiefComplaint,
        string? hma,
        bool? isSexuallyActive,
        string? dyspareunia,
        string? breastsStatus,
        string? breastsFindings,
        string? abdomenStatus,
        string? abdomenFindings,
        string? externalGenitaliaStatus,
        string? externalGenitaliaFindings,
        string? speculumExamStatus,
        string? speculumExamFindings,
        string? bimanualPalpationStatus,
        string? bimanualPalpationFindings,
        string? procedurePerformed,
        string? procedureBatch,
        string? procedureNotes,
        string? diagnosesJson,
        string? prescriptionNotes,
        string? generalOrientationNotes,
        DateTimeOffset now,
        string? cervicalClockFindingsJson = null,
        DateOnly? firstUltrasoundDate = null,
        int? firstUltrasoundWeeks = null,
        int? firstUltrasoundDays = null,
        double? firstUltrasoundCcnMm = null,
        GestationalAgeReference? preferredGestationalReference = null)
    {
        var normBreasts = NormalizeStatus(breastsStatus);
        var normAbdomen = NormalizeStatus(abdomenStatus);
        var normGenitalia = NormalizeStatus(externalGenitaliaStatus);
        var normSpeculum = NormalizeStatus(speculumExamStatus);
        var normBimanual = NormalizeStatus(bimanualPalpationStatus);

        if (normBreasts == "Abnormal" && string.IsNullOrWhiteSpace(breastsFindings))
            throw new ArgumentException("Por favor, detalhe as alterações encontradas no segmento marcado como alterado.", nameof(breastsFindings));
        if (normAbdomen == "Abnormal" && string.IsNullOrWhiteSpace(abdomenFindings))
            throw new ArgumentException("Por favor, detalhe as alterações encontradas no segmento marcado como alterado.", nameof(abdomenFindings));
        if (normGenitalia == "Abnormal" && string.IsNullOrWhiteSpace(externalGenitaliaFindings))
            throw new ArgumentException("Por favor, detalhe as alterações encontradas no segmento marcado como alterado.", nameof(externalGenitaliaFindings));
        if (normSpeculum == "Abnormal" && string.IsNullOrWhiteSpace(speculumExamFindings))
            throw new ArgumentException("Por favor, detalhe as alterações encontradas no segmento marcado como alterado.", nameof(speculumExamFindings));
        if (normBimanual == "Abnormal" && string.IsNullOrWhiteSpace(bimanualPalpationFindings))
            throw new ArgumentException("Por favor, detalhe as alterações encontradas no segmento marcado como alterado.", nameof(bimanualPalpationFindings));

        Dum = isMenopausal ? null : dum;
        IsDumUncertain = !isMenopausal && isDumUncertain;
        IsMenopausal = isMenopausal;
        ChiefComplaint = chiefComplaint?.Trim();
        Hma = hma?.Trim();
        IsSexuallyActive = isSexuallyActive;
        Dyspareunia = dyspareunia?.Trim();

        BreastsStatus = normBreasts;
        BreastsFindings = normBreasts == "Abnormal" ? breastsFindings?.Trim() : null;

        AbdomenStatus = normAbdomen;
        AbdomenFindings = normAbdomen == "Abnormal" ? abdomenFindings?.Trim() : null;

        ExternalGenitaliaStatus = normGenitalia;
        ExternalGenitaliaFindings = normGenitalia == "Abnormal" ? externalGenitaliaFindings?.Trim() : null;

        SpeculumExamStatus = normSpeculum;
        SpeculumExamFindings = normSpeculum == "Abnormal" ? speculumExamFindings?.Trim() : null;

        BimanualPalpationStatus = normBimanual;
        BimanualPalpationFindings = normBimanual == "Abnormal" ? bimanualPalpationFindings?.Trim() : null;

        ProcedurePerformed = procedurePerformed?.Trim();
        ProcedureBatch = procedureBatch?.Trim();
        ProcedureNotes = procedureNotes?.Trim();
        DiagnosesJson = diagnosesJson?.Trim();
        PrescriptionNotes = prescriptionNotes?.Trim();
        GeneralOrientationNotes = generalOrientationNotes?.Trim();
        CervicalClockFindingsJson = cervicalClockFindingsJson?.Trim();

        if (firstUltrasoundDate.HasValue || firstUltrasoundWeeks.HasValue || firstUltrasoundDays.HasValue || firstUltrasoundCcnMm.HasValue || preferredGestationalReference.HasValue)
        {
            FirstUltrasoundDate = firstUltrasoundDate;
            FirstUltrasoundWeeks = firstUltrasoundWeeks;
            FirstUltrasoundDays = firstUltrasoundDays;
            FirstUltrasoundCcnMm = firstUltrasoundCcnMm;
            PreferredGestationalReference = preferredGestationalReference;
        }

        MarkUpdated(now);
    }

    public void Update(
        DateOnly? dum,
        bool isDumUncertain,
        bool isMenopausal,
        string? chiefComplaint,
        string? hma,
        bool? isSexuallyActive,
        string? dyspareunia,
        bool breastsIsNormal,
        string? breastsFindings,
        bool abdomenIsNormal,
        string? abdomenFindings,
        bool externalGenitaliaIsNormal,
        string? externalGenitaliaFindings,
        bool speculumExamIsNormal,
        string? speculumExamFindings,
        bool bimanualPalpationIsNormal,
        string? bimanualPalpationFindings,
        string? procedurePerformed,
        string? procedureBatch,
        string? procedureNotes,
        string? diagnosesJson,
        string? prescriptionNotes,
        string? generalOrientationNotes,
        DateTimeOffset now)
    {
        UpdateTriState(
            dum,
            isDumUncertain,
            isMenopausal,
            chiefComplaint,
            hma,
            isSexuallyActive,
            dyspareunia,
            breastsIsNormal ? "Normal" : "Abnormal",
            breastsFindings,
            abdomenIsNormal ? "Normal" : "Abnormal",
            abdomenFindings,
            externalGenitaliaIsNormal ? "Normal" : "Abnormal",
            externalGenitaliaFindings,
            speculumExamIsNormal ? "Normal" : "Abnormal",
            speculumExamFindings,
            bimanualPalpationIsNormal ? "Normal" : "Abnormal",
            bimanualPalpationFindings,
            procedurePerformed,
            procedureBatch,
            procedureNotes,
            diagnosesJson,
            prescriptionNotes,
            generalOrientationNotes,
            now);
    }

    public void UpdateObstetricUltrasound(
        DateOnly? firstUltrasoundDate,
        int? firstUltrasoundWeeks,
        int? firstUltrasoundDays,
        double? firstUltrasoundCcnMm,
        GestationalAgeReference? preferredGestationalReference,
        DateTimeOffset now)
    {
        FirstUltrasoundDate = firstUltrasoundDate;
        FirstUltrasoundWeeks = firstUltrasoundWeeks;
        FirstUltrasoundDays = firstUltrasoundDays;
        FirstUltrasoundCcnMm = firstUltrasoundCcnMm;
        PreferredGestationalReference = preferredGestationalReference;

        MarkUpdated(now);
    }
}
