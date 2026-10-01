namespace Canamed.Domain.Agenda;

/// <summary>Lançada quando o intervalo pretendido está bloqueado na agenda do profissional (RN-011).</summary>
public sealed class ScheduleBlockedException(string message) : Exception(message);
