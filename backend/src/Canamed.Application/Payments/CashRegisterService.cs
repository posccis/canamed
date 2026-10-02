using System.Text.Json;
using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Auditing;
using Canamed.Domain.Payments;

namespace Canamed.Application.Payments;

public sealed class CashRegisterService(
    ICashRegisterRepository cashRegisterRepository,
    IPaymentRepository paymentRepository,
    IIdentityRepository identityRepository,
    ICurrentActorAccessor actorAccessor,
    IAuditRepository auditRepository,
    TimeProvider timeProvider)
{
    private static Guid ResolveOperatorId(CurrentActor actor)
    {
        if (Guid.TryParse(actor.UserId, out var id) && id != Guid.Empty)
        {
            return id;
        }

        if (string.IsNullOrWhiteSpace(actor.UserId))
        {
            return Guid.Empty;
        }

        var hash = System.Security.Cryptography.MD5.HashData(System.Text.Encoding.UTF8.GetBytes(actor.UserId));
        return new Guid(hash);
    }

    public async Task<CashRegisterShiftResponse> OpenShiftAsync(
        OpenCashRegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        actor.EnsurePermission(Permissions.CashierOperate);

        var operatorId = ResolveOperatorId(actor);
        var active = await cashRegisterRepository
            .GetActiveShiftAsync(actor.ClinicId, operatorId, cancellationToken)
            .ConfigureAwait(false);

        if (active is not null)
        {
            throw new CanamedException(
                ProblemKind.Conflict,
                "Caixa já aberto",
                "Já existe um caixa aberto para seu usuário nesta clínica.",
                "cash-register-already-open");
        }

        var shift = CashRegisterShift.Open(
            actor.ClinicId,
            operatorId,
            request.InitialCash,
            timeProvider.GetUtcNow());

        await cashRegisterRepository.AddShiftAsync(shift, cancellationToken).ConfigureAwait(false);

        auditRepository.Add(AuditEvent.Record(
            actor.ClinicId,
            actor.UserId,
            actor.Name,
            AuditActions.CashRegisterOpened,
            AuditResources.CashRegister,
            shift.Id.ToString(),
            timeProvider.GetUtcNow(),
            JsonSerializer.Serialize(new
            {
                initialCash = shift.InitialCash,
                openedAt = shift.OpenedAt
            })));

        await cashRegisterRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return MapShift(shift, actor.Name, []);
    }

    public async Task<CashMovementResponse> RegisterMovementAsync(
        RegisterCashMovementRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        actor.EnsurePermission(Permissions.CashierOperate);

        var operatorId = ResolveOperatorId(actor);
        var shift = await cashRegisterRepository
            .GetActiveShiftAsync(actor.ClinicId, operatorId, cancellationToken)
            .ConfigureAwait(false);

        if (shift is null)
        {
            throw new CanamedException(
                ProblemKind.Conflict,
                "Nenhum caixa aberto",
                "Você precisa abrir o caixa antes de registrar sangrias ou suprimentos.",
                "no-active-cash-register");
        }

        var movements = await cashRegisterRepository
            .ListMovementsByShiftAsync(shift.Id, actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        var payments = await paymentRepository
            .ListByDateAsync(DateOnly.FromDateTime(timeProvider.GetUtcNow().Date), actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        var operatorPayments = payments
            .Where(p => p.OperatorId == operatorId && p.PaidAt >= shift.OpenedAt)
            .ToList();

        var totalCashReceived = operatorPayments
            .Where(p => p.Method == PaymentMethods.Cash && p.Status == PaymentStatuses.Paid)
            .Sum(p => p.Amount);

        var totalSupplies = movements
            .Where(m => m.Type == CashMovementTypes.Supply)
            .Sum(m => m.Amount);

        var totalWithdrawals = movements
            .Where(m => m.Type == CashMovementTypes.Withdrawal)
            .Sum(m => m.Amount);

        var currentCash = shift.InitialCash + totalCashReceived + totalSupplies - totalWithdrawals;

        if (request.Type.Equals(CashMovementTypes.Withdrawal, StringComparison.OrdinalIgnoreCase) && request.Amount > currentCash)
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Saldo insuficiente para sangria",
                $"O valor solicitado de R$ {request.Amount:N2} excede o saldo físico atual de R$ {currentCash:N2} em caixa.",
                "insufficient-cash-for-withdrawal");
        }

        var movement = CashMovement.Create(
            actor.ClinicId,
            shift.Id,
            operatorId,
            request.Type,
            request.Amount,
            request.Reason,
            timeProvider.GetUtcNow());

        await cashRegisterRepository.AddMovementAsync(movement, cancellationToken).ConfigureAwait(false);

        auditRepository.Add(AuditEvent.Record(
            actor.ClinicId,
            actor.UserId,
            actor.Name,
            AuditActions.CashMovementRegistered,
            AuditResources.CashRegister,
            movement.Id.ToString(),
            timeProvider.GetUtcNow(),
            JsonSerializer.Serialize(new
            {
                type = movement.Type,
                amount = movement.Amount,
                reason = movement.Reason,
                shiftId = shift.Id
            })));

        await cashRegisterRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return new CashMovementResponse(
            movement.Id,
            movement.CashRegisterShiftId,
            movement.OperatorId,
            movement.Type,
            movement.Amount,
            movement.Reason,
            movement.CreatedAt);
    }

    public async Task<CashRegisterCurrentStatusResponse> GetCurrentStatusAsync(
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        actor.EnsurePermission(Permissions.CashierOperate);

        var operatorId = ResolveOperatorId(actor);
        var shift = await cashRegisterRepository
            .GetActiveShiftAsync(actor.ClinicId, operatorId, cancellationToken)
            .ConfigureAwait(false);

        if (shift is null)
        {
            return new CashRegisterCurrentStatusResponse(
                IsOpen: false,
                Shift: null,
                TotalCashPayments: 0,
                TotalPixPayments: 0,
                TotalDebitCardPayments: 0,
                TotalCreditCardPayments: 0,
                TotalHealthPlanPayments: 0,
                TotalSupplies: 0,
                TotalWithdrawals: 0,
                CurrentCashInDrawer: 0);
        }

        var movements = await cashRegisterRepository
            .ListMovementsByShiftAsync(shift.Id, actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        var payments = await paymentRepository
            .ListByDateAsync(DateOnly.FromDateTime(timeProvider.GetUtcNow().Date), actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        var operatorPayments = payments
            .Where(p => p.OperatorId == operatorId && p.PaidAt >= shift.OpenedAt)
            .ToList();

        var totalCash = operatorPayments.Where(p => p.Method == PaymentMethods.Cash && p.Status == PaymentStatuses.Paid).Sum(p => p.Amount);
        var totalPix = operatorPayments.Where(p => p.Method == PaymentMethods.Pix && p.Status == PaymentStatuses.Paid).Sum(p => p.Amount);
        var totalDebit = operatorPayments.Where(p => p.Method == PaymentMethods.DebitCard && p.Status == PaymentStatuses.Paid).Sum(p => p.Amount);
        var totalCredit = operatorPayments.Where(p => p.Method == PaymentMethods.CreditCard && p.Status == PaymentStatuses.Paid).Sum(p => p.Amount);
        var totalPlan = operatorPayments.Where(p => p.Method == PaymentMethods.HealthPlanBilled && p.Status == PaymentStatuses.Paid).Sum(p => p.Amount);

        var supplies = movements.Where(m => m.Type == CashMovementTypes.Supply).Sum(m => m.Amount);
        var withdrawals = movements.Where(m => m.Type == CashMovementTypes.Withdrawal).Sum(m => m.Amount);

        var cashInDrawer = shift.InitialCash + totalCash + supplies - withdrawals;

        return new CashRegisterCurrentStatusResponse(
            IsOpen: true,
            Shift: MapShift(shift, actor.Name, movements),
            TotalCashPayments: totalCash,
            TotalPixPayments: totalPix,
            TotalDebitCardPayments: totalDebit,
            TotalCreditCardPayments: totalCredit,
            TotalHealthPlanPayments: totalPlan,
            TotalSupplies: supplies,
            TotalWithdrawals: withdrawals,
            CurrentCashInDrawer: cashInDrawer);
    }

    public async Task<CashRegisterShiftResponse> CloseShiftAsync(
        CloseCashRegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        actor.EnsurePermission(Permissions.CashierOperate);

        var operatorId = ResolveOperatorId(actor);
        var shift = await cashRegisterRepository
            .GetActiveShiftAsync(actor.ClinicId, operatorId, cancellationToken)
            .ConfigureAwait(false);

        if (shift is null)
        {
            throw new CanamedException(
                ProblemKind.Conflict,
                "Nenhum caixa aberto",
                "Não há nenhum caixa aberto para fechamento.",
                "no-active-cash-register");
        }

        var movements = await cashRegisterRepository
            .ListMovementsByShiftAsync(shift.Id, actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        var payments = await paymentRepository
            .ListByDateAsync(DateOnly.FromDateTime(timeProvider.GetUtcNow().Date), actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        var operatorPayments = payments
            .Where(p => p.OperatorId == operatorId && p.PaidAt >= shift.OpenedAt)
            .ToList();

        var totalCash = operatorPayments.Where(p => p.Method == PaymentMethods.Cash && p.Status == PaymentStatuses.Paid).Sum(p => p.Amount);
        var supplies = movements.Where(m => m.Type == CashMovementTypes.Supply).Sum(m => m.Amount);
        var withdrawals = movements.Where(m => m.Type == CashMovementTypes.Withdrawal).Sum(m => m.Amount);

        var expectedCash = shift.InitialCash + totalCash + supplies - withdrawals;

        shift.Close(request.DeclaredCash, expectedCash, request.Notes, timeProvider.GetUtcNow());
        await cashRegisterRepository.UpdateShiftAsync(shift, cancellationToken).ConfigureAwait(false);

        auditRepository.Add(AuditEvent.Record(
            actor.ClinicId,
            actor.UserId,
            actor.Name,
            AuditActions.CashRegisterClosed,
            AuditResources.CashRegister,
            shift.Id.ToString(),
            timeProvider.GetUtcNow(),
            JsonSerializer.Serialize(new
            {
                declaredCash = shift.DeclaredCash,
                expectedCash = shift.ExpectedCash,
                cashDifference = shift.CashDifference,
                closedAt = shift.ClosedAt
            })));

        await cashRegisterRepository.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return MapShift(shift, actor.Name, movements);
    }

    public async Task<IReadOnlyList<CashRegisterShiftResponse>> ListHistoryAsync(
        DateOnly? date = null,
        CancellationToken cancellationToken = default)
    {
        var actor = actorAccessor.RequireActor();
        actor.EnsurePermission(Permissions.PaymentsRead);

        var shifts = await cashRegisterRepository
            .ListShiftsAsync(actor.ClinicId, date, cancellationToken)
            .ConfigureAwait(false);

        var result = new List<CashRegisterShiftResponse>(shifts.Count);
        foreach (var s in shifts)
        {
            var user = await identityRepository.FindUserByIdAsync(s.OperatorId, cancellationToken).ConfigureAwait(false);
            var movements = await cashRegisterRepository
                .ListMovementsByShiftAsync(s.Id, actor.ClinicId, cancellationToken)
                .ConfigureAwait(false);

            result.Add(MapShift(s, user?.Name ?? "Operador", movements));
        }

        return result;
    }

    private static CashRegisterShiftResponse MapShift(
        CashRegisterShift shift,
        string operatorName,
        IReadOnlyList<CashMovement> movements)
    {
        return new CashRegisterShiftResponse(
            shift.Id,
            shift.ClinicId,
            shift.OperatorId,
            operatorName,
            shift.Status,
            shift.InitialCash,
            shift.OpenedAt,
            shift.ClosedAt,
            shift.DeclaredCash,
            shift.ExpectedCash,
            shift.CashDifference,
            shift.Notes,
            movements.Select(m => new CashMovementResponse(
                m.Id,
                m.CashRegisterShiftId,
                m.OperatorId,
                m.Type,
                m.Amount,
                m.Reason,
                m.CreatedAt)).ToList());
    }
}
