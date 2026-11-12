import React, { useState } from 'react';
import { patientApi } from '../patientApi';
import '../patient-serene.css';

export interface PrenatalVisit {
  week: number;
  date: string;
  title: string;
  bloodPressure: string;
  fetalHeartRateBpm?: number;
  uterineHeightCm?: number;
  weightKg?: number;
  notes?: string;
  isUltrasound?: boolean;
}

export interface AttachedDocument {
  id: string;
  title: string;
  date: string;
  size: string;
  doctorOrLab: string;
  pdfUrl?: string;
}

export interface DigitalPrenatalCardPageProps {
  patientName?: string;
  recordNumber?: string;
  bloodType?: string;
  isRhNegative?: boolean;
  gestationalAgeText?: string;
  currentWeeks?: number;
  totalWeeks?: number;
  lastMenstrualPeriod?: string;
  estimatedDueDate?: string;
  daysRemaining?: number;
  responsibleDoctor?: string;
  doctorCrm?: string;
  nextAppointmentDate?: string;
  visits?: PrenatalVisit[];
  documents?: AttachedDocument[];
  sessionToken?: string;
  onBack?: () => void;
  onDownloadPdf?: () => Promise<void> | void;
  onNavigateTab?: (tab: string) => void;
}

const defaultVisits: PrenatalVisit[] = [
  {
    week: 24,
    date: '14/10/2024',
    title: 'Consulta de rotina e aferição clínica',
    bloodPressure: '110 x 70 mmHg',
    fetalHeartRateBpm: 144,
    uterineHeightCm: 23,
    weightKg: 64.8,
    notes:
      'Desenvolvimento fetal compatível com a idade gestacional. Movimentação fetal ativa.',
  },
  {
    week: 20,
    date: '16/09/2024',
    title: 'Ultrassonografia Morfológica de 2º trimestre',
    bloodPressure: '115 x 75 mmHg',
    fetalHeartRateBpm: 148,
    uterineHeightCm: 19,
    weightKg: 62.5,
    notes: 'Parâmetros biométricos dentro da normalidade para a IG.',
    isUltrasound: true,
  },
  {
    week: 12,
    date: '22/07/2024',
    title: 'Ultrassom de Translucência Nucal',
    bloodPressure: '110 x 70 mmHg',
    fetalHeartRateBpm: 156,
    notes:
      'Exames laboratoriais de sangue e sorologias do 1º trimestre concluídos com sucesso.',
    isUltrasound: true,
  },
];

const defaultDocuments: AttachedDocument[] = [
  {
    id: '1',
    title: 'Morfologia Fetal 2T.pdf',
    date: '16 Set 2024',
    size: '2.4 MB',
    doctorOrLab: 'Dr. Arthur Albuquerque',
  },
  {
    id: '2',
    title: 'Hemograma Completo.pdf',
    date: '14 Out 2024',
    size: '640 KB',
    doctorOrLab: 'Lab Cana Med',
  },
];

