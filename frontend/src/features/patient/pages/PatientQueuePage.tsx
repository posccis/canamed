import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { patientApi, type PatientQueueStatus } from '../patientApi';
import { useClinicBySlug } from '../useClinicBySlug';

const STAGE_LABELS: Record<string, string> = {
  aguardando: 'Aguardando triagem',
  em_triagem: 'Em triagem',
  chamado: 'É a sua vez',
  em_atendimento: 'Em atendimento',
  atendido: 'Atendimento concluído',
  desistiu: 'Consulta não realizada',
  cancelado: 'Consulta cancelada',
};

/** Acompanhamento da fila e da etapa do atendimento (link L-12, SPEC-0026/9.3). */
export function PatientQueuePage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const clinicState = useClinicBySlug(slug);
  const clinicId = clinicState.status === 'ready' ? clinicState.clinic.clinicId : undefined;

  const [ticketCode, setTicketCode] = useState(token ?? '');
  const [queue, setQueue] = useState<PatientQueueStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const code = ticketCode.trim();
    if (!code) return;
    setLoading(true);
    try {
      if (token) {
        setQueue(await patientApi.getQueueByToken(token));
      } else if (clinicId) {
        const status = await patientApi.kioskTicketStatus(clinicId, code);
        setQueue({
          ticketCode: status.ticketCode,
          stage: status.status,
          stageLabel: STAGE_LABELS[status.status] ?? status.status,
          message:
            status.status === 'chamado'
              ? `É a sua vez! Dirija-se a ${status.calledToRoom ?? 'a sala indicada'}.`
              : `Você é o ${status.aheadInQueueCount + 1}º da fila.`,
          positionInQueue: status.aheadInQueueCount + 1,
          estimatedWaitMinutes: status.estimatedWaitMinutes,
          roomName: status.calledToRoom,
          updatedAt: new Date().toISOString(),
        });
      }
      setErrorMessage(null);
    } catch {
      setQueue(null);
      setErrorMessage('Não encontramos esta senha agora. Confira o código ou fale com a recepção.');
    } finally {
      setLoading(false);
    }
  }, [token, ticketCode, clinicId]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 15000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <section className="patient-page">
      <header className="patient-page__header">
        <h1 className="patient-page__title">Minha posição na fila</h1>
        <p className="patient-page__subtitle">
          Esta tela se atualiza sozinha. Você não precisa permanecer no balcão.
        </p>
      </header>

      {!token ? (
        <label className="patient-field">
          <span>Senha recebida no check-in</span>
          <input
            type="text"
            value={ticketCode}
            placeholder="Ex.: N-012"
            onChange={(event) => setTicketCode(event.target.value.toUpperCase())}
          />
        </label>
      ) : null}

      {errorMessage ? (
        <div className="patient-notice patient-notice--error" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {queue ? (
        <div className="patient-queue" aria-live="polite">
          <p className="patient-queue__ticket">{queue.ticketCode}</p>
          <p className="patient-queue__stage">{queue.stageLabel}</p>
          <p className="patient-queue__message">{queue.message}</p>
          <dl className="patient-queue__metrics">
            <div>
              <dt>Posição</dt>
              <dd>{queue.positionInQueue}º</dd>
            </div>
            <div>
              <dt>Previsão</dt>
              <dd>~{queue.estimatedWaitMinutes} min</dd>
            </div>
            {queue.professionalName ? (
              <div>
                <dt>Profissional</dt>
                <dd>{queue.professionalName}</dd>
              </div>
            ) : null}
            {queue.roomName ? (
              <div>
                <dt>Sala</dt>
                <dd>{queue.roomName}</dd>
              </div>
            ) : null}
          </dl>
          {loading ? <p className="patient-queue__refreshing">Atualizando…</p> : null}
        </div>
      ) : null}

      <p className="patient-help">Precisa de ajuda? Ligue para a recepção da clínica.</p>
    </section>
  );
}
