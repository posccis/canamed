import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getPatientMedicalRecordHistory,
  addMedicalRecordAddendum,
  getGynecologicalProfile,
  getPatientScreenings,
  type MedicalRecordResponse,
  type GynecologicalProfileDto,
  type PreventiveScreeningDto,
} from './medicalRecordsApi';
import {
  getPatientMedicalDocuments,
  type MedicalDocumentResponse,
} from './medicalDocumentsApi';
import { fetchPatients, type ManagedPatient } from '../catalog/catalogApi';
import { GynecologicalProfileCard } from './GynecologicalProfileCard';
import { PreventiveScreeningList } from './PreventiveScreeningList';
import { GynecologicalExamSection } from './GynecologicalExamSection';
import { PatientExamAttachmentsSection } from './PatientExamAttachmentsSection';
import { DocumentModal } from './DocumentModal';
import { useToast } from '../layout/Toast';
import { DOCTOR_PATHS } from '../../navigation/routes';

export function DoctorMedicalRecordsPage() {
  const { patientId } = useParams<{ patientId?: string }>();
  const { addToast } = useToast();

  const [patients, setPatients] = useState<ManagedPatient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Dados do paciente selecionado
  const [selectedPatient, setSelectedPatient] = useState<ManagedPatient | null>(null);
  const [records, setRecords] = useState<MedicalRecordResponse[]>([]);
  const [documents, setDocuments] = useState<MedicalDocumentResponse[]>([]);
  const [gynProfile, setGynProfile] = useState<GynecologicalProfileDto | null>(null);
  const [screenings, setScreenings] = useState<PreventiveScreeningDto[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Estado para novo adendo
  const [selectedRecordForAddendum, setSelectedRecordForAddendum] = useState<string | null>(null);
  const [addendumJustification, setAddendumJustification] = useState('');
  const [addendumNotes, setAddendumNotes] = useState('');
  const [savingAddendum, setSavingAddendum] = useState(false);

  // Modal de documento
  const [docModalOpen, setDocModalOpen] = useState(false);

  // Aba ativa na ficha do paciente: 'records' | 'gynProfile' | 'screenings' | 'documents'
  const [activeTab, setActiveTab] = useState<'records' | 'gynProfile' | 'screenings' | 'documents' | 'attachments'>('records');

  // Carrega catálogo de pacientes
  useEffect(() => {
    let active = true;
    setLoadingPatients(true);

    fetchPatients()
      .then((data) => {
        if (active) setPatients(data);
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : 'Falha ao carregar pacientes.';
          addToast(msg, 'error');
        }
      })
      .finally(() => {
        if (active) setLoadingPatients(false);
      });

    return () => {
      active = false;
    };
  }, [addToast]);

  // Sincroniza paciente selecionado e busca prontuários quando patientId muda na URL
  useEffect(() => {
    if (!patientId) {
      setSelectedPatient(null);
      setRecords([]);
      setDocuments([]);
      setGynProfile(null);
      setScreenings([]);
      return;
    }

    // Acha o paciente ou cria um placeholder com o id
    const found = patients.find((p) => p.id === patientId);
    if (found) {
      setSelectedPatient(found);
    } else {
      setSelectedPatient({
        id: patientId,
        name: 'Paciente',
        phone: '',
        email: null,
        birthDate: null,
        isActive: true,
      });
    }

    let active = true;
    setLoadingRecords(true);

    Promise.all([
      getPatientMedicalRecordHistory(patientId),
      getPatientMedicalDocuments(patientId),
      getGynecologicalProfile(patientId).catch(() => null),
      getPatientScreenings(patientId).catch(() => []),
    ])
      .then(([recData, docData, profData, scrData]) => {
        if (active) {
          setRecords(recData);
          setDocuments(docData);
          if (profData && typeof profData === 'object' && 'gravida' in profData) {
            setGynProfile(profData as GynecologicalProfileDto);
          }
          if (Array.isArray(scrData)) {
            setScreenings(scrData as PreventiveScreeningDto[]);
          }
        }
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : 'Falha ao carregar histórico clínico.';
          addToast(msg, 'error');
        }
      })
      .finally(() => {
        if (active) setLoadingRecords(false);
      });

    return () => {
      active = false;
    };
  }, [patientId, patients, addToast]);

  // Filtro de busca de pacientes
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const term = searchTerm.toLowerCase().trim();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.phone.includes(term) ||
        (p.email && p.email.toLowerCase().includes(term)),
    );
  }, [patients, searchTerm]);

  // Salvar novo adendo clínico (SPEC-0012 / CFM)
  async function handleAddAddendum(recordId: string) {
    if (!addendumJustification.trim() || !addendumNotes.trim()) {
      addToast('Preencha a justificativa e o texto do adendo clínico.', 'error');
      return;
    }

    setSavingAddendum(true);
    try {
      await addMedicalRecordAddendum(recordId, {
        justification: addendumJustification.trim(),
        notes: addendumNotes.trim(),
      });
      addToast('Adendo clínico registrado com sucesso e carimbo de data/hora!', 'success');
      setAddendumJustification('');
      setAddendumNotes('');
      setSelectedRecordForAddendum(null);

      if (patientId) {
        const refreshed = await getPatientMedicalRecordHistory(patientId);
        setRecords(refreshed);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar adendo.';
      addToast(msg, 'error');
    } finally {
      setSavingAddendum(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: '1400px' }}>
      <header className="page__header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page__title">Prontuário Eletrônico do Paciente (PEP)</h1>
          <p className="form__hint">
            Histórico longitudinal da saúde da mulher, ficha obstétrica (GPA), rastreamento preventivo e evolução clínica conforme diretrizes CFM e LGPD.
          </p>
        </div>

        {patientId && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link
              to={DOCTOR_PATHS.patientRecord(patientId)}
              target="_blank"
              rel="noopener noreferrer"
              className="button button--secondary button--small"
              title="Abrir a ficha deste paciente em uma nova aba do navegador"
            >
              🔗 Abrir em Nova Aba ↗
            </Link>
            <Link to={DOCTOR_PATHS.records} className="button button--ghost button--small">
              ← Buscar Outro Paciente
            </Link>
          </div>
        )}
      </header>

      {/* Se não houver paciente na URL, exibe barra de pesquisa e lista de pacientes */}
      {!patientId ? (
        <section
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-neutral-border)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ maxWidth: '600px', marginBottom: '1.5rem' }}>
            <label className="field" htmlFor="patient-search-input">
              <span className="field__label" style={{ fontWeight: 600 }}>Localizar Paciente</span>
              <input
                id="patient-search-input"
                type="search"
                className="form__input"
                placeholder="Digite o nome, telefone ou e-mail do paciente…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </label>
          </div>

          {loadingPatients ? (
            <p className="form__hint">Carregando lista de pacientes…</p>
          ) : filteredPatients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-neutral-muted)' }}>
              <p style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Nenhum paciente encontrado.</p>
              <p className="form__hint">Verifique a ortografia ou consulte a recepção para novo cadastro.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-neutral-border)' }}>
                    <th style={{ padding: '0.75rem' }}>Nome do Paciente</th>
                    <th style={{ padding: '0.75rem' }}>Telefone</th>
                    <th style={{ padding: '0.75rem' }}>Data Nasc.</th>
                    <th style={{ padding: '0.75rem' }}>Situação</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p) => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: '1px solid var(--color-neutral-border)' }}
                    >
                      <td style={{ padding: '0.75rem' }}>
                        <strong>{p.name}</strong>
                        {p.email && <div style={{ fontSize: '0.8rem', color: 'var(--color-neutral-muted)' }}>{p.email}</div>}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{p.phone || '-'}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                        {p.birthDate ? new Date(p.birthDate).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: p.isActive ? '#dcfce7' : '#f1f5f9',
                            color: p.isActive ? '#15803d' : '#64748b',
                          }}
                        >
                          {p.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <Link
                            to={DOCTOR_PATHS.patientRecord(p.id)}
                            className="button button--primary button--small"
                          >
                            Abrir Prontuário
                          </Link>
                          <Link
                            to={DOCTOR_PATHS.patientRecord(p.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button button--secondary button--small"
                            title="Abrir este prontuário em uma nova aba do navegador"
                          >
                            Nova Aba ↗
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
      ) : (
        /* Visualização Detalhada do Prontuário do Paciente */
        <div>
          {/* Card Resumo do Paciente com Indicadores Ginecológicos */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-neutral-border)',
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--color-primary-dark)', margin: 0 }}>
                  {selectedPatient?.name || 'Paciente'}
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  PEP ATIVO
                </span>
              </div>
              <p className="form__hint" style={{ margin: '0 0 0.5rem 0' }}>
                {selectedPatient?.phone ? `Telefone: ${selectedPatient.phone}` : ''}
                {selectedPatient?.birthDate ? ` • Nasc: ${new Date(selectedPatient.birthDate).toLocaleDateString('pt-BR')}` : ''}
                {selectedPatient?.email ? ` • E-mail: ${selectedPatient.email}` : ''}
              </p>

              {/* Destaque Obstétrico & Contraceptivo Rápido */}
              {gynProfile && (
                <div style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                  <span
                    style={{
                      background: '#f0fdfa',
                      color: 'var(--color-primary-dark)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      border: '1px solid #99f6e4',
                    }}
                  >
                    🤰 Obstétrico: G{gynProfile.gravida} P{gynProfile.para} (Cesáreas: {gynProfile.cesareans}, Abortos: {gynProfile.abortions}, Vivos: {gynProfile.livingChildren})
                  </span>
                  <span
                    style={{
                      background: '#f8fafc',
                      color: '#334155',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    💊 Método: {gynProfile.currentMethod || 'Nenhum'}
                  </span>
                  <span
                    style={{
                      background: '#f8fafc',
                      color: '#334155',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    🔄 Ciclo: {gynProfile.cycleIntervalDays || 28}d ({gynProfile.isCycleRegular ? 'Regular' : 'Irregular'})
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                className="button button--primary button--small"
                onClick={() => setDocModalOpen(true)}
              >
                📄 + Nova Receita / Atestado
              </button>
            </div>
          </div>

          {/* Abas Segregadas: Evolução SOAP vs Ficha Ginecológica vs Rastreamento vs Documentos */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--color-neutral-border)',
              paddingBottom: '0.5rem',
              overflowX: 'auto',
            }}
          >
            <button
              type="button"
              className={`button ${activeTab === 'records' ? 'button--primary' : 'button--ghost'} button--small`}
              onClick={() => setActiveTab('records')}
            >
              📋 Evolução Clínica & Histórico ({records.length})
            </button>
            <button
              type="button"
              className={`button ${activeTab === 'gynProfile' ? 'button--primary' : 'button--ghost'} button--small`}
              onClick={() => setActiveTab('gynProfile')}
            >
              🌸 Ficha Gineco-Obstétrica (GPA / Ciclos)
            </button>
            <button
              type="button"
              className={`button ${activeTab === 'screenings' ? 'button--primary' : 'button--ghost'} button--small`}
              onClick={() => setActiveTab('screenings')}
            >
              🛡️ Rastreamento Preventivo ({screenings.length})
            </button>
            <button
              type="button"
              className={`button ${activeTab === 'documents' ? 'button--primary' : 'button--ghost'} button--small`}
              onClick={() => setActiveTab('documents')}
            >
              📄 Documentos e Receitas ({documents.length})
            </button>
            <button
              type="button"
              className={`button ${activeTab === 'attachments' ? 'button--primary' : 'button--ghost'} button--small`}
              onClick={() => setActiveTab('attachments')}
            >
              📁 Exames Anteriores Anexados
            </button>
          </div>

          {loadingRecords ? (
            <p className="form__hint">Carregando prontuário e registros clínicos…</p>
          ) : activeTab === 'gynProfile' ? (
            /* Ficha Gineco-Obstétrica Longitudinal */
            <GynecologicalProfileCard
              profile={gynProfile}
              onProfileUpdated={(updated) => setGynProfile(updated)}
            />
          ) : activeTab === 'screenings' ? (
            /* Rastreamento Preventivo (Papanicolau, HPV, Mamografia, USG) */
            <PreventiveScreeningList
              patientId={patientId}
              screenings={screenings}
              onScreeningAdded={(newScr) => setScreenings((prev) => [newScr, ...prev])}
            />
          ) : activeTab === 'records' ? (
            /* Histórico de Atendimentos SOAP e Exames Ginecológicos */
            records.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-neutral-border)',
                  padding: '3rem',
                  textAlign: 'center',
                  color: 'var(--color-neutral-muted)',
                }}
              >
                <p style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Nenhum atendimento anterior registrado para este paciente.</p>
                <p className="form__hint">Novos registros são gerados ao iniciar o atendimento no Consultório Virtual.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {records.map((record) => (
                  <article
                    key={record.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--color-neutral-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.5rem',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                        borderBottom: '1px solid var(--color-neutral-border)',
                        paddingBottom: '0.75rem',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                          Atendimento em {new Date(record.createdAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(record.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </strong>
                        {record.finalizedAt && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-muted)', display: 'block' }}>
                            Finalizado em {new Date(record.finalizedAt).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>

                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: record.status === 'finalizado' ? '#dcfce7' : '#fef9c3',
                          color: record.status === 'finalizado' ? '#15803d' : '#854d0e',
                        }}
                      >
                        {record.status === 'finalizado' ? '✓ Prontuário Finalizado' : '⏳ Em Andamento'}
                      </span>
                    </div>

                    {/* Dados Ginecológicos Especializados da Consulta (se existirem) */}
                    {record.gynecologicalData && (
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid var(--color-neutral-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          marginBottom: '1rem',
                        }}
                      >
                        <h4 style={{ fontSize: '0.95rem', color: 'var(--color-primary-dark)', margin: '0 0 0.5rem 0' }}>
                          🌸 Dados Clínicos Ginecológicos do Atendimento
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                          <div>
                            <span className="form__hint" style={{ fontSize: '0.75rem' }}>DUM (Última Menstruação)</span>
                            <strong>
                              {record.gynecologicalData.dum
                                ? new Date(record.gynecologicalData.dum).toLocaleDateString('pt-BR')
                                : record.gynecologicalData.isMenopausal
                                ? 'Menopausa / Climatério'
                                : record.gynecologicalData.isDumUncertain
                                ? 'DUM Incerta'
                                : 'Não informada'}
                            </strong>
                          </div>
                          <div>
                            <span className="form__hint" style={{ fontSize: '0.75rem' }}>Vida Sexual Ativa</span>
                            <strong>
                              {record.gynecologicalData.isSexuallyActive === true
                                ? 'Sim'
                                : record.gynecologicalData.isSexuallyActive === false
                                ? 'Não'
                                : 'Não informada'}
                            </strong>
                          </div>
                          <div>
                            <span className="form__hint" style={{ fontSize: '0.75rem' }}>Dispareunia</span>
                            <strong style={{ textTransform: 'capitalize' }}>
                              {record.gynecologicalData.dyspareunia || 'Ausente'}
                            </strong>
                          </div>
                          {record.gynecologicalData.procedurePerformed && (
                            <div>
                              <span className="form__hint" style={{ fontSize: '0.75rem' }}>Procedimento Realizado</span>
                              <strong style={{ color: '#005F6A' }}>
                                💉 {record.gynecologicalData.procedurePerformed}
                              </strong>
                              {record.gynecologicalData.procedureBatch && (
                                <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                                  ({record.gynecologicalData.procedureBatch})
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Exame Físico Ginecológico Segmentado em modo Somente Leitura */}
                        <div style={{ marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                            Exame Físico Ginecológico Segmentado:
                          </span>
                          <GynecologicalExamSection
                            exam={{
                              breastsIsNormal: record.gynecologicalData.breastsIsNormal,
                              breastsFindings: record.gynecologicalData.breastsFindings || '',
                              abdomenIsNormal: record.gynecologicalData.abdomenIsNormal,
                              abdomenFindings: record.gynecologicalData.abdomenFindings || '',
                              externalGenitaliaIsNormal: record.gynecologicalData.externalGenitaliaIsNormal,
                              externalGenitaliaFindings: record.gynecologicalData.externalGenitaliaFindings || '',
                              speculumExamIsNormal: record.gynecologicalData.speculumExamIsNormal,
                              speculumExamFindings: record.gynecologicalData.speculumExamFindings || '',
                              bimanualPalpationIsNormal: record.gynecologicalData.bimanualPalpationIsNormal,
                              bimanualPalpationFindings: record.gynecologicalData.bimanualPalpationFindings || '',
                            }}
                            onChange={() => {}}
                            readOnly={true}
                          />
                        </div>

                        {/* Prescrições e Orientações Segregadas */}
                        {(record.gynecologicalData.prescriptionNotes || record.gynecologicalData.generalOrientationNotes) && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                            {record.gynecologicalData.prescriptionNotes && (
                              <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}>
                                <strong style={{ color: 'var(--color-primary-dark)', display: 'block', marginBottom: '0.25rem' }}>
                                  💊 Prescrição Medicamentosa:
                                </strong>
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                                  {record.gynecologicalData.prescriptionNotes}
                                </p>
                              </div>
                            )}
                            {record.gynecologicalData.generalOrientationNotes && (
                              <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}>
                                <strong style={{ color: 'var(--color-primary-dark)', display: 'block', marginBottom: '0.25rem' }}>
                                  📋 Orientações Assistenciais & Retorno:
                                </strong>
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                                  {record.gynecologicalData.generalOrientationNotes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Grade SOAP Tradicional */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1rem',
                        fontSize: '0.9rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ background: 'var(--color-neutral-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <strong style={{ color: 'var(--color-primary-dark)', display: 'block', marginBottom: '0.25rem' }}>
                          S — Subjetivo (Anamnese / Queixa):
                        </strong>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--color-neutral-dark)' }}>
                          {record.subjective || <em style={{ color: 'var(--color-neutral-muted)' }}>Sem registro</em>}
                        </p>
                      </div>

                      <div style={{ background: 'var(--color-neutral-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <strong style={{ color: 'var(--color-primary-dark)', display: 'block', marginBottom: '0.25rem' }}>
                          O — Objetivo (Exame Físico / Sinais):
                        </strong>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--color-neutral-dark)' }}>
                          {record.objective || <em style={{ color: 'var(--color-neutral-muted)' }}>Sem registro</em>}
                        </p>
                      </div>

                      <div style={{ background: 'var(--color-neutral-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <strong style={{ color: 'var(--color-primary-dark)', display: 'block', marginBottom: '0.25rem' }}>
                          A — Avaliação (Diagnóstico / Hipótese):
                        </strong>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--color-neutral-dark)' }}>
                          {record.assessment || <em style={{ color: 'var(--color-neutral-muted)' }}>Sem registro</em>}
                        </p>
                      </div>

                      <div style={{ background: 'var(--color-neutral-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <strong style={{ color: 'var(--color-primary-dark)', display: 'block', marginBottom: '0.25rem' }}>
                          P — Plano (Conduta / Orientações):
                        </strong>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--color-neutral-dark)' }}>
                          {record.plan || <em style={{ color: 'var(--color-neutral-muted)' }}>Sem registro</em>}
                        </p>
                      </div>
                    </div>

                    {record.clinicalNotes && (
                      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', borderLeft: '4px solid #64748b' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#475569' }}>Notas Clínicas Gerais:</strong>
                        <p style={{ margin: '0.25rem 0 0', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{record.clinicalNotes}</p>
                      </div>
                    )}

                    {/* Adendos Registrados (CFM / SBIS NGS2) */}
                    {record.addenda && record.addenda.length > 0 && (
                      <div style={{ borderTop: '1px dashed var(--color-neutral-border)', paddingTop: '1rem', marginTop: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
                          Adendos Clínicos e Retificações ({record.addenda.length})
                        </h4>
                        {record.addenda.map((ad) => (
                          <div
                            key={ad.id}
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderLeft: '4px solid #16a34a',
                              padding: '0.75rem 1rem',
                              borderRadius: 'var(--radius-sm)',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <p style={{ fontSize: '0.75rem', color: '#166534', margin: '0 0 0.25rem' }}>
                              Registrado em {new Date(ad.createdAt).toLocaleString('pt-BR')} • Justificativa:{' '}
                              <strong>{ad.justification}</strong>
                            </p>
                            <p style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{ad.notes}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Botão para Inserir Novo Adendo se o prontuário estiver finalizado */}
                    {record.status === 'finalizado' && (
                      <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                        {selectedRecordForAddendum === record.id ? (
                          <div
                            style={{
                              background: '#ffffff',
                              padding: '1.25rem',
                              borderRadius: 'var(--radius-md)',
                              border: '2px solid var(--color-primary)',
                              textAlign: 'left',
                              marginTop: '0.75rem',
                            }}
                          >
                            <h5 style={{ margin: '0 0 0.5rem', color: 'var(--color-primary-dark)', fontSize: '1rem' }}>
                              Novo Adendo Clínico (CFM / LGPD)
                            </h5>
                            <p className="form__hint" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                              Conforme as normas do CFM, um prontuário finalizado não pode ser modificado. O adendo registra notas suplementares com carimbo imutável.
                            </p>
                            <input
                              type="text"
                              className="form__input"
                              placeholder="Justificativa formal obrigatória (ex.: Laudo de biópsia recebido posteriormente)"
                              value={addendumJustification}
                              onChange={(e) => setAddendumJustification(e.target.value)}
                              style={{ marginBottom: '0.5rem' }}
                            />
                            <textarea
                              className="form__textarea"
                              rows={3}
                              placeholder="Conteúdo descritivo do adendo clínico…"
                              value={addendumNotes}
                              onChange={(e) => setAddendumNotes(e.target.value)}
                              style={{ marginBottom: '0.75rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="button button--secondary button--small"
                                onClick={() => setSelectedRecordForAddendum(null)}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                className="button button--primary button--small"
                                onClick={() => handleAddAddendum(record.id)}
                                disabled={savingAddendum}
                              >
                                {savingAddendum ? 'Gravando Adendo…' : 'Gravar Adendo'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="button button--secondary button--small"
                            onClick={() => {
                              setSelectedRecordForAddendum(record.id);
                              setAddendumJustification('');
                              setAddendumNotes('');
                            }}
                          >
                            + Inserir Adendo Clínico
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )
          ) : activeTab === 'attachments' ? (
            /* Aba de Exames Anteriores Anexados */
            <PatientExamAttachmentsSection patientId={patientId!} canEdit={true} />
          ) : (
            /* Aba de Documentos do Paciente */
            documents.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-neutral-border)',
                  padding: '3rem',
                  textAlign: 'center',
                  color: 'var(--color-neutral-muted)',
                }}
              >
                <p style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Nenhum documento ou receita emitido para este paciente.</p>
                <button
                  type="button"
                  className="button button--primary button--small"
                  onClick={() => setDocModalOpen(true)}
                  style={{ marginTop: '0.5rem' }}
                >
                  📄 Emitir Primeira Receita / Atestado
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--color-neutral-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <strong style={{ fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
                          {doc.documentType === 'receita_simples'
                            ? 'Receita Simples'
                            : doc.documentType === 'receita_controle_especial'
                            ? 'Receita de Controle Especial'
                            : doc.documentType === 'atestado_medico'
                            ? 'Atestado Médico'
                            : 'Solicitação de Exames'}
                        </strong>
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: doc.status === 'assinado' ? '#dcfce7' : doc.status === 'cancelado' ? '#fee2e2' : '#fef9c3',
                            color: doc.status === 'assinado' ? '#15803d' : doc.status === 'cancelado' ? '#991b1b' : '#854d0e',
                          }}
                        >
                          {doc.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="form__hint" style={{ margin: 0 }}>
                        Emitido em: {new Date(doc.createdAt).toLocaleString('pt-BR')} • Chave pública:{' '}
                        <code>{doc.publicToken}</code>
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link
                        to={`/p/cana-med/validar/${doc.publicToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button button--secondary button--small"
                        title="Ver página de validação pública e QR Code"
                      >
                        🔍 Validar Documento ↗
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Modal de Emissão de Documento */}
          {selectedPatient && (
            <DocumentModal
              isOpen={docModalOpen}
              patientId={selectedPatient.id}
              patientName={selectedPatient.name}
              onClose={() => setDocModalOpen(false)}
              onDocumentIssued={() => {
                if (patientId) {
                  getPatientMedicalDocuments(patientId).then(setDocuments);
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
