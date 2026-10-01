namespace Canamed.Domain.Agenda;

/// <summary>Lançada quando o início pretendido está no passado (RN-003).</summary>
public sealed class PastSchedulingException(string message) : Exception(message);
