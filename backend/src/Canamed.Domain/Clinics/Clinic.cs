using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Canamed.Domain.Common;

namespace Canamed.Domain.Clinics;

/// <summary>Clínica — raiz do isolamento multi-clínica (ADR-0008).</summary>
public sealed partial class Clinic : Entity
{
    /// <summary>Menor slug aceito nos links públicos (SPEC-0026/RN-003).</summary>
    public const int MinSlugLength = 3;

    /// <summary>Maior slug aceito; mantém os endereços curtos e previsíveis.</summary>
    public const int MaxSlugLength = 60;

    private Clinic()
    {
    }

    public string Name { get; private set; } = string.Empty;

    /// <summary>Slug estável usado nos links públicos (`/p/{slug}`, SPEC-0026/RN-003).</summary>
    public string Slug { get; private set; } = string.Empty;

    /// <summary>Nome exibido na superfície do paciente; cai para <see cref="Name"/> quando vazio.</summary>
    public string? PublicName { get; private set; }

    /// <summary>Habilita a reposição de vaga por lista de espera (SPEC-0026/RN-019).</summary>
    public bool AllowWaitlist { get; private set; }

    /// <summary>Habilita o reagendamento autônomo pelo paciente (SPEC-0026/RN-014).</summary>
    public bool AllowSelfReschedule { get; private set; } = true;

    /// <summary>Máximo de agendamentos futuros ativos por paciente (SPEC-0015/RN-003).</summary>
    public int MaxOnlineAppointments { get; private set; } = 2;

    /// <summary>
    /// Cria uma clínica. O identificador é informado apenas em dados de demonstração e testes
    /// (ADR-0003), para permitir valores determinísticos; em produção é sempre gerado.
    /// </summary>
    public static Clinic Create(
        string name,
        DateTimeOffset now,
        Guid? id = null,
        string? slug = null,
        string? publicName = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        var clinic = new Clinic
        {
            Name = name.Trim(),
            Slug = NormalizeSlug(slug ?? Slugify(name)),
            PublicName = string.IsNullOrWhiteSpace(publicName) ? null : publicName.Trim(),
        };

        if (id is not null)
        {
            clinic.Id = id.Value;
        }

        clinic.MarkCreated(now);

        return clinic;
    }

    /// <summary>Nome (ou slug) exibido na superfície pública do paciente.</summary>
    public string DisplayName => string.IsNullOrWhiteSpace(PublicName) ? Name : PublicName;

    /// <summary>Atualiza os parâmetros públicos e de autonomia do paciente (SPEC-0026/7.1).</summary>
    public void UpdatePublicSettings(
        string? publicName,
        bool allowWaitlist,
        bool allowSelfReschedule,
        int maxOnlineAppointments,
        DateTimeOffset now)
    {
        if (maxOnlineAppointments < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(maxOnlineAppointments), "O limite de agendamentos online não pode ser negativo.");
        }

        PublicName = string.IsNullOrWhiteSpace(publicName) ? null : publicName.Trim();
        AllowWaitlist = allowWaitlist;
        AllowSelfReschedule = allowSelfReschedule;
        MaxOnlineAppointments = maxOnlineAppointments;
        MarkUpdated(now);
    }

    /// <summary>Troca o slug da clínica preservando a regra de formato (SPEC-0026/RN-003).</summary>
    public void ChangeSlug(string slug, DateTimeOffset now)
    {
        Slug = NormalizeSlug(slug);
        MarkUpdated(now);
    }

    private static string NormalizeSlug(string slug)
    {
        var normalized = (slug ?? string.Empty).Trim().ToLowerInvariant();

        if (normalized.Length is < MinSlugLength or > MaxSlugLength || !SlugPattern().IsMatch(normalized))
        {
            throw new ArgumentException(
                $"O slug deve ter entre {MinSlugLength} e {MaxSlugLength} caracteres, apenas letras minúsculas, números e hífen.",
                nameof(slug));
        }

        return normalized;
    }

    /// <summary>Gera um slug estável a partir de um nome quando ele não é informado explicitamente.</summary>
    public static string Slugify(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);

        var decomposed = value.Trim().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);

        foreach (var character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            builder.Append(char.IsLetterOrDigit(character) ? char.ToLowerInvariant(character) : '-');
        }

        var candidate = NonSlugChars().Replace(builder.ToString(), "-").Trim('-');
        if (candidate.Length == 0)
        {
            candidate = "clinica";
        }

        if (candidate.Length > MaxSlugLength)
        {
            candidate = candidate[..MaxSlugLength].Trim('-');
        }

        return candidate.Length < MinSlugLength ? candidate.PadRight(MinSlugLength, '0') : candidate;
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonSlugChars();

    [GeneratedRegex("^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$")]
    private static partial Regex SlugPattern();
}
