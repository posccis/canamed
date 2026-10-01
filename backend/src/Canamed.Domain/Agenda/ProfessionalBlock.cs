using Canamed.Domain.Common;

namespace Canamed.Domain.Agenda;

/// <summary>Bloqueio de agenda do profissional (RN-011).</summary>
public sealed class ProfessionalBlock : Entity
{
    private ProfessionalBlock()
    {
    }

    public Guid ClinicId { get; private set; }

    public Guid ProfessionalId { get; private set; }

    public DateTimeOffset StartsAt { get; private set; }

    public DateTimeOffset EndsAt { get; private set; }

    public string? Reason { get; private set; }

    /// <summary>Intervalo bloqueado.</summary>
    public TimeRange TimeRange => new(StartsAt, EndsAt);

    /// <summary>Cria um bloqueio de agenda.</summary>
    public static ProfessionalBlock Create(
        Guid clinicId,
        Guid professionalId,
        DateTimeOffset startsAt,
        DateTimeOffset endsAt,
        string? reason,
        DateTimeOffset now)
    {
        var range = new TimeRange(startsAt.ToUniversalTime(), endsAt.ToUniversalTime());

        var block = new ProfessionalBlock
        {
            ClinicId = clinicId,
            ProfessionalId = professionalId,
            StartsAt = range.StartsAt,
            EndsAt = range.EndsAt,
            Reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim(),
        };

        block.MarkCreated(now);

        return block;
    }
}
