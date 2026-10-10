import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DoctorSidebar } from './DoctorSidebar';

describe('DoctorSidebar', () => {
  it('renderiza os links de navegação principais do médico', () => {
    const onToggleCollapse = vi.fn();
    const onCloseMobile = vi.fn();

    render(
      <MemoryRouter>
        <DoctorSidebar
          collapsed={false}
          onToggleCollapse={onToggleCollapse}
          mobileOpen={false}
          onCloseMobile={onCloseMobile}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Clínico')).toBeInTheDocument();
    expect(screen.getByText('Consultório Virtual')).toBeInTheDocument();
    expect(screen.getByText('Minha Agenda')).toBeInTheDocument();
    expect(screen.getByText('Minha fila')).toBeInTheDocument();
    expect(screen.getByText('Prontuário (PEP)')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
    expect(screen.getByText('Retornos e Prazos')).toBeInTheDocument();
  });

  it('aciona onToggleCollapse ao clicar no botão de encolher/expandir', () => {
    const onToggleCollapse = vi.fn();
    const onCloseMobile = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <DoctorSidebar
          collapsed={false}
          onToggleCollapse={onToggleCollapse}
          mobileOpen={false}
          onCloseMobile={onCloseMobile}
        />
      </MemoryRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /Recolher barra lateral/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.getByText('Recolher')).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);

    // Quando recolhido
    rerender(
      <MemoryRouter>
        <DoctorSidebar
          collapsed={true}
          onToggleCollapse={onToggleCollapse}
          mobileOpen={false}
          onCloseMobile={onCloseMobile}
        />
      </MemoryRouter>
    );

    const expandBtn = screen.getByRole('button', { name: /Expandir barra lateral/i });
    expect(expandBtn).toBeInTheDocument();
    // No modo recolhido, o texto 'Recolher' não aparece
    expect(screen.queryByText('Recolher')).not.toBeInTheDocument();
  });

  it('não deve mais conter o botão Sair no rodapé da barra lateral (movido para o perfil)', () => {
    render(
      <MemoryRouter>
        <DoctorSidebar
          collapsed={false}
          onToggleCollapse={vi.fn()}
          mobileOpen={false}
          onCloseMobile={vi.fn()}
        />
      </MemoryRouter>
    );

    // Confirmação de que o botão 'Sair' não reside na sidebar
    expect(screen.queryByRole('button', { name: /^Sair$/i })).not.toBeInTheDocument();
  });

  it('renderiza badges nos itens correspondentes quando fornecidos', () => {
    render(
      <MemoryRouter>
        <DoctorSidebar
          collapsed={false}
          onToggleCollapse={vi.fn()}
          mobileOpen={false}
          onCloseMobile={vi.fn()}
          badges={{ '/medico/fila': 3 }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
