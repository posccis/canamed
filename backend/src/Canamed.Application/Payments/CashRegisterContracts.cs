namespace Canamed.Application.Payments;

public sealed record OpenCashRegisterRequest(decimal InitialCash);

public sealed record RegisterCashMovementRequest(
    string Type,
    decimal Amount,
    string Reason);

public sealed record CloseCashRegisterRequest(
    decimal DeclaredCash,
    string? Notes = null);

public sealed record CashMovementResponse(
    Guid Id,
    Guid CashRegisterShiftId,
    Guid OperatorId,
    string Type,
    decimal Amount,
    string Reason,
    DateTimeOffset CreatedAt);

public sealed record CashRegisterShiftResponse(
    Guid Id,
    Guid ClinicId,
    Guid OperatorId,
    string OperatorName,
    string Status,
    decimal InitialCash,
    DateTimeOffset OpenedAt,
    DateTimeOffset? ClosedAt,
    decimal? DeclaredCash,
    decimal? ExpectedCash,
    decimal? CashDifference,
    string? Notes,
    IReadOnlyList<CashMovementResponse> Movements);

public sealed record CashRegisterCurrentStatusResponse(
    bool IsOpen,
    CashRegisterShiftResponse? Shift,
    decimal TotalCashPayments,
    decimal TotalPixPayments,
    decimal TotalDebitCardPayments,
    decimal TotalCreditCardPayments,
    decimal TotalHealthPlanPayments,
    decimal TotalSupplies,
    decimal TotalWithdrawals,
    decimal CurrentCashInDrawer);
