import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentModal } from './DocumentModal';
import * as medicalDocumentsApi from './medicalDocumentsApi';

vi.mock('../layout/Toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('./medicalDocumentsApi', () => ({
  createMedicalDocument: vi.fn(),
  signMedicalDocument: vi.fn(),
}));

describe('DocumentModal', () => {
  const defaultProps = {
    isOpen: true,
    patientId: 'patient-123',
    patientName: 'Maria Silva',
    medicalRecordId: 'record-456',
    onClose: vi.fn(),
    onDocumentIssued: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preenche medicamentos e instruções automaticamente quando fornecidos via initialMedications (elimina dupla digitação)', () => {
    render(
      <DocumentModal
        {...defaultProps}
        initialDocType="receita_simples"
        initialMedications="1. Desogestrel 75mcg — Tomar 1 comprimido por via oral diariamente"
        initialGeneralInstructions="Manter ingestão regular com bastante líquido."
      />
    );

    const medInput = screen.getByPlaceholderText(/Nome do Medicamento/i) as HTMLInputElement;
    expect(medInput.value).toBe('Desogestrel 75mcg');

    const instrInput = screen.getByPlaceholderText(/Posologia e Instruções/i) as HTMLInputElement;
    expect(instrInput.value).toBe('Tomar 1 comprimido por via oral diariamente');

    const genInstr = screen.getByPlaceholderText(/Instruções de hidratação/i) as HTMLTextAreaElement;
    expect(genInstr.value).toBe('Manter ingestão regular com bastante líquido.');
  });

  it('exibe alerta e orientações de 2 vias quando selecionada Receita de Controle Especial', () => {
    render(
      <DocumentModal
        {...defaultProps}
        initialDocType="receita_controle_especial"
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent(/Receita de Controle Especial/i);
    expect(screen.getByText(/Portaria SVS\/MS 344\/98/i)).toBeInTheDocument();
    expect(screen.getByText(/1ª VIA \(Retenção da Farmácia\)/i)).toBeInTheDocument();
    expect(screen.getByText(/2ª VIA \(Orientação da Paciente\)/i)).toBeInTheDocument();
  });

  it('ao emitir e imprimir Receita de Controle Especial, gera documento com 2 vias e blocos de Comprador e Fornecedor', async () => {
    const mockCreatedDoc = {
      id: 'doc-789',
      clinicId: 'clinic-1',
      patientId: 'patient-123',
      doctorId: 'doc-1',
      documentType: 'receita_controle_especial' as const,
      status: 'assinado' as const,
      contentPayload: JSON.stringify({
        items: [
          { medication: 'Zolpidem 10mg', concentration: '10mg', route: 'Oral', instructions: '1 cp ao deitar', quantity: '30 cp' }
        ],
        generalInstructions: 'Não ingerir bebidas alcoólicas durante o uso.',
      }),
      publicToken: 'TOKEN123456789',
      signatureHash: 'HASH_DIGITAL_123',
      signedAt: '2026-10-26T12:00:00Z',
      createdAt: '2026-10-26T12:00:00Z',
      patientConsentedCid: false,
    };

    vi.mocked(medicalDocumentsApi.createMedicalDocument).mockResolvedValue(mockCreatedDoc);
    vi.mocked(medicalDocumentsApi.signMedicalDocument).mockResolvedValue(mockCreatedDoc);

    const mockWrite = vi.fn();
    const mockClose = vi.fn();
    const mockPrint = vi.fn();

    vi.spyOn(window, 'open').mockReturnValue({
      document: {
        write: mockWrite,
        close: mockClose,
      },
      print: mockPrint,
    } as unknown as Window);

    render(
      <DocumentModal
        {...defaultProps}
        initialDocType="receita_controle_especial"
        initialMedications="1. Zolpidem 10mg — 1 cp ao deitar"
      />
    );

    // Clica em Assinar e Emitir
    const submitBtn = screen.getByRole('button', { name: /Assinar e Emitir/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Documento Assinado Digitalmente/i)).toBeInTheDocument();
    });

    // Clica em Imprimir Documento
    const printBtn = screen.getByRole('button', { name: /Imprimir Documento/i });
    fireEvent.click(printBtn);

    expect(window.open).toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalled();

    const printedHtml = mockWrite.mock.calls[0][0];
    expect(printedHtml).toContain('1ª VIA — RETENÇÃO DA FARMÁCIA');
    expect(printedHtml).toContain('2ª VIA — ORIENTAÇÃO DA PACIENTE');
    expect(printedHtml).toContain('Identificação do Comprador');
    expect(printedHtml).toContain('Identificação do Fornecedor');
    expect(printedHtml).toContain('page-break-after: always');
  });

  it('filtra hipóteses diagnósticas e preenche apenas diagnósticos confirmados no atestado médico (RN-011)', () => {
    const diagnoses = JSON.stringify([
      { code: 'N86', description: 'Erosão e ectrópio do colo do útero', category: 'confirmed' },
      { code: 'N72', description: 'Suspeita de cervicite', category: 'hypothesis' },
    ]);

    render(
      <DocumentModal
        {...defaultProps}
        initialDocType="atestado_medico"
        initialDiagnoses={diagnoses}
      />
    );

    const cidInput = screen.getByLabelText(/Código CID-10/i) as HTMLInputElement;
    expect(cidInput.value).toBe('N86');
    expect(cidInput.value).not.toContain('N72');
  });
});
