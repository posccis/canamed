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

    // Exame Físico Estruturado (MED-03)
    public bool BreastsIsNormal { get; private set; } = true;
    public string? BreastsFindings { get; private set; }

    public bool AbdomenIsNormal { get; private set; } = true;
    public string? AbdomenFindings { get; private set; }

    public bool ExternalGenitaliaIsNormal { get; private set; } = true;
    public string? ExternalGenitaliaFindings { get; private set; }

    public bool SpeculumExamIsNormal { get; private set; } = true;
    public string? SpeculumExamFindings { get; private set; }

    public bool BimanualPalpationIsNormal { get; private set; } = true;
    public string? BimanualPalpationFindings { get; private set; }

    // Procedimentos & Diagnósticos & Prescrições (MED-04)
    public string? ProcedurePerformed { get; private set; }
    public string? ProcedureBatch { get; private set; }
    public string? ProcedureNotes { get; private set; }
    public string? DiagnosesJson { get; private set; }
    public string? PrescriptionNotes { get; private set; }
    public string? GeneralOrientationNotes { get; private set; }

    public static GynecologicalConsultationData Create(Guid medicalRecordId, DateTimeOffset now)
    {
        if (medicalRecordId == Guid.Empty)
        {
            throw new ArgumentException("O prontuário é obrigatório.", nameof(medicalRecordId));
        }

        var data = new GynecologicalConsultationData
        {
            MedicalRecordId = medicalRecordId,
            BreastsIsNormal = true,
            AbdomenIsNormal = true,
            ExternalGenitaliaIsNormal = true,
            SpeculumExamIsNormal = true,
            BimanualPalpationIsNormal = true
        };

        data.MarkCreated(now);
        return data;
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
        Dum = isMenopausal ? null : dum;
        IsDumUncertain = !isMenopausal && isDumUncertain;
        IsMenopausal = isMenopausal;
        ChiefComplaint = chiefComplaint?.Trim();
        Hma = hma?.Trim();
        IsSexuallyActive = isSexuallyActive;
        Dyspareunia = dyspareunia?.Trim();

        BreastsIsNormal = breastsIsNormal;
        BreastsFindings = breastsIsNormal ? null : breastsFindings?.Trim();

        AbdomenIsNormal = abdomenIsNormal;
        AbdomenFindings = abdomenIsNormal ? null : abdomenFindings?.Trim();

        ExternalGenitaliaIsNormal = externalGenitaliaIsNormal;
        ExternalGenitaliaFindings = externalGenitaliaIsNormal ? null : externalGenitaliaFindings?.Trim();

        SpeculumExamIsNormal = speculumExamIsNormal;
        SpeculumExamFindings = speculumExamIsNormal ? null : speculumExamFindings?.Trim();

        BimanualPalpationIsNormal = bimanualPalpationIsNormal;
        BimanualPalpationFindings = bimanualPalpationIsNormal ? null : bimanualPalpationFindings?.Trim();

        ProcedurePerformed = procedurePerformed?.Trim();
        ProcedureBatch = procedureBatch?.Trim();
        ProcedureNotes = procedureNotes?.Trim();
        DiagnosesJson = diagnosesJson?.Trim();
        PrescriptionNotes = prescriptionNotes?.Trim();
        GeneralOrientationNotes = generalOrientationNotes?.Trim();

        MarkUpdated(now);
    }
}
