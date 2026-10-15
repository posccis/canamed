import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AgendaRecepcaoPanel } from './AgendaRecepcaoPanel';

// Mocks dos módulos internos
vi.mock('./AgendaPage', () => ({
  AgendaPage: () => <div data-testid="mock-agenda-page">Grade da Agenda</div>,
}));

vi.mock('../queue/QueuePanel', () => ({
  QueuePanel: () => <div data-testid="mock-queue-panel">Fila & Recepção</div>,
}));

describe('AgendaRecepcaoPanel', () => {
  it('renderiza o cabeçalho e o alternador de visão de 1 clique', () => {
    render(<AgendaRecepcaoPanel />);

    expect(screen.getByText('Agenda & Recepção')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Grade da Agenda/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fila & Recepção/i })).toBeInTheDocument();
  });

  it('permite alternar entre a Grade da Agenda e a Fila & Recepção com preservação de contexto', () => {
    render(<AgendaRecepcaoPanel initialView="agenda" />);

    // Por padrão exibe a Grade da Agenda
    expect(screen.getByTestId('mock-agenda-page')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-queue-panel')).not.toBeInTheDocument();

    // Clica para alternar para Fila & Recepção
    fireEvent.click(screen.getByRole('button', { name: /Fila & Recepção/i }));

    expect(screen.getByTestId('mock-queue-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-agenda-page')).not.toBeInTheDocument();

    // Retorna para a Grade
    fireEvent.click(screen.getByRole('button', { name: /Grade da Agenda/i }));
    expect(screen.getByTestId('mock-agenda-page')).toBeInTheDocument();
  });
});
