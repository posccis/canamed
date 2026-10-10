import { useState } from 'react';
import {
  type GynecologicalProfileDto,
  type UpdateGynecologicalProfileRequest,
  updateGynecologicalProfile,
} from './medicalRecordsApi';
import { useToast } from '../layout/Toast';

interface Props {
  profile: GynecologicalProfileDto | null;
  onProfileUpdated: (updated: GynecologicalProfileDto) => void;
  readOnly?: boolean;
}

export function GynecologicalProfileCard({ profile, onProfileUpdated, readOnly }: Props) {
  const { addToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<UpdateGynecologicalProfileRequest>({
    menarcheAge: profile?.menarcheAge ?? null,
    sexarcheAge: profile?.sexarcheAge ?? null,
    cycleIntervalDays: profile?.cycleIntervalDays ?? 28,
    cycleDurationDays: profile?.cycleDurationDays ?? 4,
    isCycleRegular: profile?.isCycleRegular ?? true,
    flowIntensity: profile?.flowIntensity ?? 'moderado',
    dysmenorrhea: profile?.dysmenorrhea ?? 'ausente',
    hasPms: profile?.hasPms ?? false,
    pmsSymptoms: profile?.pmsSymptoms ?? '',
    menopauseStatus: profile?.menopauseStatus ?? 'menacme',
    menopauseAge: profile?.menopauseAge ?? null,
    hrtInUse: profile?.hrtInUse ?? false,
    gravida: profile?.gravida ?? 0,
    para: profile?.para ?? 0,
    cesareans: profile?.cesareans ?? 0,
    abortions: profile?.abortions ?? 0,
    livingChildren: profile?.livingChildren ?? 0,
    ectopicPregnancies: profile?.ectopicPregnancies ?? 0,
    obstetricNotes: profile?.obstetricNotes ?? '',
    currentMethod: profile?.currentMethod ?? 'nenhum',
    currentMethodUsageMonths: profile?.currentMethodUsageMonths ?? null,
    previousMethods: profile?.previousMethods ?? '',
    reproductivePlan: profile?.reproductivePlan ?? 'sem_desejo',
    pelvicSurgeries: profile?.pelvicSurgeries ?? '',
    stiHistory: profile?.stiHistory ?? '',
    familyCancerHistory: profile?.familyCancerHistory ?? '',
  });

  const handleStartEdit = () => {
    if (!profile) return;
    setFormData({
      menarcheAge: profile.menarcheAge ?? null,
      sexarcheAge: profile.sexarcheAge ?? null,
      cycleIntervalDays: profile.cycleIntervalDays ?? 28,
      cycleDurationDays: profile.cycleDurationDays ?? 4,
      isCycleRegular: profile.isCycleRegular ?? true,
      flowIntensity: profile.flowIntensity ?? 'moderado',
      dysmenorrhea: profile.dysmenorrhea ?? 'ausente',
      hasPms: profile.hasPms ?? false,
      pmsSymptoms: profile.pmsSymptoms ?? '',
      menopauseStatus: profile.menopauseStatus ?? 'menacme',
      menopauseAge: profile.menopauseAge ?? null,
      hrtInUse: profile.hrtInUse ?? false,
      gravida: profile.gravida,
      para: profile.para,
      cesareans: profile.cesareans,
      abortions: profile.abortions,
      livingChildren: profile.livingChildren,
      ectopicPregnancies: profile.ectopicPregnancies,
      obstetricNotes: profile.obstetricNotes ?? '',
      currentMethod: profile.currentMethod ?? 'nenhum',
      currentMethodUsageMonths: profile.currentMethodUsageMonths ?? null,
      previousMethods: profile.previousMethods ?? '',
      reproductivePlan: profile.reproductivePlan ?? 'sem_desejo',
      pelvicSurgeries: profile.pelvicSurgeries ?? '',
      stiHistory: profile.stiHistory ?? '',
      familyCancerHistory: profile.familyCancerHistory ?? '',
    });
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const updated = await updateGynecologicalProfile(profile.patientId, formData);
      onProfileUpdated(updated);
      addToast('Perfil gineco-obstétrico atualizado com sucesso!', 'success');
      setEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar perfil ginecológico.';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--color-neutral-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.25rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--color-neutral-border)',
          paddingBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.3rem' }}>🌸</span>
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-primary-dark)' }}>
            Ficha Gineco-Obstétrica Longitudinal
          </h3>
        </div>

        {!readOnly && !editing && (
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={handleStartEdit}
          >
            ✏️ Editar Histórico
          </button>
        )}
      </div>

      {!editing ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
          {/* Obstétrico GPA */}
          <div style={{ background: 'var(--color-neutral-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-neutral-muted)', fontWeight: 700 }}>
              Histórico Obstétrico
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0.25rem 0' }}>
              G{profile?.gravida ?? 0} P{profile?.para ?? 0} PC{profile?.cesareans ?? 0} A{profile?.abortions ?? 0} F{profile?.livingChildren ?? 0}
            </div>
            {profile?.ectopicPregnancies ? (
              <span style={{ fontSize: '0.75rem', color: '#c53030' }}>
                Ectópicas: {profile.ectopicPregnancies}
              </span>
            ) : null}
            {profile?.obstetricNotes && (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: '#4a5568' }}>
                {profile.obstetricNotes}
              </p>
            )}
          </div>

          {/* Menstrual */}
          <div style={{ background: 'var(--color-neutral-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-neutral-muted)', fontWeight: 700 }}>
              Padrão Menstrual
            </span>
            <div style={{ margin: '0.25rem 0' }}>
              <strong>Menarca:</strong> {profile?.menarcheAge ? `${profile.menarcheAge} anos` : 'Não informada'}
              {profile?.sexarcheAge ? ` • Sexarca: ${profile.sexarcheAge} anos` : ''}
            </div>
            <div>
              <strong>Ciclos:</strong> {profile?.cycleIntervalDays ? `${profile.cycleIntervalDays}d / ${profile.cycleDurationDays || 4}d` : 'Padrão'}
              {' '}({profile?.isCycleRegular ? 'Regular' : 'Irregular'})
            </div>
            <div style={{ fontSize: '0.8rem', color: '#4a5568', marginTop: '0.2rem' }}>
              Fluxo: {profile?.flowIntensity || 'Normal'} • Dismenorreia: {profile?.dysmenorrhea || 'Ausente'}
            </div>
          </div>

          {/* Contracepção */}
          <div style={{ background: 'var(--color-neutral-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-neutral-muted)', fontWeight: 700 }}>
              Contracepção & Planejamento
            </span>
            <div style={{ margin: '0.25rem 0' }}>
              <strong>Método Atual:</strong>{' '}
              <span style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
                {profile?.currentMethod ? profile.currentMethod.replace('_', ' ').toUpperCase() : 'NENHUM'}
              </span>
              {profile?.currentMethodUsageMonths ? ` (${profile.currentMethodUsageMonths} meses)` : ''}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>
              Plano: {profile?.reproductivePlan === 'desejo_engravidar' ? '👶 Desejo de engravidar' : 'Sem desejo reprodutivo'}
            </div>
          </div>

          {/* Antecedentes */}
          <div style={{ background: 'var(--color-neutral-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-neutral-muted)', fontWeight: 700 }}>
              Antecedentes Cirúrgicos / Família
            </span>
            <div style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#4a5568' }}>
              Cirurgias pélvicas: {profile?.pelvicSurgeries || 'Nenhuma'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>
              Histórico Familiar CA: {profile?.familyCancerHistory || 'Nega'}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            <label className="field">
              <span className="field__label">Gestações (G)</span>
              <input
                type="number"
                min="0"
                className="form__input"
                value={formData.gravida}
                onChange={(e) => setFormData({ ...formData, gravida: parseInt(e.target.value, 10) || 0 })}
              />
            </label>
            <label className="field">
              <span className="field__label">Partos Vaginais (PN)</span>
              <input
                type="number"
                min="0"
                className="form__input"
                value={formData.para}
                onChange={(e) => setFormData({ ...formData, para: parseInt(e.target.value, 10) || 0 })}
              />
            </label>
            <label className="field">
              <span className="field__label">Cesáreas (PC)</span>
              <input
                type="number"
                min="0"
                className="form__input"
                value={formData.cesareans}
                onChange={(e) => setFormData({ ...formData, cesareans: parseInt(e.target.value, 10) || 0 })}
              />
            </label>
            <label className="field">
              <span className="field__label">Abortos (A)</span>
              <input
                type="number"
                min="0"
                className="form__input"
                value={formData.abortions}
                onChange={(e) => setFormData({ ...formData, abortions: parseInt(e.target.value, 10) || 0 })}
              />
            </label>
            <label className="field">
              <span className="field__label">Filhos Vivos (F)</span>
              <input
                type="number"
                min="0"
                className="form__input"
                value={formData.livingChildren}
                onChange={(e) => setFormData({ ...formData, livingChildren: parseInt(e.target.value, 10) || 0 })}
              />
            </label>
            <label className="field">
              <span className="field__label">Ectópicas (E)</span>
              <input
                type="number"
                min="0"
                className="form__input"
                value={formData.ectopicPregnancies}
                onChange={(e) => setFormData({ ...formData, ectopicPregnancies: parseInt(e.target.value, 10) || 0 })}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <label className="field">
              <span className="field__label">Menarca (idade em anos)</span>
              <input
                type="number"
                min="5"
                max="25"
                className="form__input"
                value={formData.menarcheAge ?? ''}
                onChange={(e) => setFormData({ ...formData, menarcheAge: e.target.value ? parseInt(e.target.value, 10) : null })}
              />
            </label>
            <label className="field">
              <span className="field__label">Sexarca (idade em anos)</span>
              <input
                type="number"
                min="8"
                max="50"
                className="form__input"
                value={formData.sexarcheAge ?? ''}
                onChange={(e) => setFormData({ ...formData, sexarcheAge: e.target.value ? parseInt(e.target.value, 10) : null })}
              />
            </label>
            <label className="field">
              <span className="field__label">Intervalo do Ciclo (dias)</span>
              <input
                type="number"
                className="form__input"
                value={formData.cycleIntervalDays ?? ''}
                onChange={(e) => setFormData({ ...formData, cycleIntervalDays: e.target.value ? parseInt(e.target.value, 10) : null })}
              />
            </label>
            <label className="field">
              <span className="field__label">Duração do Fluxo (dias)</span>
              <input
                type="number"
                className="form__input"
                value={formData.cycleDurationDays ?? ''}
                onChange={(e) => setFormData({ ...formData, cycleDurationDays: e.target.value ? parseInt(e.target.value, 10) : null })}
              />
            </label>
            <label className="field">
              <span className="field__label">Regularidade</span>
              <select
                className="form__select"
                value={formData.isCycleRegular ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isCycleRegular: e.target.value === 'true' })}
              >
                <option value="true">Regular</option>
                <option value="false">Irregular</option>
              </select>
            </label>
            <label className="field">
              <span className="field__label">Método Contraceptivo</span>
              <select
                className="form__select"
                value={formData.currentMethod || 'nenhum'}
                onChange={(e) => setFormData({ ...formData, currentMethod: e.target.value })}
              >
                <option value="nenhum">Nenhum</option>
                <option value="diu_cobre">DIU de Cobre</option>
                <option value="diu_hormonal">DIU Hormonal (Mirena/Kyleena)</option>
                <option value="aco_combinado">Anticoncepcional Oral Combinado</option>
                <option value="minipilula">Minipílula</option>
                <option value="injetavel_mensal">Injetável Mensal</option>
                <option value="injetavel_trimestral">Injetável Trimestral</option>
                <option value="implante">Implante Subdérmico</option>
                <option value="preservativo">Preservativo Masculino/Feminino</option>
                <option value="laqueadura">Laqueadura Tubária</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label className="field">
              <span className="field__label">Cirurgias Pélvicas / Ginecológicas</span>
              <input
                type="text"
                className="form__input"
                placeholder="Ex: Histerectomia parcial em 2020..."
                value={formData.pelvicSurgeries ?? ''}
                onChange={(e) => setFormData({ ...formData, pelvicSurgeries: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Histórico Familiar de Câncer</span>
              <input
                type="text"
                className="form__input"
                placeholder="Ex: Mãe com CA de mama, tia com CA de ovário..."
                value={formData.familyCancerHistory ?? ''}
                onChange={(e) => setFormData({ ...formData, familyCancerHistory: e.target.value })}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button button--primary"
              disabled={saving}
            >
              {saving ? 'Salvando…' : 'Salvar Ficha'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
