namespace Canamed.Domain.Agenda;

/// <summary>Natureza da consulta (RN-001 da SPEC-0004).</summary>
public enum AppointmentCategory
{
    /// <summary>Consulta avulsa — atendimento isolado.</summary>
    Single,

    /// <summary>Acompanhamento — continuidade de um tratamento.</summary>
    FollowUp,
}

/// <summary>Forma de custeio da consulta (RN-001 da SPEC-0004).</summary>
public enum AppointmentCoverage
{
    /// <summary>Atendimento particular, pago pelo paciente.</summary>
    Private,

    /// <summary>Atendimento custeado por plano de saúde.</summary>
    HealthPlan,
}

/// <summary>Conversão entre o enum de código (inglês, RN-014 da SPEC-0001) e o valor persistido.</summary>
public static class AppointmentClassificationMap
{
    private static readonly Dictionary<AppointmentCategory, string> Categories = new()
    {
        [AppointmentCategory.Single] = "avulsa",
        [AppointmentCategory.FollowUp] = "acompanhamento",
    };

    private static readonly Dictionary<AppointmentCoverage, string> Coverages = new()
    {
        [AppointmentCoverage.Private] = "particular",
        [AppointmentCoverage.HealthPlan] = "plano_saude",
    };

    private static readonly Dictionary<string, AppointmentCategory> CategoriesByValue =
        Categories.ToDictionary(pair => pair.Value, pair => pair.Key, StringComparer.Ordinal);

    private static readonly Dictionary<string, AppointmentCoverage> CoveragesByValue =
        Coverages.ToDictionary(pair => pair.Value, pair => pair.Key, StringComparer.Ordinal);

    /// <summary>Valores de natureza aceitos pelo banco.</summary>
    public static IReadOnlyList<string> CategoryValues { get; } = [.. Categories.Values];

    /// <summary>Valores de custeio aceitos pelo banco.</summary>
    public static IReadOnlyList<string> CoverageValues { get; } = [.. Coverages.Values];

    /// <summary>Converte a natureza para o valor persistido.</summary>
    public static string ToStoredValue(this AppointmentCategory category) =>
        Categories.TryGetValue(category, out var value)
            ? value
            : throw new ArgumentOutOfRangeException(nameof(category), category, "Natureza de consulta desconhecida.");

    /// <summary>Converte o custeio para o valor persistido.</summary>
    public static string ToStoredValue(this AppointmentCoverage coverage) =>
        Coverages.TryGetValue(coverage, out var value)
            ? value
            : throw new ArgumentOutOfRangeException(nameof(coverage), coverage, "Custeio de consulta desconhecido.");

    /// <summary>Converte o valor persistido em natureza, recusando valores desconhecidos.</summary>
    public static AppointmentCategory CategoryFromStoredValue(string? value) =>
        value is not null && CategoriesByValue.TryGetValue(value, out var category)
            ? category
            : throw new ArgumentOutOfRangeException(nameof(value), value, "Natureza de consulta desconhecida.");

    /// <summary>Converte o valor persistido em custeio, recusando valores desconhecidos.</summary>
    public static AppointmentCoverage CoverageFromStoredValue(string? value) =>
        value is not null && CoveragesByValue.TryGetValue(value, out var coverage)
            ? coverage
            : throw new ArgumentOutOfRangeException(nameof(value), value, "Custeio de consulta desconhecido.");
}
