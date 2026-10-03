using Canamed.Domain.Common;

namespace Canamed.Domain.CashRegister;

/// <summary>
/// Representa a sessão de turno de caixa de um operador no balcão (SPEC-0019).
/// </summary>
public sealed class CashSession : Entity
{
    private readonly List<CashMovement> _movements = [];

    private CashSession()
    {
    }

    public Guid ClinicId { get; private set; }
    public Guid OperatorUserId { get; private set; }
    public string OperatorName { get; private set; } = string.Empty;
    public DateTimeOffset OpenedAt { get; private set; }
    public DateTimeOffset? ClosedAt { get; private set; }
    public string Status { get; private set; } = "aberta"; // aberta, fechada

    /// <summary>Fundo de troco inicial fornecido na abertura.</summary>
    public decimal InitialFloat { get; private set; }

    // Totais esperados apurados pelo sistema
    public decimal TotalCashExpected { get; private set; }
    public decimal TotalPixExpected { get; private set; }
    public decimal TotalDebitExpected { get; private set; }
    public decimal TotalCreditExpected { get; private set; }

    // Totais declarados pelo operador no fechamento
    public decimal TotalCashDeclared { get; private set; }
    public decimal TotalPixDeclared { get; private set; }
    public decimal TotalDebitDeclared { get; private set; }
    public decimal TotalCreditDeclared { get; private set; }

    /// <summary>Diferença apurada em dinheiro (Declarado - Esperado). Negativo = Quebra / Positivo = Sobra.</summary>
    public decimal CashDifference { get; private set; }

    public string? ClosingNotes { get; private set; }

    public IReadOnlyCollection<CashMovement> Movements => _movements.AsReadOnly();

    public static CashSession Open(
        Guid clinicId,
        Guid operatorUserId,
        string operatorName,
        decimal initialFloat,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty) throw new ArgumentException("Clínica obrigatória.", nameof(clinicId));
        if (operatorUserId == Guid.Empty) throw new ArgumentException("Operador obrigatório.", nameof(operatorUserId));
        if (string.IsNullOrWhiteSpace(operatorName)) throw new ArgumentException("Nome do operador obrigatório.", nameof(operatorName));
        if (initialFloat < 0) throw new ArgumentOutOfRangeException(nameof(initialFloat), "Fundo inicial não pode ser negativo.");

        var session = new CashSession
        {
            ClinicId = clinicId,
            OperatorUserId = operatorUserId,
            OperatorName = operatorName.Trim(),
            OpenedAt = now,
            InitialFloat = initialFloat,
            TotalCashExpected = initialFloat,
            Status = "aberta"
        };
        session.MarkCreated(now);

        if (initialFloat > 0)
        {
            session._movements.Add(CashMovement.Create(
                session.Id,
                clinicId,
                "suprimento",
                initialFloat,
                "Fundo de troco inicial",
                operatorUserId,
                now));
        }

        return session;
    }

    /// <summary>Registra recebimento de pagamento de balcão nesta sessão de caixa.</summary>
    public void RegisterPaymentReceived(string method, decimal amount, DateTimeOffset now)
    {
        EnsureOpen();
        if (amount <= 0) return;

        switch (method.ToLowerInvariant())
        {
            case "dinheiro":
                TotalCashExpected += amount;
                break;
            case "pix":
                TotalPixExpected += amount;
                break;
            case "cartao_debito":
            case "debito":
                TotalDebitExpected += amount;
                break;
            case "cartao_credito":
            case "credito":
                TotalCreditExpected += amount;
                break;
        }

        MarkUpdated(now);
    }

    /// <summary>Registra sangria (retirada de dinheiro da gaveta).</summary>
    public CashMovement RegisterSangria(decimal amount, string reason, Guid performedByUserId, DateTimeOffset now)
    {
        EnsureOpen();
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount), "Valor da sangria deve ser positivo.");
        if (amount > TotalCashExpected) throw new InvalidOperationException("Valor da sangria excede o saldo em dinheiro disponível no caixa.");
        if (string.IsNullOrWhiteSpace(reason)) throw new ArgumentException("Motivo da sangria obrigatório.", nameof(reason));

        TotalCashExpected -= amount;
        var movement = CashMovement.Create(Id, ClinicId, "sangria", amount, reason.Trim(), performedByUserId, now);
        _movements.Add(movement);
        MarkUpdated(now);
        return movement;
    }

    /// <summary>Registra suprimento adicional durante o expediente.</summary>
    public CashMovement RegisterSuprimento(decimal amount, string reason, Guid performedByUserId, DateTimeOffset now)
    {
        EnsureOpen();
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount), "Valor de suprimento deve ser positivo.");

        TotalCashExpected += amount;
        var movement = CashMovement.Create(Id, ClinicId, "suprimento", amount, reason.Trim(), performedByUserId, now);
        _movements.Add(movement);
        MarkUpdated(now);
        return movement;
    }

    /// <summary>Efetua o fechamento da sessão com conferência cega/assistida.</summary>
    public void Close(
        decimal cashDeclared,
        decimal pixDeclared,
        decimal debitDeclared,
        decimal creditDeclared,
        string? notes,
        DateTimeOffset now)
    {
        EnsureOpen();

        TotalCashDeclared = cashDeclared;
        TotalPixDeclared = pixDeclared;
        TotalDebitDeclared = debitDeclared;
        TotalCreditDeclared = creditDeclared;

        CashDifference = cashDeclared - TotalCashExpected;
        ClosingNotes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
        ClosedAt = now;
        Status = "fechada";

        MarkUpdated(now);
    }

    private void EnsureOpen()
    {
        if (Status != "aberta")
        {
            throw new InvalidOperationException("Esta sessão de caixa já está fechada e não aceita mais movimentações.");
        }
    }
}
