import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PublicEntryLanding } from './PublicEntryLanding';

describe('PublicEntryLanding Component (Tela 1 - SPEC-0036 / Stitch)', () => {
  it('renderiza o acolhimento oficial e os dois cards da bimodalidade de agendamento', () => {
    render(<PublicEntryLanding />);

    // Título e badge de segurança
    expect(screen.getByText('Vamos cuidar de você?')).toBeInTheDocument();
    expect(screen.getByText(/Ambiente Seguro Criptografado • Conformidade LGPD/i)).toBeInTheDocument();

    // Card 1: Agendar sem criar conta
    expect(screen.getByRole('heading', { name: /Agendar sem criar conta/i })).toBeInTheDocument();
    expect(screen.getByText(/Mais Rápido • Menos de 1 min/i)).toBeInTheDocument();
    expect(screen.getByText(/Sem necessidade de login ou senha/i)).toBeInTheDocument();
    expect(screen.getByText(/Preenchimento ágil apenas com dados essenciais/i)).toBeInTheDocument();
    expect(screen.getByText(/Acompanhamento e confirmação enviados pelo WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar sem conta/i })).toBeInTheDocument();

    // Card 2: Quero criar minha conta
    expect(screen.getByRole('heading', { name: /Quero criar minha conta/i })).toBeInTheDocument();
    expect(screen.getByText(/Experiência Completa/i)).toBeInTheDocument();
    expect(screen.getByText(/Acompanhe o histórico de consultas/i)).toBeInTheDocument();
    expect(screen.getByText(/Cartão da Gestante e pré-natal digital/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Criar minha conta/i })).toBeInTheDocument();
  });

  it('permite acionar as ações dos cards chamando os respectivos callbacks', () => {
    const handleGuest = vi.fn();
    const handleCreateAccount = vi.fn();

    render(
      <PublicEntryLanding
        onSelectGuestBooking={handleGuest}
        onSelectCreateAccount={handleCreateAccount}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Continuar sem conta/i }));
    expect(handleGuest).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Criar minha conta/i }));
    expect(handleCreateAccount).toHaveBeenCalledTimes(1);
  });

  it('renderiza canal de atendimento via WhatsApp e links de política e termos', () => {
    render(
      <PublicEntryLanding
        clinicName="Clínica Serena Saúde da Mulher"
        whatsappPhone="5511999998888"
      />
    );

    expect(screen.getByText(/Clínica Serena Saúde da Mulher/i)).toBeInTheDocument();
    expect(screen.getByText(/Fale com a recepção pelo WhatsApp/i)).toBeInTheDocument();

    const whatsappLink = screen.getByLabelText(/Iniciar conversa com a recepção no WhatsApp/i);
    expect(whatsappLink).toHaveAttribute('href', expect.stringContaining('5511999998888'));
    expect(screen.getByText(/Política de Privacidade/i)).toBeInTheDocument();
    expect(screen.getByText(/Termos de Uso/i)).toBeInTheDocument();
  });
});
