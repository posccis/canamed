using System.Text.Json;
using Canamed.Application.Abstractions;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Auditing;
using Canamed.Domain.CashRegister;

namespace Canamed.Application.CashRegister;

public sealed class CashRegisterService
{
    private readonly ICashSessionRepository _repository;
    private readonly IAuditRepository _auditRepository;
    private readonly ICurrentActorAccessor _actorAccessor;
    private readonly TimeProvider _timeProvider;
    private readonly IUnitOfWork _unitOfWork;

    public CashRegisterService(
        ICashSessionRepository repository,
        IAuditRepository auditRepository,
        ICurrentActorAccessor actorAccessor,
        TimeProvider timeProvider,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _auditRepository = auditRepository;
        _actorAccessor = actorAccessor;
        _timeProvider = timeProvider;
        _unitOfWork = unitOfWork;
    }

    public async Task<CashSessionDto> OpenSessionAsync(
        OpenCashSessionRequest request,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            if (!Guid.TryParse(actor.UserId, out var operatorUserId) || operatorUserId == Guid.Empty)
            {
                operatorUserId = Guid.NewGuid();
            }

            var existing = await _repository.GetActiveByOperatorAsync(request.ClinicId, operatorUserId, ct);
            if (existing is not null)
            {
                throw new CanamedException(
                    ProblemKind.Conflict,
                    "Conflito de caixa",
                    "Já existe uma sessão de caixa aberta para este operador nesta clínica.",
                    "CASH_SESSION_ALREADY_OPEN");
            }

            var session = CashSession.Open(
                request.ClinicId,
                operatorUserId,
                actor.Name ?? "Operador",
                request.InitialFloat,
                now);

            await _repository.AddAsync(session, ct);
            _auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name ?? "Operador",
                "CashSessionOpened",
                "CashSession",
                session.Id.ToString(),
                now,
                JsonSerializer.Serialize(new { initialFloat = session.InitialFloat })));

            return MapToDto(session);
        }, cancellationToken);
    }

    public async Task<CashSessionDto?> GetActiveSessionAsync(
        Guid clinicId,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        if (!Guid.TryParse(actor.UserId, out var operatorUserId) || operatorUserId == Guid.Empty)
        {
            return null;
        }

        var session = await _repository.GetActiveByOperatorAsync(clinicId, operatorUserId, cancellationToken);
        return session is null ? null : MapToDto(session);
    }

    public async Task<CashSessionDto> RegisterSangriaAsync(
        Guid sessionId,
        Guid clinicId,
        CashSangriaRequest request,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var session = await _repository.GetByIdAsync(sessionId, clinicId, ct)
                ?? throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Sessão de caixa não encontrada.", "CASH_SESSION_NOT_FOUND");

            if (!Guid.TryParse(actor.UserId, out var userId) || userId == Guid.Empty)
            {
                userId = Guid.NewGuid();
            }

            try
            {
                session.RegisterSangria(request.Amount, request.Reason, userId, now);
            }
            catch (InvalidOperationException ex)
            {
                throw new CanamedException(ProblemKind.Validation, "Validação de caixa", ex.Message, "CASH_SANGRIA_EXCEEDS_BALANCE");
            }
            catch (ArgumentException ex)
            {
                throw new CanamedException(ProblemKind.Validation, "Validação de caixa", ex.Message, "CASH_SANGRIA_INVALID");
            }

            await _repository.UpdateAsync(session, ct);
            _auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name ?? "Operador",
                "CashSangriaRegistered",
                "CashSession",
                session.Id.ToString(),
                now,
                JsonSerializer.Serialize(new { amount = request.Amount, reason = request.Reason })));

            return MapToDto(session);
        }, cancellationToken);
    }

    public async Task<CashSessionDto> RegisterSuprimentoAsync(
        Guid sessionId,
        Guid clinicId,
        CashSuprimentoRequest request,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var session = await _repository.GetByIdAsync(sessionId, clinicId, ct)
                ?? throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Sessão de caixa não encontrada.", "CASH_SESSION_NOT_FOUND");

            if (!Guid.TryParse(actor.UserId, out var userId) || userId == Guid.Empty)
            {
                userId = Guid.NewGuid();
            }

            try
            {
                session.RegisterSuprimento(request.Amount, request.Reason, userId, now);
            }
            catch (ArgumentException ex)
            {
                throw new CanamedException(ProblemKind.Validation, "Validação de caixa", ex.Message, "CASH_SUPRIMENTO_INVALID");
            }

            await _repository.UpdateAsync(session, ct);
            _auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name ?? "Operador",
                "CashSuprimentoRegistered",
                "CashSession",
                session.Id.ToString(),
                now,
                JsonSerializer.Serialize(new { amount = request.Amount, reason = request.Reason })));

            return MapToDto(session);
        }, cancellationToken);
    }

    public async Task<CashSessionDto> CloseSessionAsync(
        Guid sessionId,
        Guid clinicId,
        CloseCashSessionRequest request,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var session = await _repository.GetByIdAsync(sessionId, clinicId, ct)
                ?? throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Sessão de caixa não encontrada.", "CASH_SESSION_NOT_FOUND");

            try
            {
                session.Close(
                    request.CashDeclared,
                    request.PixDeclared,
                    request.DebitDeclared,
                    request.CreditDeclared,
                    request.Notes,
                    now);
            }
            catch (InvalidOperationException ex)
            {
                throw new CanamedException(ProblemKind.Validation, "Validação de caixa", ex.Message, "CASH_SESSION_CLOSE_INVALID");
            }

            await _repository.UpdateAsync(session, ct);
            _auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name ?? "Operador",
                "CashSessionClosed",
                "CashSession",
                session.Id.ToString(),
                now,
                JsonSerializer.Serialize(new { cashDeclared = request.CashDeclared, difference = session.CashDifference })));

            return MapToDto(session);
        }, cancellationToken);
    }

    public async Task<IReadOnlyList<CashSessionDto>> ListSessionsAsync(
        Guid clinicId,
        DateTimeOffset? from = null,
        DateTimeOffset? to = null,
        CancellationToken cancellationToken = default)
    {
        var sessions = await _repository.ListAsync(clinicId, from, to, cancellationToken);
        return sessions.Select(MapToDto).ToList();
    }

    private static CashSessionDto MapToDto(CashSession s) =>
        new(
            s.Id,
            s.ClinicId,
            s.OperatorUserId,
            s.OperatorName,
            s.OpenedAt,
            s.ClosedAt,
            s.Status,
            s.InitialFloat,
            s.TotalCashExpected,
            s.TotalPixExpected,
            s.TotalDebitExpected,
            s.TotalCreditExpected,
            s.TotalCashDeclared,
            s.TotalPixDeclared,
            s.TotalDebitDeclared,
            s.TotalCreditDeclared,
            s.CashDifference,
            s.ClosingNotes,
            s.Movements.Select(m => new CashMovementDto(
                m.Id,
                m.MovementType,
                m.Amount,
                m.Reason,
                m.PerformedByUserId,
                m.CreatedAt)).ToList());
}
