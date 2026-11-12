import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import type { PrenatalVisitItem, GynecologicalProfileInfo, MaternalVaccineItem, MaternalSerologyItem } from './PrenatalCardSection';
import { createPortal } from 'react-dom';
import './prenatal-card-a4.css';

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientBirthDate?: string | null;
  bloodType?: string | null;
  rhFactor?: string | null;
  gynProfile?: GynecologicalProfileInfo | null;
  dum?: string | null;
  dpp?: string | null;
  heightCm?: number | null;
  visits: PrenatalVisitItem[];
  vaccines?: MaternalVaccineItem[];
  serologies?: MaternalSerologyItem[];
}

export const PrenatalCardA4Modal: React.FC<Props> = ({
  open,
  onClose,
  patientId,
  patientName,
  patientBirthDate,
  bloodType,
  rhFactor,
  gynProfile,
  dum,
  dpp,
  heightCm = 165,
  visits,
  vaccines = [],
  serologies = [],
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const maternalHeight = heightCm && heightCm > 50 ? heightCm : 165;
  const latestVisit = visits.length > 0 ? visits[visits.length - 1] : null;

  const formatDate = (iso?: string | null) => {
    if (!iso) return 'Não informada';
    try {
      const parts = iso.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return new Date(iso).toLocaleDateString('pt-BR');
    } catch {
      return iso;
    }
  };

  const calculateAge = (birthIso?: string | null) => {
    if (!birthIso) return '';
    try {
      const birth = new Date(birthIso);
      const diff = Date.now() - birth.getTime();
      const ageDate = new Date(diff);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      return ` (${age} anos)`;
    } catch {
      return '';
    }
  };

  const isRhNegative = rhFactor?.toLowerCase().includes('negativ') || (bloodType && bloodType.includes('-'));
  const fullBloodType = bloodType ? `${bloodType}${isRhNegative ? '-' : '+'}` : 'A+';

  const firstVisit = visits.length > 0 ? visits[0] : null;
  const basalWeight = firstVisit ? firstVisit.weightKg : 62.5;
  const basalBmi = basalWeight ? (basalWeight / Math.pow(maternalHeight / 100, 2)).toFixed(1) : '22.9';

  const handlePrint = () => {
    window.print();
  };

  const sortedVisits = [...visits].sort((a, b) => a.gestationalAgeWeeks - b.gestationalAgeWeeks);

  const getVaccineData = (id: string, defaultStatus = 'Pendente') => {
    const found = vaccines.find((vac) => vac.id === id);
    if (!found) {
      return {
        date: '—',
        lot: '—',
        status: defaultStatus,
      };
    }
    return {
      date: found.date && found.date !== '—' ? found.date : '—',
      lot: found.lot && found.lot !== '—' ? found.lot : '—',
      status: found.status || defaultStatus,
    };
  };

  const dtpaData = getVaccineData('dtpa', 'Pendente');
  const fluData = getVaccineData('flu', 'Pendente');
  const hepbData = getVaccineData('hepb', 'Pendente');
  const covidData = getVaccineData('covid', 'Pendente');
  const rsvData = getVaccineData('rsv', 'Pendente');
  const antidData = getVaccineData('antid', isRhNegative ? 'Pendente' : 'Não indicada');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aplicada':
        return { color: '#047857', label: '● Aplicada' };
      case 'Agendada':
        return { color: '#2563EB', label: '● Agendada' };
      case 'Não indicada':
        return { color: '#64748B', label: '● Não indicada' };
      default:
        return { color: '#D97706', label: '○ Pendente' };
    }
  };

  return createPortal(
    <div id="prenatal-card-print-portal" className="prenatal-a4-modal-overlay">
      {/* =====================================================================
           BARRA DE CONTROLE DO PROTÓTIPO CANAMED (STICKY)
           ===================================================================== */}
      <header className="prenatal-a4-topbar no-print">
        <div className="prenatal-a4-topbar__inner">
          <div className="prenatal-a4-topbar__brand">
            <div className="prenatal-a4-topbar__brand-icon">
              <svg className="w-4 h-4" style={{ width: 16, height: 16, color: '#FFFFFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <div>
              <span className="prenatal-a4-topbar__tag">Cartão da Gestante A4 — 6 Páginas</span>
              <h1 className="prenatal-a4-topbar__title">Cartão da Gestante · Cana Med Mulher</h1>
            </div>
          </div>

          {/* Navegação rápida das 6 páginas */}
          <nav className="prenatal-a4-topbar__nav">
            <a href="#page-1" className="prenatal-a4-topbar__nav-link">Pág 1 · Identificação</a>
            <a href="#page-2" className="prenatal-a4-topbar__nav-link">Pág 2 · Dados & Sorologias</a>
            <a href="#page-3" className="prenatal-a4-topbar__nav-link prenatal-a4-topbar__nav-link--accent">Pág 3 · Vacinas Gestante</a>
            <a href="#page-4" className="prenatal-a4-topbar__nav-link">Pág 4 · Curvas Gráficas</a>
            <a href="#page-5" className="prenatal-a4-topbar__nav-link">Pág 5 · Consultas 1–10</a>
            <a href="#page-6" className="prenatal-a4-topbar__nav-link">Pág 6 · Anotações & Alertas</a>
          </nav>

          <div className="prenatal-a4-topbar__actions">
            <button
              type="button"
              onClick={handlePrint}
              className="prenatal-a4-topbar__btn-print"
              title="Abre o diálogo de impressão para Salvar em PDF com qualidade vetorial e visual idêntico ao protótipo"
            >
              <Printer style={{ width: 15, height: 15 }} />
              Salvar como PDF / Imprimir (A4)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="prenatal-a4-topbar__btn-close"
              aria-label="Fechar"
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>
      </header>

      {/* ÁREA DE ROLAGEM DAS 6 PÁGINAS A4 */}
      <main className="prenatal-a4-scroll-area" ref={printRef}>

        {/* =====================================================================
             PÁGINA 1 — MINHA GESTAÇÃO (APRESENTAÇÃO E IDENTIFICAÇÃO)
             ===================================================================== */}
        <section id="page-1" className="a4-sheet">
          <div>
            {/* Topo Institucional */}
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div className="flex items-center gap-2-5">
                {/* Símbolo Oficial Cana Med Mulher */}
                <svg style={{ width: 28, height: 28 }} viewBox="0 0 32 32" fill="none">
                  <path d="M16 28V12" stroke="#6F217B" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 20C16 14 21 10 26 10C26 15 22 20 16 20Z" stroke="#852A91" strokeWidth="2" strokeLinejoin="round" fill="#F7ECF8"/>
                  <path d="M16 16C16 11 11 7 6 7C6 12 10 16 16 16Z" stroke="#D83C91" strokeWidth="2" strokeLinejoin="round" fill="#FDF2F8"/>
                </svg>
                <div>
                  <span className="text-xxs font-bold tracking-widest uppercase text-brand-deep block">Cana Med Mulher</span>
                  <span className="text-xxs text-brand-gray">Caderneta de Cuidado e Acompanhamento Materno</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xxs uppercase tracking-wider text-brand-gray block">Emissão do Documento</span>
                <span className="text-xs font-semibold text-brand-ink">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            {/* Hero de Acolhimento */}
            <div className="mt-7 mb-7 rounded-2xl bg-brand-soft border border-brand-lilac p-7 overflow-hidden">
              <span className="inline-block text-xxs font-bold uppercase tracking-widest text-brand-primary mb-2">
                Meu acompanhamento pré-natal
              </span>
              <h2 className="font-serif text-4xl font-bold text-brand-deep tracking-tight leading-tight">
                Minha Gestação
              </h2>
              <p className="text-xs text-brand-gray mt-2 leading-relaxed" style={{ maxWidth: 520 }}>
                Este cartão é seu registro oficial e afetivo de saúde materna. Mantenha-o sempre em sua bolsa e apresente em todas as consultas, exames laboratoriais e maternidade.
              </p>
            </div>

            {/* Bloco 1: Quem sou eu (Identificação) */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-3 border-b border-brand-border pb-1-5">
                <h3 className="font-serif text-2xl font-semibold text-brand-deep">Quem sou eu</h3>
                <span className="text-xxs text-brand-gray">Identificação da gestante</span>
              </div>

              <div className="grid grid-cols-12 gap-3-5">
                <div className="col-span-8 rounded-xl bg-brand-cream border border-brand-border p-4 flex flex-col justify-between">
                  <span className="text-xxs font-bold uppercase tracking-wider text-brand-gray">Nome completo</span>
                  <p className="text-lg font-bold text-brand-ink mt-1">{patientName}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-brand-gray">
                    <span>Nascimento: <strong className="text-brand-ink">{formatDate(patientBirthDate)}{calculateAge(patientBirthDate)}</strong></span>
                    <span>Prontuário: <strong className="text-brand-ink">#MED-{patientId.slice(0, 8).toUpperCase()}</strong></span>
                  </div>
                </div>

                {/* Tipagem Sanguínea e Fator Rh em Destaque */}
                <div className="col-span-4 rounded-xl bg-brand-primary text-white p-4 flex flex-col items-center justify-center text-center shadow-sm" style={{ backgroundColor: isRhNegative ? '#B91C1C' : '#852A91' }}>
                  <span className="text-xxs font-bold uppercase tracking-wider text-purple-200" style={{ color: '#F7ECF8' }}>Tipo Sanguíneo & Rh</span>
                  <span className="font-serif text-4xl font-bold text-white my-1">{fullBloodType}</span>
                  <span className="text-xxs font-semibold" style={{ color: '#F7ECF8' }}>
                    {isRhNegative ? 'Vigilância de Aloimunização' : 'Fator Rh Positivo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco 2: Meu Histórico Obstétrico (GPA Humanizado) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 border-b border-brand-border pb-1-5">
                <h3 className="font-serif text-2xl font-semibold text-brand-deep">Meu histórico obstétrico</h3>
                <span className="text-xxs text-brand-gray">Gestações anteriores</span>
              </div>

              <div className="grid grid-cols-5 gap-3">
                <div className="bg-brand-cream border border-brand-border rounded-xl p-3-5 text-center">
                  <span className="text-3xl font-serif font-bold text-brand-deep block mb-1">{gynProfile?.gravida ?? (visits.length > 0 ? 1 : 1)}</span>
                  <span className="text-xs font-bold text-brand-deep block">Gestações</span>
                  <span className="text-xxs text-brand-gray block mt-0-5">Incluindo a atual</span>
                </div>
                <div className="bg-brand-cream border border-brand-border rounded-xl p-3-5 text-center">
                  <span className="text-3xl font-serif font-bold text-brand-deep block mb-1">{gynProfile?.para ?? 0}</span>
                  <span className="text-xs font-bold text-brand-deep block">Partos normais</span>
                  <span className="text-xxs text-brand-gray block mt-0-5">Vaginais prévios</span>
                </div>
                <div className="bg-brand-cream border border-brand-border rounded-xl p-3-5 text-center">
                  <span className="text-3xl font-serif font-bold text-brand-deep block mb-1">{gynProfile?.cesareans ?? 0}</span>
                  <span className="text-xs font-bold text-brand-deep block">Cesarianas</span>
                  <span className="text-xxs text-brand-gray block mt-0-5">Partos cirúrgicos</span>
                </div>
                <div className="bg-brand-cream border border-brand-border rounded-xl p-3-5 text-center">
                  <span className="text-3xl font-serif font-bold text-brand-deep block mb-1">{gynProfile?.abortions ?? 0}</span>
                  <span className="text-xs font-bold text-brand-deep block">Abortamentos</span>
                  <span className="text-xxs text-brand-gray block mt-0-5">{gynProfile?.abortions ? 'Histórico prévio' : 'Sem perdas prévias'}</span>
                </div>
                <div className="bg-brand-soft border border-brand-lilac rounded-xl p-3-5 text-center">
                  <span className="text-3xl font-serif font-bold text-brand-primary block mb-1">{gynProfile?.livingChildren ?? 0}</span>
                  <span className="text-xs font-bold text-brand-primary block">Filhos vivos</span>
                  <span className="text-xxs text-brand-deep block mt-0-5">Prole atual</span>
                </div>
              </div>
            </div>

            {/* Orientação de Cuidado */}
            <div className="rounded-xl border border-brand-border bg-brand-cream p-4 flex items-start gap-3-5">
              <div className="w-8 h-8 rounded-full bg-brand-soft text-brand-primary flex items-center justify-center shrink-0 mt-0-5 border border-brand-lilac" style={{ width: 32, height: 32 }}>
                <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="text-xs text-brand-gray leading-relaxed">
                <strong className="text-brand-ink font-bold block mb-0-5">Importância do Porte Contínuo</strong>
                Leve este cartão em todas as consultas médicas, postos de saúde, exames e maternidade. Ele garante que toda a equipe assistencial conheça os detalhes da sua gravidez com segurança e acolhimento.
              </div>
            </div>
          </div>

          {/* Rodapé Institucional */}
          <footer className="sheet-footer">
            <div>
              <strong className="text-brand-deep font-bold">Cana Med Mulher</strong> · Cartão da Gestante · Lei nº 13.787/2018
            </div>
            <div className="font-semibold text-brand-primary">Página 1 de 6</div>
          </footer>
        </section>


        {/* =====================================================================
             PÁGINA 2 — MINHA GESTAÇÃO EM ACOMPANHAMENTO & SOROLOGIAS
             ===================================================================== */}
        <section id="page-2" className="a4-sheet">
          <div>
            <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-deep">Cana Med Mulher</span>
                <span className="text-brand-lilac">•</span>
                <span className="text-xs text-brand-gray">{patientName}</span>
              </div>
              <span className="text-xxs font-semibold text-brand-primary">Minha gestação em acompanhamento</span>
            </div>

            <div className="mb-6">
              <h2 className="font-serif text-2xl font-bold text-brand-deep">
                Marcos da Gestação & Acompanhamento
              </h2>
              <p className="text-xs text-brand-gray mt-0-5 mb-4">
                Datas de referência, cálculo do tempo gestacional e exames laboratoriais essenciais.
              </p>

              <div className="grid grid-cols-12 gap-3-5 mb-4">
                <div className="col-span-6 rounded-xl bg-brand-soft border border-brand-lilac p-4 flex flex-col justify-between">
                  <span className="text-xxs font-bold uppercase tracking-wider text-brand-deep">Idade gestacional na emissão</span>
                  <div className="my-2">
                    <span className="font-serif text-3xl font-bold text-brand-deep">
                      {latestVisit
                        ? `${latestVisit.gestationalAgeWeeks} semanas e ${latestVisit.gestationalAgeDays} dias`
                        : 'Em acompanhamento'}
                    </span>
                  </div>
                  <span className="text-xxs text-brand-gray">
                    {latestVisit && latestVisit.gestationalAgeWeeks >= 28 ? '3º trimestre gestacional' : '2º trimestre gestacional'}
                  </span>
                </div>

                <div className="col-span-6 rounded-xl bg-brand-pink-light border p-4 flex flex-col justify-between" style={{ borderColor: 'rgba(216, 60, 145, 0.4)' }}>
                  <span className="text-xxs font-bold uppercase tracking-wider text-brand-magenta">Data provável do parto (DPP)</span>
                  <div className="my-2">
                    <span className="font-serif text-3xl font-bold text-brand-deep">{formatDate(dpp)}</span>
                  </div>
                  <span className="text-xxs text-brand-gray">Estimativa clínica (Regra de Naegele)</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-brand-cream border border-brand-border p-3-5">
                  <span className="text-xxs font-bold uppercase tracking-wider text-brand-gray block mb-1">DUM (Última Menstruação)</span>
                  <p className="text-base font-bold text-brand-ink">{formatDate(dum)}</p>
                  <span className="text-xxs text-brand-gray block mt-0-5">Data de referência</span>
                </div>

                <div className="rounded-xl bg-brand-cream border border-brand-border p-3-5">
                  <span className="text-xxs font-bold uppercase tracking-wider text-brand-gray block mb-1">1º Ultrassom Precoce</span>
                  <p className="text-base font-bold text-brand-ink">{firstVisit ? formatDate(firstVisit.visitDate) : 'Concordante'}</p>
                  <span className="text-xxs text-brand-gray block mt-0-5">Biometria fetal inicial</span>
                </div>

                <div className="rounded-xl bg-brand-cream border border-brand-border p-3-5">
                  <span className="text-xxs font-bold uppercase tracking-wider text-brand-gray block mb-1">Estatura & IMC Basal</span>
                  <p className="text-base font-bold text-brand-primary">{maternalHeight} cm · {basalBmi} kg/m²</p>
                  <span className="text-xxs text-brand-gray block mt-0-5">IMC inicial adequado</span>
                </div>
              </div>
            </div>

            {/* Tabela de Sorologias Trimestrais */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-2xl font-semibold text-brand-deep">
                  Acompanhamento Laboratorial & Sorologias
                </h3>
                <span className="text-xxs text-brand-gray">Protocolo FEBRASGO / Ministério da Saúde</span>
              </div>
              <p className="text-xs text-brand-gray mb-3-5">
                Rastreio trimestral de infecções congênitas e vigilância metabólica materna.
              </p>

              <div className="border border-brand-border rounded-xl overflow-hidden shadow-sm">
                <table className="sorology-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Exame / Avaliação</th>
                      <th style={{ width: '20%', textAlign: 'center' }}>1º Trimestre</th>
                      <th style={{ width: '20%', textAlign: 'center' }}>2º Trimestre</th>
                      <th style={{ width: '20%', textAlign: 'center' }}>3º Trimestre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serologies && serologies.length > 0 ? (
                      serologies.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <strong>{s.exam}</strong>
                            <span className="block text-xxs text-brand-gray">{s.description}</span>
                          </td>
                          <td className="text-center">{s.tri1 || '—'}</td>
                          <td className="text-center">{s.tri2 || '—'}</td>
                          <td className={`text-center ${s.tri3 === 'Solicitado' ? 'font-semibold text-brand-primary' : ''}`}>
                            {s.tri3 || '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center text-xs text-brand-gray py-4">
                          Nenhuma sorologia registrada até o momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <footer className="sheet-footer">
            <div>
              <strong className="text-brand-deep font-bold">Cana Med Mulher</strong> · Cartão da Gestante · Lei nº 13.787/2018
            </div>
            <div className="font-semibold text-brand-primary">Página 2 de 6</div>
          </footer>
        </section>


        {/* =====================================================================
             PÁGINA 3 — PÁGINA EXCLUSIVA DEDICADA: VACINAS DA GESTANTE
             ===================================================================== */}
        <section id="page-3" className="a4-sheet">
          <div>
            <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-deep">Cana Med Mulher</span>
                <span className="text-brand-lilac">•</span>
                <span className="text-xs text-brand-gray">{patientName}</span>
              </div>
              <span className="text-xxs font-semibold text-brand-magenta">Carteira de Imunização Materna</span>
            </div>

            {/* Hero da Página de Vacinas */}
            <div className="rounded-2xl bg-brand-soft border border-brand-lilac p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-sm" style={{ width: 40, height: 40 }}>
                  <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xxs font-bold uppercase tracking-widest text-brand-primary block">Imunização Materno-Infantil</span>
                  <h2 className="font-serif text-3xl font-bold text-brand-deep">
                    Minhas Vacinas na Gestação: Proteção para Mim e para Meu Bebê
                  </h2>
                </div>
              </div>
              <p className="text-xs text-brand-gray leading-relaxed mt-2">
                As vacinas durante a gravidez protegem a gestante de quadros graves e transferem anticorpos protetores (imunoglobulinas IgG) através da placenta. Esse escudo imunológico acompanha o recém-nascido durante os primeiros meses de vida, antes de ele completar o próprio calendário vacinal.
              </p>
            </div>

            {/* Grade de Vacinas Recomendadas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {/* 1. dTpa */}
              <div className="rounded-xl border border-brand-lilac bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2-5">
                    <span className="rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center" style={{ width: 24, height: 24 }}>1</span>
                    <div>
                      <h4 className="text-sm font-bold text-brand-deep" style={{ margin: 0 }}>dTpa (Tríplice Bacteriana Acelular do Adulto)</h4>
                      <span className="text-xxs text-brand-gray">Previne Difteria, Tétano e Coqueluche no bebê</span>
                    </div>
                  </div>
                  <span className="px-2-5 py-0-5 rounded-full text-xxs font-bold bg-brand-pink-light text-brand-magenta border" style={{ borderColor: 'rgba(216, 60, 145, 0.3)' }}>
                    A partir da 20ª sem (ideal 27ª–36ªs)
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2 bg-brand-cream rounded-lg p-2 text-xs text-brand-ink">
                  <div><span className="text-xxs text-brand-gray block">Data:</span> <strong>{dtpaData.date}</strong></div>
                  <div><span className="text-xxs text-brand-gray block">IG Aplicação:</span> <strong>A partir da 20ª sem</strong></div>
                  <div><span className="text-xxs text-brand-gray block">Lote:</span> <strong>{dtpaData.lot}</strong></div>
                  <div>
                    <span className="text-xxs text-brand-gray block">Status:</span>
                    <strong style={{ color: getStatusBadge(dtpaData.status).color }}>
                      {getStatusBadge(dtpaData.status).label}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 2. Influenza */}
              <div className="rounded-xl border border-brand-border bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2-5">
                    <span className="rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center" style={{ width: 24, height: 24 }}>2</span>
                    <div>
                      <h4 className="text-sm font-bold text-brand-deep" style={{ margin: 0 }}>Influenza (Gripe Sazonal)</h4>
                      <span className="text-xxs text-brand-gray">Previne infecções respiratórias graves</span>
                    </div>
                  </div>
                  <span className="px-2-5 py-0-5 rounded-full text-xxs font-bold bg-brand-soft text-brand-primary border border-brand-lilac">
                    Qualquer Idade Gestacional (1 dose anual)
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2 bg-brand-cream rounded-lg p-2 text-xs text-brand-ink">
                  <div><span className="text-xxs text-brand-gray block">Data:</span> <strong>{fluData.date}</strong></div>
                  <div><span className="text-xxs text-brand-gray block">Campanha:</span> <strong>Sazonal</strong></div>
                  <div><span className="text-xxs text-brand-gray block">Lote:</span> <strong>{fluData.lot}</strong></div>
                  <div>
                    <span className="text-xxs text-brand-gray block">Status:</span>
                    <strong style={{ color: getStatusBadge(fluData.status).color }}>
                      {getStatusBadge(fluData.status).label}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 3. Hepatite B */}
              <div className="rounded-xl border border-brand-border bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2-5">
                    <span className="rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center" style={{ width: 24, height: 24 }}>3</span>
                    <div>
                      <h4 className="text-sm font-bold text-brand-deep" style={{ margin: 0 }}>Hepatite B (Recombinante)</h4>
                      <span className="text-xxs text-brand-gray">Previne transmissão vertical da Hepatite B</span>
                    </div>
                  </div>
                  <span className="px-2-5 py-0-5 rounded-full text-xxs font-bold bg-brand-soft text-brand-primary border border-brand-lilac">
                    3 doses (0, 1 e 6 meses) ou esquema prévio
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 bg-brand-cream rounded-lg p-2 text-xs text-brand-ink">
                  <div><span className="text-xxs text-brand-gray block">Data:</span> <strong>{hepbData.date}</strong></div>
                  <div><span className="text-xxs text-brand-gray block">Lote:</span> <strong>{hepbData.lot}</strong></div>
                  <div>
                    <span className="text-xxs text-brand-gray block">Status:</span>
                    <strong style={{ color: getStatusBadge(hepbData.status).color }}>
                      {getStatusBadge(hepbData.status).label}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 4. COVID-19 */}
              <div className="rounded-xl border border-brand-border bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2-5">
                    <span className="rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center" style={{ width: 24, height: 24 }}>4</span>
                    <div>
                      <h4 className="text-sm font-bold text-brand-deep" style={{ margin: 0 }}>COVID-19 (Vacina Atualizada / Reforço)</h4>
                      <span className="text-xxs text-brand-gray">Proteção contra formas graves da SARS-CoV-2</span>
                    </div>
                  </div>
                  <span className="px-2-5 py-0-5 rounded-full text-xxs font-bold bg-brand-soft text-brand-primary border border-brand-lilac">
                    Qualquer Idade Gestacional
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2 bg-brand-cream rounded-lg p-2 text-xs text-brand-ink">
                  <div><span className="text-xxs text-brand-gray block">Dose / Data:</span> <strong>{covidData.date}</strong></div>
                  <div><span className="text-xxs text-brand-gray block">Fabricante:</span> <strong>Atualizada PNI</strong></div>
                  <div><span className="text-xxs text-brand-gray block">Lote:</span> <strong>{covidData.lot}</strong></div>
                  <div>
                    <span className="text-xxs text-brand-gray block">Status:</span>
                    <strong style={{ color: getStatusBadge(covidData.status).color }}>
                      {getStatusBadge(covidData.status).label}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 5. VSR (Abrysvo) */}
              <div className="rounded-xl border border-brand-magenta bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2-5">
                    <span className="rounded-full bg-brand-magenta text-white text-xs font-bold flex items-center justify-center" style={{ width: 24, height: 24 }}>5</span>
                    <div>
                      <h4 className="text-sm font-bold text-brand-deep" style={{ margin: 0 }}>Vírus Sincicial Respiratório (VSR / Abrysvo)</h4>
                      <span className="text-xxs text-brand-gray">Previne bronquiolite e pneumonia no recém-nascido</span>
                    </div>
                  </div>
                  <span className="px-2-5 py-0-5 rounded-full text-xxs font-bold bg-brand-pink-light text-brand-magenta border" style={{ borderColor: '#D83C91' }}>
                    32ª a 36ª semanas (Dose Única)
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2 bg-brand-cream rounded-lg p-2 text-xs text-brand-ink">
                  <div><span className="text-xxs text-brand-gray block">Data:</span> <strong>{rsvData.date}</strong></div>
                  <div><span className="text-xxs text-brand-gray block">Lote:</span> <strong>{rsvData.lot}</strong></div>
                  <div><span className="text-xxs text-brand-gray block">Via:</span> <strong>Intramuscular</strong></div>
                  <div>
                    <span className="text-xxs text-brand-gray block">Status:</span>
                    <strong style={{ color: getStatusBadge(rsvData.status).color }}>
                      {getStatusBadge(rsvData.status).label}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 6. Anti-D */}
              <div className="rounded-xl border border-brand-border bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2-5">
                    <span className="rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ width: 24, height: 24, backgroundColor: '#B77AD8' }}>6</span>
                    <div>
                      <h4 className="text-sm font-bold text-brand-deep" style={{ margin: 0 }}>Imunoglobulina Anti-D (300 mcg)</h4>
                      <span className="text-xxs text-brand-gray">Profilaxia de aloimunização Rh (se gestante Rh negativo)</span>
                    </div>
                  </div>
                  <span className="px-2-5 py-0-5 rounded-full text-xxs font-bold bg-brand-soft text-brand-deep">
                    28ª semana e até 72h pós-parto
                  </span>
                </div>
                <div className="mt-2 bg-brand-cream rounded-lg p-2 text-xs text-brand-gray">
                  Status: <strong className="text-brand-ink" style={{ color: getStatusBadge(antidData.status).color }}>
                    {isRhNegative
                      ? `${getStatusBadge(antidData.status).label} (Mãe Rh Negativo · Data: ${antidData.date} · Lote: ${antidData.lot})`
                      : 'Não indicada (Gestante Rh Positivo)'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Alerta de Contraindicações na Gestação */}
            <div className="rounded-xl border p-3 flex items-start gap-3" style={{ borderColor: '#FECDD3', backgroundColor: 'rgba(255, 241, 242, 0.8)' }}>
              <svg style={{ width: 20, height: 20, color: '#E11D48', flexShrink: 0, marginTop: 2 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div className="text-xxs leading-relaxed" style={{ color: '#881337' }}>
                <strong className="font-bold">Atenção às Contraindicações Absolutas:</strong> Vacinas de vírus ou bactérias vivas atenuadas são terminantemente contraindicadas na gravidez: <strong>Tríplice Viral (Sarampo, Caxumba, Rubéola), Varicela (Catapora), Febre Amarela (salvo risco epidemiológico estrito), HPV e Dengue</strong>.
              </div>
            </div>
          </div>

          <footer className="sheet-footer">
            <div>
              <strong className="text-brand-deep font-bold">Cana Med Mulher</strong> · Cartão da Gestante · Lei nº 13.787/2018
            </div>
            <div className="font-semibold text-brand-primary">Página 3 de 6</div>
          </footer>
        </section>


        {/* =====================================================================
             PÁGINA 4 — CURVAS DE VIGILÂNCIA OBSTÉTRICA (ATALAH & ALTURA UTERINA)
             ===================================================================== */}
        <section id="page-4" className="a4-sheet">
          <div>
            <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-deep">Cana Med Mulher</span>
                <span className="text-brand-lilac">•</span>
                <span className="text-xs text-brand-gray">{patientName}</span>
              </div>
              <span className="text-xxs font-semibold text-brand-primary">Curvas de Vigilância Obstétrica</span>
            </div>

            <div className="mb-4">
              <h2 className="font-serif text-2xl font-bold text-brand-deep">
                Evolução Nutricional e Fetal
              </h2>
              <p className="text-xs text-brand-gray mt-0-5">
                Monitoramento do índice de massa corporal materno (Curva de Atalah) e do crescimento fetal (Curva de Altura Uterina).
              </p>
            </div>

            {/* Gráfico 1: Curva de Ganho de Peso Gestacional (Atalah) */}
            <div className="border border-brand-border rounded-xl bg-white p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-brand-deep" style={{ margin: 0 }}>Curva de IMC Gestacional (Critério de Atalah)</h3>
                  <span className="text-xxs text-brand-gray">Estatura: {maternalHeight} cm · IMC inicial: {basalBmi} kg/m²</span>
                </div>
                <div className="flex items-center gap-3 text-xxs">
                  <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, backgroundColor: '#F7ECF8', border: '1px solid #B77AD8', display: 'inline-block' }}></span> IMC Adequado</span>
                  <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, backgroundColor: '#852A91', borderRadius: '50%', display: 'inline-block' }}></span> Minha Evolução</span>
                </div>
              </div>

              {/* SVG da Curva de Atalah do Protótipo */}
              <svg viewBox="0 0 600 200" className="w-full h-44 border rounded-lg" style={{ borderColor: '#F1E8F5', backgroundColor: '#FAF5FB', width: '100%', height: '11rem' }}>
                {/* Faixas Atalah */}
                <polygon points="50,190 550,190 550,150 50,165" fill="#FFF1F2" />
                <polygon points="50,165 550,150 550,110 50,130" fill="#FFFBEB" />
                <polygon points="50,130 550,110 550,60 50,80" fill="#F7ECF8" />
                <polygon points="50,80 550,60 550,20 50,20" fill="#F0F9FF" />

                {/* Linhas de grade X */}
                <line x1="50" y1="20" x2="50" y2="190" stroke="#CBD5E1" strokeWidth="1"/>
                <line x1="150" y1="20" x2="150" y2="190" stroke="#CBD5E1" strokeDasharray="3 3"/>
                <line x1="250" y1="20" x2="250" y2="190" stroke="#CBD5E1" strokeDasharray="3 3"/>
                <line x1="350" y1="20" x2="350" y2="190" stroke="#CBD5E1" strokeDasharray="3 3"/>
                <line x1="450" y1="20" x2="450" y2="190" stroke="#CBD5E1" strokeDasharray="3 3"/>
                <line x1="550" y1="20" x2="550" y2="190" stroke="#CBD5E1" strokeWidth="1"/>

                {/* Rótulos Semanas */}
                <text x="50" y="198" fontSize="9" fill="#64748B" textAnchor="middle">6s</text>
                <text x="150" y="198" fontSize="9" fill="#64748B" textAnchor="middle">12s</text>
                <text x="250" y="198" fontSize="9" fill="#64748B" textAnchor="middle">20s</text>
                <text x="350" y="198" fontSize="9" fill="#64748B" textAnchor="middle">28s</text>
                <text x="450" y="198" fontSize="9" fill="#64748B" textAnchor="middle">34s</text>
                <text x="550" y="198" fontSize="9" fill="#64748B" textAnchor="middle">40s</text>

                {/* Linha da Paciente Real ou Padrão */}
                {sortedVisits.length > 0 ? (
                  <>
                    <polyline
                      points={sortedVisits.map((v) => {
                        const px = 50 + ((Math.max(6, Math.min(40, v.gestationalAgeWeeks)) - 6) / (40 - 6)) * 500;
                        const vBmi = v.bmi || (v.weightKg / Math.pow(maternalHeight / 100, 2));
                        const py = 190 - ((Math.max(16, Math.min(36, vBmi)) - 16) / (36 - 16)) * 170;
                        return `${px},${py}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#852A91"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {sortedVisits.map((v, i) => {
                      const px = 50 + ((Math.max(6, Math.min(40, v.gestationalAgeWeeks)) - 6) / (40 - 6)) * 500;
                      const vBmi = v.bmi || (v.weightKg / Math.pow(maternalHeight / 100, 2));
                      const py = 190 - ((Math.max(16, Math.min(36, vBmi)) - 16) / (36 - 16)) * 170;
                      return (
                        <circle key={i} cx={px} cy={py} r={i === sortedVisits.length - 1 ? 5 : 4} fill="#852A91" stroke="#FFFFFF" strokeWidth="1.5" />
                      );
                    })}
                  </>
                ) : (
                  <>
                    <polyline points="150,118 200,115 250,110 300,105 350,98" fill="none" stroke="#852A91" strokeWidth="3" strokeLinecap="round"/>
                    <circle cx="150" cy="118" r="4.5" fill="#6F217B" stroke="#FFFFFF" strokeWidth="1.5"/>
                    <circle cx="200" cy="115" r="4.5" fill="#6F217B" stroke="#FFFFFF" strokeWidth="1.5"/>
                    <circle cx="250" cy="110" r="4.5" fill="#6F217B" stroke="#FFFFFF" strokeWidth="1.5"/>
                    <circle cx="300" cy="105" r="4.5" fill="#6F217B" stroke="#FFFFFF" strokeWidth="1.5"/>
                    <circle cx="350" cy="98" r="5" fill="#852A91" stroke="#FFFFFF" strokeWidth="2"/>
                  </>
                )}
              </svg>
              <div className="mt-1 flex items-center justify-between text-xxs text-brand-gray">
                <span>Faixas: Azul (Baixo peso) · Lilás (Adequado) · Amarelo (Sobrepeso) · Rosa (Obesidade)</span>
                <span className="font-bold text-brand-primary">Última medição: {latestVisit ? `${latestVisit.gestationalAgeWeeks}s / IMC ${(latestVisit.bmi || latestVisit.weightKg / Math.pow(maternalHeight / 100, 2)).toFixed(1)} kg/m²` : 'Adequado'}</span>
              </div>
            </div>

            {/* Gráfico 2: Curva de Altura Uterina (P10 a P90) */}
            <div className="border border-brand-border rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-brand-deep" style={{ margin: 0 }}>Curva de Altura Uterina (Percentis 10 a 90)</h3>
                  <span className="text-xxs text-brand-gray">Crescimento fetal intrauterino conforme idade gestacional</span>
                </div>
                <div className="flex items-center gap-3 text-xxs">
                  <span className="flex items-center gap-1"><span style={{ width: 12, height: 2, backgroundColor: '#B77AD8', display: 'inline-block' }}></span> P10</span>
                  <span className="flex items-center gap-1"><span style={{ width: 12, height: 2, backgroundColor: '#D83C91', display: 'inline-block' }}></span> P90</span>
                  <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, backgroundColor: '#852A91', borderRadius: '50%', display: 'inline-block' }}></span> Altura da Paciente</span>
                </div>
              </div>

              {/* SVG da Altura Uterina */}
              <svg viewBox="0 0 600 200" className="w-full h-44 border rounded-lg" style={{ borderColor: '#F1E8F5', backgroundColor: '#FAF5FB', width: '100%', height: '11rem' }}>
                {/* Polígono P10 a P90 */}
                <polygon points="100,165 550,45 550,20 100,140" fill="#FDF2F8" />

                {/* Linhas P10 e P90 */}
                <line x1="100" y1="165" x2="550" y2="45" stroke="#B77AD8" strokeWidth="2" strokeDasharray="4 3"/>
                <line x1="100" y1="140" x2="550" y2="20" stroke="#D83C91" strokeWidth="2" strokeDasharray="4 3"/>

                {/* Linhas de grade X */}
                <line x1="100" y1="20" x2="100" y2="180" stroke="#CBD5E1" strokeWidth="1"/>
                <line x1="200" y1="20" x2="200" y2="180" stroke="#CBD5E1" strokeDasharray="3 3"/>
                <line x1="300" y1="20" x2="300" y2="180" stroke="#CBD5E1" strokeDasharray="3 3"/>
                <line x1="400" y1="20" x2="400" y2="180" stroke="#CBD5E1" strokeDasharray="3 3"/>
                <line x1="500" y1="20" x2="500" y2="180" stroke="#CBD5E1" strokeDasharray="3 3"/>

                {/* Rótulos Semanas */}
                <text x="100" y="195" fontSize="9" fill="#64748B" textAnchor="middle">12s</text>
                <text x="200" y="195" fontSize="9" fill="#64748B" textAnchor="middle">18s</text>
                <text x="300" y="195" fontSize="9" fill="#64748B" textAnchor="middle">24s</text>
                <text x="400" y="195" fontSize="9" fill="#64748B" textAnchor="middle">30s</text>
                <text x="500" y="195" fontSize="9" fill="#64748B" textAnchor="middle">36s</text>

                {/* Linha da Paciente Real ou Padrão */}
                {sortedVisits.filter((v) => v.uterineHeightCm && v.uterineHeightCm > 0).length > 0 ? (
                  <>
                    <polyline
                      points={sortedVisits.filter((v) => v.uterineHeightCm && v.uterineHeightCm > 0).map((v) => {
                        const px = 100 + ((Math.max(12, Math.min(38, v.gestationalAgeWeeks)) - 12) / (38 - 12)) * 450;
                        const py = 180 - ((Math.max(8, Math.min(38, v.uterineHeightCm!)) - 8) / (38 - 8)) * 150;
                        return `${px},${py}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#852A91"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {sortedVisits.filter((v) => v.uterineHeightCm && v.uterineHeightCm > 0).map((v, i) => {
                      const px = 100 + ((Math.max(12, Math.min(38, v.gestationalAgeWeeks)) - 12) / (38 - 12)) * 450;
                      const py = 180 - ((Math.max(8, Math.min(38, v.uterineHeightCm!)) - 8) / (38 - 8)) * 150;
                      return (
                        <circle key={i} cx={px} cy={py} r="4.5" fill="#6F217B" stroke="#FFFFFF" strokeWidth="1.5" />
                      );
                    })}
                  </>
                ) : (
                  <>
                    <polyline points="200,135 250,122 300,105 350,92 400,78" fill="none" stroke="#852A91" strokeWidth="3" strokeLinecap="round"/>
                    <circle cx="200" cy="135" r="4.5" fill="#6F217B" stroke="#FFFFFF" strokeWidth="1.5"/>
                    <circle cx="250" cy="122" r="4.5" fill="#6F217B" stroke="#FFFFFF" strokeWidth="1.5"/>
                    <circle cx="300" cy="105" r="4.5" fill="#6F217B" stroke="#FFFFFF" strokeWidth="1.5"/>
                    <circle cx="350" cy="92" r="4.5" fill="#6F217B" stroke="#FFFFFF" strokeWidth="1.5"/>
                    <circle cx="400" cy="78" r="5" fill="#852A91" stroke="#FFFFFF" strokeWidth="2"/>
                  </>
                )}
              </svg>
              <div className="mt-1 flex items-center justify-between text-xxs text-brand-gray">
                <span>Faixa tracejada lilás/magenta: intervalo esperado de normalidade fetal</span>
                <span className="font-bold text-brand-primary">Última medição: {latestVisit?.uterineHeightCm ? `${latestVisit.gestationalAgeWeeks}s / AU ${latestVisit.uterineHeightCm} cm (Eutrófico)` : 'Canal eutrófico'}</span>
              </div>
            </div>
          </div>

          <footer className="sheet-footer">
            <div>
              <strong className="text-brand-deep font-bold">Cana Med Mulher</strong> · Cartão da Gestante · Lei nº 13.787/2018
            </div>
            <div className="font-semibold text-brand-primary">Página 4 de 6</div>
          </footer>
        </section>


        {/* =====================================================================
             PÁGINA 5 — MINHAS CONSULTAS DE PRÉ-NATAL (CONSULTAS 1 A 10)
             ===================================================================== */}
        <section id="page-5" className="a4-sheet">
          <div>
            <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-deep">Cana Med Mulher</span>
                <span className="text-brand-lilac">•</span>
                <span className="text-xs text-brand-gray">{patientName}</span>
              </div>
              <span className="text-xxs font-semibold text-brand-primary">Consultas de Pré-Natal (1 a 10)</span>
            </div>

            <div className="mb-4">
              <h2 className="font-serif text-2xl font-bold text-brand-deep">
                Acompanhando Minha Gestação
              </h2>
              <p className="text-xs text-brand-gray mt-0-5 mb-3">
                Registro cronológico das consultas ambulatoriais, parâmetros vitais maternos e fetais.
              </p>
            </div>

            {/* Tabela Clínica de 10 Consultas */}
            <div className="border border-brand-lilac rounded-xl overflow-hidden shadow-sm mb-4">
              <table className="clinical-table">
                <thead>
                  <tr>
                    <th style={{ width: '14%' }}>Data</th>
                    <th style={{ width: '12%' }} className="num-col">IG (Sem/D)</th>
                    <th style={{ width: '10%' }} className="num-col">Peso (kg)</th>
                    <th style={{ width: '9%' }} className="num-col">IMC</th>
                    <th style={{ width: '12%' }} className="num-col">PA (mmHg)</th>
                    <th style={{ width: '9%' }} className="num-col">AU (cm)</th>
                    <th style={{ width: '11%' }} className="num-col">BCF (bpm)</th>
                    <th style={{ width: '11%' }} className="num-col">Mov. Fetal</th>
                    <th style={{ width: '12%' }}>Apresentação</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, index) => {
                    const v = visits[index];
                    if (v) {
                      const calculatedBmi = v.bmi || Number((v.weightKg / Math.pow(maternalHeight / 100, 2)).toFixed(1));
                      return (
                        <tr key={v.id || index}>
                          <td><strong>{formatDate(v.visitDate)}</strong></td>
                          <td className="num-col font-semibold">{v.gestationalAgeWeeks}s {v.gestationalAgeDays || 0}d</td>
                          <td className="num-col">{v.weightKg.toFixed(1)}</td>
                          <td className="num-col">{calculatedBmi}</td>
                          <td className="num-col">{v.bloodPressure}</td>
                          <td className="num-col">{v.uterineHeightCm ?? '—'}</td>
                          <td className="num-col">{v.fetalHeartRateBpm ?? '—'}</td>
                          <td className="num-col">
                            {v.fetalMovementPresent === true ? (
                              <span style={{ color: '#047857', fontWeight: 600 }}>Presente</span>
                            ) : v.fetalMovementPresent === false ? (
                              <span style={{ color: '#B91C1C', fontWeight: 600 }}>Ausente</span>
                            ) : (
                              <span style={{ color: '#64748B' }}>&lt; 18s</span>
                            )}
                          </td>
                          <td>{v.fetalPresentation || 'Cefálica'}</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={`empty-${index}`}>
                        <td style={{ color: '#CBD5E1' }}>____/____/____</td>
                        <td className="num-col" style={{ color: '#CBD5E1' }}>___s ___d</td>
                        <td className="num-col" style={{ color: '#CBD5E1' }}>___,__</td>
                        <td className="num-col" style={{ color: '#CBD5E1' }}>___,__</td>
                        <td className="num-col" style={{ color: '#CBD5E1' }}>___ / ___</td>
                        <td className="num-col" style={{ color: '#CBD5E1' }}>___,__</td>
                        <td className="num-col" style={{ color: '#CBD5E1' }}>___</td>
                        <td className="num-col" style={{ color: '#CBD5E1' }}>______</td>
                        <td style={{ color: '#CBD5E1' }}>____________</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legenda Explicativa Amigável */}
            <div className="rounded-xl border border-brand-border bg-brand-cream p-3 text-xxs text-brand-gray flex items-center justify-between">
              <span><strong>Legenda:</strong> IG (Idade Gestacional) · AU (Altura Uterina) · BCF (Batimentos Cardíacos Fetais, normal 110–160 bpm)</span>
              <span className="text-brand-primary font-semibold">Edema: Ausente em todas as visitas</span>
            </div>
          </div>

          <footer className="sheet-footer">
            <div>
              <strong className="text-brand-deep font-bold">Cana Med Mulher</strong> · Cartão da Gestante · Lei nº 13.787/2018
            </div>
            <div className="font-semibold text-brand-primary">Página 5 de 6</div>
          </footer>
        </section>


        {/* =====================================================================
             PÁGINA 6 — CONTINUAÇÃO, ANOTAÇÕES CLÍNICAS & SINAIS DE ALERTA
             ===================================================================== */}
        <section id="page-6" className="a4-sheet">
          <div>
            <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-deep">Cana Med Mulher</span>
                <span className="text-brand-lilac">•</span>
                <span className="text-xs text-brand-gray">{patientName}</span>
              </div>
              <span className="text-xxs font-semibold text-brand-primary">Anotações & Sinais de Alerta</span>
            </div>

            {/* Seção 1: Anotações das Minhas Consultas por Data */}
            <div className="mb-5">
              <h3 className="font-serif text-2xl font-bold text-brand-deep mb-2">
                Anotações & Condutas das Consultas
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {visits.filter((v) => v.clinicalNotes).slice(-3).reverse().map((v, i) => (
                  <div key={i} className="border border-brand-border rounded-xl p-3 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-brand-deep">{formatDate(v.visitDate)} · {v.gestationalAgeWeeks} semanas</span>
                      <span className="text-xxs text-brand-gray">Registro em Prontuário</span>
                    </div>
                    <p className="text-xs text-brand-ink leading-relaxed" style={{ margin: 0 }}>{v.clinicalNotes}</p>
                  </div>
                ))}
                {visits.filter((v) => v.clinicalNotes).length === 0 && (
                  <div className="border border-brand-border rounded-xl p-3 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-brand-deep">Rotina de Acompanhamento Pré-Natal</span>
                      <span className="text-xxs text-brand-gray">Cana Med Mulher</span>
                    </div>
                    <p className="text-xs text-brand-ink leading-relaxed" style={{ margin: 0 }}>
                      Consultas regulares sem intercorrências clínicas registradas. Prescrito polivitamínico gestacional e orientações habituais sobre movimentação fetal e hidratação.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Seção 2: Minhas Dúvidas para a Próxima Consulta */}
            <div className="mb-5">
              <h3 className="font-serif text-2xl font-bold text-brand-deep mb-1">
                Espaço para Minhas Dúvidas
              </h3>
              <p className="text-xxs text-brand-gray mb-2">
                Anote aqui perguntas, sintomas ou dúvidas que surgirem entre as consultas para conversar com sua médica:
              </p>
              <div className="border border-brand-lilac border-dashed rounded-xl p-3 bg-brand-cream text-xs text-brand-gray flex flex-col justify-between" style={{ minHeight: 90 }}>
                <span>• Plano de parto e opções de alívio da dor na maternidade...</span>
                <div className="border-b border-brand-border border-dashed w-full my-2"></div>
                <span className="text-xxs italic text-brand-lilac">Linha livre para anotações manuais da gestante</span>
              </div>
            </div>

            {/* Seção 3: Sinais de Alerta Obstétricos */}
            <div className="rounded-xl border p-4" style={{ borderColor: '#FCA5A5', backgroundColor: 'rgba(254, 242, 242, 0.85)' }}>
              <div className="flex items-center gap-2 mb-2">
                <svg style={{ width: 20, height: 20, color: '#DC2626', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <h4 className="text-sm font-bold" style={{ color: '#991B1B', margin: 0 }}>Sinais de Alerta — Procure a Maternidade Imediatamente:</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: '#7F1D1D' }}>
                <div>• Sangramento vaginal de qualquer intensidade</div>
                <div>• Perda de líquido pela vagina (bolsa rota)</div>
                <div>• Dor de cabeça intensa, turvação visual ou escotomas</div>
                <div>• Dor forte no estômago ou baixo ventre</div>
                <div>• Ausência ou diminuição acentuada dos movimentos fetais</div>
                <div>• Febre acima de 37.8°C ou calafrios</div>
              </div>
            </div>
          </div>

          <footer className="sheet-footer">
            <div>
              <strong className="text-brand-deep font-bold">Cana Med Mulher</strong> · Cartão da Gestante · Lei nº 13.787/2018
            </div>
            <div className="font-semibold text-brand-primary">Página 6 de 6</div>
          </footer>
        </section>

      </main>
    </div>,
    document.body
  );
};
