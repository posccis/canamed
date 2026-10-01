namespace Canamed.Domain.Agenda;

/// <summary>Lançada quando a operação não é permitida para o status atual do agendamento (RN-008).</summary>
public sealed class AppointmentStatusTransitionException(string message) : Exception(message);
