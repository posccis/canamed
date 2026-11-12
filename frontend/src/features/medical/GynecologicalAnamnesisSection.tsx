import { useState } from 'react';
import type { GynecologicalProfileDto } from './medicalRecordsApi';
import { QuickChiefComplaintSelector } from './QuickChiefComplaintSelector';
import { GuidedHmaEditor } from './GuidedHmaEditor';
import { ObstetricCalculatorWidget } from './ObstetricCalculatorWidget';
import { GynecologicalProfileCard } from './GynecologicalProfileCard';

interface Props {
  chiefComplaint: string;
  onChiefComplaintChange: (val: string) => void;
  hma: string;
  onHmaChange: (val: string) => void;

  dum: string;
  onDumChange: (val: string) => void;
  isDumUncertain: boolean;
  onIsDumUncertainChange: (val: boolean) => void;
  isMenopausal: boolean;
  onIsMenopausalChange: (val: boolean) => void;

  isSexuallyActive: boolean | null;
  onIsSexuallyActiveChange: (val: boolean | null) => void;
  dyspareunia: string;
  onDyspareuniaChange: (val: string) => void;

  profile: GynecologicalProfileDto | null;
  onProfileUpdated: (updated: GynecologicalProfileDto) => void;

  onApplyObstetricValues?: (val: { effectiveGaWeeks: number; effectiveGaDays: number; effectiveEdd: string }) => void;
  disabled?: boolean;
  privacyMode?: boolean;
  onPrivacyModeToggle?: () => void;
}

