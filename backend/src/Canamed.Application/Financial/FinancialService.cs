using Canamed.Application.Abstractions;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Auditing;
using Canamed.Domain.Financial;

namespace Canamed.Application.Financial;

public sealed class FinancialService
{
    private readonly IFinancialRepository _financialRepository;
    private readonly IAgendaRepository _agendaRepository;
    private readonly IAuditRepository _auditRepository;
    private readonly ICurrentActorAccessor _actorAccessor;
    private readonly TimeProvider _timeProvider;
    private readonly IUnitOfWork _unitOfWork;

    public FinancialService(
        IFinancialRepository financialRepository,
        IAgendaRepository agendaRepository,
        IAuditRepository auditRepository,
        ICurrentActorAccessor actorAccessor,
        TimeProvider timeProvider,
        IUnitOfWork unitOfWork)
    {
        _financialRepository = financialRepository;
        _agendaRepository = agendaRepository;
        _auditRepository = auditRepository;
        _actorAccessor = actorAccessor;
        _timeProvider = timeProvider;
        _unitOfWork = unitOfWork;
    }

    public async Task<PayoutContractDto> UpsertPayoutContractAsync(
        UpsertPayoutContractRequest request,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var existing = await _financialRepository.GetContractAsync(request.ClinicId, request.ProfessionalId, ct);
            if (existing is null)
            {
                existing = MedicalPayoutContract.Create(
                    request.ClinicId,
                    request.ProfessionalId,
                    request.PayoutType,
                    request.Value,
                    now);
            }
            else
            {
                existing.Update(request.PayoutType, request.Value, true, now);
            }

            await _financialRepository.UpsertContractAsync(existing, ct);
            _auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name ?? "Gestor",
                "PayoutContractUpdated",
                "MedicalPayoutContract",
                existing.Id.ToString(),
                now,
                $"{{\"payoutType\":\"{existing.PayoutType}\",\"value\":{existing.Value}}}"));

            return new PayoutContractDto(
                existing.Id,
                existing.ClinicId,
                existing.ProfessionalId,
                existing.PayoutType,
                existing.Value,
                existing.IsActive);
        }, cancellationToken);
    }

    public async Task<PayoutContractDto?> GetPayoutContractAsync(
        Guid clinicId,
        Guid professionalId,
        CancellationToken cancellationToken = default)
    {
        var contract = await _financialRepository.GetContractAsync(clinicId, professionalId, cancellationToken);
        return contract is null ? null : new PayoutContractDto(
            contract.Id,
            contract.ClinicId,
            contract.ProfessionalId,
            contract.PayoutType,
            contract.Value,
            contract.IsActive);
    }

    public async Task<PayoutBatchDto> GeneratePayoutBatchAsync(
        GeneratePayoutBatchRequest request,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var contract = await _financialRepository.GetContractAsync(request.ClinicId, request.ProfessionalId, ct)
                ?? MedicalPayoutContract.Create(request.ClinicId, request.ProfessionalId, "percentage", 70.00m, now);

            // Busca consultas atendidas/pagas do profissional no período
            var appointments = await _agendaRepository.ListAppointmentsAsync(
                request.ClinicId,
                request.ProfessionalId,
                request.PeriodStart,
                request.PeriodEnd,
                ct);

            var eligible = appointments
                .Where(a => a.PaymentStatus == "pago" && a.DeletedAt is null)
                .ToList();

            var batch = MedicalPayoutBatch.Create(
                request.ClinicId,
                request.ProfessionalId,
                request.PeriodStart,
                request.PeriodEnd,
                now);

            const decimal defaultConsultationPrice = 150.00m;

            foreach (var apt in eligible)
            {
                var gross = defaultConsultationPrice;
                var (payout, retained) = contract.CalculatePayout(gross);

                batch.AddItem(
                    apt.Id,
                    $"Paciente #{apt.PatientId.ToString()[..8]}",
                    apt.StartsAt,
                    gross,
                    retained,
                    payout,
                    now);
            }

            await _financialRepository.AddBatchAsync(batch, ct);
            _auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name ?? "Gestor",
                "PayoutBatchGenerated",
                "MedicalPayoutBatch",
                batch.Id.ToString(),
                now,
                $"{{\"totalPayout\":{batch.TotalPayoutAmount},\"itemsCount\":{batch.Items.Count}}}"));

            return MapBatchToDto(batch);
        }, cancellationToken);
    }

    public async Task<PayoutBatchDto> SettlePayoutBatchAsync(
        Guid batchId,
        Guid clinicId,
        SettlePayoutBatchRequest request,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var batch = await _financialRepository.GetBatchByIdAsync(batchId, clinicId, ct)
                ?? throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Lote de repasse não encontrado.", "PAYOUT_BATCH_NOT_FOUND");

            batch.Settle(request.ReceiptReference, request.Notes, now);

            var tx = FinancialTransaction.Create(
                clinicId,
                "repasse",
                "Repasse Médico",
                $"Repasse médico liquidado (Lote {batch.Id.ToString()[..8]})",
                batch.TotalPayoutAmount,
                now,
                batch.PeriodEnd,
                "pago",
                now,
                now);

            await _financialRepository.AddTransactionAsync(tx, ct);
            await _financialRepository.UpdateBatchAsync(batch, ct);

            _auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name ?? "Gestor",
                "PayoutBatchSettled",
                "MedicalPayoutBatch",
                batch.Id.ToString(),
                now,
                $"{{\"totalPayout\":{batch.TotalPayoutAmount},\"receiptRef\":\"{request.ReceiptReference}\"}}"));

            return MapBatchToDto(batch);
        }, cancellationToken);
    }

    public async Task<IReadOnlyList<PayoutBatchDto>> ListBatchesAsync(
        Guid clinicId,
        Guid? professionalId = null,
        CancellationToken cancellationToken = default)
    {
        var batches = await _financialRepository.ListBatchesAsync(clinicId, professionalId, cancellationToken);
        return batches.Select(MapBatchToDto).ToList();
    }

    public async Task<FinancialTransactionDto> CreateTransactionAsync(
        CreateTransactionRequest request,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var tx = FinancialTransaction.Create(
                request.ClinicId,
                request.Type,
                request.Category,
                request.Description,
                request.Amount,
                request.DueDate,
                request.CompetenceDate,
                request.Status,
                null,
                now);

            await _financialRepository.AddTransactionAsync(tx, ct);
            _auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name ?? "Gestor",
                "FinancialTransactionCreated",
                "FinancialTransaction",
                tx.Id.ToString(),
                now,
                $"{{\"type\":\"{tx.Type}\",\"amount\":{tx.Amount}}}"));

            return MapTransactionToDto(tx);
        }, cancellationToken);
    }

    public async Task<FinancialSummaryDto> GetFinancialSummaryAsync(
        Guid clinicId,
        DateTimeOffset from,
        DateTimeOffset to,
        CancellationToken cancellationToken = default)
    {
        var transactions = await _financialRepository.ListTransactionsAsync(clinicId, from, to, cancellationToken);

        var totalRev = transactions.Where(t => t.Type == "receita" && t.Status == "pago").Sum(t => t.Amount);
        var totalExp = transactions.Where(t => t.Type == "despesa" && t.Status == "pago").Sum(t => t.Amount);
        var totalPayouts = transactions.Where(t => t.Type == "repasse" && t.Status == "pago").Sum(t => t.Amount);
        var net = totalRev - totalExp - totalPayouts;

        return new FinancialSummaryDto(
            clinicId,
            from,
            to,
            totalRev,
            totalExp,
            totalPayouts,
            net,
            transactions.Select(MapTransactionToDto).ToList());
    }

    private static PayoutBatchDto MapBatchToDto(MedicalPayoutBatch b) =>
        new(
            b.Id,
            b.ClinicId,
            b.ProfessionalId,
            b.PeriodStart,
            b.PeriodEnd,
            b.Status,
            b.TotalGross,
            b.TotalClinicRetained,
            b.TotalPayoutAmount,
            b.SettledAt,
            b.SettlementNotes,
            b.ReceiptReference,
            b.Items.Select(i => new PayoutItemDto(
                i.Id,
                i.AppointmentId,
                i.PatientName,
                i.ConsultationDate,
                i.GrossAmount,
                i.ClinicRetainedAmount,
                i.PayoutAmount)).ToList());

    private static FinancialTransactionDto MapTransactionToDto(FinancialTransaction t) =>
        new(
            t.Id,
            t.ClinicId,
            t.Type,
            t.Category,
            t.Description,
            t.Amount,
            t.DueDate,
            t.CompetenceDate,
            t.Status,
            t.PaidAt);
}
