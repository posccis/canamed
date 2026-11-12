import React, { useState } from 'react';
import '../patient-serene.css';

export interface DoctorOption {
  id: string;
  name: string;
  specialty: string;
  crm: string;
  price: string;
  nextSlot: string;
  modalityType: 'telemedicina' | 'presencial' | 'ambas';
  avatarUrl?: string;
  fastest?: boolean;
}

export interface WalkInBookingPageProps {
  onBack?: () => void;
  onContinue?: (data: {
    modality: 'telemedicina' | 'presencial';
    reason: string;
    doctorId: string;
    symptoms?: string;
  }) => void;
  onNavigateTab?: (tab: string) => void;
  emergencyPhone?: string;
  initialDoctors?: DoctorOption[];
}

const DEFAULT_DOCTORS: DoctorOption[] = [
  {
    id: 'doc-beatriz',
    name: 'Dra. Beatriz Faria',
    specialty: 'Ginecologia & Telemedicina',
    crm: 'CRM 162.408',
    price: 'R$ 290',
    nextSlot: 'Disponível em ~20 min',
    modalityType: 'telemedicina',
    fastest: true,
    avatarUrl: '/assets/brand/canamed_logo-removebg-preview.png',
  },
  {
    id: 'doc-mariana',
    name: 'Dra. Mariana Siqueira',
    specialty: 'Ginecologia Geral & Reprodutiva',
    crm: 'CRM 148.920',
    price: 'R$ 350',
    nextSlot: 'Hoje às 15:30 • Presencial - Jardins',
    modalityType: 'presencial',
    avatarUrl: '/assets/brand/canamed_logo-removebg-preview.png',
  },
];

const REASON_TAGS = [
  'Dúvida ou sintoma agudo',
  'Segunda opinião médica',
  'Renovação de receita / Pílula',
  'Avaliação de exame alterado',
  'Outro motivo',
];

const RED_FLAGS_KEYWORDS = [
  'sangramento',
  'dor aguda',
  'perda de líquido',
  'febre alta',
  'visão turva',
  'escotoma',
  'desmaio',
  'falta de ar',
];

