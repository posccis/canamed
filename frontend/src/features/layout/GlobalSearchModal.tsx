import React, { useState, useEffect, useRef } from 'react';
import type { Patient } from '../agenda/agendaApi';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'dashboard' | 'agenda' | 'queue' | 'operation' | 'catalog' | 'users') => void;
  patients?: Patient[];
}

interface ActionItem {
  id: string;
  category: 'Navegação' | 'Ação Rápida';
  title: string;
  description: string;
  action: () => void;
}

export function GlobalSearchModal({ isOpen, onClose, onNavigate, patients = [] }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent, but if needed we can trigger onClose
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultActions: ActionItem[] = [
    {
      id: 'nav-dash',
      category: 'Navegação',
      title: 'Painel Gerencial / Dashboard',
      description: 'Indicadores do dia, fluxo de espera e ocupação',
      action: () => {
        onNavigate('dashboard');
        onClose();
      }
    },
    {
      id: 'nav-agenda',
      category: 'Navegação',
      title: 'Agenda de Consultas',
      description: 'Marcar, remarcar, cancelar e consultar horários',
      action: () => {
        onNavigate('agenda');
        onClose();
      }
    },
    {
      id: 'nav-queue',
      category: 'Navegação',
      title: 'Fila de Espera & Recepção',
      description: 'Check-in de pacientes, triagem e chamadas',
      action: () => {
        onNavigate('queue');
        onClose();
      }
    },
    {
      id: 'nav-op',
      category: 'Navegação',
      title: 'Gestão Operacional',
      description: 'Salas, convênios, horários de funcionamento e feriados',
      action: () => {
        onNavigate('operation');
        onClose();
      }
    },
    {
      id: 'nav-cat',
      category: 'Navegação',
      title: 'Catálogo Assistencial',
      description: 'Especialidades, tipos de atendimento e profissionais',
      action: () => {
        onNavigate('catalog');
        onClose();
      }
    },
    {
      id: 'nav-usr',
      category: 'Navegação',
      title: 'Usuários & Permissões',
      description: 'Acessos, perfis e segurança da equipe',
      action: () => {
        onNavigate('users');
        onClose();
      }
    }
  ];

  const trimmed = query.trim().toLowerCase();

  const filteredActions = defaultActions.filter(
    (item) =>
      item.title.toLowerCase().includes(trimmed) ||
      item.description.toLowerCase().includes(trimmed)
  );

  const matchedPatients = trimmed
    ? patients
        .filter((p) => p.name.toLowerCase().includes(trimmed))
        .slice(0, 5)
        .map((p) => ({
          id: `patient-${p.id}`,
          category: 'Ação Rápida' as const,
          title: `Paciente: ${p.name}`,
          description: `Telefone: ${p.phone || 'Não informado'} — Ir para Agenda`,
          action: () => {
            onNavigate('agenda');
            onClose();
          }
        }))
    : [];

  const combinedItems = [...filteredActions, ...matchedPatients];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, combinedItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + combinedItems.length) % Math.max(1, combinedItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (combinedItems[selectedIndex]) {
        combinedItems[selectedIndex].action();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Busca global de pacientes e navegação"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(26, 32, 44, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh'
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
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)'
          }}
        >
          <span style={{ color: 'var(--color-muted)', fontSize: '1.125rem' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Digite para buscar pacientes, módulos ou atalhos... (Esc para sair)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              color: 'var(--color-text)',
              backgroundColor: 'transparent'
            }}
          />
          <kbd
            style={{
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-muted)'
            }}
          >
            ESC
          </kbd>
        </div>

        <div style={{ maxHeight: '24rem', overflowY: 'auto', padding: '0.5rem' }}>
          {combinedItems.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>
              Nenhum resultado encontrado para &quot;{query}&quot;.
            </div>
          ) : (
            combinedItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.925rem' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '0.125rem' }}>
                      {item.description}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.2rem 0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-bg)',
                      color: 'var(--color-primary)'
                    }}
                  >
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            padding: '0.625rem 1.25rem',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            fontSize: '0.75rem',
            color: 'var(--color-muted)',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}
        >
          <span>Use <b>↑</b> <b>↓</b> para navegar</span>
          <span><b>Enter</b> para selecionar</span>
        </div>
      </div>
    </div>
  );
}
