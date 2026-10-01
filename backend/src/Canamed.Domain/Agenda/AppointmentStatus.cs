namespace Canamed.Domain.Agenda;

/// <summary>Ciclo de vida do agendamento (RN-005 da SPEC-0002).</summary>
public enum AppointmentStatus
{
    /// <summary>Agendado — estado inicial.</summary>
    Scheduled,

    /// <summary>Confirmado — presença confirmada pela recepção ou pelo paciente.</summary>
    Confirmed,

    /// <summary>Atendido — o paciente compareceu e foi atendido.</summary>
    Attended,

    /// <summary>Cancelado — o registro é preservado e o horário volta a ficar livre (RN-006).</summary>
    Cancelled,

    /// <summary>Faltou — o paciente não compareceu.</summary>
    NoShow,
}

/// <summary>
/// Conversão entre o enum de código (inglês, RN-014) e a representação persistida e exposta na API
/// (português, alinhada à RN-005 da SPEC-0002).
/// </summary>
public static class AppointmentStatusMap
{
    private static readonly Dictionary<AppointmentStatus, string> ToValueMap = new()
    {
        [AppointmentStatus.Scheduled] = "agendado",
        [AppointmentStatus.Confirmed] = "confirmado",
        [AppointmentStatus.Attended] = "atendido",
        [AppointmentStatus.Cancelled] = "cancelado",
        [AppointmentStatus.NoShow] = "faltou",
    };

    private static readonly Dictionary<string, AppointmentStatus> FromValueEntries =
        ToValueMap.ToDictionary(pair => pair.Value, pair => pair.Key, StringComparer.Ordinal);

    /// <summary>Valores aceitos, na ordem do ciclo de vida. Usados também pela restrição do banco.</summary>
    public static IReadOnlyList<string> StoredValues { get; } = [.. ToValueMap.Values];

    /// <summary>Converte o enum para o valor persistido/exibido.</summary>
    public static string ToStoredValue(this AppointmentStatus status) =>
        ToValueMap.TryGetValue(status, out var value)
            ? value
            : throw new ArgumentOutOfRangeException(nameof(status), status, "Status de agendamento desconhecido.");

    /// <summary>Converte o valor persistido/exibido para o enum.</summary>
    public static AppointmentStatus FromStoredValue(string? value) =>
        value is not null && FromValueEntries.TryGetValue(value, out var status)
            ? status
            : throw new ArgumentOutOfRangeException(nameof(value), value, "Status de agendamento desconhecido.");

    /// <summary>Tenta converter sem lançar exceção.</summary>
    public static bool TryFromStoredValue(string? value, out AppointmentStatus status)
    {
        if (value is not null && FromValueEntries.TryGetValue(value, out status))
        {
            return true;
        }

        status = default;
        return false;
    }
}
