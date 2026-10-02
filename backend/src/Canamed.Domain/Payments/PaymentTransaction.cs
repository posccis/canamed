using Canamed.Domain.Common;

namespace Canamed.Domain.Payments;

public static class PaymentMethods
{
    public const string Cash = "dinheiro";
    public const string Pix = "pix";
    public const string DebitCard = "cartao_debito";
    public const string CreditCard = "cartao_credito";
    public const string HealthPlanBilled = "convenio_faturado";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Cash,
        Pix,
        DebitCard,
        CreditCard,
        HealthPlanBilled
    };
}

public static class PaymentStatuses
{
    public const string Pending = "pendente";
    public const string Paid = "pago";
    public const string Exempt = "isento";
    public const string Refunded = "estornado";
}

public sealed class PaymentTransaction : Entity
{
    private PaymentTransaction()
    {
    }

    public Guid ClinicId { get; private set; }

    public Guid AppointmentId { get; private set; }

    public Guid PatientId { get; private set; }

    public decimal Amount { get; private set; }

    public string Method { get; private set; } = string.Empty;

    public string Status { get; private set; } = PaymentStatuses.Paid;

    public string? CardBrand { get; private set; }

    public string? CardLastFourDigits { get; private set; }

    public DateTimeOffset PaidAt { get; private set; }

    public Guid OperatorId { get; private set; }

    public string? Notes { get; private set; }

    public DateTimeOffset? RefundedAt { get; private set; }

    public string? RefundReason { get; private set; }

    public Guid? RefundedBy { get; private set; }

    public static PaymentTransaction Record(
        Guid clinicId,
        Guid appointmentId,
        Guid patientId,
        decimal amount,
        string method,
        Guid operatorId,
        DateTimeOffset now,
        string? cardBrand = null,
        string? cardLastFourDigits = null,
        string? notes = null)
    {
        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("A clínica é obrigatória.", nameof(clinicId));
        }

        if (appointmentId == Guid.Empty)
        {
            throw new ArgumentException("O agendamento é obrigatório.", nameof(appointmentId));
        }

        if (patientId == Guid.Empty)
        {
            throw new ArgumentException("O paciente é obrigatório.", nameof(patientId));
        }

        if (operatorId == Guid.Empty)
        {
            throw new ArgumentException("O operador é obrigatório.", nameof(operatorId));
        }

        var normalizedMethod = method?.Trim().ToLowerInvariant() ?? string.Empty;
        if (!PaymentMethods.All.Contains(normalizedMethod))
        {
            throw new ArgumentException($"Meio de pagamento inválido: '{method}'.", nameof(method));
        }

        if (normalizedMethod == PaymentMethods.HealthPlanBilled)
        {
            if (amount < 0)
            {
                throw new ArgumentException("O valor para faturamento de convênio não pode ser negativo.", nameof(amount));
            }
        }
        else
        {
            if (amount <= 0)
            {
                throw new ArgumentException("O valor do pagamento deve ser maior que zero.", nameof(amount));
            }
        }

        string? cleanLastFour = null;
        if (!string.IsNullOrWhiteSpace(cardLastFourDigits))
        {
            var digitsOnly = new string(cardLastFourDigits.Where(char.IsDigit).ToArray());
            cleanLastFour = digitsOnly.Length > 4 ? digitsOnly[^4..] : digitsOnly;
        }

        var transaction = new PaymentTransaction
        {
            ClinicId = clinicId,
            AppointmentId = appointmentId,
            PatientId = patientId,
            Amount = decimal.Round(amount, 2),
            Method = normalizedMethod,
            Status = PaymentStatuses.Paid,
            CardBrand = string.IsNullOrWhiteSpace(cardBrand) ? null : cardBrand.Trim(),
            CardLastFourDigits = cleanLastFour,
            PaidAt = now.ToUniversalTime(),
            OperatorId = operatorId,
            Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim()
        };

        transaction.MarkCreated(now);
        return transaction;
    }

    public void Refund(Guid refundedBy, string reason, DateTimeOffset now)
    {
        if (Status == PaymentStatuses.Refunded)
        {
            throw new InvalidOperationException("Este pagamento já foi estornado.");
        }

        if (refundedBy == Guid.Empty)
        {
            throw new ArgumentException("O responsável pelo estorno é obrigatório.", nameof(refundedBy));
        }

        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 5)
        {
            throw new ArgumentException("A justificativa do estorno deve conter ao menos 5 caracteres.", nameof(reason));
        }

        Status = PaymentStatuses.Refunded;
        RefundedBy = refundedBy;
        RefundReason = reason.Trim();
        RefundedAt = now.ToUniversalTime();
        MarkUpdated(now);
    }
}
