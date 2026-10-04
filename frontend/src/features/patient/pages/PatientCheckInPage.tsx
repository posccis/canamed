import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { patientPaths } from '../../../navigation/routes';
import {
  patientApi,
  type CapabilitySummary,
  type CheckInByTokenResult,
  type KioskSearchResult,
} from '../patientApi';
import { useClinicBySlug } from '../useClinicBySlug';

const PRIORITY_OPTIONS = [
  { value: 'nao', label: 'Não me enquadro em prioridade legal' },
  { value: 'idoso', label: 'Idoso(a) com 60 anos ou mais' },
  { value: 'gestante', label: 'Gestante ou lactante' },
  { value: 'pcd', label: 'Pessoa com deficiência (PCD)' },
  { value: 'autista', label: 'Pessoa com Transtorno do Espectro Autista' },
] as const;

type CheckInResult = {
  ticketCode: string;
  priority: string;
  positionInQueue: number;
  professionalName: string;
};

/**
 * Check-in digital por link/QR Code (SPEC-0026/RN-009), com fallback por CPF ou telefone.
 * Substitui o totem físico, preservando prioridade legal e emissão de senha (SPEC-0017).
 */
export function PatientCheckInPage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const paths = patientPaths(slug ?? '');
  const clinicState = useClinicBySlug(slug);
  const clinicId = clinicState.status === 'ready' ? clinicState.clinic.clinicId : undefined;

  const [capability, setCapability] = useState<CapabilitySummary | null>(null);
  const [capabilityError, setCapabilityError] = useState<string | null>(null);
  const [identityQuery, setIdentityQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KioskSearchResult[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [priority, setPriority] = useState<(typeof PRIORITY_OPTIONS)[number]['value']>('nao');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setCapability(null);
      return;
    }

    patientApi
      .resolveCapability(token)
      .then(setCapability)
      .catch(() => setCapabilityError('Este link de check-in não está mais disponível. Fale com a recepção.'));
  }, [token]);

  async function handleSearch() {
    if (!clinicId || !identityQuery.trim()) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const found = await patientApi.kioskSearch(clinicId, identityQuery.trim());
      setSearchResults(found);
      const firstAvailable = found.find((item) => item.allowedCheckIn);
      setSelectedAppointmentId(firstAvailable?.appointmentId ?? null);
      if (found.length === 0) {
        setErrorMessage('Nenhum agendamento encontrado hoje com estes dados. Procure a recepção.');
      }
    } catch {
      setErrorMessage('Não foi possível localizar seu agendamento agora.');
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    setBusy(true);
    setErrorMessage(null);
    try {
      if (token) {
        const res: CheckInByTokenResult = await patientApi.checkInByToken(
          token,
          priority !== 'nao',
        );
        setResult(res);
      } else {
        if (!clinicId || !selectedAppointmentId) return;
        const res = await patientApi.kioskCheckIn(
          selectedAppointmentId,
          clinicId,
          priority !== 'nao',
          'link',
        );
        setResult({
          ticketCode: res.ticketCode,
          priority: res.priority,
          positionInQueue: res.positionInQueue,
          professionalName: res.professionalName,
        });
      }
    } catch {
      setErrorMessage('Você está fora da janela de check-in (60 min antes a 15 min depois). Procure a recepção.');
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <section className="patient-page">
        <div className="patient-ticket">
          <p className="patient-ticket__caption">Check-in confirmado!</p>
          <p className="patient-ticket__code">{result.ticketCode}</p>
          <p className="patient-ticket__meta">
            {result.priority !== 'Normal' ? 'Atendimento prioritário' : 'Atendimento normal'} •{' '}
            {result.positionInQueue}º na fila
          </p>
          <p className="patient-ticket__meta">Profissional: {result.professionalName}</p>
        </div>

        <Link className="patient-action" to={paths.filaFor(result.ticketCode)}>
          Acompanhar minha posição
        </Link>
      </section>
    );
  }

  return (
    <section className="patient-page">
      <header className="patient-page__header">
        <h1 className="patient-page__title">Check-in</h1>
        <p className="patient-page__subtitle">
          {token
            ? 'Confirme sua presença e receba sua senha de atendimento.'
            : 'Informe seu CPF ou telefone para localizar o agendamento de hoje.'}
        </p>
      </header>

      {capability?.patientNameMasked ? (
        <p className="patient-hello">Paciente: {capability.patientNameMasked}</p>
      ) : null}

      {capabilityError ? (
        <div className="patient-notice patient-notice--error" role="alert">
          {capabilityError}
        </div>
      ) : null}

      {!token ? (
        <>
          <label className="patient-field">
            <span>CPF ou telefone</span>
            <input
              type="tel"
              inputMode="numeric"
              value={identityQuery}
              placeholder="Ex.: 81999990000"
              onChange={(event) => setIdentityQuery(event.target.value)}
            />
          </label>
          <button type="button" className="patient-action" onClick={handleSearch} disabled={busy}>
            {busy ? 'Buscando…' : 'Buscar meu agendamento'}
          </button>

          {searchResults.length > 0 ? (
            <ul className="patient-list">
              {searchResults.map((item) => (
                <li key={item.appointmentId}>
                  <button
                    type="button"
                    className={`patient-list__item ${
                      selectedAppointmentId === item.appointmentId ? 'patient-list__item--selected' : ''
                    }`}
                    disabled={!item.allowedCheckIn}
                    onClick={() => setSelectedAppointmentId(item.appointmentId)}
                  >
                    <span>{item.maskedName}</span>
                    <span>
                      {new Date(item.scheduledTime).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • {item.professionalName}
                    </span>
                    {!item.allowedCheckIn && item.disallowReason ? <em>{item.disallowReason}</em> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      <fieldset className="patient-fieldset">
        <legend>Você se enquadra em atendimento prioritário por lei?</legend>
        {PRIORITY_OPTIONS.map((option) => (
          <label key={option.value} className="patient-radio">
            <input
              type="radio"
              name="priority"
              value={option.value}
              checked={priority === option.value}
              onChange={() => setPriority(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>

      {errorMessage ? (
        <div className="patient-notice patient-notice--error" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        className="patient-action patient-action--primary"
        onClick={handleConfirm}
        disabled={busy || (token ? capabilityError !== null : selectedAppointmentId === null)}
      >
        {busy ? 'Confirmando…' : 'Confirmar presença e receber senha'}
      </button>

      <p className="patient-help">Precisa de ajuda? Ligue para a recepção da clínica.</p>
    </section>
  );
}
