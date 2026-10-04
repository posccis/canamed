import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PatientRegistrationPage } from './PatientRegistrationPage';

const mocks = vi.hoisted(() => ({
  getRegistrationDraft: vi.fn(),
  updateRegistrationDraft: vi.fn(),
  submitRegistrationDraft: vi.fn(),
}));

vi.mock('../patientApi', () => ({
  patientApi: {
    getRegistrationDraft: mocks.getRegistrationDraft,
    updateRegistrationDraft: mocks.updateRegistrationDraft,
    submitRegistrationDraft: mocks.submitRegistrationDraft,
  },
}));

describe('PatientRegistrationPage Component (SPEC-0026 / F-004)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega e preenche o formulário a partir do rascunho existente', async () => {
    mocks.getRegistrationDraft.mockResolvedValueOnce({
      draftId: 'draft-1',
      clinicId: 'clinic-1',
      patientId: 'patient-1',
      clinicSlug: 'cana-med',
      status: 'draft',
      patientNameMasked: 'M*** S***',
      payloadJson: JSON.stringify({
        name: 'Maria da Silva',
        document: '123.456.789-00',
        phone: '(81) 98888-7777',
        city: 'Recife',
        state: 'PE',
      }),
    });

    render(
      <MemoryRouter initialEntries={['/p/cana-med/cadastro/token-valido']}>
        <Routes>
          <Route path="/p/:slug/cadastro/:token" element={<PatientRegistrationPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Cadastro Completo')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Maria da Silva')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123.456.789-00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('(81) 98888-7777')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Recife')).toBeInTheDocument();
      expect(screen.getByDisplayValue('PE')).toBeInTheDocument();
    });
  });

  it('permite submeter o formulário para validação da recepção', async () => {
    mocks.getRegistrationDraft.mockResolvedValueOnce({
      draftId: 'draft-1',
      clinicId: 'clinic-1',
      patientId: 'patient-1',
      clinicSlug: 'cana-med',
      status: 'draft',
      patientNameMasked: 'M*** S***',
      payloadJson: JSON.stringify({
        name: 'Maria da Silva',
        phone: '(81) 98888-7777',
      }),
    });

    mocks.submitRegistrationDraft.mockResolvedValueOnce({
      draftId: 'draft-1',
      clinicId: 'clinic-1',
      patientId: 'patient-1',
      clinicSlug: 'cana-med',
      status: 'pending_review',
      patientNameMasked: 'M*** S***',
      payloadJson: JSON.stringify({
        name: 'Maria da Silva',
        phone: '(81) 98888-7777',
      }),
    });

    render(
      <MemoryRouter initialEntries={['/p/cana-med/cadastro/token-valido']}>
        <Routes>
          <Route path="/p/:slug/cadastro/:token" element={<PatientRegistrationPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Maria da Silva')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Enviar cadastro para conferência/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mocks.submitRegistrationDraft).toHaveBeenCalledWith(
        'token-valido',
        expect.stringContaining('Maria da Silva')
      );
      expect(screen.getByText(/Cadastro em Análise/i)).toBeInTheDocument();
    });
  });

  it('exibe badge e desabilita campos quando status é approved', async () => {
    mocks.getRegistrationDraft.mockResolvedValueOnce({
      draftId: 'draft-1',
      clinicId: 'clinic-1',
      patientId: 'patient-1',
      clinicSlug: 'cana-med',
      status: 'approved',
      patientNameMasked: 'M*** S***',
      payloadJson: JSON.stringify({
        name: 'Maria da Silva',
        phone: '(81) 98888-7777',
      }),
    });

    render(
      <MemoryRouter initialEntries={['/p/cana-med/cadastro/token-valido']}>
        <Routes>
          <Route path="/p/:slug/cadastro/:token" element={<PatientRegistrationPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Cadastro Aprovado!')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Enviar cadastro para conferência/i })).not.toBeInTheDocument();
    });
  });

  it('exibe orientações quando status é returned', async () => {
    mocks.getRegistrationDraft.mockResolvedValueOnce({
      draftId: 'draft-1',
      clinicId: 'clinic-1',
      patientId: 'patient-1',
      clinicSlug: 'cana-med',
      status: 'returned',
      reviewNote: 'Favor conferir o número do CPF e reenviar.',
      patientNameMasked: 'M*** S***',
      payloadJson: JSON.stringify({
        name: 'Maria da Silva',
        phone: '(81) 98888-7777',
      }),
    });

    render(
      <MemoryRouter initialEntries={['/p/cana-med/cadastro/token-valido']}>
        <Routes>
          <Route path="/p/:slug/cadastro/:token" element={<PatientRegistrationPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ajustes Solicitados pela Recepção')).toBeInTheDocument();
      expect(screen.getByText('Favor conferir o número do CPF e reenviar.')).toBeInTheDocument();
    });
  });
});
