import { useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { type Session, switchClinic } from '../auth/authApi';
import type { StaffView } from '../../navigation/routes';
import { UserProfileMenu } from '../../shared/UserProfileMenu';

type TopbarProps = {
  session: Session;
  view: StaffView;
  onToggleMobile: () => void;
  onSignOut: () => void;
  onOpenSearch?: () => void;
  onReloadSession?: () => void;
};

const VIEW_TITLES: Record<StaffView, { breadcrumb: string; title: string }> = {
  dashboard: { breadcrumb: 'Dashboard', title: 'Visão Geral da Clínica' },
  agenda: { breadcrumb: 'Agenda & Recepção', title: 'Agenda de Consultas e Fila do Dia' },
  patients: { breadcrumb: 'Pacientes', title: 'Gestão de Pacientes' },
  professionals: { breadcrumb: 'Profissionais', title: 'Corpo Clínico & Especialistas' },
  queue: { breadcrumb: 'Recepção', title: 'Recepção e Fila de Espera' },
  operation: { breadcrumb: 'Operação', title: 'Salas & Convênios' },
  catalog: { breadcrumb: 'Catálogo', title: 'Catálogo Assistencial' },
  users: { breadcrumb: 'Usuários', title: 'Gestão de Usuários' },
  cashier: { breadcrumb: 'Caixa Diário', title: 'Frente de Caixa & Conferência' },
  financial: { breadcrumb: 'Financeiro', title: 'Fechamento de Caixa' },
  inventory: { breadcrumb: 'Estoque', title: 'Insumos Clínicos' },
  dpo: { breadcrumb: 'DPO', title: 'Privacidade & LGPD' },
  policies: { breadcrumb: 'Políticas', title: 'Regras de Agendamento' },
  tv: { breadcrumb: 'Painel TV', title: 'Painel de Chamada do Saguão' },
  links: { breadcrumb: 'Links', title: 'Central de Links' },
  settings: { breadcrumb: 'Configurações', title: 'Configurações da Clínica' },
};

export function Topbar({ session, view, onToggleMobile, onSignOut, onOpenSearch, onReloadSession }: TopbarProps) {
  const [switching, setSwitching] = useState(false);
  const currentView = VIEW_TITLES[view] || { breadcrumb: 'Administração', title: 'Painel Geral' };

  async function handleClinicChange(newClinicId: string) {
    if (!newClinicId || newClinicId === session.clinicId || switching) return;
    setSwitching(true);
    try {
      await switchClinic(newClinicId);
      onReloadSession?.();
    } catch {
      // Ignora erro de troca de clínica
    } finally {
      setSwitching(false);
    }
  }

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobile}
          aria-label="Abrir menu de navegação"
          title="Abrir menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Breadcrumb idêntico ao protótipo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: 'var(--content-muted, #858D99)',
              fontWeight: 500,
              gap: '0.4rem',
              lineHeight: 1.2,
              marginBottom: '0.2rem',
            }}
          >
            <span style={{ color: 'var(--brand-primary, #852A91)', fontWeight: 600 }}>Administração</span>
            <span style={{ fontSize: '0.7rem' }}>›</span>
            <span>{currentView.breadcrumb}</span>
          </div>
          <h1 className="topbar__title" style={{ margin: 0, fontSize: '1.18rem', fontWeight: 700, color: 'var(--content-primary, #202631)' }}>
            {currentView.title}
          </h1>
        </div>

        {/* Seletor de Clínica estilizado */}
        {session.clinics && session.clinics.length > 1 ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.75rem' }}>
            <select
              aria-label="Selecionar Unidade ou Clínica"
              className="topbar__clinic-tag"
              style={{
                cursor: 'pointer',
                background: 'var(--base-surface, #FFFFFF)',
                border: '1px solid var(--base-border, #E2E6EC)',
                color: 'var(--brand-primary, #852A91)',
                fontWeight: 600,
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '0.8rem',
              }}
              value={session.clinicId}
              disabled={switching}
              onChange={(e) => void handleClinicChange(e.target.value)}
            >
              {session.clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role})
                </option>
              ))}
            </select>
            {switching && <span style={{ fontSize: '0.75rem', color: 'var(--content-muted)' }}>Trocando...</span>}
          </div>
        ) : (
          <span
            className="topbar__clinic-tag"
            style={{
              marginLeft: '0.75rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--brand-primary, #852A91)',
              background: 'var(--brand-soft, #F7ECF8)',
              border: '1px solid rgba(183, 122, 216, 0.3)',
              borderRadius: '999px',
              padding: '0.2rem 0.65rem',
            }}
          >
            🏥 {session.clinicName}
          </span>
        )}
      </div>

      <div className="topbar__right">
        {onOpenSearch ? (
          <button
            type="button"
            className="button button--ghost"
            onClick={onOpenSearch}
            title="Busca rápida (Ctrl+K)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.75rem',
              fontSize: '0.82rem',
              color: 'var(--content-secondary, #626B79)',
              borderRadius: '8px',
              border: '1px solid var(--base-border, #E2E6EC)',
              backgroundColor: 'var(--base-surface, #FFFFFF)',
            }}
          >
            <Search size={15} />
            <span>Buscar</span>
            <kbd
              style={{
                fontSize: '0.7rem',
                padding: '0.1rem 0.35rem',
                border: '1px solid var(--base-border, #E2E6EC)',
                borderRadius: '4px',
                backgroundColor: 'var(--base-muted, #F1F3F6)',
                fontFamily: 'inherit',
              }}
            >
              Ctrl+K
            </kbd>
          </button>
        ) : null}

        {/* Notificações (Sino do Protótipo) */}
        <button
          type="button"
          title="Notificações"
          aria-label="Notificações da clínica"
          style={{
            position: 'relative',
            padding: '0.5rem',
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            color: 'var(--content-secondary, #626B79)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
          <Bell size={20} />
          <span
            style={{
              position: 'absolute',
              top: '7px',
              right: '7px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#C33D49',
              border: '1.5px solid #FFFFFF',
            }}
          />
        </button>

        {/* Divisor Vertical do Protótipo */}
        <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--base-border, #E2E6EC)' }} />

        {/* Menu de Perfil com Dropdown Oficial */}
        <UserProfileMenu
          session={session}
          onSignOut={onSignOut}
          portalSubtitle="Recepção / Gestão"
        />
      </div>
    </header>
  );
}
