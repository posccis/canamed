import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdvancedRegistrationPage } from './AdvancedRegistrationPage';

describe('AdvancedRegistrationPage Component (Tela 4 - SPEC-0036 / Stitch)', () => {
  it('renderiza barra de progresso clínico, seções de identificação, histórico e convênio', () => {
    render(<AdvancedRegistrationPage />);

    // Barra de progresso
    expect(screen.getByText(/Passo 1 de 3/i)).toBeInTheDocument();
    expect(screen.getByText(/75% Concluído/i)).toBeInTheDocument();

    // Seção 1: Identificação e Contato
    expect(screen.getByRole('heading', { name: /Identificação e Contato/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome Completo da Paciente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CPF/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nascimento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Celular \/ WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail para Laudos/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Lucas Silveira/i)).toBeInTheDocument();

    // Seção 2: Histórico Ginecológico & Clínico
    expect(screen.getByRole('heading', { name: /Histórico Ginecológico & Clínico/i })).toBeInTheDocument();
    expect(screen.getByText(/Tipo Sanguíneo e Fator Rh/i)).toBeInTheDocument();
    expect(screen.getByText(/Histórico Obstétrico \(GPA\)/i)).toBeInTheDocument();

    // Seção 3: Convênio ou Reembolso
    expect(screen.getByRole('heading', { name: /Convênio ou Reembolso/i })).toBeInTheDocument();
    expect(screen.getByText(/Bradesco Saúde/i)).toBeInTheDocument();
    expect(screen.getByText(/SulAmérica/i)).toBeInTheDocument();
    expect(screen.getByText(/Amil One/i)).toBeInTheDocument();

    // Consentimento CFM & LGPD
    expect(screen.getByLabelText(/Declaro a veracidade dos dados clínicos fornecidos/i)).toBeInTheDocument();

    // Botões
    expect(screen.getByRole('button', { name: /Concluir Cadastro/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar rascunho/i })).toBeInTheDocument();
  });

  it('permite selecionar exclusivamente um dos 8 chips de tipo sanguíneo', () => {
    render(<AdvancedRegistrationPage />);

    const chipOplus = screen.getByRole('button', { name: /^O\+$/i });
    const chipAminus = screen.getByRole('button', { name: /^A-$/i });

    fireEvent.click(chipOplus);
    expect(chipOplus).toHaveClass('active');
    expect(chipAminus).not.toHaveClass('active');

    fireEvent.click(chipAminus);
    expect(chipAminus).toHaveClass('active');
    expect(chipOplus).not.toHaveClass('active');
  });

  it('permite alternar tags de alergia e alterar contadores de GPA', () => {
    render(<AdvancedRegistrationPage />);

    // Toggle tag Dipirona
    const tagDipirona = screen.getByRole('button', { name: /Dipirona/i });
    fireEvent.click(tagDipirona);

    // Contadores GPA
    const btnIncrementGestations = screen.getByLabelText(/Aumentar gestações/i);
    fireEvent.click(btnIncrementGestations);
    expect(screen.getByTestId('gpa-gestations')).toHaveTextContent('2');
  });

  it('aciona confirmação de saída se houver alterações não salvas ao clicar em voltar', () => {
    const handleBack = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<AdvancedRegistrationPage onBack={handleBack} />);

    // Modifica um campo para tornar o formulário "dirty"
    const nameInput = screen.getByLabelText(/Nome Completo da Paciente/i);
    fireEvent.change(nameInput, { target: { value: 'Novo Nome Teste' } });

    // Clica em voltar
    const backBtn = screen.getByLabelText(/Voltar/i);
    fireEvent.click(backBtn);

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('alterações não salvas'));
    expect(handleBack).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });

  it('submete os dados completos do formulário ao clicar em Concluir Cadastro', () => {
    const handleSubmit = vi.fn();
    render(<AdvancedRegistrationPage onSubmit={handleSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /Concluir Cadastro/i }));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: expect.any(String),
        cpf: expect.any(String),
        bloodType: expect.any(String),
        insuranceName: expect.any(String),
        consentLgpd: true,
      })
    );
  });
});
