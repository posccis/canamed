import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WalkInBookingPage } from './WalkInBookingPage';

describe('WalkInBookingPage Component (Tela 2 - SPEC-0036 / Stitch)', () => {
  it('renderiza o cabeçalho, modalidades e tags de motivo da consulta', () => {
    render(<WalkInBookingPage />);

    expect(screen.getByRole('heading', { name: /Consulta Avulsa/i })).toBeInTheDocument();
    expect(screen.getByText(/Atendimento Rápido & Sem Vínculo Contínuo/i)).toBeInTheDocument();

    // Modalidades
    expect(screen.getByText(/Telemedicina Imediata \(Plantão\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Presencial nas Clínicas/i)).toBeInTheDocument();

    // Tags de Motivo
    expect(screen.getByRole('button', { name: /Dúvida ou sintoma agudo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Segunda opinião médica/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Renovação de receita \/ Pílula/i })).toBeInTheDocument();
  });

  it('permite alternar entre Telemedicina e Presencial e selecionar médica disponível', () => {
    const handleContinue = vi.fn();
    render(<WalkInBookingPage onContinue={handleContinue} />);

    // Alternar para Presencial
    const radioPresencial = screen.getByLabelText(/Presencial nas Clínicas/i);
    fireEvent.click(radioPresencial);
    expect(radioPresencial).toBeChecked();

    // Selecionar tag de motivo
    const tagRenovacao = screen.getByRole('button', { name: /Renovação de receita \/ Pílula/i });
    fireEvent.click(tagRenovacao);

    // Selecionar médica
    const selectDoctorBtn = screen.getByRole('button', { name: /Escolher Plantão Dra. Beatriz Faria/i });
    fireEvent.click(selectDoctorBtn);

    // Clicar em Continuar
    fireEvent.click(screen.getByRole('button', { name: /Continuar para Confirmação/i }));
    expect(handleContinue).toHaveBeenCalledTimes(1);
    expect(handleContinue).toHaveBeenCalledWith(
      expect.objectContaining({
        modality: 'presencial',
        reason: 'Renovação de receita / Pílula',
        doctorId: expect.any(String),
      })
    );
  });

  it('aciona modal de emergência com discagem SAMU 192 e Plantão 24h em sintomas de Red Flag', () => {
    render(<WalkInBookingPage emergencyPhone="5511999990000" />);

    const textarea = screen.getByPlaceholderText(/Ex: Cólica atípica desde ontem/i);
    fireEvent.change(textarea, { target: { value: 'Estou com sangramento volumoso e dor aguda' } });

    // Deve exibir o aviso imperativo de emergência médica (Red Flags)
    expect(screen.getByText(/Atenção: Sintomas de Emergência Obstétrica/i)).toBeInTheDocument();
    expect(screen.getByText(/Dirija-se imediatamente a um pronto-socorro/i)).toBeInTheDocument();

    // Botões de discagem rápida
    const samuLink = screen.getByRole('link', { name: /Ligar 192 SAMU/i });
    expect(samuLink).toHaveAttribute('href', 'tel:192');

    const emergencyClinicLink = screen.getByRole('link', { name: /Plantão 24h Clínica/i });
    expect(emergencyClinicLink).toHaveAttribute('href', expect.stringContaining('5511999990000'));
  });
});
