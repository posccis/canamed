import { useEffect, useState } from 'react';

import {
  activateHealthPlan,
  activateRoom,
  createClinicClosure,
  createHealthPlan,
  createRoom,
  deactivateHealthPlan,
  deactivateRoom,
  fetchClinicClosures,
  fetchHealthPlans,
  fetchOperatingHours,
  fetchRooms,
  removeClinicClosure,
  renameRoom,
  replaceOperatingHours,
  updateHealthPlan,
  type ClinicClosure,
  type HealthPlan,
  type OperatingHourInput,
  type Room,
} from './clinicsApi';
import { useSession } from '../auth/useSession';
import { Modal } from '../../shared/Modal';

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export function OperationPanel() {
  const { state: sessionState } = useSession();
  const permissions = sessionState.status === 'authenticated' ? sessionState.session.permissions : [];
  const canManage = permissions.includes('clinic:manage');

  const [activeTab, setActiveTab] = useState<'plans' | 'rooms' | 'hours' | 'closures'>('plans');
  const [plans, setPlans] = useState<HealthPlan[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [closures, setClosures] = useState<ClinicClosure[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modais de convênio
  const [planModal, setPlanModal] = useState<{ open: boolean; editing?: HealthPlan }>({ open: false });
  const [planName, setPlanName] = useState('');
  const [planAns, setPlanAns] = useState('');

  // Modais de sala
  const [roomModal, setRoomModal] = useState<{ open: boolean; editing?: Room }>({ open: false });
  const [roomName, setRoomName] = useState('');

  // Modal de fechamento/feriado
  const [closureModal, setClosureModal] = useState(false);
  const [closureDate, setClosureDate] = useState('');
  const [closureDesc, setClosureDesc] = useState('');

  // Edição de horários
  const [editingHours, setEditingHours] = useState<OperatingHourInput[]>([]);
  const [hoursDirty, setHoursDirty] = useState(false);

  function loadAll() {
    setLoading(true);
    setError(null);

    Promise.all([
      fetchHealthPlans(),
      fetchRooms(),
      fetchOperatingHours(),
      fetchClinicClosures(),
    ])
      .then(([p, r, h, c]) => {
        setPlans(p);
        setRooms(r);
        setEditingHours(
          h.map((item) => ({
            dayOfWeek: item.dayOfWeek,
            startsAt: item.startsAt.substring(0, 5),
            endsAt: item.endsAt.substring(0, 5),
          })),
        );
        setClosures(c);
      })
      .catch((err: unknown) => {
        setError(extractErrorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadAll();
  }, []);

  function extractErrorMessage(err: unknown): string {
    if (err && typeof err === 'object') {
      const record = err as Record<string, unknown>;
      if (typeof record.detail === 'string') return record.detail;
      if (typeof record.title === 'string') return record.title;
      if (typeof record.message === 'string') return record.message;
    }
    return 'Ocorreu um erro ao processar a operação.';
  }

  // --- Operações de Convênio ---
  function openCreatePlan() {
    setPlanName('');
    setPlanAns('');
    setPlanModal({ open: true });
  }

  function openEditPlan(plan: HealthPlan) {
    setPlanName(plan.name);
    setPlanAns(plan.ansCode ?? '');
    setPlanModal({ open: true, editing: plan });
  }

  async function handleSavePlan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (planModal.editing) {
        await updateHealthPlan(planModal.editing.id, {
          name: planName.trim(),
          ansCode: planAns.trim() || null,
        });
        setSuccess('Convênio atualizado com sucesso.');
      } else {
        await createHealthPlan({
          name: planName.trim(),
          ansCode: planAns.trim() || null,
        });
        setSuccess('Convênio cadastrado com sucesso.');
      }
      setPlanModal({ open: false });
      loadAll();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleTogglePlanActive(plan: HealthPlan) {
    setError(null);
    try {
      if (plan.isActive) {
        await deactivateHealthPlan(plan.id);
        setSuccess('Convênio desativado.');
      } else {
        await activateHealthPlan(plan.id);
        setSuccess('Convênio ativado.');
      }
      loadAll();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  // --- Operações de Sala ---
  function openCreateRoom() {
    setRoomName('');
    setRoomModal({ open: true });
  }

  function openEditRoom(room: Room) {
    setRoomName(room.name);
    setRoomModal({ open: true, editing: room });
  }

  async function handleSaveRoom(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (roomModal.editing) {
        await renameRoom(roomModal.editing.id, { name: roomName.trim() });
        setSuccess('Sala renomeada com sucesso.');
      } else {
        await createRoom({ name: roomName.trim() });
        setSuccess('Sala cadastrada com sucesso.');
      }
      setRoomModal({ open: false });
      loadAll();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleToggleRoomActive(room: Room) {
    setError(null);
    try {
      if (room.isActive) {
        await deactivateRoom(room.id);
        setSuccess('Sala desativada.');
      } else {
        await activateRoom(room.id);
        setSuccess('Sala ativada.');
      }
      loadAll();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  // --- Operações de Horário ---
  function addOperatingHourRow(dayOfWeek: number) {
    setEditingHours((prev) => [
      ...prev,
      { dayOfWeek, startsAt: '08:00', endsAt: '12:00' },
    ]);
    setHoursDirty(true);
  }

  function removeOperatingHourRow(index: number) {
    setEditingHours((prev) => prev.filter((_, i) => i !== index));
    setHoursDirty(true);
  }

  function updateOperatingHourRow(
    index: number,
    field: 'startsAt' | 'endsAt',
    value: string,
  ) {
    setEditingHours((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
    setHoursDirty(true);
  }

  async function handleSaveHours() {
    setError(null);
    try {
      await replaceOperatingHours(editingHours);
      setSuccess('Horários de funcionamento atualizados com sucesso.');
      setHoursDirty(false);
      loadAll();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  // --- Operações de Feriados ---
  async function handleCreateClosure(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createClinicClosure({
        date: closureDate,
        description: closureDesc.trim(),
      });
      setSuccess('Feriado/exceção registrado com sucesso.');
      setClosureModal(false);
      setClosureDate('');
      setClosureDesc('');
      loadAll();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleRemoveClosure(id: string) {
    setError(null);
    try {
      await removeClinicClosure(id);
      setSuccess('Feriado/exceção removido.');
      loadAll();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="page-container">
      <div className="page__header">
        <div>
          <h1 className="page__title">Gestão Operacional da Clínica</h1>
          <p className="page__tagline">
            Configure convênios atendidos, salas de atendimento, horários de funcionamento e feriados.
          </p>
        </div>
      </div>

      {error ? (
        <div className="alert alert--error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {success ? (
        <div className="alert alert--success" role="alert">
          <p>{success}</p>
        </div>
      ) : null}

      {!canManage ? (
        <div className="alert alert--success" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }}>
          <p>Modo somente leitura. Apenas gestores podem alterar as configurações operacionais da clínica.</p>
        </div>
      ) : null}

      <div className="tabs" role="tablist">
        <button
          type="button"
          className={`tab ${activeTab === 'plans' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          Convênios ({plans.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'rooms' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          Salas ({rooms.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'hours' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('hours')}
        >
          Horário de Funcionamento
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'closures' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('closures')}
        >
          Feriados e Exceções ({closures.length})
        </button>
      </div>

      {loading ? (
        <div className="skeleton">
          <div className="skeleton__row" />
          <div className="skeleton__row" />
          <div className="skeleton__row" />
        </div>
      ) : activeTab === 'plans' ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 className="card__title" style={{ margin: 0 }}>Convênios e Planos de Saúde</h2>
              <p className="form__hint">Planos aceitos pela clínica para consultas com custeio "Plano de Saúde".</p>
            </div>
            {canManage ? (
              <button type="button" className="button button--primary" onClick={openCreatePlan}>
                + Novo convênio
              </button>
            ) : null}
          </div>

          {plans.length === 0 ? (
            <p className="empty">Nenhum convênio cadastrado.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome do Convênio</th>
                    <th>Registro ANS</th>
                    <th>Status</th>
                    {canManage ? <th style={{ textAlign: 'right' }}>Ações</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id}>
                      <td><strong>{plan.name}</strong></td>
                      <td>{plan.ansCode || '—'}</td>
                      <td>
                        <span className={`badge ${plan.isActive ? 'badge--agendado' : 'badge--cancelado'}`}>
                          {plan.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      {canManage ? (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="button button--ghost"
                            style={{ marginRight: '0.5rem', padding: '0.3rem 0.6rem' }}
                            onClick={() => openEditPlan(plan)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="button button--ghost"
                            style={{ padding: '0.3rem 0.6rem' }}
                            onClick={() => handleTogglePlanActive(plan)}
                          >
                            {plan.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'rooms' ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 className="card__title" style={{ margin: 0 }}>Salas e Consultórios</h2>
              <p className="form__hint">Salas físicas utilizadas para os atendimentos e consultas da clínica.</p>
            </div>
            {canManage ? (
              <button type="button" className="button button--primary" onClick={openCreateRoom}>
                + Nova sala
              </button>
            ) : null}
          </div>

          {rooms.length === 0 ? (
            <p className="empty">Nenhuma sala cadastrada.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Identificação da Sala</th>
                    <th>Status</th>
                    {canManage ? <th style={{ textAlign: 'right' }}>Ações</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td><strong>{room.name}</strong></td>
                      <td>
                        <span className={`badge ${room.isActive ? 'badge--agendado' : 'badge--cancelado'}`}>
                          {room.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      {canManage ? (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="button button--ghost"
                            style={{ marginRight: '0.5rem', padding: '0.3rem 0.6rem' }}
                            onClick={() => openEditRoom(room)}
                          >
                            Renomear
                          </button>
                          <button
                            type="button"
                            className="button button--ghost"
                            style={{ padding: '0.3rem 0.6rem' }}
                            onClick={() => handleToggleRoomActive(room)}
                          >
                            {room.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'hours' ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 className="card__title" style={{ margin: 0 }}>Horário de Funcionamento Semanal</h2>
              <p className="form__hint">
                Agendamentos fora destes intervalos serão recusados pela clínica. Se nenhum horário estiver configurado, qualquer horário é aceito.
              </p>
            </div>
            {canManage && hoursDirty ? (
              <button type="button" className="button button--primary" onClick={handleSaveHours}>
                Salvar alterações
              </button>
            ) : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {DAYS_OF_WEEK.map((dayName, dayIdx) => {
              const dayRows = editingHours
                .map((row, idx) => ({ row, idx }))
                .filter(({ row }) => row.dayOfWeek === dayIdx);

              return (
                <div
                  key={dayIdx}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '1rem',
                    backgroundColor: dayRows.length > 0 ? '#ffffff' : 'var(--color-surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong>{dayName}</strong>
                    {canManage ? (
                      <button
                        type="button"
                        className="button button--ghost"
                        style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => addOperatingHourRow(dayIdx)}
                      >
                        + Adicionar intervalo
                      </button>
                    ) : null}
                  </div>

                  {dayRows.length === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      Sem atendimento configurado (fechado)
                    </span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {dayRows.map(({ row, idx }) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.85rem' }}>De:</span>
                          <input
                            type="time"
                            className="field__input"
                            style={{ width: '130px' }}
                            value={row.startsAt}
                            disabled={!canManage}
                            onChange={(e) => updateOperatingHourRow(idx, 'startsAt', e.target.value)}
                          />
                          <span style={{ fontSize: '0.85rem' }}>até:</span>
                          <input
                            type="time"
                            className="field__input"
                            style={{ width: '130px' }}
                            value={row.endsAt}
                            disabled={!canManage}
                            onChange={(e) => updateOperatingHourRow(idx, 'endsAt', e.target.value)}
                          />
                          {canManage ? (
                            <button
                              type="button"
                              className="button button--ghost"
                              style={{ color: '#dc2626', padding: '0.25rem 0.5rem' }}
                              onClick={() => removeOperatingHourRow(idx)}
                              title="Remover este intervalo"
                            >
                              ✕
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {canManage && hoursDirty ? (
            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button type="button" className="button button--primary" onClick={handleSaveHours}>
                Salvar horários de funcionamento
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 className="card__title" style={{ margin: 0 }}>Feriados e Exceções</h2>
              <p className="form__hint">
                Datas em que a clínica não terá atendimento. Agendamentos nestas datas serão recusados.
              </p>
            </div>
            {canManage ? (
              <button type="button" className="button button--primary" onClick={() => setClosureModal(true)}>
                + Adicionar feriado
              </button>
            ) : null}
          </div>

          {closures.length === 0 ? (
            <p className="empty">Nenhum feriado cadastrado.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    {canManage ? <th style={{ textAlign: 'right' }}>Ações</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {closures.map((closure) => (
                    <tr key={closure.id}>
                      <td><strong>{closure.date}</strong></td>
                      <td>{closure.description}</td>
                      {canManage ? (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="button button--ghost"
                            style={{ color: '#dc2626', padding: '0.3rem 0.6rem' }}
                            onClick={() => handleRemoveClosure(closure.id)}
                          >
                            Excluir
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Convênio */}
      {planModal.open ? (
        <Modal
          title={planModal.editing ? 'Editar Convênio' : 'Novo Convênio'}
          onClose={() => setPlanModal({ open: false })}
        >
          <form className="form" onSubmit={handleSavePlan}>
            <label className="field">
              <span className="field__label">Nome do convênio *</span>
              <input
                className="field__input"
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Ex.: Unimed, Bradesco Saúde, SulAmérica"
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Código ANS (opcional)</span>
              <input
                className="field__input"
                type="text"
                value={planAns}
                onChange={(e) => setPlanAns(e.target.value)}
                placeholder="Ex.: 305149"
              />
            </label>
            <div className="form__actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setPlanModal({ open: false })}
              >
                Cancelar
              </button>
              <button type="submit" className="button button--primary">
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {/* Modal Sala */}
      {roomModal.open ? (
        <Modal
          title={roomModal.editing ? 'Renomear Sala' : 'Nova Sala'}
          onClose={() => setRoomModal({ open: false })}
        >
          <form className="form" onSubmit={handleSaveRoom}>
            <label className="field">
              <span className="field__label">Nome ou identificação da sala *</span>
              <input
                className="field__input"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Ex.: Consultório 01, Sala de Procedimentos"
                required
              />
            </label>
            <div className="form__actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setRoomModal({ open: false })}
              >
                Cancelar
              </button>
              <button type="submit" className="button button--primary">
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {/* Modal Feriado */}
      {closureModal ? (
        <Modal title="Adicionar Feriado ou Exceção" onClose={() => setClosureModal(false)}>
          <form className="form" onSubmit={handleCreateClosure}>
            <label className="field">
              <span className="field__label">Data *</span>
              <input
                className="field__input"
                type="date"
                value={closureDate}
                onChange={(e) => setClosureDate(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Descrição *</span>
              <input
                className="field__input"
                type="text"
                value={closureDesc}
                onChange={(e) => setClosureDesc(e.target.value)}
                placeholder="Ex.: Feriado de Tiradentes, Manutenção Predial"
                required
              />
            </label>
            <div className="form__actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setClosureModal(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="button button--primary">
                Adicionar
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
