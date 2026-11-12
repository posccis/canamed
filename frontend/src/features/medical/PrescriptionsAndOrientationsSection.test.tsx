import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PrescriptionsAndOrientationsSection } from './PrescriptionsAndOrientationsSection';

describe('PrescriptionsAndOrientationsSection', () => {
  it('renderiza os blocos segregados de prescrição e orientações', () => {
    render(
      <PrescriptionsAndOrientationsSection
        prescriptionNotes=""
        onPrescriptionNotesChange={vi.fn()}
        generalOrientationNotes=""
        onGeneralOrientationNotesChange={vi.fn()}
      />
    );

    expect(screen.getByText('Prescrições Segregadas & Recomendações Assistenciais')).toBeInTheDocument();
    expect(screen.getByText(/Prescrição Medicamentosa/i)).toBeInTheDocument();
    expect(screen.getByText(/Orientações Gerais, Estilo de Vida/i)).toBeInTheDocument();
  });

  it('insere template de anticoncepcional ao clicar no botão correspondente', () => {
    const handlePrescChange = vi.fn();
    render(
      <PrescriptionsAndOrientationsSection
        prescriptionNotes=""
        onPrescriptionNotesChange={handlePrescChange}
        generalOrientationNotes=""
        onGeneralOrientationNotesChange={vi.fn()}
      />
    );

    const btnAnticoncepcional = screen.getByText('+ Anticoncepcional Oral');
    fireEvent.click(btnAnticoncepcional);

    expect(handlePrescChange).toHaveBeenCalledWith(
      expect.stringContaining('Desogestrel 75mcg')
    );
  });

  it('dispara onEmitPrescription com tipo correto ao clicar nos botões de emissão', () => {
    const handleEmit = vi.fn();
    render(
      <PrescriptionsAndOrientationsSection
        prescriptionNotes="1. Fluconazol 150mg"
        onPrescriptionNotesChange={vi.fn()}
        generalOrientationNotes=""
        onGeneralOrientationNotesChange={vi.fn()}
        onEmitPrescription={handleEmit}
      />
    );

    const btnReceitaSimples = screen.getByRole('button', { name: /Emitir Receita Médica/i });
    fireEvent.click(btnReceitaSimples);
    expect(handleEmit).toHaveBeenCalledWith('receita_simples');

    const btnReceitaEspecial = screen.getByRole('button', { name: /Receita Especial \(2 Vias\)/i });
    fireEvent.click(btnReceitaEspecial);
    expect(handleEmit).toHaveBeenCalledWith('receita_controle_especial');
  });
});