export const WalkInBookingPage: React.FC<WalkInBookingPageProps> = ({
  onBack,
  onContinue,
  onNavigateTab,
  emergencyPhone = '0800-000-2424',
  initialDoctors = DEFAULT_DOCTORS,
}) => {
  const [modality, setModality] = useState<'telemedicina' | 'presencial'>('telemedicina');
  const [selectedReason, setSelectedReason] = useState<string>('Dúvida ou sintoma agudo');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctors[0]?.id || 'doc-beatriz');
  const [symptoms, setSymptoms] = useState<string>('');

  const hasRedFlag = RED_FLAGS_KEYWORDS.some((kw) =>
    symptoms.toLowerCase().includes(kw)
  );

  const handleContinue = () => {
    onContinue?.({
      modality,
      reason: selectedReason,
      doctorId: selectedDoctorId,
      symptoms: symptoms.trim() || undefined,
    });
  };

  return (
    <div className="bg-[#F7F8FA] text-[#1E293B] antialiased font-body-md min-h-screen flex flex-col justify-between selection:bg-[#F7ECF8] selection:text-[#852A91]">
      {/* Container Responsivo Desconfinado */}
      <div className="relative w-full max-w-3xl mx-auto min-h-screen flex flex-col bg-[#F7F8FA] md:bg-white md:shadow-sm md:my-6 md:rounded-3xl md:border md:border-slate-200 overflow-hidden">
        {/* TopAppBar */}
        <header className="sticky top-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md px-4 md:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              aria-label="Voltar"
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition-all duration-150"
              type="button"
              onClick={onBack}
            >
              <span className="material-symbols-outlined" data-icon="arrow_back">
                arrow_back
              </span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-[#1E293B] tracking-tight">
                  Consulta Avulsa
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#F7ECF8] text-[#852A91]">
                  Plantão Pontual
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Atendimento ginecológico ou obstétrico pontual
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <img
              alt="Cana Med Mulher"
              className="h-7 w-auto object-contain opacity-90 pl-1"
              src="/assets/brand/canamed_logo-removebg-preview.png"
            />
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 px-4 md:px-6 pt-5 pb-28 space-y-6 overflow-y-auto">
          {/* Badge & Hero Welcome Banner */}
          <section className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
            <div className="relative z-10 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F7ECF8] text-[#852A91] flex items-center justify-center shadow-xs shrink-0 font-bold">
                <span className="material-symbols-outlined" data-icon="bolt">
                  bolt
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#852A91]">
                    Atendimento Rápido &amp; Sem Vínculo Contínuo
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Ideal para queixas imediatas, avaliação de sintomas recentes, segunda opinião médica ou renovação ágil de receitas.
                </p>
              </div>
            </div>
          </section>

          {/* Selector: Modalidade de Atendimento */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1E293B] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#852A91] text-[18px]" data-icon="tune">
                  tune
                </span>
                Modalidade de Atendimento
              </h2>
              <span className="text-xs text-[#64748B]">Selecione 1 opção</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Option 1: Telemedicina */}
              <label
                className={`relative flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                  modality === 'telemedicina'
                    ? 'border-2 border-[#852A91] bg-[#F7ECF8]/30 shadow-xs'
                    : 'border border-slate-200 bg-white hover:border-[#852A91]/40 shadow-xs'
                }`}
              >
                <input
                  type="radio"
                  name="modalidade"
                  checked={modality === 'telemedicina'}
                  onChange={() => setModality('telemedicina')}
                  aria-label="Telemedicina Imediata (Plantão)"
                  className="mt-1 text-[#852A91] focus:ring-[#852A91]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#852A91] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#852A91]" data-icon="videocam">
                        videocam
                      </span>
                      Telemedicina Imediata (Plantão)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#852A91] text-white">
                      Em até 30 min
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    Consulta por vídeo-chamada criptografada com emissão de receitas digitais e atestados válidos.
                  </p>
                </div>
              </label>

              {/* Option 2: Presencial */}
              <label
                className={`relative flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                  modality === 'presencial'
                    ? 'border-2 border-[#852A91] bg-[#F7ECF8]/30 shadow-xs'
                    : 'border border-slate-200 bg-white hover:border-[#852A91]/40 shadow-xs'
                }`}
              >
                <input
                  type="radio"
                  name="modalidade"
                  checked={modality === 'presencial'}
                  onChange={() => setModality('presencial')}
                  aria-label="Presencial nas Clínicas"
                  className="mt-1 text-[#852A91] focus:ring-[#852A91]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1E293B] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#6F217B]" data-icon="location_on">
                        location_on
                      </span>
                      Presencial nas Clínicas
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                      Hoje ou Amanhã
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    Encaixe pontual nas unidades <strong>Paulista</strong> ou <strong>Jardins</strong> com acolhimento clínico completo.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* Motivo da Consulta (Tags Interativas) */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-[#1E293B] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#852A91] text-[18px]" data-icon="bubble_chart">
                bubble_chart
              </span>
              Principal motivo da consulta
            </h2>
            <div className="flex flex-wrap gap-2">
              {REASON_TAGS.map((tag) => {
                const isSelected = selectedReason === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedReason(tag)}
                    className={`px-3.5 py-2 rounded-xl text-xs transition-all active:scale-95 ${
                      isSelected
                        ? 'font-bold bg-[#852A91] text-white border border-[#852A91] shadow-xs'
                        : 'font-medium bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Médicas Disponíveis (Cards Elegantes de Saúde) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1E293B] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#852A91] text-[18px]" data-icon="stethoscope">
                  stethoscope
                </span>
                Ginecologistas Disponíveis Agora
              </h2>
              <span className="text-xs text-[#852A91] font-semibold">
                {initialDoctors.length} opções
              </span>
            </div>

            <div className="space-y-3">
              {initialDoctors.map((doc) => {
                const isSelected = selectedDoctorId === doc.id;
                const isFastest = doc.fastest;

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`p-4 rounded-2xl bg-white transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-2 border-[#852A91] shadow-md shadow-[#852A91]/5'
                        : 'border border-slate-200 shadow-xs hover:border-slate-300'
                    }`}
                  >
                    {isFastest && (
                      <div className="absolute top-0 right-0 bg-[#852A91] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Mais Rápido
                      </div>
                    )}

                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-[#F7ECF8] border border-[#B77AD8]/30 flex items-center justify-center text-[#852A91] font-bold shrink-0">
                        <span className="material-symbols-outlined text-2xl">person</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between pr-14">
                          <h3 className="text-sm font-bold text-[#1E293B]">
                            {doc.name}
                          </h3>
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {doc.specialty} • {doc.crm}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F7ECF8] text-[#852A91]">
                            <span className="material-symbols-outlined text-[13px]" data-icon="bolt">
                              bolt
                            </span>
                            {doc.nextSlot}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            <span className="material-symbols-outlined text-[13px]" data-icon="videocam">
                              videocam
                            </span>
                            Chamada Online Segura
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">
                        Consulta avulsa: <strong className="text-[#852A91] font-bold text-sm">{doc.price}</strong>
                      </span>
                      <button
                        type="button"
                        aria-label={`Escolher Plantão ${doc.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoctorId(doc.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                          isSelected
                            ? 'bg-[#852A91] text-white hover:bg-[#6F217B]'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Selecionado' : 'Escolher Plantão'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Campo de Observação Opcional */}
          <section className="space-y-1.5">
            <label
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between"
              htmlFor="observacoes"
            >
              <span>O que você está sentindo?</span>
              <span className="font-normal text-slate-500 text-xs lowercase">Opcional</span>
            </label>
            <div className="relative">
              <textarea
                id="observacoes"
                rows={3}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Ex: Cólica atípica desde ontem, dúvida sobre interação de medicamento..."
                className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#852A91] focus:ring-2 focus:ring-[#852A91]/20 transition-all min-h-[96px] resize-none"
              />
              <span
                className="material-symbols-outlined absolute right-3.5 bottom-3.5 text-slate-400 text-[18px]"
                data-icon="edit_note"
              >
                edit_note
              </span>
            </div>
          </section>

          {/* Alerta Clínico de Triagem e Urgência */}
          <section
            className={`rounded-xl p-4 border flex items-start gap-3 transition-all ${
              hasRedFlag
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <span className="material-symbols-outlined text-rose-600 shrink-0 mt-0.5" data-icon="emergency">
              emergency
            </span>
            <div className="text-xs leading-relaxed w-full">
              <strong className="text-rose-700 font-bold block mb-1">
                Atenção: Sintomas de Emergência Obstétrica ou Ginecológica
              </strong>
              <p>
                Caso apresente febre alta (&gt;38,5°C), dor abdominal aguda súbita ou sangramento volumoso, <strong>dirija-se imediatamente a um pronto-socorro obstétrico ou ginecológico hospitalar</strong>.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <a
                  href="tel:192"
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">call</span>
                  <span>Ligar 192 SAMU</span>
                </a>
                <a
                  href={`tel:${emergencyPhone}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">phone_in_talk</span>
                  <span>Plantão 24h Clínica</span>
                </a>
              </div>
            </div>
          </section>

          {/* Call to Action Container */}
          <section className="pt-2">
            <button
              type="button"
              onClick={handleContinue}
              className="w-full py-3.5 px-4 rounded-xl bg-[#852A91] hover:bg-[#6F217B] text-white font-bold text-sm shadow-md shadow-[#852A91]/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span>Continuar para Confirmação</span>
              <span className="material-symbols-outlined text-[20px]" data-icon="arrow_forward">
                arrow_forward
              </span>
            </button>
            <p className="text-center text-xs text-[#64748B] mt-2 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#852A91]" data-icon="lock">
                lock
              </span>
              Ambiente seguro certificado pela Cana Med Mulher
            </p>
          </section>
        </main>

        {/* BottomNavBar */}
        <nav
          aria-label="Navegação Inferior"
          className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 h-16 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(30,41,59,0.05)] md:hidden"
        >
          <button
            type="button"
            onClick={() => onNavigateTab?.('inicio')}
            className="flex flex-col items-center justify-center text-[#64748B] font-medium gap-1 hover:text-[#852A91] transition-colors duration-150 active:scale-90"
          >
            <span className="material-symbols-outlined" data-icon="home">
              home
            </span>
            <span className="text-xs">Início</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center text-[#852A91] font-bold gap-1 active:scale-90 transition-transform duration-150"
          >
            <span
              className="material-symbols-outlined"
              data-icon="calendar_add_on"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              calendar_add_on
            </span>
            <span className="text-xs font-bold">Agendar</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab?.('consultas')}
            className="flex flex-col items-center justify-center text-[#64748B] font-medium gap-1 hover:text-[#852A91] transition-colors duration-150 active:scale-90"
          >
            <span className="material-symbols-outlined" data-icon="calendar_month">
              calendar_month
            </span>
            <span className="text-xs">Consultas</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab?.('prenatal')}
            className="flex flex-col items-center justify-center text-[#64748B] font-medium gap-1 hover:text-[#852A91] transition-colors duration-150 active:scale-90"
          >
            <span className="material-symbols-outlined" data-icon="pregnant_woman">
              pregnant_woman
            </span>
            <span className="text-xs">Pré-natal</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab?.('perfil')}
            className="flex flex-col items-center justify-center text-[#64748B] font-medium gap-1 hover:text-[#852A91] transition-colors duration-150 active:scale-90"
          >
            <span className="material-symbols-outlined" data-icon="person">
              person
            </span>
            <span className="text-xs">Perfil</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