export function GynecologicalAnamnesisSection({
  chiefComplaint,
  onChiefComplaintChange,
  hma,
  onHmaChange,
  dum,
  onDumChange,
  isDumUncertain,
  onIsDumUncertainChange,
  isMenopausal,
  onIsMenopausalChange,
  isSexuallyActive,
  onIsSexuallyActiveChange,
  dyspareunia,
  onDyspareuniaChange,
  profile,
  onProfileUpdated,
  onApplyObstetricValues,
  disabled = false,
  privacyMode: privacyModeProp,
  onPrivacyModeToggle,
}: Props) {
  const [localPrivacyMode, setLocalPrivacyMode] = useState(false);
  const privacyMode = privacyModeProp !== undefined ? privacyModeProp : localPrivacyMode;
  const handleTogglePrivacy = onPrivacyModeToggle || (() => setLocalPrivacyMode((prev) => !prev));
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <section
      id="sec-gyn-anamnesis"
      className="card gyn-anamnesis-card"
      style={{
        border: '1px solid var(--color-neutral-border, #CBD5E1)',
        borderRadius: 'var(--radius-lg, 12px)',
        background: '#ffffff',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06))',
      }}
    >
      {/* 1. Cabeçalho da Central de Anamnese */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--color-neutral-border, #E2E8F0)',
          paddingBottom: '0.85rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🌸</span>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark, #6F217B)', margin: 0, fontWeight: 700 }}>
              Anamnese Ginecológica Integrada
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-muted, #64748B)' }}>
              Registro da consulta atual, queixa principal, cronologia de sintomas e controle menstrual
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Botão de Modo Privacidade */}
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={handleTogglePrivacy}
            style={{
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: privacyMode ? '#FEF3C7' : '#F1F5F9',
              color: privacyMode ? '#92400E' : '#475569',
              border: privacyMode ? '1px solid #FCD34D' : '1px solid #CBD5E1',
            }}
            title="Oculta ou revela informações íntimas e antecedentes sensíveis no consultório"
          >
            <span>{privacyMode ? '🕶️ Modo Privacidade Ativo' : '👁️ Modo Privacidade'}</span>
          </button>

          {/* Botão de Edição Rápida da Ficha Longitudinal */}
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={() => setShowProfileModal(true)}
            style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <span>✏️ Editar Ficha GO Longitudinal</span>
          </button>
        </div>
      </div>

      {/* 2. Mini-Barra Longitudinal GO (Snapshot Rápido da Paciente) */}
      <div
        className="gyn-profile-snapshot"
        style={{
          background: 'var(--color-neutral-surface, #F8FAFC)',
          border: '1px solid var(--color-neutral-border, #E2E8F0)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '0.6rem 0.9rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          fontSize: '0.85rem',
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--color-primary-dark, #6F217B)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <span>📋</span> Resumo GO:
        </span>

        {/* Histórico Obstétrico GPA */}
        <span
          style={{
            background: '#ffffff',
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-sm, 4px)',
            border: '1px solid #E2E8F0',
            fontWeight: 600,
            color: 'var(--color-primary-dark, #6F217B)',
            filter: privacyMode ? 'blur(4px)' : 'none',
            transition: 'filter 0.2s',
          }}
          title="Gestações, Partos vaginais, Cesáreas, Abortos, Filhos vivos"
        >
          G{profile?.gravida ?? 0} P{profile?.para ?? 0} PC{profile?.cesareans ?? 0} A{profile?.abortions ?? 0} F{profile?.livingChildren ?? 0}
        </span>

        {/* Ciclo Menstrual */}
        <span
          style={{
            background: '#ffffff',
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-sm, 4px)',
            border: '1px solid #E2E8F0',
          }}
        >
          Ciclo: <strong>{profile?.cycleIntervalDays ?? 28}d / {profile?.cycleDurationDays ?? 4}d</strong> ({profile?.isCycleRegular ? 'Regular' : 'Irregular'})
        </span>

        {/* Menarca e Sexarca */}
        <span
          style={{
            background: '#ffffff',
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-sm, 4px)',
            border: '1px solid #E2E8F0',
            filter: privacyMode ? 'blur(4px)' : 'none',
            transition: 'filter 0.2s',
          }}
        >
          Menarca: <strong>{profile?.menarcheAge ? `${profile.menarcheAge}a` : 'N/I'}</strong> • Sexarca: <strong>{profile?.sexarcheAge ? `${profile.sexarcheAge}a` : 'N/I'}</strong>
        </span>

        {/* Contracepção */}
        <span
          style={{
            background: '#ffffff',
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-sm, 4px)',
            border: '1px solid #E2E8F0',
          }}
        >
          Contracepção: <strong>{profile?.currentMethod && profile.currentMethod !== 'nenhum' ? profile.currentMethod : 'Nenhum método'}</strong>
        </span>
      </div>

      {/* 3. Queixa Principal com Atalhos Ágeis */}
      <div style={{ marginBottom: '1.25rem' }}>
        <QuickChiefComplaintSelector
          value={chiefComplaint}
          onChange={onChiefComplaintChange}
          disabled={disabled}
        />
      </div>

      {/* 4. História da Moléstia Atual (HMA) Guiada */}
      <div style={{ marginBottom: '1.25rem' }}>
        <GuidedHmaEditor
          value={hma}
          onChange={onHmaChange}
          disabled={disabled}
        />
      </div>

      {/* 5. Bloco de Controle Menstrual, Vida Sexual & Calculadora Obstétrica */}
      <div
        className="gyn-menstrual-context-box"
        style={{
          border: '1px solid var(--color-neutral-border, #E2E8F0)',
          borderRadius: 'var(--radius-md, 8px)',
          background: '#FAFAFA',
          padding: '1rem',
        }}
      >
        <h4 style={{ fontSize: '0.95rem', color: 'var(--color-primary-dark, #6F217B)', margin: '0 0 0.85rem 0', fontWeight: 700 }}>
          Controle Menstrual & DUM Contextualizada
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '0.85rem' }}>
          {/* Data da Última Menstruação */}
          <div>
            <label className="form__label" htmlFor="gyn-anamnesis-dum" style={{ fontWeight: 600 }}>
              Data da Última Menstruação (DUM)
            </label>
            <input
              id="gyn-anamnesis-dum"
              type="date"
              className="form__input"
              value={dum}
              disabled={disabled || isMenopausal}
              onChange={(e) => onDumChange(e.target.value)}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.8rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isDumUncertain}
                  onChange={(e) => onIsDumUncertainChange(e.target.checked)}
                  disabled={disabled || isMenopausal}
                />
                DUM incerta / esquecida
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isMenopausal}
                  onChange={(e) => {
                    onIsMenopausalChange(e.target.checked);
                    if (e.target.checked) onDumChange('');
                  }}
                  disabled={disabled}
                />
                Menopausa / Climatério
              </label>
            </div>
          </div>

          {/* Vida Sexual Ativa */}
          <div>
            <label className="form__label" htmlFor="gyn-anamnesis-sexual-active" style={{ fontWeight: 600 }}>
              Vida Sexual Ativa?
            </label>
            <select
              id="gyn-anamnesis-sexual-active"
              className="form__select"
              value={isSexuallyActive === null ? '' : isSexuallyActive ? 'true' : 'false'}
              disabled={disabled}
              onChange={(e) => {
                if (e.target.value === '') onIsSexuallyActiveChange(null);
                else onIsSexuallyActiveChange(e.target.value === 'true');
              }}
              style={{
                width: '100%',
                filter: privacyMode ? 'blur(4px)' : 'none',
                transition: 'filter 0.2s',
              }}
            >
              <option value="">Não informado</option>
              <option value="true">Sim, sexualmente ativa</option>
              <option value="false">Não sexualmente ativa</option>
            </select>
          </div>

          {/* Dispareunia */}
          <div>
            <label className="form__label" htmlFor="gyn-anamnesis-dyspareunia" style={{ fontWeight: 600 }}>
              Dispareunia (Dor na Relação)
            </label>
            <select
              id="gyn-anamnesis-dyspareunia"
              className="form__select"
              value={dyspareunia}
              disabled={disabled}
              onChange={(e) => onDyspareuniaChange(e.target.value)}
              style={{
                width: '100%',
                filter: privacyMode ? 'blur(4px)' : 'none',
                transition: 'filter 0.2s',
              }}
            >
              <option value="ausente">Ausente / Sem dor</option>
              <option value="superficial">Superficial (introito)</option>
              <option value="profunda">Profunda (pélvica)</option>
              <option value="ambas">Mista / Ambas</option>
            </select>
          </div>
        </div>

        {/* Calculadora Obstétrica FEBRASGO Integrada */}
        {!isMenopausal && (
          <div style={{ marginTop: '0.75rem' }}>
            <ObstetricCalculatorWidget
              dum={dum}
              isDumUncertain={isDumUncertain}
              onApplyCalculatedValues={(val) => {
                if (onApplyObstetricValues) {
                  onApplyObstetricValues(val);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Modal / Gaveta In-Place para Edição da Ficha Longitudinal */}
      {showProfileModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setShowProfileModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg, 12px)',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary-dark, #6F217B)', fontSize: '1.2rem' }}>
                Editar Histórico Gineco-Obstétrico da Paciente
              </h3>
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => setShowProfileModal(false)}
              >
                ✕ Fechar
              </button>
            </div>

            <GynecologicalProfileCard
              profile={profile}
              onProfileUpdated={(updated) => {
                onProfileUpdated(updated);
                setShowProfileModal(false);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

