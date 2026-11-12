import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DigitalPrenatalCardPage } from './DigitalPrenatalCardPage';
import { patientApi } from '../patientApi';

vi.mock('../patientApi', () => ({
  patientApi: {
    downloadPrenatalCardPdf: vi.fn(),
  },
}));

describe('DigitalPrenatalCardPage Component (Tela 6 - SPEC-0036 / Stitch Serene Bloom)', () => {
  it('renderiza resumo gestacional com idade gestacional, DUM, DPP e barra de progresso', () => {
    render(
      <DigitalPrenatalCardPage
        patientName="Juliana Rocha Mendes"
        gestationalAgeText="26 sem e 3 dias"
        lastMenstrualPeriod="15/04/2024"
        estimatedDueDate="20/01/2025"
      />
    );

    expect(screen.getByRole('heading', { name: /Cartão da Gestante/i })).toBeInTheDocument();
    expect(screen.getByText(/Juliana Rocha Mendes/i)).toBeInTheDocument();
    expect(screen.getByText(/26 sem e 3 dias/i)).toBeInTheDocument();
    expect(screen.getByText(/15\/04\/2024/i)).toBeInTheDocument();
    expect(screen.getByText(/20\/01\/2025/i)).toBeInTheDocument();
    expect(screen.getByText(/6[56]% concluído/i)).toBeInTheDocument();
  });

  it('exibe badge de alerta para fator Rh negativo com profilaxia anti-D ([P1-02] Clínico)', () => {
    render(
      <DigitalPrenatalCardPage
        bloodType="O-"
        isRhNegative={true}
      />
    );

    expect(screen.getByText(/Alerta Rh Negativo/i)).toBeInTheDocument();
    expect(screen.getByText(/Acompanhamento de Coombs Indireto e Profilaxia Anti-D/i)).toBeInTheDocument();
  });

  it('renderiza linha do tempo pré-natal com aferições clínicas (PA, BCF, AU, Peso)', () => {
    render(<DigitalPrenatalCardPage />);

    expect(screen.getByText(/Linha do Tempo Pré-Natal/i)).toBeInTheDocument();
    expect(screen.getByText(/24ª SEMANA/i)).toBeInTheDocument();
    expect(screen.getAllByText(/110 x 70 mmHg/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/144 bpm/i)).toBeInTheDocument();
    expect(screen.getByText(/23 cm/i)).toBeInTheDocument();
    expect(screen.getByText(/64.8 kg/i)).toBeInTheDocument();
  });

  it('renderiza documentos e laudos anexados em PDF com botões de ação', () => {
    render(<DigitalPrenatalCardPage />);

    expect(screen.getByText(/Documentos e Laudos/i)).toBeInTheDocument();
    expect(screen.getByText(/Morfologia Fetal 2T\.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/Hemograma Completo\.pdf/i)).toBeInTheDocument();
  });

  it('dispara download do PDF oficial do Cartão da Gestante via patientApi', async () => {
    const mockBlob = new Blob(['%PDF-fake'], { type: 'application/pdf' });
    vi.mocked(patientApi.downloadPrenatalCardPdf).mockResolvedValue(mockBlob);

    // Mock URL.createObjectURL and revokeObjectURL
    const originalCreateObjectUrl = window.URL.createObjectURL;
    const originalRevokeObjectUrl = window.URL.revokeObjectURL;
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    window.URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<DigitalPrenatalCardPage sessionToken="valid-token-123" />);

    const downloadButtons = screen.getAllByRole('button', { name: /Baixar Cartão em PDF/i });
    expect(downloadButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(downloadButtons[0]);

    await waitFor(() => {
      expect(patientApi.downloadPrenatalCardPdf).toHaveBeenCalledWith('valid-token-123');
    });

    window.URL.createObjectURL = originalCreateObjectUrl;
    window.URL.revokeObjectURL = originalRevokeObjectUrl;
    clickSpy.mockRestore();
  });

  it('permite acionar botão voltar', () => {
    const handleBack = vi.fn();
    render(<DigitalPrenatalCardPage onBack={handleBack} />);

    const backBtn = screen.getByRole('button', { name: /Voltar para tela anterior/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
