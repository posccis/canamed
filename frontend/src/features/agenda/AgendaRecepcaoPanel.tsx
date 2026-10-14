import { useState } from 'react';
import { CalendarDays, Users, Clock } from 'lucide-react';
import { AgendaPage } from './AgendaPage';
import { QueuePanel } from '../queue/QueuePanel';

type AgendaRecepcaoViewMode = 'agenda' | 'queue';

type AgendaRecepcaoPanelProps = {
  initialView?: AgendaRecepcaoViewMode;
};

export function AgendaRecepcaoPanel({ initialView = 'agenda' }: AgendaRecepcaoPanelProps) {
  const [viewMode, setViewMode] = useState<AgendaRecepcaoViewMode>(initialView);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Barra de Controle de Visão Operacional (Segmented Control) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--base-surface, #FFFFFF)',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--base-border, #E2E6EC)',
          boxShadow: 'var(--shadow-soft, 0 2px 10px -2px rgba(32, 38, 49, 0.05))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--brand-soft, #F7ECF8)',
              color: 'var(--brand-primary, #852A91)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarDays size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--content-primary, #202631)' }}>
              Agenda & Recepção
            </h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--content-secondary, #626B79)' }}>
              {viewMode === 'agenda'
                ? 'Visualização da grade de horários, bloqueios e agendamentos.'
                : 'Fila de espera em tempo real, confirmação de chegada (check-in) e chamadas.'}
            </p>
          </div>
        </div>

        {/* Alternador Segmented Control */}
        <div
          role="group"
          aria-label="Alternar Visão da Agenda e Recepção"
          style={{
            display: 'inline-flex',
            padding: '0.25rem',
            background: 'var(--base-muted, #F1F3F6)',
            borderRadius: '10px',
            border: '1px solid var(--base-border, #E2E6EC)',
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('agenda')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.95rem',
              fontSize: '0.85rem',
              fontWeight: viewMode === 'agenda' ? 600 : 500,
              color: viewMode === 'agenda' ? 'var(--brand-primary, #852A91)' : 'var(--content-secondary, #626B79)',
              background: viewMode === 'agenda' ? 'var(--base-surface, #FFFFFF)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: viewMode === 'agenda' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Clock size={16} strokeWidth={viewMode === 'agenda' ? 2.2 : 1.8} />
            <span>Grade da Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('queue')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.95rem',
              fontSize: '0.85rem',
              fontWeight: viewMode === 'queue' ? 600 : 500,
              color: viewMode === 'queue' ? 'var(--brand-primary, #852A91)' : 'var(--content-secondary, #626B79)',
              background: viewMode === 'queue' ? 'var(--base-surface, #FFFFFF)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: viewMode === 'queue' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={16} strokeWidth={viewMode === 'queue' ? 2.2 : 1.8} />
            <span>Fila & Recepção</span>
          </button>
        </div>
      </div>

      {/* Renderização do Painel Ativo */}
      <div>
        {viewMode === 'agenda' ? <AgendaPage /> : <QueuePanel />}
      </div>
    </div>
  );
}
