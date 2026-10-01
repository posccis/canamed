using Canamed.Domain.Common;

namespace Canamed.Domain.Clinics;

/// <summary>Clínica — raiz do isolamento multi-clínica (ADR-0008).</summary>
public sealed class Clinic : Entity
{
    private Clinic()
    {
    }

    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Cria uma clínica. O identificador é informado apenas em dados de demonstração e testes
    /// (ADR-0003), para permitir valores determinísticos; em produção é sempre gerado.
    /// </summary>
    public static Clinic Create(string name, DateTimeOffset now, Guid? id = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        var clinic = new Clinic { Name = name.Trim() };

        if (id is not null)
        {
            clinic.Id = id.Value;
        }

        clinic.MarkCreated(now);

        return clinic;
    }
}
