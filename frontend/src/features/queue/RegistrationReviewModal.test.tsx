import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegistrationReviewModal } from './RegistrationReviewModal';

const mocks = vi.hoisted(() => ({
  listPendingRegistrationReviews: vi.fn(),
  approveRegistrationReview: vi.fn(),
  returnRegistrationReview: vi.fn(),
}));

vi.mock('../patient/patientApi', () => ({
  patientApi: {
    listPendingRegistrationReviews: mocks.listPendingRegistrationReviews,
    approveRegistrationReview: mocks.approveRegistrationReview,
    returnRegistrationReview: mocks.returnRegistrationReview,
  },
}));

describe('RegistrationReviewModal Component (SPEC-0026 / F-004 / RN-016)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockReviews = [
    {
      draftId: 'draft-1',
      clinicId: 'clinic-1',
      patientId: 'pat-1',
      patientName: 'Severino Silva',
      patientPhone: '(81) 99999-1111',
      status: 'pending_review',
      payloadJson: JSON.stringify({
        name: 'Severino Silva',
        document: '111.222.333-44',
        birthDate: '1985-05-15',
        phone: '(81) 99999-1111',
        email: 'severino@email.com',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Boa Viagem',
        city: 'Recife',
        state: 'PE',
        healthPlanName: 'Unimed Recife',
        healthPlanCardNumber: '99887766',
        allergies: 'Dipirona',
      }),
      submittedAt: '2026-10-03T10:00:00Z',
    },
  ];

  it('lista os cadastros pendentes e exibe os dados do paciente selecionado', async () => {
    mocks.listPendingRegistrationReviews.mockResolvedValue(mockReviews);

    render(
      <RegistrationReviewModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Validação de Cadastros Prévios (F-004 / RN-016)')).toBeInTheDocument();
      expect(screen.getByText('Pendentes de Conferência (1)')).toBeInTheDocument();
      expect(screen.getAllByText('Severino Silva').length).toBeGreaterThan(0);
      expect(screen.getByText('111.222.333-44')).toBeInTheDocument();
      expect(screen.getByText('Rua das Flores, nº 123')).toBeInTheDocument();
      expect(screen.getByText('Unimed Recife')).toBeInTheDocument();
      expect(screen.getByText('Dipirona')).toBeInTheDocument();
    });
  });

  it('permite que a recepção aprove o cadastro', async () => {
    mocks.listPendingRegistrationReviews.mockResolvedValue(mockReviews);
    mocks.approveRegistrationReview.mockResolvedValueOnce({ message: 'Aprovado' });

    const onComplete = vi.fn();
    render(
      <RegistrationReviewModal
        isOpen={true}
        onClose={vi.fn()}
        onReviewCompleted={onComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Severino Silva').length).toBeGreaterThan(0);
    });

    const approveBtn = screen.getByRole('button', { name: /Aprovar e Consolidar Cadastro/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(mocks.approveRegistrationReview).toHaveBeenCalledWith('draft-1');
      expect(onComplete).toHaveBeenCalled();
      expect(screen.getByText(/Cadastro de Severino Silva aprovado com sucesso!/i)).toBeInTheDocument();
    });
  });

  it('permite que a recepção devolva o cadastro solicitando ajustes', async () => {
    mocks.listPendingRegistrationReviews.mockResolvedValue(mockReviews);
    mocks.returnRegistrationReview.mockResolvedValueOnce({ message: 'Devolvido' });

    const onComplete = vi.fn();
    render(
      <RegistrationReviewModal
        isOpen={true}
        onClose={vi.fn()}
        onReviewCompleted={onComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Severino Silva').length).toBeGreaterThan(0);
    });

    const requestAdjustmentsBtn = screen.getByRole('button', { name: /Solicitar Ajustes/i });
    fireEvent.click(requestAdjustmentsBtn);

    const textarea = screen.getByPlaceholderText(/Favor conferir o número do CPF digitado/i);
    fireEvent.change(textarea, { target: { value: 'Favor anexar carteirinha do plano legível.' } });

    const confirmReturnBtn = screen.getByRole('button', { name: /Confirmar Devolução/i });
    fireEvent.click(confirmReturnBtn);

    await waitFor(() => {
      expect(mocks.returnRegistrationReview).toHaveBeenCalledWith(
        'draft-1',
        'Favor anexar carteirinha do plano legível.'
      );
      expect(onComplete).toHaveBeenCalled();
      expect(screen.getByText(/Cadastro devolvido com orientações para Severino Silva./i)).toBeInTheDocument();
    });
  });
});
