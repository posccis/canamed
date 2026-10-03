import { useState, useEffect, useCallback } from 'react';
import {
  type OverbookingCheckResult,
  getClinicPolicy,
  updateClinicPolicy,
  checkOverbookingQuota,
} from './adminApi';
import { fetchUsers, type ManagedUser } from '../auth/authApi';
import { useSession } from '../auth/useSession';
import { useToast } from '../layout/Toast';

export function ClinicPolicyPanel() {
  const { state: authState } = useSession();
  const { showSuccess, showError } = useToast();
  const clinicId = authState.status === 'authenticated' ? authState.session.clinicId : '';

  const [loading, setLoading] = useState(true);
  const [maxOverbooking, setMaxOverbooking] = useState('2');
  const [onlineBookingNotice, setOnlineBookingNotice] = useState('2');
  const [cancellationNotice, setCancellationNotice] = useState('4');
  const [saving, setSaving] = useState(false);

  // Simulador de Encaixe
  const [professionals, setProfessionals] = useState<ManagedUser[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [simDate, setSimDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [simResult, setSimResult] = useState<OverbookingCheckResult | null>(null);
  const [testing, setTesting] = useState(false);

  const loadData = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const [policy, users] = await Promise.all([
        getClinicPolicy(clinicId),
        fetchUsers(),
      ]);
      setMaxOverbooking(policy.maxDailyOverbookingPerDoctor.toString());
      setOnlineBookingNotice(policy.minHoursNoticeForOnlineBooking.toString());
      setCancellationNotice(policy.minHoursNoticeForFreeCancellation.toString());

      const docs = users.filter((u) => u.role === 'profissional' && u.isActive);
      setProfessionals(docs);
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0].id);
      }
    } catch {
      showError('Falha ao carregar políticas operacionais da clínica.');
    } finally {
      setLoading(false);
    }
  }, [clinicId, selectedDocId, showError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSavePolicy(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicId) return;
    setSaving(true);
    try {
      await updateClinicPolicy(clinicId, {
        maxDailyOverbookingPerDoctor: parseInt(maxOverbooking, 10) || 0,
        minHoursNoticeForOnlineBooking: parseInt(onlineBookingNotice, 10) || 0,
        minHoursNoticeForFreeCancellation: parseInt(cancellationNotice, 10) || 0,
      });
      showSuccess('Políticas da clínica atualizadas com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar políticas.';
      showError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestQuota() {
    if (!clinicId || !selectedDocId) return;
    setTesting(true);
    try {
      const res = await checkOverbookingQuota(
        clinicId,
        selectedDocId,
        new Date(`${simDate}T12:00:00Z`).toISOString()
      );
      setSimResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao verificar cota de encaixe.';
      showError(msg);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="clinic-policy-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Políticas de Agendamento & Encaixes</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
            Regras de overbooking, limites de encaixe diário e prazos de cancelamento (SPEC-0025).
          </p>
        </div>
      </div>

      {loading ? (
        <p>Carregando parâmetros de política...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* Configuração das Políticas */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Parâmetros da Clínica</h3>

            <form onSubmit={handleSavePolicy} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label htmlFor="maxOverbookingInput" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Cota Máxima de Encaixes por Médico / Dia *
                </label>
                <input
                  id="maxOverbookingInput"
                  type="number"
                  min="0"
                  max="50"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={maxOverbooking}
                  onChange={(e) => setMaxOverbooking(e.target.value)}
                  required
                />
                <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Limite seguro de pacientes extras para evitar sobrecarga de consultas e atrasos crônicos na recepção.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="onlineNoticeInput" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Antecedência Mínima para Agendamento Online (Horas) *
                </label>
                <input
                  id="onlineNoticeInput"
                  type="number"
                  min="0"
                  max="168"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={onlineBookingNotice}
                  onChange={(e) => setOnlineBookingNotice(e.target.value)}
                  required
                />
                <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Janela mínima para que o paciente marque no portal/totem sem colidir com consultas imediatas.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="cancelNoticeInput" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Antecedência Mínima para Cancelamento Gratuito (Horas) *
                </label>
                <input
                  id="cancelNoticeInput"
                  type="number"
                  min="0"
                  max="168"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={cancellationNotice}
                  onChange={(e) => setCancellationNotice(e.target.value)}
                  required
                />
                <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Após esse prazo, o cancelamento gera taxa administrativa ou perda do sinal conforme regra comercial.
                </small>
              </div>

              <button
                type="submit"
                className="button button--primary"
                disabled={saving}
                style={{ alignSelf: 'flex-start' }}
              >
                {saving ? 'Salvando...' : 'Salvar Políticas'}
              </button>
            </form>
          </div>

          {/* Validador de Cota de Encaixes */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Simulador de Cota de Encaixe</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Teste a disponibilidade de overbooking para um profissional em determinada data.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="simDoctorSelect" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Profissional
                </label>
                <select
                  id="simDoctorSelect"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                >
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="simDateInput" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Data Desejada
                </label>
                <input
                  id="simDateInput"
                  type="date"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={simDate}
                  onChange={(e) => setSimDate(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="button button--secondary"
                onClick={() => void handleTestQuota()}
                disabled={testing || !selectedDocId}
              >
                {testing ? 'Verificando...' : '🔍 Checar Cota Disponível'}
              </button>

              {simResult && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '1rem',
                  borderRadius: '6px',
                  backgroundColor: simResult.allowed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${simResult.allowed ? '#10b981' : '#ef4444'}`,
                }}>
                  <div style={{ fontWeight: 700, color: simResult.allowed ? '#10b981' : '#ef4444', marginBottom: '0.25rem' }}>
                    {simResult.allowed ? '✓ Encaixe Permitido' : '✕ Cota Máxima de Encaixes Atingida'}
                  </div>
                  <div style={{ fontSize: '0.88rem' }}>
                    Encaixes realizados hoje: <strong>{simResult.current}</strong> de <strong>{simResult.max}</strong> permitidos.
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    {simResult.message}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
