import { useNavigate, useParams } from 'react-router-dom';

import { patientPaths } from '../../../navigation/routes';
import { type SereneNavTab } from '../components/PatientLayoutSerene';
import { useClinicBySlug } from '../useClinicBySlug';
import { PublicEntryLanding } from './PublicEntryLanding';
import { WalkInBookingPage } from './WalkInBookingPage';
import { GuestBookingFormPage } from './GuestBookingFormPage';
import { AdvancedRegistrationPage } from './AdvancedRegistrationPage';
import { PatientDashboardPage } from './PatientDashboardPage';
import { DigitalPrenatalCardPage } from './DigitalPrenatalCardPage';
import { PatientLayoutSerene } from '../components/PatientLayoutSerene';

/**
 * Tela 1: Acolhimento e Entrada Pública (/p/:slug)
 */
export function PatientHomePage() {
  const { slug = 'cana-med' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const paths = patientPaths(slug);
  const clinicState = useClinicBySlug(slug);

  return (
    <PublicEntryLanding
      clinicName={clinicState.status === 'ready' ? clinicState.clinic.name : 'Cana Med Mulher'}
      onSelectGuestBooking={() => navigate(paths.agendarAvulso)}
      onSelectCreateAccount={() => navigate(paths.cadastroAvancado)}
      onSelectLogin={() => navigate(paths.dashboard)}
    />
  );
}

/**
 * Tela 2: Agendamento Avulso e Seleção de Queixa (/p/:slug/agendar-avulso)
 */
export function PatientWalkInBookingPage() {
  const { slug = 'cana-med' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const paths = patientPaths(slug);

  const handleNavigateTab = (tab: string) => {
    if (tab === 'inicio') navigate(paths.base);
    else if (tab === 'agendar') navigate(paths.agendarAvulso);
    else if (tab === 'consultas') navigate(paths.consultas);
    else if (tab === 'prenatal') navigate(paths.cartaoGestante);
    else if (tab === 'perfil') navigate(paths.cadastroAvancado);
  };

  return (
    <WalkInBookingPage
      onBack={() => navigate(paths.base)}
      onContinue={() => navigate(paths.cadastroRapido)}
      onNavigateTab={handleNavigateTab}
    />
  );
}

/**
 * Tela 3: Formulário de Agendamento Ágil (/p/:slug/cadastro-rapido)
 * RN-020 / [P0-2]: Sem bottom navigation para desempilhar teclado virtual.
 */
export function PatientGuestBookingPage() {
  const { slug = 'cana-med' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const paths = patientPaths(slug);

  const handleNavigateTab = (tab: string) => {
    if (tab === 'inicio') navigate(paths.base);
    else if (tab === 'agendar') navigate(paths.agendarAvulso);
    else if (tab === 'consultas') navigate(paths.consultas);
    else if (tab === 'prenatal') navigate(paths.cartaoGestante);
    else if (tab === 'perfil') navigate(paths.cadastroAvancado);
  };

  return (
    <GuestBookingFormPage
      onBack={() => navigate(paths.agendarAvulso)}
      onSuccess={() => navigate(paths.dashboard)}
      onNavigateTab={handleNavigateTab}
    />
  );
}

/**
 * Tela 4: Cadastro Avançado e Histórico Ginecológico (/p/:slug/cadastro-avancado)
 * RN-020 / [P0-2]: Sem bottom navigation.
 */
export function PatientAdvancedRegistrationPage() {
  const { slug = 'cana-med' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const paths = patientPaths(slug);

  const handleNavigateTab = (tab: string) => {
    if (tab === 'inicio') navigate(paths.base);
    else if (tab === 'agendar') navigate(paths.agendarAvulso);
    else if (tab === 'consultas') navigate(paths.consultas);
    else if (tab === 'prenatal') navigate(paths.cartaoGestante);
    else if (tab === 'perfil') navigate(paths.cadastroAvancado);
  };

  return (
    <AdvancedRegistrationPage
      onBack={() => navigate(paths.base)}
      onSubmit={() => navigate(paths.dashboard)}
      onNavigateTab={handleNavigateTab}
    />
  );
}

/**
 * Tela 5: Dashboard da Paciente (/p/:slug/dashboard)
 */
export function PatientDashboardRoute() {
  const { slug = 'cana-med' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const paths = patientPaths(slug);

  const handleTabChange = (tab: SereneNavTab) => {
    if (tab === 'inicio') navigate(paths.dashboard);
    else if (tab === 'agendar') navigate(paths.agendarAvulso);
    else if (tab === 'consultas') navigate(paths.consultas);
    else if (tab === 'cartao-gestante') navigate(paths.cartaoGestante);
    else if (tab === 'plantao') navigate(paths.agendarAvulso);
    else if (tab === 'perfil') navigate(paths.perfil);
  };

  return (
    <PatientLayoutSerene
      activeTab="inicio"
      hideBottomNav={true}
      onTabChange={handleTabChange}
      onLogout={() => navigate(paths.base, { replace: true })}
    >
      <PatientDashboardPage
        onBookAppointment={() => navigate(paths.agendarAvulso)}
        onNavigateSection={(section) => {
          if (section === 'cartao-gestante') navigate(paths.cartaoGestante);
          else if (section === 'consultas') navigate(paths.consultas);
          else if (section === 'exames') navigate(paths.cartaoGestante);
          else if (section === 'contato') navigate(paths.agendarAvulso);
        }}
        onNavigateTab={(tab) => {
          if (tab === 'inicio') navigate(paths.dashboard);
          else if (tab === 'agendar') navigate(paths.agendarAvulso);
          else if (tab === 'consultas') navigate(paths.consultas);
          else if (tab === 'prenatal') navigate(paths.cartaoGestante);
          else if (tab === 'perfil') navigate(paths.perfil);
        }}
      />
    </PatientLayoutSerene>
  );
}

/**
 * Tela 6: Cartão da Gestante Digital (/p/:slug/cartao-gestante)
 */
export function PatientPrenatalCardRoute() {
  const { slug = 'cana-med' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const paths = patientPaths(slug);

  const handleTabChange = (tab: SereneNavTab) => {
    if (tab === 'inicio') navigate(paths.dashboard);
    else if (tab === 'agendar') navigate(paths.agendarAvulso);
    else if (tab === 'consultas') navigate(paths.consultas);
    else if (tab === 'cartao-gestante') navigate(paths.cartaoGestante);
    else if (tab === 'plantao') navigate(paths.agendarAvulso);
    else if (tab === 'perfil') navigate(paths.perfil);
  };

  return (
    <PatientLayoutSerene
      activeTab="cartao-gestante"
      hideBottomNav={true}
      breadcrumbs={[
        { label: 'Início', href: paths.dashboard },
        { label: 'Pré-Natal', href: paths.dashboard },
        { label: 'Cartão da Gestante' },
      ]}
      onTabChange={handleTabChange}
      onLogout={() => navigate(paths.base, { replace: true })}
    >
      <DigitalPrenatalCardPage
        onBack={() => navigate(paths.dashboard)}
        onNavigateTab={(tab) => {
          if (tab === 'inicio') navigate(paths.dashboard);
          else if (tab === 'agendar') navigate(paths.agendarAvulso);
          else if (tab === 'consultas') navigate(paths.consultas);
          else if (tab === 'prenatal') navigate(paths.cartaoGestante);
          else if (tab === 'perfil') navigate(paths.perfil);
        }}
      />
    </PatientLayoutSerene>
  );
}

/**
 * Rotas de compatibilidade
 */
export function PatientBookingPage() {
  const { slug = 'cana-med' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const paths = patientPaths(slug);

  return (
    <WalkInBookingPage
      onBack={() => navigate(paths.base)}
      onContinue={() => navigate(paths.cadastroRapido)}
    />
  );
}

export function PatientAppointmentsPage() {
  const { slug = 'cana-med' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const paths = patientPaths(slug);

  return (
    <PatientLayoutSerene
      activeTab="consultas"
      onTabChange={(tab) => {
        if (tab === 'inicio') navigate(paths.dashboard);
        else if (tab === 'agendar') navigate(paths.agendarAvulso);
        else if (tab === 'cartao-gestante') navigate(paths.cartaoGestante);
      }}
      onLogout={() => navigate(paths.base, { replace: true })}
    >
      <PatientDashboardPage onBookAppointment={() => navigate(paths.agendarAvulso)} />
    </PatientLayoutSerene>
  );
}

export function PatientDocumentsPage() {
  return <PatientPrenatalCardRoute />;
}

export function PatientProfilePage() {
  const { slug = 'cana-med' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const paths = patientPaths(slug);

  return (
    <PatientLayoutSerene
      activeTab="perfil"
      onTabChange={(tab) => {
        if (tab === 'inicio') navigate(paths.dashboard);
        else if (tab === 'agendar') navigate(paths.agendarAvulso);
        else if (tab === 'cartao-gestante') navigate(paths.cartaoGestante);
      }}
      onLogout={() => navigate(paths.base, { replace: true })}
    >
      <AdvancedRegistrationPage
        onBack={() => navigate(paths.dashboard)}
        onSubmit={() => navigate(paths.dashboard)}
      />
    </PatientLayoutSerene>
  );
}

