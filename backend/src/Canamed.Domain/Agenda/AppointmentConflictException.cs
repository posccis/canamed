namespace Canamed.Domain.Agenda;

/// <summary>Lançada quando já existe agendamento ativo sobreposto para o mesmo profissional (RN-001).</summary>
public sealed class AppointmentConflictException(string message) : Exception(message);
