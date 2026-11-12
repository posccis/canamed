import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PatientPortal } from './PatientPortal';
import { ToastProvider } from '../layout/Toast';

const mocks = vi.hoisted(() => ({
  getPortalMeta: vi.fn(),
  requestOtp: vi.fn(),
  verifyOtp: vi.fn(),
  getAvailableSlots: vi.fn(),
  getMyAppointments: vi.fn(),
  getMyDocuments: vi.fn(),
}));

vi.mock('./patientApi', () => ({
  patientApi: {
    getPortalMeta: mocks.getPortalMeta,
    requestOtp: mocks.requestOtp,
    verifyOtp: mocks.verifyOtp,
    getAvailableSlots: mocks.getAvailableSlots,
    getMyAppointments: mocks.getMyAppointments,
    getMyDocuments: mocks.getMyDocuments,
  },
}));

describe('PatientPortal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.scrollTo = vi.fn();
  });

  it('renderiza a tela inicial acolhedora com header CANA MED Mulher e botão para autenticar quando não há sessão', async () => {
    mocks.getPortalMeta.mockResolvedValueOnce({
      clinicId: 'clinic-1',
      clinicName: 'Clínica CanaMed Recife',
      specialties: [],
      professionals: [],
    });

    render(
      <ToastProvider>
        <PatientPortal />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('CANA MED')).toBeInTheDocument();
      expect(screen.getByText('Mulher')).toBeInTheDocument();
      expect(screen.getByText(/Bem-vinda à sua área de saúde/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
      expect(screen.getByText('Seu próximo compromisso')).toBeInTheDocument();
      expect(screen.getByText('Nova Consulta')).toBeInTheDocument();
      expect(screen.getByText('Falar com Clínica')).toBeInTheDocument();
    });
  });

  it('renderiza o portal com abas inferiores e saudação quando o paciente está autenticado', async () => {
    localStorage.setItem(
      'canamed_patient_session',
      JSON.stringify({
        token: 'test-token',
        patientId: 'pat-1',
        patientName: 'Maria Silva',
      })
    );

    mocks.getPortalMeta.mockResolvedValueOnce({
      clinicId: 'clinic-1',
      clinicName: 'Clínica CanaMed Recife',
      specialties: [{ id: 'spec-1', name: 'Clínica Geral' }],
      professionals: [{ id: 'doc-1', name: 'Dr. Roberto', specialtyId: 'spec-1' }],
    });
    mocks.getAvailableSlots.mockResolvedValueOnce([]);
    mocks.getMyAppointments.mockResolvedValueOnce([]);

    render(
      <ToastProvider>
        <PatientPortal />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Olá, Maria!/i)).toBeInTheDocument();
      expect(screen.getByText('Início')).toBeInTheDocument();
      expect(screen.getByText('Agendar')).toBeInTheDocument();
      expect(screen.getByText('Consultas')).toBeInTheDocument();
      expect(screen.getByText('Perfil')).toBeInTheDocument();
    });
  });

  it('renderiza o fluxo de agendamento em etapas progressivas', async () => {
    localStorage.setItem(
      'canamed_patient_session',
      JSON.stringify({
        token: 'test-token',
        patientId: 'pat-1',
        patientName: 'Maria Silva',
      })
    );

    mocks.getPortalMeta.mockResolvedValueOnce({
      clinicId: 'clinic-1',
      clinicName: 'Clínica CanaMed Recife',
      specialties: [{ id: 'spec-1', name: 'Ginecologia Geral' }],
      professionals: [{ id: 'doc-1', name: 'Dra. Helena Costa', specialtyId: 'spec-1' }],
    });
    mocks.getAvailableSlots.mockResolvedValueOnce([]);
    mocks.getMyAppointments.mockResolvedValueOnce([]);

    render(
      <ToastProvider>
        <PatientPortal initialTab="schedule" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Com quem deseja passar?')).toBeInTheDocument();
      expect(screen.getByText('Especialista')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('Horário')).toBeInTheDocument();
      expect(screen.getByText('Confirmação')).toBeInTheDocument();
    });
  });

  it('permite selecionar a modalidade de atendimento no Passo 1, repassa appointmentTypeId para getAvailableSlots no Passo 3 e exibe orientações de preparo no Passo 4', async () => {
    localStorage.setItem(
      'canamed_patient_session',
      JSON.stringify({
        token: 'test-token',
        patientId: 'pat-1',
        patientName: 'Maria Silva',
      })
    );

    const recentCompletedDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

    mocks.getPortalMeta.mockResolvedValueOnce({
      clinicId: 'clinic-1',
      clinicName: 'Clínica CanaMed Recife',
      specialties: [{ id: 'spec-1', name: 'Ginecologia Geral' }],
      professionals: [{ id: 'doc-1', name: 'Dra. Helena Costa', specialtyId: 'spec-1' }],
      appointmentTypes: [
        { id: 'type-rotina', name: 'Consulta Ginecológica de Rotina', durationMinutes: 30 },
        { id: 'type-preventivo', name: 'Exame Preventivo / Papanicolaou', durationMinutes: 30 },
        { id: 'type-retorno', name: 'Retorno de Consulta (CFM 30 dias)', durationMinutes: 20 },
      ],
    });
    mocks.getMyAppointments.mockResolvedValueOnce([
      {
        id: 'appt-prev',
        professionalId: 'doc-1',
        professionalName: 'Dra. Helena Costa',
        specialtyName: 'Ginecologia Geral',
        startsAt: recentCompletedDate,
        endsAt: recentCompletedDate,
        status: 'realizado',
      },
    ]);
    mocks.getAvailableSlots.mockResolvedValueOnce([
      {
        professionalId: 'doc-1',
        professionalName: 'Dra. Helena Costa',
        startsAt: '2026-10-28T14:00:00.000Z',
        endsAt: '2026-10-28T14:30:00.000Z',
        durationMinutes: 30,
      },
    ]);

    const { container } = render(
      <ToastProvider>
        <PatientPortal initialTab="schedule" />
      </ToastProvider>
    );

    // Verifica banner de elegibilidade de retorno CFM 1.958/2010
    await waitFor(() => {
      expect(screen.getByText(/Elegível para Retorno sem custo \(CFM 1\.958\/2010\)/i)).toBeInTheDocument();
    });

    // Seleciona a modalidade no Passo 1
    const modalitySelect = screen.getByLabelText(/Modalidade \/ Tipo de Atendimento/i);
    fireEvent.change(modalitySelect, { target: { value: 'type-preventivo' } });

    // Seleciona a médica no Passo 1
    fireEvent.click(screen.getByText('Dra. Helena Costa'));

    // Avança para o Passo 2 (Data)
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await waitFor(() => {
      expect(screen.getByText('Escolha a data')).toBeInTheDocument();
    });

    // Avança para o Passo 3 (Horários)
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => {
      expect(mocks.getAvailableSlots).toHaveBeenCalledWith(
        'clinic-1',
        'spec-1',
        expect.any(String),
        'doc-1',
        'type-preventivo'
      );
    });

    // Seleciona o primeiro horário disponível e avança para o Passo 4 (Confirmação)
    const slotButtons = container.querySelectorAll('main button');
    // Clica no horário retornado
    const timeButton = Array.from(slotButtons).find((b) => b.textContent?.includes(':'));
    expect(timeButton).toBeTruthy();
    fireEvent.click(timeButton!);

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    // Verifica orientações clínicas de preparo no Passo 4 e paleta oficial (sem #852A91)
    await waitFor(() => {
      expect(screen.getByText(/Orientações Clínicas de Preparo/i)).toBeInTheDocument();
      expect(screen.getByText(/Para coleta de preventivo \(Papanicolaou\): evite relações sexuais/i)).toBeInTheDocument();
    });
    expect(container.innerHTML).not.toContain('#852A91');
  });

  it('renderiza os bento cards de entrada mobile do Stitch (Agendar sem criar conta vs Quero criar minha conta) e permite navegação direta', async () => {
    mocks.getPortalMeta.mockResolvedValueOnce({
      clinicId: 'clinic-1',
      clinicName: 'Clínica Serena Saúde da Mulher',
      specialties: [{ id: 'spec-1', name: 'Ginecologia Geral' }],
      professionals: [{ id: 'doc-1', name: 'Dra. Beatriz Faria', specialtyId: 'spec-1' }],
    });

    render(
      <ToastProvider>
        <PatientPortal />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Vamos cuidar de você?')).toBeInTheDocument();
      expect(screen.getByText('Agendar sem criar conta')).toBeInTheDocument();
      expect(screen.getByText('Mais Rápido • Menos de 1 min')).toBeInTheDocument();
      expect(screen.getByText('Quero criar minha conta')).toBeInTheDocument();
      expect(screen.getByText('Experiência Completa')).toBeInTheDocument();
      expect(screen.getByText(/Dúvidas com o agendamento\?/i)).toBeInTheDocument();
    });

    // Clica em Continuar sem conta -> Deve navegar diretamente para a etapa de agendamento
    fireEvent.click(screen.getByRole('button', { name: /Continuar sem conta/i }));

    await waitFor(() => {
      expect(screen.getByText('Com quem deseja passar?')).toBeInTheDocument();
      expect(screen.getByText('Especialista')).toBeInTheDocument();
    });
  });
});


