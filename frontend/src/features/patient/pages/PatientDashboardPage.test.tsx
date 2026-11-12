import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PatientDashboardPage } from './PatientDashboardPage';

describe('PatientDashboardPage Component (Tela 5 - SPEC-0036 / Stitch Serene Bloom)', () => {
  it('renderiza hero com saudação, CTA de agendamento e card de próxima consulta', () => {
    const handleBook = vi.fn();
    render(<PatientDashboardPage patientName="Juliana" onBookAppointment={handleBook} />);

    expect(screen.getByRole('heading', { name: /Olá, Juliana/i })).toBeInTheDocument();
    expect(screen.getByText(/Veja seus próximos compromissos e acompanhe seu cuidado/i)).toBeInTheDocument();

    const bookBtn = screen.getByRole('button', { name: /Agendar consulta/i });
    expect(bookBtn).toBeInTheDocument();
    fireEvent.click(bookBtn);
    expect(handleBook).toHaveBeenCalledTimes(1);

    // Próxima Consulta
    expect(screen.getByRole('heading', { name: /Próxima Consulta/i })).toBeInTheDocument();
    expect(screen.getByText(/Dra\. Camila Vasconcelos/i)).toBeInTheDocument();
    expect(screen.getByText(/Ginecologia e Obstetrícia/i)).toBeInTheDocument();
    expect(screen.getByText(/CRM 148\.920 • RQE 42\.110/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirmada/i)).toBeInTheDocument();
    expect(screen.getByText(/Unidade Jardins/i)).toBeInTheDocument();
  });

  it('exibe widget pré-natal quando a paciente possui gestação ativa', () => {
    render(<PatientDashboardPage hasActivePregnancy={true} />);

    expect(screen.getByText(/Seu Acompanhamento Pré-Natal/i)).toBeInTheDocument();
    expect(screen.getByText(/Gestação Ativa/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/berinjela/i)).toBeInTheDocument();
  });

  it('degrada graciosamente para Prevenção & Saúde da Mulher quando não gestante (RN-012)', () => {
    render(<PatientDashboardPage hasActivePregnancy={false} />);

    expect(screen.queryByText(/Seu Acompanhamento Pré-Natal/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText(/Prevenção & Saúde da Mulher/i)).toBeInTheDocument();
    expect(screen.getByText(/Papanicolau & Check-up Preventivo/i)).toBeInTheDocument();
  });

  it('renderiza os 4 cards de Acesso Rápido (Bento Grid)', () => {
    render(<PatientDashboardPage />);

    expect(screen.getByRole('heading', { name: /Minhas Consultas/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Exames Anexados/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Cartão da Gestante/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Falar com a Clínica/i })).toBeInTheDocument();
  });

  it('valida regra RN-013 de antecedência mínima de 2 horas para remarcação online', () => {
    render(
      <PatientDashboardPage
        appointmentDateTime={new Date(Date.now() + 60 * 60 * 1000).toISOString()} // 1 hora no futuro (< 2h)
      />
    );

    const rescheduleBtn = screen.getByRole('button', { name: /Remarcar consulta/i });
    fireEvent.click(rescheduleBtn);

    expect(
      screen.getByText(/Para remarcações com menos de 2 horas de antecedência, entre em contato com a recepção/i)
    ).toBeInTheDocument();
  });

  it('permite remarcação se antecedência for superior a 2 horas (RN-013)', () => {
    const handleReschedule = vi.fn();
    render(
      <PatientDashboardPage
        appointmentDateTime={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()} // 24 horas no futuro (> 2h)
        onReschedule={handleReschedule}
      />
    );

    const rescheduleBtn = screen.getByRole('button', { name: /Remarcar consulta/i });
    fireEvent.click(rescheduleBtn);

    expect(handleReschedule).toHaveBeenCalledTimes(1);
  });

  it('renderiza canais de plantão obstétrico e emergência 24h', () => {
    render(<PatientDashboardPage />);

    expect(screen.getByRole('heading', { name: /Plantão Obstétrico 24h/i })).toBeInTheDocument();
    const phoneLinks = screen.getAllByRole('link', { name: /Ligar para Emergência 24h|Plantão Obstétrico 24h/i });
    expect(phoneLinks.length).toBeGreaterThanOrEqual(1);
  });
});
