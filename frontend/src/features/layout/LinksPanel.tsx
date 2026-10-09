import { useEffect, useMemo, useState } from 'react';

import { patientApi, type PortalMetaResponse } from '../patient/patientApi';
import { DEFAULT_CLINIC_SLUG, patientPaths } from '../../navigation/routes';

type LinkRow = {
  id: string;
  label: string;
  url: string;
  purpose: string;
  perPatient?: boolean;
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Central de Links (SPEC-0026/RN-018 e seção 9.1).
 * Reúne os endereços compartilháveis da superfície do paciente em um só lugar.
 */
export function LinksPanel() {
  const [meta, setMeta] = useState<PortalMetaResponse | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    patientApi
      .getPortalMeta()
      .then((response) => {
        setMeta(response);
        setSelectedProfessionalId(response.professionals[0]?.id ?? '');
        setSelectedSpecialtyId(response.specialties[0]?.id ?? '');
      })
      .catch(() => setMeta(null));
  }, []);

  const slug = meta?.clinicSlug?.trim() || slugify(meta?.clinicName ?? '') || DEFAULT_CLINIC_SLUG;
  const paths = patientPaths(slug);

  const rows = useMemo<LinkRow[]>(() => {
    const professional = meta?.professionals.find((item) => item.id === selectedProfessionalId);
    const specialty = meta?.specialties.find((item) => item.id === selectedSpecialtyId);

    return [
      { id: 'L-01', label: 'Hub do paciente', url: paths.base, purpose: 'Link de bio, Instagram e site' },
      { id: 'L-02', label: 'Agendamento geral', url: paths.agendar, purpose: 'Marcar consulta' },
      {
        id: 'L-03',
        label: 'Agendamento por profissional',
        url: professional ? paths.agendarProfessional(slugify(professional.name)) : paths.agendar,
        purpose: 'Cartão do médico, convênio e indicação',
      },
      {
        id: 'L-04',
        label: 'Agendamento por especialidade',
        url: specialty ? paths.agendarSpecialty(slugify(specialty.name)) : paths.agendar,
        purpose: 'Campanhas e captação',
      },
      { id: 'L-06', label: 'Meus atendimentos', url: paths.consultas, purpose: 'Autocuidado geral' },
      { id: 'L-07', label: 'Detalhe da consulta', url: paths.appointmentFor('{token}'), purpose: 'Ver, confirmar, remarcar e cancelar', perPatient: true },
      { id: 'L-08', label: 'Confirmação de presença', url: paths.confirm('{token}'), purpose: 'Confirmar em 1 clique', perPatient: true },
      { id: 'L-09', label: 'Reagendamento', url: paths.reschedule('{token}'), purpose: 'Mudar horário', perPatient: true },
      { id: 'L-10', label: 'Cancelamento', url: paths.cancel('{token}'), purpose: 'Cancelar com política', perPatient: true },
      { id: 'L-11', label: 'Check-in', url: paths.checkInFor('{token}'), purpose: 'QR Code e mensagem de chegada', perPatient: true },
      { id: 'L-12', label: 'Fila e etapa', url: paths.filaFor('{token}'), purpose: 'Acompanhar atendimento', perPatient: true },
      { id: 'L-13', label: 'Documentos', url: paths.documentoFor('{token}'), purpose: 'Receita, atestado e exame', perPatient: true },
      { id: 'L-14', label: 'Validação pública', url: paths.validar('{token}'), purpose: 'Farmácia e terceiros', perPatient: true },
      { id: 'L-15', label: 'Privacidade (LGPD)', url: paths.privacidade, purpose: 'Direitos do titular' },
    ];
  }, [meta, paths, selectedProfessionalId, selectedSpecialtyId]);

  async function copy(row: LinkRow) {
    const absolute = new URL(row.url, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(row.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Central de Links</h1>
          <p className="page__tagline">
            Copie o endereço correto para enviar ao paciente por WhatsApp, SMS ou cartão.
          </p>
        </div>
      </header>

      <div className="links-filters">
        <label className="field">
          <span className="field__label">Profissional (link L-03)</span>
          <select
            className="field__input"
            value={selectedProfessionalId}
            onChange={(event) => setSelectedProfessionalId(event.target.value)}
          >
            {meta?.professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Especialidade (link L-04)</span>
          <select
            className="field__input"
            value={selectedSpecialtyId}
            onChange={(event) => setSelectedSpecialtyId(event.target.value)}
          >
            {meta?.specialties.map((specialty) => (
              <option key={specialty.id} value={specialty.id}>
                {specialty.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Link</th>
              <th>Endereço</th>
              <th>Quando usar</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.id}</strong> — {row.label}
                </td>
                <td>
                  <code className="links-url">{row.url}</code>
                  {row.perPatient ? <span className="links-badge">por paciente</span> : null}
                </td>
                <td>{row.purpose}</td>
                <td>
                  <button
                    type="button"
                    className="button button--secondary button--small"
                    onClick={() => void copy(row)}
                  >
                    {copied === row.id ? 'Copiado!' : 'Copiar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="form__hint">
        Os links marcados como <strong>por paciente</strong> são gerados no envio da mensagem e carregam um
        token de uso único; nunca contêm CPF, diagnóstico ou qualquer dado de saúde.
      </p>
    </div>
  );
}
