import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock('../../../api/client', () => ({
  ApiError: class ApiError extends Error {
    public readonly status: number;
    public constructor(status: number, title: string) {
      super(title);
      this.status = status;
    }
  },
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
}));

import { App } from '../../../App';

function navigateTo(path: string) {
  window.history.pushState({}, '', path);
}

describe('Roteamento Serene Bloom da Paciente (Task 11 - SPEC-0036 / ADR-0011)', () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.apiPost.mockReset();
    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path.startsWith('/public/clinics/')) {
        return {
          clinicId: 'clinica-1',
          slug: 'cana-med',
          name: 'Clínica Cana Med',
          publicName: 'Cana Med',
          allowWaitlist: false,
          allowSelfReschedule: true,
          specialties: [],
          professionals: [],
          appointmentTypes: [],
        };
      }
      return {};
    });
  });

  it('renderiza PublicEntryLanding na rota raiz /p/:slug', async () => {
    navigateTo('/p/cana-med');
    render(<App />);

    expect(await screen.findByText(/Vamos cuidar de você\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar sem conta|Agendar sem criar conta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Criar minha conta|Quero criar minha conta/i })).toBeInTheDocument();
  });

  it('renderiza WalkInBookingPage em /p/:slug/agendar-avulso', async () => {
    navigateTo('/p/cana-med/agendar-avulso');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Consulta Avulsa/i })).toBeInTheDocument();
    expect(screen.getByText(/Atendimento ginecológico ou obstétrico pontual/i)).toBeInTheDocument();
  });

  it('renderiza GuestBookingFormPage em /p/:slug/cadastro-rapido', async () => {
    navigateTo('/p/cana-med/cadastro-rapido');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Cadastro Rápido/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
  });

  it('renderiza AdvancedRegistrationPage em /p/:slug/cadastro-avancado', async () => {
    navigateTo('/p/cana-med/cadastro-avancado');
    render(<App />);

    expect(await screen.findByText(/Passo 1 de 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Identificação e Contato/i)).toBeInTheDocument();
  });

  it('renderiza PatientDashboardPage com PatientLayoutSerene em /p/:slug/dashboard', async () => {
    navigateTo('/p/cana-med/dashboard');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Olá, Juliana/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Navegação Principal Mobile/i })).toBeInTheDocument();
  });

  it('renderiza DigitalPrenatalCardPage com PatientLayoutSerene em /p/:slug/cartao-gestante', async () => {
    navigateTo('/p/cana-med/cartao-gestante');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Cartão da Gestante/i })).toBeInTheDocument();
    expect(screen.getByText(/Prontuário Pré-Natal Digital/i)).toBeInTheDocument();
  });
});
