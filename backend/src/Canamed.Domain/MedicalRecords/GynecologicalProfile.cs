using Canamed.Domain.Common;

namespace Canamed.Domain.MedicalRecords;

public sealed class GynecologicalProfile : Entity
{
    private GynecologicalProfile()
    {
    }

    public Guid ClinicId { get; private set; }
    public Guid PatientId { get; private set; }

    // Menstrual & Reprodutivo
    public int? MenarcheAge { get; private set; }
    public int? SexarcheAge { get; private set; }
    public int? CycleIntervalDays { get; private set; }
    public int? CycleDurationDays { get; private set; }
    public bool? IsCycleRegular { get; private set; }
    public string? FlowIntensity { get; private set; }
    public string? Dysmenorrhea { get; private set; }
    public bool? HasPms { get; private set; }
    public string? PmsSymptoms { get; private set; }
    public string? MenopauseStatus { get; private set; }
    public int? MenopauseAge { get; private set; }
    public bool? HrtInUse { get; private set; }

    // Obstétrico (GPA)
    public int Gravida { get; private set; }
    public int Para { get; private set; }
    public int Cesareans { get; private set; }
    public int Abortions { get; private set; }
    public int LivingChildren { get; private set; }
    public int EctopicPregnancies { get; private set; }
    public string? ObstetricNotes { get; private set; }

    // Contracepção
    public string? CurrentMethod { get; private set; }
    public int? CurrentMethodUsageMonths { get; private set; }
    public string? PreviousMethods { get; private set; }
    public string? ReproductivePlan { get; private set; }

    // Antecedentes
    public string? PelvicSurgeries { get; private set; }
    public string? StiHistory { get; private set; }
    public string? FamilyCancerHistory { get; private set; }

    public static GynecologicalProfile Create(
        Guid clinicId,
        Guid patientId,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("A clínica é obrigatória.", nameof(clinicId));
        }

        if (patientId == Guid.Empty)
        {
            throw new ArgumentException("O paciente é obrigatório.", nameof(patientId));
        }

        var profile = new GynecologicalProfile
        {
            ClinicId = clinicId,
            PatientId = patientId,
            Gravida = 0,
            Para = 0,
            Cesareans = 0,
            Abortions = 0,
            LivingChildren = 0,
            EctopicPregnancies = 0
        };

        profile.MarkCreated(now);
        return profile;
    }

    public void Update(
        int? menarcheAge,
        int? sexarcheAge,
        int? cycleIntervalDays,
        int? cycleDurationDays,
        bool? isCycleRegular,
        string? flowIntensity,
        string? dysmenorrhea,
        bool? hasPms,
        string? pmsSymptoms,
        string? menopauseStatus,
        int? menopauseAge,
        bool? hrtInUse,
        int gravida,
        int para,
        int cesareans,
        int abortions,
        int livingChildren,
        int ectopicPregnancies,
        string? obstetricNotes,
        string? currentMethod,
        int? currentMethodUsageMonths,
        string? previousMethods,
        string? reproductivePlan,
        string? pelvicSurgeries,
        string? stiHistory,
        string? familyCancerHistory,
        DateTimeOffset now)
    {
        if (menarcheAge is < 5 or > 25)
        {
            throw new ArgumentException("Idade da menarca fora do intervalo plausível (5 a 25 anos).", nameof(menarcheAge));
        }

        if (sexarcheAge is < 8 or > 50)
        {
            throw new ArgumentException("Idade da sexarca fora do intervalo plausível (8 a 50 anos).", nameof(sexarcheAge));
        }

        if (gravida < 0 || para < 0 || cesareans < 0 || abortions < 0 || livingChildren < 0 || ectopicPregnancies < 0)
        {
            throw new ArgumentException("Os contadores do histórico obstétrico (GPA) não podem ser negativos.");
        }

        MenarcheAge = menarcheAge;
        SexarcheAge = sexarcheAge;
        CycleIntervalDays = cycleIntervalDays;
        CycleDurationDays = cycleDurationDays;
        IsCycleRegular = isCycleRegular;
        FlowIntensity = flowIntensity?.Trim();
        Dysmenorrhea = dysmenorrhea?.Trim();
        HasPms = hasPms;
        PmsSymptoms = pmsSymptoms?.Trim();
        MenopauseStatus = menopauseStatus?.Trim();
        MenopauseAge = menopauseAge;
        HrtInUse = hrtInUse;

        Gravida = gravida;
        Para = para;
        Cesareans = cesareans;
        Abortions = abortions;
        LivingChildren = livingChildren;
        EctopicPregnancies = ectopicPregnancies;
        ObstetricNotes = obstetricNotes?.Trim();

        CurrentMethod = currentMethod?.Trim();
        CurrentMethodUsageMonths = currentMethodUsageMonths;
        PreviousMethods = previousMethods?.Trim();
        ReproductivePlan = reproductivePlan?.Trim();

        PelvicSurgeries = pelvicSurgeries?.Trim();
        StiHistory = stiHistory?.Trim();
        FamilyCancerHistory = familyCancerHistory?.Trim();

        MarkUpdated(now);
    }
}
