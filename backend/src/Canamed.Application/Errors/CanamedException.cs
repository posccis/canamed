namespace Canamed.Application.Errors;

/// <summary>
/// Erro previsto da aplicação, convertido em Problem Details (RFC 7807) pela camada de API.
/// A mensagem nunca contém dados pessoais de paciente (RN-014 da SPEC-0002).
/// </summary>
public sealed class CanamedException : Exception
{
    public CanamedException(
        ProblemKind kind,
        string title,
        string? detail = null,
        string? problemType = null,
        IReadOnlyDictionary<string, object?>? extensions = null)
        : base(detail ?? title)
    {
        Kind = kind;
        Title = title;
        Detail = detail;
        ProblemType = problemType;
        Extensions = extensions ?? new Dictionary<string, object?>();
    }

    public ProblemKind Kind { get; }

    public string Title { get; }

    public string? Detail { get; }

    /// <summary>Sufixo do identificador do problema (ex.: <c>appointment-overlap</c>).</summary>
    public string? ProblemType { get; }

    /// <summary>Campos adicionais do Problem Details (ex.: horários livres sugeridos).</summary>
    public IReadOnlyDictionary<string, object?> Extensions { get; }
}
