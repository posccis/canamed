import { useState, useMemo } from 'react';
import { CalendarDays, Users, Clock, Search, UserCheck, X } from 'lucide-react';
import { AgendaPage } from './AgendaPage';
import { QueuePanel } from '../queue/QueuePanel';
import type { Patient } from './agendaApi';

type AgendaRecepcaoViewMode = 'agenda' | 'queue';

type AgendaRecepcaoPanelProps = {
  initialView?: AgendaRecepcaoViewMode;
  initialPatients?: Patient[];
};

export function AgendaRecepcaoPanel({
  initialView = 'agenda',
  initialPatients = [],
}: AgendaRecepcaoPanelProps) {
  const [viewMode, setViewMode] = useState<AgendaRecepcaoViewMode>(initialView);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Autocomplete Preditivo da Recepção Inteligente (Task 15 / RN-005)
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 3) {
      return [];
    }
    const cleanTerm = searchTerm.toLowerCase().trim();
    const cleanDigits = searchTerm.replace(/\D/g, '');

    return initialPatients.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(cleanTerm);
      const phoneMatch = cleanDigits.length >= 3 && p.phone ? p.phone.replace(/\D/g, '').includes(cleanDigits) : false;
      const cpfMatch = cleanDigits.length >= 3 && (p as unknown as { cpf?: string }).cpf
        ? (p as unknown as { cpf?: string }).cpf!.replace(/\D/g, '').includes(cleanDigits)
        : false;
      return nameMatch || phoneMatch || cpfMatch;
    });
  }, [searchTerm, initialPatients]);

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

      {/* Recepção Inteligente: Autocomplete Preditivo de Pacientes */}
      <div
        style={{
          position: 'relative',
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Recepção Inteligente: buscar paciente por nome, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.65rem 2.25rem 0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.88rem',
                outline: 'none',
                background: '#F8FAFC',
              }}
            />
            <Search
              size={18}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Dropdown com resultados preditivos */}
        {isDropdownOpen && filteredPatients.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '1.25rem',
              right: '1.25rem',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              zIndex: 100,
              maxHeight: '220px',
              overflowY: 'auto',
              marginTop: '4px',
            }}
          >
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPatient(p);
                  setSearchTerm('');
                  setIsDropdownOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderBottom: '1px solid #F1F5F9',
                  background: '#FFFFFF',
                  color: '#1E293B',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#6F217B' }}>{p.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                    Tel: {p.phone || 'N/I'} {(p as unknown as { cpf?: string }).cpf ? `· CPF: ${(p as unknown as { cpf?: string }).cpf}` : ''}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#852A91',
                    background: '#F7ECF8',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                  }}
                >
                  Selecionar
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Feedback visual de paciente selecionada */}
        {selectedPatient && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.65rem 0.85rem',
              background: '#F0FDF9',
              border: '1px solid #B77AD8',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={18} color="#852A91" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6F217B' }}>
                Paciente selecionada: <strong>{selectedPatient.name}</strong> ({selectedPatient.phone || 'Sem telefone'})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPatient(null)}
              aria-label="Limpar seleção"
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Renderização do Painel Ativo */}
      <div>
        {viewMode === 'agenda' ? <AgendaPage /> : <QueuePanel />}
      </div>
    </div>
  );
}

