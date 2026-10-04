import { Link } from 'react-router-dom';
import { DOCTOR_PATHS, LOBBY_TV_PATH, STAFF_PATHS } from '../../navigation/routes';

export function HomePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-background, #f8fafc)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: '2.5rem', maxWidth: '640px' }}>
        <img
          src="/assets/brand/canadamed_logogrande_comtitulo-removebg-preview.png"
          alt="CANA MED — Eficiência Para Quem Mais Precisa"
          style={{ maxWidth: '280px', height: 'auto', marginBottom: '1rem' }}
        />
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--color-primary-dark, #064e3b)',
            margin: '0 0 0.5rem',
          }}
        >
          Portal de Acesso Integrado
        </h1>
        <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '1.05rem', margin: 0 }}>
          Selecione o ambiente desejado para continuar. Cada perfil possui credenciais e área de trabalho dedicadas.
        </p>
      </header>

      {/* Grid de Portais Principais */}
      <main
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          width: '100%',
          maxWidth: '820px',
          marginBottom: '2.5rem',
        }}
      >
        {/* Card 1: Recepção e Administração */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#ecfdf5',
                color: 'var(--color-primary, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--color-text, #1e293b)' }}>
              Administração & Recepção
            </h2>
            <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 1.5rem' }}>
              Gestão da fila de espera, acolhimento e check-in, agenda geral da clínica, catálogo de especialidades, validação cadastral e Central de Links.
            </p>
          </div>

          <Link
            to={STAFF_PATHS.dashboard}
            className="button button--primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.85rem 1.25rem',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '10px',
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Acessar Administração
          </Link>
        </div>

        {/* Card 2: Espaço do Médico / Consultório */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '2px solid var(--color-primary, #059669)',
            boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.1), 0 4px 6px -4px rgba(5, 150, 105, 0.1)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-primary, #059669)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--color-text, #1e293b)' }}>
                Espaço do Médico
              </h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                CONSULTÓRIO
              </span>
            </div>

            <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 1.5rem' }}>
              Ambiente exclusivo do profissional: fila do consultório, prontuário eletrônico (SOAP), emissão de receitas, atestados e pedidos de exame com assinatura digital.
            </p>
          </div>

          <Link
            to={DOCTOR_PATHS.home}
            className="button button--primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.85rem 1.25rem',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '10px',
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Entrar no Consultório Médico
          </Link>
        </div>
      </main>

      {/* Atalhos Rápidos Adicionais */}
      <footer
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem',
          color: 'var(--color-text-muted, #64748b)',
          fontSize: '0.9rem',
        }}
      >
        <span>Outros acessos:</span>
        <Link
          to={LOBBY_TV_PATH}
          style={{ color: 'var(--color-primary-dark, #064e3b)', fontWeight: 600, textDecoration: 'none' }}
        >
          📺 Painel de TV (Saguão)
        </Link>
        <span>•</span>
        <Link
          to="/p/cana-med"
          style={{ color: 'var(--color-primary-dark, #064e3b)', fontWeight: 600, textDecoration: 'none' }}
        >
          📱 Portal do Paciente
        </Link>
      </footer>
    </div>
  );
}
