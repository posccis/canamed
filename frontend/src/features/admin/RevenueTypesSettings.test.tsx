import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { RevenueTypesSettings } from './RevenueTypesSettings';

describe('RevenueTypesSettings', () => {
  const mockClinicId = 'test-clinic-id';

  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza os tipos de receita padrão e botões de ação', async () => {
    render(<RevenueTypesSettings clinicId={mockClinicId} />);

    await waitFor(() => {
      expect(screen.getByText('Tipos de Entrada Financeira')).toBeInTheDocument();
      expect(screen.getByText('Primeira Consulta Ginecológica')).toBeInTheDocument();
      expect(screen.getByText('Inserção de Dispositivo Intrauterino (DIU)')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /\+ Novo Tipo de Entrada/i })).toBeInTheDocument();
  });

  it('permite abrir o modal e cadastrar um novo tipo de receita', async () => {
    render(<RevenueTypesSettings clinicId={mockClinicId} />);

    await waitFor(() => {
      expect(screen.getByText('Tipos de Entrada Financeira')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ Novo Tipo de Entrada/i }));

    expect(screen.getByText('Novo Tipo de Entrada Financeira')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Nome da Entrada \*/i), {
      target: { value: 'Cauterização Química de Colo' },
    });
    fireEvent.change(screen.getByLabelText(/Valor Padrão Sugerido \(R\$\) \*/i), {
      target: { value: '180.00' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Salvar Tipo de Entrada/i }));

    await waitFor(() => {
      expect(screen.getByText('Cauterização Química de Colo')).toBeInTheDocument();
    });
  });
});
