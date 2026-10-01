namespace Canamed.Application.Abstractions;

/// <summary>
/// Fronteira transacional das operações de escrita. Cada caso de uso executa em uma única transação,
/// o que mantém o agendamento e o evento de auditoria consistentes entre si.
/// </summary>
public interface IUnitOfWork
{
    /// <summary>Executa a operação dentro de uma transação, confirmando ao final e revertendo em caso de erro.</summary>
    Task<T> ExecuteInTransactionAsync<T>(
        Func<CancellationToken, Task<T>> operation,
        CancellationToken cancellationToken = default);
}
