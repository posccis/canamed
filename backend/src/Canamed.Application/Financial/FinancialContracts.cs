using Canamed.Domain.Financial;

namespace Canamed.Application.Financial;

public interface IFinancialRepository
{
    Task<MedicalPayoutContract?> GetContractAsync(Guid clinicId, Guid professionalId, CancellationToken cancellationToken = default);
    Task UpsertContractAsync(MedicalPayoutContract contract, CancellationToken cancellationToken = default);

    Task AddBatchAsync(MedicalPayoutBatch batch, CancellationToken cancellationToken = default);
    Task<MedicalPayoutBatch?> GetBatchByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MedicalPayoutBatch>> ListBatchesAsync(Guid clinicId, Guid? professionalId = null, CancellationToken cancellationToken = default);
    Task UpdateBatchAsync(MedicalPayoutBatch batch, CancellationToken cancellationToken = default);

    Task AddTransactionAsync(FinancialTransaction tx, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FinancialTransaction>> ListTransactionsAsync(Guid clinicId, DateTimeOffset from, DateTimeOffset to, CancellationToken cancellationToken = default);
}

public sealed record UpsertPayoutContractRequest(
    Guid ClinicId,
    Guid ProfessionalId,
    string PayoutType,
    decimal Value);

public sealed record GeneratePayoutBatchRequest(
    Guid ClinicId,
    Guid ProfessionalId,
    DateTimeOffset PeriodStart,
    DateTimeOffset PeriodEnd);

public sealed record SettlePayoutBatchRequest(
    string? ReceiptReference,
    string? Notes);

public sealed record CreateTransactionRequest(
    Guid ClinicId,
    string Type,
    string Category,
    string Description,
    decimal Amount,
    DateTimeOffset DueDate,
    DateTimeOffset CompetenceDate,
    string Status);

public sealed record PayoutContractDto(
    Guid Id,
    Guid ClinicId,
    Guid ProfessionalId,
    string PayoutType,
    decimal Value,
    bool IsActive);

public sealed record PayoutBatchDto(
    Guid Id,
    Guid ClinicId,
    Guid ProfessionalId,
    DateTimeOffset PeriodStart,
    DateTimeOffset PeriodEnd,
    string Status,
    decimal TotalGross,
    decimal TotalClinicRetained,
    decimal TotalPayoutAmount,
    DateTimeOffset? SettledAt,
    string? SettlementNotes,
    string? ReceiptReference,
    IReadOnlyList<PayoutItemDto> Items);

public sealed record PayoutItemDto(
    Guid Id,
    Guid AppointmentId,
    string PatientName,
    DateTimeOffset ConsultationDate,
    decimal GrossAmount,
    decimal ClinicRetainedAmount,
    decimal PayoutAmount);

public sealed record FinancialTransactionDto(
    Guid Id,
    Guid ClinicId,
    string Type,
    string Category,
    string Description,
    decimal Amount,
    DateTimeOffset DueDate,
    DateTimeOffset CompetenceDate,
    string Status,
    DateTimeOffset? PaidAt);

public sealed record FinancialSummaryDto(
    Guid ClinicId,
    DateTimeOffset PeriodStart,
    DateTimeOffset PeriodEnd,
    decimal TotalRevenue,
    decimal TotalExpenses,
    decimal TotalMedicalPayouts,
    decimal NetResult,
    IReadOnlyList<FinancialTransactionDto> Transactions);
