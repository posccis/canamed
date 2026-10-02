import { useState, type FormEvent } from 'react';
import {
  recordPayment,
  type PaymentMethod,
  type PaymentTransactionResponse
} from './paymentsApi';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientName: string;
  appointmentTypeName?: string;
  defaultAmount?: number;
  onSuccess: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  appointmentId,
  patientName,
  appointmentTypeName,
  defaultAmount = 200,
  onSuccess
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [amount, setAmount] = useState<string>(String(defaultAmount));
  const [cardBrand, setCardBrand] = useState('');
  const [cardLastFour, setCardLastFour] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedTx, setCompletedTx] = useState<PaymentTransactionResponse | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || (method !== 'convenio_faturado' && parsedAmount <= 0)) {
      setError('Informe um valor de pagamento válido maior que zero.');
      setLoading(false);
      return;
    }

    try {
      const res = await recordPayment({
        appointmentId,
        amount: parsedAmount,
        paymentMethod: method,
        cardBrand: method === 'cartao_debito' || method === 'cartao_credito' ? cardBrand || undefined : undefined,
        cardLastFourDigits: method === 'cartao_debito' || method === 'cartao_credito' ? cardLastFour || undefined : undefined,
        notes: notes.trim() || undefined
      });

      setCompletedTx(res);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao registrar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Registrar pagamento no balcão"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(26, 32, 44, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '32rem',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-surface)'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--color-text)' }}>
              {completedTx ? 'Comprovante de Pagamento' : 'Registrar Pagamento no Balcão'}
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              Paciente: <b>{patientName}</b> {appointmentTypeName ? `— ${appointmentTypeName}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: 'var(--color-muted)'
            }}
          >
            &times;
          </button>
        </div>

        {completedTx ? (
          <div style={{ padding: '1.5rem' }}>
            <div
              style={{
                backgroundColor: 'var(--color-accent-subtle)',
                border: '1px solid var(--color-accent)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>✓</div>
              <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)', fontSize: '1.1rem' }}>
                Pagamento Registrado com Sucesso!
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-primary-dark)' }}>
                Status do agendamento atualizado para <b>Pago</b>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ color: 'var(--color-muted)' }}>Valor Pago:</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)' }}>
                  R$ {completedTx.amount.toFixed(2).replace('.', ',')}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-muted)' }}>Forma de Pagamento:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-text)', textTransform: 'capitalize' }}>
                  {completedTx.paymentMethod.replace('_', ' ')}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-muted)' }}>Data e Horário:</span>
                <div style={{ color: 'var(--color-text)' }}>
                  {new Date(completedTx.paidAt).toLocaleString('pt-BR')}
                </div>
              </div>
              {completedTx.cardLastFourDigits && (
                <div>
                  <span style={{ color: 'var(--color-muted)' }}>Cartão:</span>
                  <div style={{ color: 'var(--color-text)' }}>
                    {completedTx.cardBrand || 'Cartão'} final {completedTx.cardLastFourDigits}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="button button--secondary"
                onClick={handlePrint}
                style={{ padding: '0.625rem 1rem' }}
              >
                🖨 Imprimir Recibo
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={onClose}
                style={{ padding: '0.625rem 1.25rem' }}
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
            {error && (
              <div
                style={{
                  backgroundColor: '#FFF5F5',
                  border: '1px solid var(--color-danger)',
                  color: 'var(--color-danger)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem'
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Forma de Pagamento *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {[
                  { value: 'pix', label: 'PIX' },
                  { value: 'dinheiro', label: 'Dinheiro' },
                  { value: 'cartao_debito', label: 'Cartão Débito' },
                  { value: 'cartao_credito', label: 'Cartão Crédito' },
                  { value: 'convenio_faturado', label: 'Convênio / Faturado' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setMethod(item.value as PaymentMethod);
                      if (item.value === 'convenio_faturado') {
                        setAmount('0.00');
                      } else if (amount === '0.00') {
                        setAmount(String(defaultAmount));
                      }
                    }}
                    style={{
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: method === item.value ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: method === item.value ? 'var(--color-accent-subtle)' : '#FFFFFF',
                      color: method === item.value ? 'var(--color-primary-dark)' : 'var(--color-text)'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Valor Cobrado (R$) *
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              />
            </div>

            {(method === 'cartao_debito' || method === 'cartao_credito') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                    Bandeira (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Visa, Master"
                    value={cardBrand}
                    onChange={(e) => setCardBrand(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                    Últimos 4 Dígitos
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Ex: 1234"
                    value={cardLastFour}
                    onChange={(e) => setCardLastFour(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Observações do Balcão
              </label>
              <input
                type="text"
                placeholder="Ex: Comprovante de autorização ou recibo manual nº..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="button button--secondary"
                onClick={onClose}
                disabled={loading}
                style={{ padding: '0.625rem 1rem' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="button button--primary"
                disabled={loading}
                style={{ padding: '0.625rem 1.25rem' }}
              >
                {loading ? 'Confirmando...' : 'Confirmar Recebimento'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
