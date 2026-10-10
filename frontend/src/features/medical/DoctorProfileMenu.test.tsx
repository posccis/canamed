import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DoctorProfileMenu } from './DoctorProfileMenu';
import type { Session } from '../auth/authApi';

const mockSession: Session = {
  user: {
    id: 'user-1',
    name: 'Dra. Ana Ribeiro',
    email: 'dra.ana@canamed.local',
  },
  clinicId: 'clinic-1',
  clinicName: 'Cana Med Gravatá',
  role: 'profissional',
  permissions: ['records:read', 'records:write'],
  professionalId: 'prof-1',
  mfaEnabled: true,
  mfaPending: false,
  clinics: [{ id: 'clinic-1', name: 'Cana Med Gravatá', role: 'profissional' }],
  expiresAt: '2026-10-09T20:00:00Z',
};

describe('DoctorProfileMenu', () => {
  it('renderiza o botão gatilho com iniciais e nome do médico', () => {
    const onSignOut = vi.fn();
    render(<DoctorProfileMenu session={mockSession} onSignOut={onSignOut} />);

    // Iniciais de "Dra. Ana Ribeiro" devem ser "AR"
    expect(screen.getByText('AR')).toBeInTheDocument();
    expect(screen.getByText('Dra. Ana Ribeiro')).toBeInTheDocument();
    expect(screen.getByText('Cana Med Gravatá')).toBeInTheDocument();
  });

  it('abre o menu suspenso ao clicar e exibe informações profissionais e botão de logout', () => {
    const onSignOut = vi.fn();
    render(<DoctorProfileMenu session={mockSession} onSignOut={onSignOut} />);

    const trigger = screen.getByRole('button', { name: /Menu de perfil/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Clica para abrir
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Conteúdo do menu
    expect(screen.getByText('Médica(o) Assistencial')).toBeInTheDocument();
    expect(screen.getByText(/Sessão Auditada/i)).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Encerrar Sessão \(Sair\)/i })).toBeInTheDocument();
  });

  it('chama onSignOut e fecha o menu ao clicar em Encerrar Sessão', () => {
    const onSignOut = vi.fn();
    render(<DoctorProfileMenu session={mockSession} onSignOut={onSignOut} />);

    const trigger = screen.getByRole('button', { name: /Menu de perfil/i });
    fireEvent.click(trigger);

    const logoutBtn = screen.getByRole('menuitem', { name: /Encerrar Sessão \(Sair\)/i });
    fireEvent.click(logoutBtn);

    expect(onSignOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('fecha o menu ao pressionar a tecla Escape', () => {
    const onSignOut = vi.fn();
    render(<DoctorProfileMenu session={mockSession} onSignOut={onSignOut} />);

    const trigger = screen.getByRole('button', { name: /Menu de perfil/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('menuitem')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });
});
