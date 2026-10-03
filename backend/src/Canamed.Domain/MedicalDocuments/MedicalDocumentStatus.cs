namespace Canamed.Domain.MedicalDocuments;

public static class MedicalDocumentStatus
{
    public const string Rascunho = "rascunho";
    public const string Assinado = "assinado";
    public const string Cancelado = "cancelado";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Rascunho,
        Assinado,
        Cancelado
    };
}
