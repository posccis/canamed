import { useEffect, useState } from 'react';
import { ExternalLink, Copy, Check, Globe } from 'lucide-react';
import { patientApi, type PortalMetaResponse } from '../patient/patientApi';
import { DEFAULT_CLINIC_SLUG, patientPaths } from '../../navigation/routes';

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Painel Simplificado do Link de Agendamento da Clínica.
 * Fornece à equipe da clínica um único link oficial para divulgar em WhatsApp, Instagram ou site.
 */
export function LinksPanel() {
  const [meta, setMeta] = useState<PortalMetaResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    patientApi
      .getPortalMeta()
      .then((response) => {
        setMeta(response);
      })
      .catch(() => setMeta(null));
  }, []);

  const slug = meta?.clinicSlug?.trim() || slugify(meta?.clinicName ?? '') || DEFAULT_CLINIC_SLUG;
  const paths = patientPaths(slug);
  const fullUrl = typeof window !== 'undefined' ? new URL(paths.base, window.location.origin).toString() : `https://canamed.com.br/p/${slug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', color: 'var(--content-primary, #202631)' }}>
          Link de Agendamento da Clínica
        </h3>
        <p style={{ margin: 0, color: 'var(--content-secondary, #626B79)', fontSize: '0.88rem', lineHeight: 1.5 }}>
          Compartilhe este endereço com suas pacientes via WhatsApp, Instagram ou no site da clínica.
          Através dele, a paciente pode agendar consultas, verificar horários e acompanhar seus atendimentos.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.25rem',
          background: 'var(--base-bg, #F7F8FA)',
          border: '1px solid var(--base-border, #E2E6EC)',
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary, #852A91)' }}>
          <Globe size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Página Pública da Paciente</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            background: '#ffffff',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--base-border, #E2E6EC)',
            flexWrap: 'wrap',
          }}
        >
          <code
            style={{
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              color: 'var(--content-primary, #202631)',
              wordBreak: 'break-all',
            }}
          >
            {fullUrl}
          </code>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={copyLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: copied ? '#059669' : 'var(--brand-primary, #852A91)',
                background: copied ? '#ECFDF5' : 'var(--brand-soft, #F7ECF8)',
                border: copied ? '1px solid #A7F3D0' : '1px solid var(--brand-primary, #852A91)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? 'Copiado!' : 'Copiar link'}</span>
            </button>

            <a
              href={paths.base}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'var(--content-primary, #202631)',
                background: '#ffffff',
                border: '1px solid var(--base-border, #E2E6EC)',
                borderRadius: '6px',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <ExternalLink size={15} />
              <span>Visualizar página</span>
            </a>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          padding: '1rem',
          background: '#EFF6FF',
          border: '1px solid #DBEAFE',
          borderRadius: '8px',
          fontSize: '0.82rem',
          color: '#1E40AF',
          lineHeight: 1.5,
        }}
      >
        <span>💡</span>
        <div>
          <strong>Dica Operacional:</strong> Você pode fixar este link na mensagem de saudação automática do WhatsApp Business da clínica ou na bio do Instagram para autoatendimento 24 horas por dia.
        </div>
      </div>
    </div>
  );
}