export const DigitalPrenatalCardPage: React.FC<DigitalPrenatalCardPageProps> = ({
  patientName = 'Juliana Rocha Mendes',
  bloodType = 'A+',
  isRhNegative = false,
  gestationalAgeText = '26 sem e 3 dias',
  currentWeeks = 26,
  totalWeeks = 40,
  lastMenstrualPeriod = '15/04/2024',
  estimatedDueDate = '20/01/2025',
  responsibleDoctor = 'Dr. Arthur Albuquerque',
  doctorCrm = 'Médico Obstetra & Fisiologia Fetal',
  nextAppointmentDate = 'Seg, 04/Nov • 10:00',
  visits = defaultVisits,
  documents = defaultDocuments,
  sessionToken,
  onBack,
  onDownloadPdf,
  onNavigateTab,
}) => {
  const [downloading, setDownloading] = useState(false);

  const progressPercent = Math.min(100, Math.round((currentWeeks / totalWeeks) * 100));

  const handleDownload = async () => {
    if (onDownloadPdf) {
      await onDownloadPdf();
      return;
    }

    if (sessionToken) {
      setDownloading(true);
      try {
        const blob = await patientApi.downloadPrenatalCardPdf(sessionToken);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cartao-gestante-${patientName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Falha ao baixar PDF:', err);
      } finally {
        setDownloading(false);
      }
    } else {
      window.print();
    }
  };

  return (
    <div className="bg-[#F7F8FA] text-[#1E293B] antialiased font-body-md min-h-screen flex justify-center selection:bg-[#F7ECF8] selection:text-[#852A91]">
      {/* Container Responsivo Desconfinado (max-w-6xl no desktop) */}
      <div className="w-full max-w-6xl bg-transparent min-h-screen relative flex flex-col pb-24">
        {/* Top App Bar */}
        <header className="sticky top-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md px-4 md:px-6 pt-3.5 pb-3.5 border-b border-slate-200 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              aria-label="Voltar para tela anterior"
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
              type="button"
              onClick={onBack}
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-bold text-[#1E293B] tracking-tight">
                Cartão da Gestante
              </h1>
              <p className="text-xs text-[#64748B]">
                Seu acompanhamento pré-natal em um só lugar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Baixar Cartão em PDF"
              onClick={handleDownload}
              disabled={downloading}
              className="hidden sm:inline-flex bg-[#852A91] hover:bg-[#6F217B] text-white text-xs font-bold py-2 px-3.5 rounded-xl items-center gap-1.5 shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">
                {downloading ? 'hourglass_top' : 'download'}
              </span>
              <span>{downloading ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>
            <img
              alt="Logo Cana Med Mulher"
              className="h-8 w-auto object-contain pl-1"
              src="/assets/brand/canamed_logo-removebg-preview.png"
            />
          </div>
        </header>

        {/* Main Content Layout (Desktop 2 colunas / Mobile 1 coluna) */}
        <main className="flex-1 px-4 md:px-6 pt-5 space-y-6">
          {/* Badge de Status Clínico */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="inline-flex items-center gap-1.5 bg-[#F7ECF8] text-[#852A91] px-3.5 py-1.5 rounded-full text-xs border border-[#B77AD8]/30 font-semibold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#852A91] animate-pulse" />
                Gestação em Acompanhamento Ativo
              </div>
              <span className="text-xs text-[#64748B] font-bold">
                {bloodType} | {isRhNegative ? 'Rh Negativo' : 'Rh Positivo'}
              </span>
            </div>
            {isRhNegative && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium flex items-center justify-between">
                <span className="font-bold">Alerta Rh Negativo</span>
                <span>Acompanhamento de Coombs Indireto e Profilaxia Anti-D</span>
              </div>
            )}
          </div>

          {/* Grid de 2 Colunas no Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna Esquerda: Resumo Gestacional (5 colunas no desktop) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Card Principal: Resumo da Gestação */}
              <section className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3.5 mb-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#852A91] font-bold">
                      Prontuário Pré-Natal Digital
                    </span>
                    <h2 className="text-lg md:text-xl font-bold text-[#1E293B] mt-0.5">
                      {patientName}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-1 text-[#64748B] text-xs">
                      <span className="material-symbols-outlined text-[16px] text-[#852A91]">verified</span>
                      <span>Identificação: Gestação Única Tópica</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-[#F7ECF8] border border-[#B77AD8]/30 flex items-center justify-center text-[#852A91] flex-shrink-0 shadow-2xs">
                    <span
                      className="material-symbols-outlined text-[24px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      pregnant_woman
                    </span>
                  </div>
                </div>

                {/* Metric Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Idade Gestacional */}
                  <div className="col-span-2 bg-[#F7ECF8] p-4 rounded-xl border border-[#B77AD8]/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#64748B] font-bold block">
                        IDADE GESTACIONAL HOJE
                      </span>
                      <span className="text-2xl font-bold text-[#852A91]">
                        {gestationalAgeText}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#6F217B] font-bold bg-white px-3 py-1 rounded-full shadow-2xs">
                        2º Trimestre
                      </span>
                    </div>
                  </div>

                  {/* DUM */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-[#64748B] text-xs mb-1">
                      <span className="material-symbols-outlined text-[15px] text-[#6F217B]">
                        calendar_today
                      </span>
                      <span>DUM</span>
                    </div>
                    <span className="text-sm font-bold text-[#1E293B]">
                      {lastMenstrualPeriod}
                    </span>
                    <span className="text-[11px] text-[#64748B] block mt-0.5">
                      Última Menstruação
                    </span>
                  </div>

                  {/* DPP */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-[#64748B] text-xs mb-1">
                      <span className="material-symbols-outlined text-[15px] text-[#852A91]">
                        event_available
                      </span>
                      <span>DPP Estimada</span>
                    </div>
                    <span className="text-sm font-bold text-[#852A91]">
                      {estimatedDueDate}
                    </span>
                    <span className="text-[11px] text-[#64748B] block mt-0.5">
                      Previsão do Parto
                    </span>
                  </div>
                </div>

                {/* Mini Progress Bar de Gestação */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-[#64748B] font-semibold">Progresso da Gestação</span>
                    <span className="text-[#852A91] font-bold">{progressPercent}% concluído</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#852A91] to-[#D83C91] h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#64748B] mt-1.5">
                    <span>Semana 1</span>
                    <span className="font-bold text-[#852A91]">Semana {currentWeeks}</span>
                    <span>Semana {totalWeeks}</span>
                  </div>
                </div>
              </section>

              {/* Card: Próxima Consulta de Pré-Natal */}
              <section className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#F7ECF8] text-[#852A91] flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[18px]">event</span>
                    </span>
                    <h3 className="text-sm font-bold text-[#1E293B]">
                      Próxima Consulta de Pré-Natal
                    </h3>
                  </div>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs px-2.5 py-0.5 rounded-full">
                    Confirmada
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#1E293B]">
                        {responsibleDoctor}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {doctorCrm}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#852A91] shadow-2xs">
                      <span className="material-symbols-outlined text-[20px]">stethoscope</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[#1E293B]">
                      <span className="material-symbols-outlined text-[16px] text-[#852A91]">
                        schedule
                      </span>
                      <span>{nextAppointmentDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#1E293B]">
                      <span className="material-symbols-outlined text-[16px] text-[#6F217B]">
                        location_on
                      </span>
                      <span>Unidade Paulista</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Baixar Cartão em PDF"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="mt-3.5 w-full bg-[#852A91] hover:bg-[#6F217B] text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-[#852A91]/20"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {downloading ? 'hourglass_top' : 'download'}
                  </span>
                  <span>{downloading ? 'Gerando Cartão...' : 'Baixar Cartão em PDF'}</span>
                </button>
              </section>
            </div>

            {/* Coluna Direita: Timeline de Consultas e Documentos (7 colunas no desktop) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Seção: Linha do Tempo Pré-Natal */}
              <section className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#F7ECF8] text-[#852A91] flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[20px]">timeline</span>
                    </span>
                    <h3 className="text-base font-bold text-[#1E293B]">
                      Linha do Tempo Pré-Natal
                    </h3>
                  </div>
                  <span className="text-xs text-[#64748B] font-semibold">
                    {visits.length} registros
                  </span>
                </div>

                {/* Vertical Timeline Items */}
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {visits.map((v, idx) => (
                    <div key={idx} className="relative">
                      <div
                        className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center shadow-xs ${
                          idx === 0
                            ? 'bg-[#852A91]'
                            : idx === 1
                            ? 'bg-[#6F217B]'
                            : 'bg-slate-400'
                        }`}
                      />
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#852A91]">
                            {v.week}ª SEMANA
                          </span>
                          <span className="text-xs text-[#64748B]">{v.date}</span>
                        </div>
                        <p className="text-sm font-semibold text-[#1E293B]">
                          {v.title}
                        </p>
                        {v.notes && (
                          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                            {v.notes}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <div className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs text-[#1E293B] flex items-center gap-1 shadow-2xs">
                            <span className="material-symbols-outlined text-[15px] text-[#852A91]">
                              monitor_heart
                            </span>
                            <span>
                              PA: <strong>{v.bloodPressure}</strong>
                            </span>
                          </div>
                          {v.fetalHeartRateBpm && (
                            <div className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs text-[#1E293B] flex items-center gap-1 shadow-2xs">
                              <span className="material-symbols-outlined text-[15px] text-[#D83C91]">
                                favorite
                              </span>
                              <span>
                                BCF: <strong>{v.fetalHeartRateBpm} bpm</strong>
                              </span>
                            </div>
                          )}
                          {v.uterineHeightCm && (
                            <div className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs text-[#1E293B] flex items-center gap-1 shadow-2xs">
                              <span className="material-symbols-outlined text-[15px] text-[#852A91]">
                                straighten
                              </span>
                              <span>
                                AU: <strong>{v.uterineHeightCm} cm</strong>
                              </span>
                            </div>
                          )}
                          {v.weightKg && (
                            <div className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs text-[#1E293B] flex items-center gap-1 shadow-2xs">
                              <span className="material-symbols-outlined text-[15px] text-slate-600">
                                scale
                              </span>
                              <span>
                                Peso: <strong>{v.weightKg} kg</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Seção: Documentos e Laudos Anexados */}
              <section className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#F7ECF8] text-[#852A91] flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[20px]">folder_open</span>
                    </span>
                    <h3 className="text-base font-bold text-[#1E293B]">
                      Documentos e Laudos Anexados
                    </h3>
                  </div>
                  <span className="text-xs text-[#852A91] font-bold">
                    {documents.length} arquivos
                  </span>
                </div>

                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between hover:border-[#852A91]/40 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#852A91] flex-shrink-0 shadow-2xs">
                          <span className="material-symbols-outlined text-[22px]">
                            picture_as_pdf
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1E293B] truncate">
                            {doc.title}
                          </p>
                          <p className="text-[11px] text-[#64748B]">
                            {doc.date} • {doc.size}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (doc.pdfUrl) {
                            window.open(doc.pdfUrl, '_blank');
                          } else {
                            handleDownload();
                          }
                        }}
                        className="ml-2 px-3 py-1.5 rounded-lg bg-[#F7ECF8] text-[#852A91] text-xs font-bold hover:bg-[#852A91] hover:text-white active:scale-95 transition-all flex items-center gap-1 flex-shrink-0"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        <span>Visualizar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Aviso Institucional */}
              <section className="rounded-xl bg-slate-100 border border-slate-200 p-3.5 flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] text-[#852A91] flex-shrink-0 mt-0.5">
                  verified_user
                </span>
                <div className="text-xs text-[#64748B]">
                  <span className="font-bold text-[#1E293B] block mb-0.5">
                    Validação Médica Cana Med
                  </span>
                  Informações preenchidas e validadas pela equipe obstétrica da Cana Med Mulher.
                </div>
              </section>
            </div>
          </div>
        </main>

        {/* Bottom Navigation Bar Mobile */}
        <nav
          aria-label="Navegação Principal"
          className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 h-16 bg-white border-t border-slate-200 md:hidden shadow-[0_-2px_10px_rgba(30,41,59,0.05)]"
        >
          <button
            type="button"
            onClick={() => onNavigateTab?.('inicio')}
            className="flex flex-col items-center justify-center text-[#64748B] font-medium gap-1 hover:text-[#852A91] transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined text-[22px]">home</span>
            <span className="text-xs">Início</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab?.('agendar')}
            className="flex flex-col items-center justify-center text-[#64748B] font-medium gap-1 hover:text-[#852A91] transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined text-[22px]">calendar_add_on</span>
            <span className="text-xs">Agendar</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab?.('consultas')}
            className="flex flex-col items-center justify-center text-[#64748B] font-medium gap-1 hover:text-[#852A91] transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined text-[22px]">calendar_month</span>
            <span className="text-xs">Consultas</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center text-[#852A91] font-bold gap-1 active:scale-90 relative"
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              pregnant_woman
            </span>
            <span className="text-xs font-bold">Pré-natal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#852A91] absolute -bottom-1" />
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab?.('perfil')}
            className="flex flex-col items-center justify-center text-[#64748B] font-medium gap-1 hover:text-[#852A91] transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined text-[22px]">person</span>
            <span className="text-xs">Perfil</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
