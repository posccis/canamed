import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuestBookingFormPage } from './GuestBookingFormPage';
import { patientApi } from '../patientApi';

vi.mock('../patientApi', () => ({
  patientApi: {
    bookGuestAppointment: vi.fn(),
  },
}));

describe('GuestBookingFormPage Component (Tela 3 - SPEC-0036 / Stitch)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza resumo do plantão selecionado, campos CFM e triagem de segurança', () => {
    render(
      <GuestBookingFormPage
        doctorName="Dra. Beatriz Faria"
        doctorCrm="CRM-SP 184.220"
        price="R$ 290,00"
        estimatedWait="Em ~20 minutos"
      />
    );

    expect(screen.getByText('Dra. Beatriz Faria')).toBeInTheDocument();
    expect(screen.getByText(/CRM-SP 184.220/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 290,00/i)).toBeInTheDocument();
    expect(screen.getByText(/Em ~20 minutos/i)).toBeInTheDocument();

    // Campos CFM
    expect(screen.getByLabelText(/Nome Completo da Paciente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CPF \(Obrigatório CFM\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data de Nascimento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/WhatsApp para Receitas/i)).toBeInTheDocument();

    // Triagem
    expect(screen.getByText(/Possui alergia medicamentosa comum\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Você está gestante no momento\?/i)).toBeInTheDocument();

    // Nota fiscal
    expect(screen.getByLabelText(/Emitir Nota Fiscal para o mesmo CPF da paciente/i)).toBeInTheDocument();

    // Botão de ação fixado
    expect(screen.getByRole('button', { name: /Confirmar e Entrar na Sala Virtual/i })).toBeInTheDocument();

    // Sem Bottom Navigation de 5 itens no mobile (desempilhamento)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('valida CPF e impede envio quando CPF for inválido', async () => {
    render(<GuestBookingFormPage />);

    const cpfInput = screen.getByLabelText(/CPF \(Obrigatório CFM\)/i);
    fireEvent.change(cpfInput, { target: { value: '111.111.111-11' } });

    const submitBtn = screen.getByRole('button', { name: /Confirmar e Entrar na Sala Virtual/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/CPF inválido/i)).toBeInTheDocument();
    expect(patientApi.bookGuestAppointment).not.toHaveBeenCalled();
  });

  it('permite selecionar alergias, marcar gestante e submeter com sucesso', async () => {
    const handleSuccess = vi.fn();
    vi.mocked(patientApi.bookGuestAppointment).mockResolvedValueOnce({
      appointmentId: 'appt-123',
      startsAt: '2026-10-28T18:00:00Z',
      doctorName: 'Dra. Beatriz Faria',
      meetUrl: 'https://meet.canamed.com.br/sala/appt-123',
    });

    render(
      <GuestBookingFormPage
        clinicId="clinic-test"
        professionalId="doc-beatriz"
        onSuccess={handleSuccess}
      />
    );

    // Preenche campos
    fireEvent.change(screen.getByLabelText(/Nome Completo da Paciente/i), {
      target: { value: 'Mariana Silveira' },
    });
    // CPF válido (algoritmo): 52998224725
    fireEvent.change(screen.getByLabelText(/CPF \(Obrigatório CFM\)/i), {
      target: { value: '529.982.247-25' },
    });
    fireEvent.change(screen.getByLabelText(/Data de Nascimento/i), {
      target: { value: '1995-04-10' },
    });
    fireEvent.change(screen.getByLabelText(/WhatsApp para Receitas/i), {
      target: { value: '(11) 98765-4321' },
    });

    // Seleciona alergia Dipirona
    const allergyDipirona = screen.getByLabelText(/Dipirona/i);
    fireEvent.click(allergyDipirona);

    // Seleciona Gestante Sim
    const pregnantSim = screen.getByLabelText(/Sim, gestante/i);
    fireEvent.click(pregnantSim);

    // Clica em confirmar
    const submitBtn = screen.getByRole('button', { name: /Confirmar e Entrar na Sala Virtual/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(patientApi.bookGuestAppointment).toHaveBeenCalledWith(
        expect.objectContaining({
          patientName: 'Mariana Silveira',
          cpf: '529.982.247-25',
          allergies: 'Dipirona',
          isPregnant: true,
          wantsInvoice: true,
        })
      );
    });

    expect(handleSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: 'appt-123',
      })
    );
  });
});
