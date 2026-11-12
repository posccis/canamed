import { render, screen, waitFor } from '@testing-library/react';
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
  it('renderiza os cards de atendimento GO com título, ícone e duração estimada', async () => {
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
      expect(screen.getByText('1ª Consulta Ginecológica')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();
      expect(screen.getByText('Retorno de Exames')).toBeInTheDocument();
      expect(screen.getByText('20 min')).toBeInTheDocument();
      expect(screen.getByText('Consulta Pré-Natal')).toBeInTheDocument();
      expect(screen.getAllByText('40 min')).toHaveLength(2);
      expect(screen.getByText('Preventivo / Papanicolaou')).toBeInTheDocument();
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('Inserção / Revisão de DIU')).toBeInTheDocument();
    });
  });

  it('abre o modal de preparo pré-exame obrigatoriamente ao selecionar Preventivo ou Inserção de DIU', async () => {
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
      expect(screen.getByText('Preventivo / Papanicolaou')).toBeInTheDocument();
    });

    const preventivoCard = screen.getByText('Preventivo / Papanicolaou').closest('button');
    preventivoCard?.click();

    await waitFor(() => {
      expect(screen.getByText(/Orientações de Preparo Pré-Exame/i)).toBeInTheDocument();
      expect(screen.getByText(/Não tive relações sexuais nas últimas 48 horas/i)).toBeInTheDocument();
      expect(screen.getByText(/Não fiz uso de pomadas, cremes ou duchas vaginais/i)).toBeInTheDocument();
      expect(screen.getByText(/Estou fora do período de sangramento menstrual/i)).toBeInTheDocument();
    });
  });

    it('bloqueia o avanço e exige confirmação do checklist de preparo para Preventivo ou DIU', async () => {
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
      expect(screen.getByText('Preventivo / Papanicolaou')).toBeInTheDocument();
    });

    // Clica no card do preventivo
    const preventivoCard = screen.getByText('Preventivo / Papanicolaou').closest('button');
    preventivoCard?.click();

    // Modal aberto: botão de confirmar desabilitado até marcar tudo
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Confirmar e Continuar/i })).toBeDisabled();
    });

    // Fecha o modal pelo botão Fechar (X)
    const closeBtn = screen.getByRole('button', { name: 'Fechar' });
    closeBtn.click();

    // Botão de avançar deve estar desabilitado porque o preparo não foi confirmado
    const nextBtn = screen.getByRole('button', { name: /^Continuar$/i });
    expect(nextBtn).toBeDisabled();
  });

  it('permite avançar após confirmar todos os itens do checklist de preparo pré-exame', async () => {
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
      expect(screen.getByText('Preventivo / Papanicolaou')).toBeInTheDocument();
    });

    // Clica no card do preventivo
    const preventivoCard = screen.getByText('Preventivo / Papanicolaou').closest('button');
    preventivoCard?.click();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Confirmar e Continuar/i })).toBeDisabled();
    });

    // Seleciona também a médica para habilitar o avanço
    const docBtn = screen.getByText('Dra. Helena Costa').closest('button');
    docBtn?.click();

    // Marca todos os 4 checkboxes do modal
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => {
      (cb as HTMLInputElement).click();
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirmar e Continuar/i });
    expect(confirmBtn).not.toBeDisabled();
    confirmBtn.click();

    await waitFor(() => {
      expect(screen.getByText(/✓ Orientações de preparo pré-exame confirmadas/i)).toBeInTheDocument();
    });

    const nextBtn = screen.getByRole('button', { name: /^Continuar$/i });
    expect(nextBtn).not.toBeDisabled();
  });

});
