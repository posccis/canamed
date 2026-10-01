namespace Canamed.Api.Errors;

/// <summary>Base dos identificadores de problema da API (campo <c>type</c> do RFC 7807).</summary>
public static class ProblemTypeUri
{
    /// <summary>Prefixo dos identificadores de problema publicados pelo CANAMED.</summary>
    public const string Prefix = "https://canamed.local/problems/";

    /// <summary>Monta o identificador a partir do sufixo informado.</summary>
    public static string From(string? suffix) =>
        string.IsNullOrWhiteSpace(suffix) ? "about:blank" : Prefix + suffix;
}
