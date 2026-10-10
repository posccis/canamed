import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, ShieldCheck, Stethoscope } from 'lucide-react';
import type { Session } from '../auth/authApi';

interface DoctorProfileMenuProps {
  session: Session;
  onSignOut: () => void;
}

/**
  * Obtém as iniciais do nome do profissional para o avatar.
  * Ignora títulos comuns como "Dr.", "Dra." para pegar as letras do nome e sobrenome reais.
  */
function getInitials(name: string): string {
  const clean = name.replace(/^(dr[a]?\.|prof[a]?\.)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Menu suspenso de perfil médico do cabeçalho superior (SPEC-0029).
 * Substitui o botão "Sair" do rodapé da barra lateral, centralizando a identidade
 * do profissional, informações da clínica ativa e logout seguro.
 */
export function DoctorProfileMenu({ session, onSignOut }: DoctorProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(session.user.name);

  // Fecha o menu ao clicar fora do componente
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

  // Fecha o menu ao pressionar a tecla Escape
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

  function handleSignOutClick() {
    setIsOpen(false);
    onSignOut();
  }

  const roleLabel =
    session.role === 'gestor'
      ? 'Gestor Clínico / Médico'
      : session.role === 'profissional'
        ? 'Médica(o) Assistencial'
        : session.role;

  return (
    <div className="doctor-profile-menu" ref={containerRef}>
      <button
        type="button"
        className="doctor-profile-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Menu de perfil de ${session.user.name}`}
      >
        <span className="doctor-profile-avatar" aria-hidden="true">
          {initials}
        </span>

        <span className="doctor-profile-info">
          <span className="doctor-profile-name">{session.user.name}</span>
          <span className="doctor-profile-role">{session.clinicName}</span>
        </span>

        <ChevronDown
          size={16}
          style={{
            color: 'var(--color-text-muted)',
            transition: 'transform var(--transition-speed) ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="doctor-profile-dropdown" role="menu" aria-label="Opções do usuário">
          <div className="doctor-profile-dropdown__header">
            <div className="doctor-profile-dropdown__name">{session.user.name}</div>
            <div className="doctor-profile-dropdown__meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary-dark)' }}>
                <Stethoscope size={13} />
                <span>{roleLabel}</span>
              </div>
              <div style={{ marginTop: '0.2rem' }}>
                Unidade: <strong>{session.clinicName}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', color: '#166534', fontSize: '0.725rem' }}>
                <ShieldCheck size={13} />
                <span>Sessão Auditada (CFM / LGPD)</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '0.25rem 0' }}>
            <button
              type="button"
              className="doctor-profile-dropdown__item doctor-profile-dropdown__item--danger"
              role="menuitem"
              onClick={handleSignOutClick}
            >
              <LogOut size={16} />
              <span>Encerrar Sessão (Sair)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
