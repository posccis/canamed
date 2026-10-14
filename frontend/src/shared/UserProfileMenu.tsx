import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, User, Settings, Bell, ShieldCheck } from 'lucide-react';
import type { Session } from '../auth/authApi';

interface UserProfileMenuProps {
  session: Session;
  onSignOut: () => void;
  portalSubtitle?: string;
}

function getInitials(name?: string): string {
  if (!name) return 'CM';
  const clean = name.replace(/^(dr[a]?\.|prof[a]?\.)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRole(role?: string): string {
  switch (role) {
    case 'gestor':
      return 'Recepção / Gestão';
    case 'recepcionista':
      return 'Recepção & Atendimento';
    case 'profissional':
      return 'Médica(o) Assistencial';
    case 'dpo':
      return 'Encarregado DPO / LGPD';
    default:
      return role || 'Colaborador';
  }
}

/**
 * Menu de Perfil Oficial idêntico ao protótipo `dashboard_administrativo_canamed.html`.
 * - Avatar em badge circular suave: bg-brand-soft, texto brand-primary, borda brand-lilac/30.
 * - Dropdown flutuante com card de identificação, atalhos e botão de logout em vermelho suave.
 */
export function UserProfileMenu({ session, onSignOut, portalSubtitle }: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(session.user.name);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fecha o menu com a tecla Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef} style={{ position: 'relative' }}>
      <button
        id="profile-button"
        type="button"
        className="profile-trigger-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Menu de perfil de ${session.user.name}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.375rem 0.65rem 0.375rem 0.375rem',
          borderRadius: '12px',
          background: 'transparent',
          border: '1px solid transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Avatar com cores oficiais da marca */}
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'var(--brand-soft, #F7ECF8)',
            color: 'var(--brand-primary, #852A91)',
            border: '1px solid rgba(183, 122, 216, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.875rem',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>

        <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--content-primary, #202631)',
            }}
          >
            {session.user.name}
          </p>
          <p
            style={{
              margin: '0.15rem 0 0',
              fontSize: '0.72rem',
              fontWeight: 500,
              color: 'var(--content-secondary, #626B79)',
            }}
          >
            {portalSubtitle || formatRole(session.role)}
          </p>
        </div>

        <ChevronDown
          size={16}
          style={{
            color: 'var(--content-muted, #858D99)',
            marginLeft: '0.25rem',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Opções do usuário"
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '0.5rem',
            width: '260px',
            backgroundColor: 'var(--base-surface, #FFFFFF)',
            borderRadius: '12px',
            border: '1px solid var(--base-border, #E2E6EC)',
            boxShadow: 'var(--shadow-dropdown, 0 10px 25px -5px rgba(32, 38, 49, 0.12), 0 8px 10px -6px rgba(32, 38, 49, 0.08))',
            padding: '0.5rem 0',
            zIndex: 100,
            animation: 'dropdown-fade 0.15s ease-out',
          }}
        >
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--base-border, #E2E6EC)' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--content-primary, #202631)' }}>
              {session.user.name}
            </p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--content-muted, #858D99)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.user.email}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', color: '#166534', fontSize: '0.72rem', fontWeight: 500 }}>
              <ShieldCheck size={13} />
              <span>{session.clinicName}</span>
            </div>
          </div>

          <div style={{ padding: '0.35rem 0.5rem' }}>
            <a
              href="/app/configuracoes"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'var(--content-secondary, #626B79)',
                textDecoration: 'none',
                borderRadius: '8px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--base-muted, #F1F3F6)';
                e.currentTarget.style.color = 'var(--brand-primary, #852A91)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--content-secondary, #626B79)';
              }}
            >
              <Settings size={16} />
              <span>Configurações da Clínica</span>
            </a>
          </div>

          <div style={{ borderTop: '1px solid var(--base-border, #E2E6EC)', margin: '0.25rem 0' }} />

          <div style={{ padding: '0.35rem 0.5rem' }}>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.55rem 0.75rem',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#C33D49',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FCECEE';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <LogOut size={16} />
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
