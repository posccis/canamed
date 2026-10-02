namespace Canamed.Application.Payments;

public sealed record RecordPaymentRequest(
    Guid AppointmentId,
    decimal Amount,
    string PaymentMethod,
    string? CardBrand = null,
    string? CardLastFourDigits = null,
    string? Notes = null);

public sealed record RefundPaymentRequest(
    string Reason);

public sealed record PaymentTransactionResponse(
    Guid Id,
    Guid ClinicId,
    Guid AppointmentId,
    Guid PatientId,
    string PatientName,
    decimal Amount,
    string PaymentMethod,
    string Status,
    string? CardBrand,
    string? CardLastFourDigits,
    DateTimeOffset PaidAt,
    Guid OperatorId,
    string? Notes,
    DateTimeOffset? RefundedAt,
    string? RefundReason);

public sealed record DailyPaymentSummaryResponse(
    DateOnly Date,
    decimal TotalReceived,
    decimal CashTotal,
    decimal PixTotal,
    decimal DebitCardTotal,
    decimal CreditCardTotal,
    decimal HealthPlanBilledTotal,
    int TransactionCount,
    int RefundCount);
