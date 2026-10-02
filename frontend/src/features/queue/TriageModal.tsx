import { useState, useEffect, type FormEvent } from 'react';
import {
  recordTriage,
  getTriage,
  type RiskClassification
} from './triageApi';

interface TriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  queueEntryId: string;
  patientName: string;
  onSuccess: () => void;
}

export function TriageModal({
  isOpen,
  onClose,
  queueEntryId,
  patientName,
  onSuccess
}: TriageModalProps) {
  const [risk, setRisk] = useState<RiskClassification>('verde');
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [glucose, setGlucose] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [allergies, setAllergies] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setFetching(true);
    setError(null);

    getTriage(queueEntryId)
      .then((data) => {
        if (!active) return;
        setRisk(data.riskClassification);
        setBloodPressure(data.bloodPressure || '');
        setHeartRate(data.heartRate ? String(data.heartRate) : '');
        setTemperature(data.temperature ? String(data.temperature) : '');
        setOxygenSaturation(data.oxygenSaturation ? String(data.oxygenSaturation) : '');
        setGlucose(data.glucose ? String(data.glucose) : '');
        setWeightKg(data.weightKg ? String(data.weightKg) : '');
        setHeightCm(data.heightCm ? String(data.heightCm) : '');
        setChiefComplaint(data.chiefComplaint || '');
        setAllergies(data.allergies || '');
      })
      .catch(() => {
        // Sem triagem prévia registrada - formulário em branco
      })
      .finally(() => {
        if (active) setFetching(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, queueEntryId]);

  if (!isOpen) return null;

  // Cálculo de IMC em tempo real
  const w = parseFloat(weightKg.replace(',', '.'));
  const h = parseFloat(heightCm.replace(',', '.'));
  let liveBmi: string | null = null;
  if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
    const meters = h / 100;
    liveBmi = (w / (meters * meters)).toFixed(1);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await recordTriage(queueEntryId, {
        riskClassification: risk,
        bloodPressure: bloodPressure.trim() || undefined,
        heartRate: heartRate ? parseInt(heartRate, 10) : undefined,
        temperature: temperature ? parseFloat(temperature.replace(',', '.')) : undefined,
        oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation, 10) : undefined,
        glucose: glucose ? parseInt(glucose, 10) : undefined,
        weightKg: !isNaN(w) && w > 0 ? w : undefined,
        heightCm: !isNaN(h) && h > 0 ? h : undefined,
        chiefComplaint: chiefComplaint.trim() || undefined,
        allergies: allergies.trim() || undefined
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar triagem.');
    } finally {
      setLoading(false);
    }
  };

  const riskOptions: { value: RiskClassification; label: string; color: string; bg: string }[] = [
    { value: 'vermelho', label: 'Vermelho (Emergência)', color: '#9B2C2C', bg: '#FED7D7' },
    { value: 'laranja', label: 'Laranja (Muito Urgente)', color: '#C05621', bg: '#FEEBC8' },
    { value: 'amarelo', label: 'Amarelo (Urgente)', color: '#B7791F', bg: '#FEFCBF' },
    { value: 'verde', label: 'Verde (Pouco Urgente)', color: '#276749', bg: '#C6F6D5' },
    { value: 'azul', label: 'Azul (Não Urgente)', color: '#2B6CB0', bg: '#BEE3F8' }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Aferição de sinais vitais e triagem"
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
          maxWidth: '38rem',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '90vh',
          overflowY: 'auto',
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
              Triagem e Sinais Vitais
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              Paciente: <b>{patientName}</b>
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

          {fetching && (
            <div style={{ textAlign: 'center', color: 'var(--color-muted)', marginBottom: '1rem' }}>
              Carregando dados da triagem...
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Classificação de Risco (Manchester) *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
              {riskOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRisk(opt.value)}
                  style={{
                    padding: '0.625rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.785rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: risk === opt.value ? `2px solid ${opt.color}` : '1px solid var(--color-border)',
                    backgroundColor: risk === opt.value ? opt.bg : '#FFFFFF',
                    color: opt.color,
                    textAlign: 'center'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Pressão Arterial (PA)
              </label>
              <input
                type="text"
                placeholder="Ex: 120/80"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
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
                Frequência Cardíaca (bpm)
              </label>
              <input
                type="number"
                placeholder="Ex: 72"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Temperatura (°C)
              </label>
              <input
                type="text"
                placeholder="Ex: 36.5"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
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
                Saturação O₂ (%)
              </label>
              <input
                type="number"
                placeholder="Ex: 98"
                value={oxygenSaturation}
                onChange={(e) => setOxygenSaturation(e.target.value)}
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
                Glicemia (mg/dL)
              </label>
              <input
                type="number"
                placeholder="Ex: 95"
                value={glucose}
                onChange={(e) => setGlucose(e.target.value)}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Peso (kg)
              </label>
              <input
                type="text"
                placeholder="Ex: 70.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
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
                Altura (cm)
              </label>
              <input
                type="text"
                placeholder="Ex: 175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div style={{ paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>IMC Calculado:</span>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
                {liveBmi ? `${liveBmi} kg/m²` : '—'}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Queixa Principal
            </label>
            <input
              type="text"
              placeholder="Ex: Cefaleia pulsátil iniciada há 2 dias acompanhada de febre..."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Alergias Relatadas
            </label>
            <input
              type="text"
              placeholder="Ex: Dipirona, Penicilina (ou 'Nenhuma')"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
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
              {loading ? 'Salvando...' : 'Salvar Triagem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
