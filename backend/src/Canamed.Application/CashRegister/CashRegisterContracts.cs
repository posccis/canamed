using Canamed.Domain.CashRegister;

namespace Canamed.Application.CashRegister;

public interface ICashSessionRepository
{
    Task AddAsync(CashSession session, CancellationToken cancellationToken = default);
    Task<CashSession?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default);
    Task<CashSession?> GetActiveByOperatorAsync(Guid clinicId, Guid operatorUserId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CashSession>> ListAsync(Guid clinicId, DateTimeOffset? from = null, DateTimeOffset? to = null, CancellationToken cancellationToken = default);
    Task UpdateAsync(CashSession session, CancellationToken cancellationToken = default);
}

public sealed record OpenCashSessionRequest(Guid ClinicId, decimal InitialFloat);
public sealed record CashSangriaRequest(decimal Amount, string Reason);
public sealed record CashSuprimentoRequest(decimal Amount, string Reason);
public sealed record CloseCashSessionRequest(
    decimal CashDeclared,
    decimal PixDeclared,
    decimal DebitDeclared,
    decimal CreditDeclared,
    string? Notes);

public sealed record CashSessionDto(
    Guid Id,
    Guid ClinicId,
    Guid OperatorUserId,
    string OperatorName,
    DateTimeOffset OpenedAt,
    DateTimeOffset? ClosedAt,
    string Status,
    decimal InitialFloat,
    decimal TotalCashExpected,
    decimal TotalPixExpected,
    decimal TotalDebitExpected,
    decimal TotalCreditExpected,
    decimal TotalCashDeclared,
    decimal TotalPixDeclared,
    decimal TotalDebitDeclared,
    decimal TotalCreditDeclared,
    decimal CashDifference,
    string? ClosingNotes,
    IReadOnlyList<CashMovementDto> Movements);

public sealed record CashMovementDto(
    Guid Id,
    string MovementType,
    decimal Amount,
    string Reason,
    Guid PerformedByUserId,
    DateTimeOffset CreatedAt);
