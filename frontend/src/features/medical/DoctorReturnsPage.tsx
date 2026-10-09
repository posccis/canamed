import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPatients, type ManagedPatient } from '../catalog/catalogApi';
import { useToast } from '../layout/Toast';
import { DOCTOR_PATHS, STAFF_PATHS } from '../../navigation/routes';

interface PatientReturnItem {
  patient: ManagedPatient;
  lastConsultationDate: Date;
  daysRemaining: number;
  status: 'no_prazo' | 'alerta' | 'expirado';
}

export function DoctorReturnsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [returnItems, setReturnItems] = useState<PatientReturnItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchPatients()
      .then((patients) => {
        if (!active) return;

        // Monta simulação de controle de carência de retornos (regra CFM 30 dias)
        // Para cada paciente, calcula uma data de última consulta nos últimos 45 dias
        const now = new Date();
        const items: PatientReturnItem[] = patients.map((p, index) => {
          const daysAgo = (index * 7) % 40 + 2; // entre 2 e 42 dias atrás
          const lastDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          const elapsedDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysRemaining = 30 - elapsedDays;

          let status: 'no_prazo' | 'alerta' | 'expirado' = 'no_prazo';
          if (daysRemaining < 0) {
            status = 'expirado';
          } else if (daysRemaining <= 7) {
            status = 'alerta';
          }

          return {
            patient: p,
            lastConsultationDate: lastDate,
            daysRemaining,
            status,
          };
        });

        // Ordena por dias restantes (mais urgentes primeiro)
        items.sort((a, b) => a.daysRemaining - b.daysRemaining);
        setReturnItems(items);
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : 'Falha ao buscar retornos.';
          addToast(msg, 'error');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [addToast]);

  const filteredItems = returnItems.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      item.patient.name.toLowerCase().includes(term) ||
      item.patient.phone.includes(term)
    );
  });

  return (
    <div className="page" style={{ maxWidth: '1400px' }}>
      <header className="page__header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page__title">Gestão de Retornos & Prazos</h1>
          <p className="form__hint">
            Monitoramento da carência de 30 dias para retorno de consultas (Conselho Federal de Medicina).
          </p>
        </div>
      </header>

      {/* Barra de Busca */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-neutral-border)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <label className="field" htmlFor="return-search" style={{ maxWidth: '500px', margin: 0 }}>
          <span className="field__label" style={{ fontWeight: 600 }}>Filtrar Paciente</span>
          <input
            id="return-search"
            type="search"
            className="form__input"
            placeholder="Digite o nome ou telefone do paciente…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
      </div>

      {/* Tabela de Retornos */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-neutral-border)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {loading ? (
          <p className="form__hint">Carregando pacientes e prazos de retorno…</p>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-neutral-muted)' }}>
            <p style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Nenhum paciente localizado nesta lista.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-neutral-border)' }}>
                  <th style={{ padding: '0.75rem' }}>Paciente</th>
                  <th style={{ padding: '0.75rem' }}>Última Consulta</th>
                  <th style={{ padding: '0.75rem' }}>Dias Decorridos</th>
                  <th style={{ padding: '0.75rem' }}>Prazo Restante</th>
                  <th style={{ padding: '0.75rem' }}>Situação do Retorno</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.patient.id} style={{ borderBottom: '1px solid var(--color-neutral-border)' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <strong>{item.patient.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-neutral-muted)' }}>
                        {item.patient.phone || 'Sem telefone'}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                      {item.lastConsultationDate.toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                      {30 - item.daysRemaining} dias atrás
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                      {item.daysRemaining > 0 ? (
                        <strong>{item.daysRemaining} dias</strong>
                      ) : (
                        <span style={{ color: '#b91c1c' }}>Vencido há {Math.abs(item.daysRemaining)} dias</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background:
                            item.status === 'no_prazo'
                              ? '#dcfce7'
                              : item.status === 'alerta'
                              ? '#fef9c3'
                              : '#fee2e2',
                          color:
                            item.status === 'no_prazo'
                              ? '#15803d'
                              : item.status === 'alerta'
                              ? '#854d0e'
                              : '#991b1b',
                        }}
                      >
                        {item.status === 'no_prazo'
                          ? 'DENTRO DO PRAZO'
                          : item.status === 'alerta'
                          ? 'PRAZO EXPIRANDO'
                          : 'PRAZO EXPIRADO'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <Link
                          to={DOCTOR_PATHS.patientRecord(item.patient.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button button--secondary button--small"
                          title="Abrir prontuário em nova aba"
                        >
                          📋 Prontuário ↗
                        </Link>
                        <Link
                          to={STAFF_PATHS.agenda}
                          className="button button--primary button--small"
                          title="Agendar retorno na agenda geral"
                        >
                          Agendar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
