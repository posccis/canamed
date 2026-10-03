namespace Canamed.Domain.MedicalRecords;

public static class MedicalRecordStatus
{
    public const string EmAndamento = "em_andamento";
    public const string Finalizado = "finalizado";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        EmAndamento,
        Finalizado
    };
}
