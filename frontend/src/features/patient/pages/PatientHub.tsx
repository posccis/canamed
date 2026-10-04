import { Link, useParams } from 'react-router-dom';

import { patientPaths } from '../../../navigation/routes';
import { useClinicBySlug } from '../useClinicBySlug';

type HubAction = {
  to: string;
  title: string;
  description: string;
  primary?: boolean;
};

/**
 * Hub de serviços do paciente (link L-01, SPEC-0026/9.1).
 */
export function PatientHub() {
  const { slug } = useParams<{ slug: string }>();
  const clinicState = useClinicBySlug(slug);
  const paths = patientPaths(slug ?? '');

  const actions: HubAction[] = [
    {
      to: paths.agendar,
      title: 'Agendar consulta',
      description: 'Escolha a especialidade, o profissional e o melhor horário.',
      primary: true,
    },
    {
      to: paths.consultas,
      title: 'Meus atendimentos',
      description: 'Veja consultas futuras, históricos e pendências.',
    },
    {
      to: paths.checkIn,
      title: 'Fazer check-in',
      description: 'Confirme sua chegada no dia da consulta e receba sua senha.',
    },
    {
      to: paths.documentos,
      title: 'Meus documentos',
      description: 'Receitas, atestados e pedidos de exame.',
    },
    {
      to: paths.privacidade,
      title: 'Privacidade e seus dados',
      description: 'Exerça seus direitos de titular da LGPD.',
    },
  ];

  return (
    <section className="patient-page">
      <header className="patient-page__header">
        <h1 className="patient-page__title">
          {clinicState.status === 'ready' ? clinicState.clinic.publicName : 'Bem-vindo(a)'}
        </h1>
        <p className="patient-page__subtitle">
          Resolva o que precisa sem sair de casa. Escolha uma opção abaixo.
        </p>
      </header>

      {clinicState.status === 'not-found' ? (
        <div className="patient-notice patient-notice--error" role="alert">
          Clínica não encontrada. Verifique o link recebido.
        </div>
      ) : clinicState.status === 'error' ? (
        <div className="patient-notice patient-notice--error" role="alert">
          {clinicState.message}
        </div>
      ) : null}

      <div className="patient-hub-grid">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`patient-hub-card ${action.primary ? 'patient-hub-card--primary' : ''}`}
          >
            <span className="patient-hub-card__title">{action.title}</span>
            <span className="patient-hub-card__description">{action.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
