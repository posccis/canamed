import React, { useState } from 'react';
import '../patient-serene.css';

export interface PatientDashboardPageProps {
  patientName?: string;
  hasActivePregnancy?: boolean;
  appointmentDateTime?: string; // ISO string
  onBookAppointment?: () => void;
  onReschedule?: () => void;
  onViewAppointmentDetails?: () => void;
  onNavigateSection?: (section: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const PatientDashboardPage: React.FC<PatientDashboardPageProps> = ({
  patientName = 'Juliana',
  hasActivePregnancy = true,
  appointmentDateTime,
  onBookAppointment,
  onReschedule,
  onViewAppointmentDetails,
  onNavigateSection,
  onNavigateTab,
}) => {
  const [rescheduleNotice, setRescheduleNotice] = useState<string | null>(null);

  const handleRescheduleClick = () => {
    if (appointmentDateTime) {
      const apptTime = new Date(appointmentDateTime).getTime();
      const now = Date.now();
      const diffHours = (apptTime - now) / (1000 * 60 * 60);

      if (diffHours < 2) {
        setRescheduleNotice(
          'Para remarcações com menos de 2 horas de antecedência, entre em contato com a recepção pelo telefone ou WhatsApp.'
        );
        return;
      }
    }

    setRescheduleNotice(null);
    if (onReschedule) {
      onReschedule();
    }
  };

  return (
    <div className="bg-[#F7F8FA] text-[#1E293B] antialiased min-h-screen pb-24 selection:bg-[#F7ECF8] selection:text-[#852A91]">
      {/* Top App Bar Header (Hidden on Desktop when inside PatientLayoutSerene) */}
      <header className="lg:hidden fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 max-w-screen-md mx-auto bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200">
        <div className="flex items-center gap-3">
          <img
            alt="Cana Med Mulher"
            className="h-9 w-auto object-contain cursor-pointer transition-transform active:scale-95 duration-150"
            src="/assets/brand/canamed_logo-removebg-preview.png"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            aria-label="Notificações"
            className="relative p-2 rounded-full hover:bg-slate-100 text-[#64748B] transition-colors duration-150 active:scale-95 flex items-center justify-center"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#852A91] rounded-full ring-2 ring-white" />
          </button>
          <div className="relative w-9 h-9 rounded-full ring-2 ring-[#852A91]/20 overflow-hidden bg-[#F7ECF8] border border-[#B77AD8]/30 flex items-center justify-center text-[#852A91] font-bold">
            <span className="material-symbols-outlined text-lg">person</span>
          </div>
        </div>
      </header>

      {/* Main Content Container (Desktop 12 columns / Mobile 1 col) */}
      <main className="pt-20 px-4 max-w-6xl mx-auto space-y-6">
        {/* Hero / Welcome Greeting */}
        <section className="mt-2 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7ECF8] text-[#852A91] border border-[#B77AD8]/30 text-xs font-semibold">
            <span
              className="material-symbols-outlined text-[16px] text-[#D83C91]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            <span>Espaço Saúde da Mulher</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1E293B] tracking-tight">
            Olá, <span className="text-[#852A91]">{patientName}</span>
          </h1>
          <p className="text-sm text-[#64748B] leading-relaxed max-w-2xl">
            Veja seus próximos compromissos e acompanhe seu cuidado com serenidade.
          </p>
        </section>

        {/* Quick Call to Action: Agendar Consulta */}
        <section>
          <button
            type="button"
            onClick={onBookAppointment}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-[#852A91] hover:bg-[#6F217B] text-white shadow-md shadow-[#852A91]/20 active:scale-[0.98] transition-all duration-150 group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[24px]">calendar_add_on</span>
              </div>
              <div className="text-left">
                <div className="text-sm font-bold tracking-wide">
                  Agendar consulta
                </div>
                <div className="text-xs text-white/80">
                  Especialistas disponíveis nesta semana
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </div>
          </button>
        </section>

        {/* Grid de 12 colunas para Próxima Consulta e Pré-Natal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna 1: Card de Destaque Próxima Consulta (7 cols no desktop) */}
          <section className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Próxima Consulta
              </h2>
              <button
                type="button"
                onClick={() => onNavigateSection?.('consultas')}
                className="text-xs font-bold text-[#852A91] hover:underline cursor-pointer"
              >
                Ver histórico
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 border-l-4 border-l-[#852A91] shadow-xs relative overflow-hidden">
              {/* Doctor Info + Status Badge */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F7ECF8] border border-[#B77AD8]/30 flex items-center justify-center text-[#852A91] font-bold shrink-0">
                    <span className="material-symbols-outlined text-2xl">person</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1E293B]">
                      Dra. Camila Vasconcelos
                    </h3>
                    <p className="text-xs font-semibold text-[#852A91]">
                      Ginecologia e Obstetrícia
                    </p>
                    <p className="text-xs text-[#64748B]">
                      CRM 148.920 • RQE 42.110
                    </p>
                  </div>
                </div>

                {/* Badge Confirmada */}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold whitespace-nowrap">
                  <span
                    className="material-symbols-outlined text-[14px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  Confirmada
                </span>
              </div>

              {/* Date & Location Specs */}
              <div className="py-4 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="p-1.5 rounded-lg bg-[#F7ECF8] text-[#852A91]">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  </div>
                  <div>
                    <div className="text-xs text-[#64748B] font-semibold">
                      Data e Horário
                    </div>
                    <div className="text-sm text-[#1E293B] font-bold">
                      Terça, 24 Out
                    </div>
                    <div className="text-xs text-[#852A91] font-semibold">
                      14:30h (Presencial)
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="p-1.5 rounded-lg bg-slate-100 text-[#6F217B]">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                  </div>
                  <div>
                    <div className="text-xs text-[#64748B] font-semibold">
                      Local de Atendimento
                    </div>
                    <div className="text-sm text-[#1E293B] font-bold">
                      Unidade Jardins
                    </div>
                    <div className="text-xs text-[#64748B]">
                      Sala 304 • 3º Andar
                    </div>
                  </div>
                </div>
              </div>

              {/* Reschedule alert */}
              {rescheduleNotice && (
                <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                  {rescheduleNotice}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onViewAppointmentDetails}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#F7ECF8] hover:bg-[#EAD0EC] text-[#852A91] font-semibold text-xs flex items-center justify-center gap-2 transition-colors duration-150 active:scale-[0.99]"
                >
                  <span>Ver detalhes do agendamento</span>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
                <button
                  type="button"
                  aria-label="Remarcar consulta"
                  onClick={handleRescheduleClick}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs active:scale-[0.99]"
                >
                  Remarcar consulta
                </button>
              </div>
            </div>
          </section>

          {/* Coluna 2: Card Contextual Pré-Natal / Prevenção (5 cols no desktop) */}
          <div className="lg:col-span-5">
            {hasActivePregnancy ? (
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-[#852A91] text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      pregnant_woman
                    </span>
                    <h2 className="text-base font-bold text-[#1E293B]">
                      Seu Acompanhamento Pré-Natal
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F7ECF8] text-[#852A91] text-xs font-bold">
                    Gestação Ativa
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#852A91] text-white text-xs font-bold shadow-xs">
                      <span className="material-symbols-outlined text-[16px]">child_care</span>
                      <span>26ª Semana Gestacional</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#64748B] block">
                        DPP Estimada:
                      </span>
                      <span className="text-xs font-bold text-[#1E293B]">
                        22/01/2025
                      </span>
                    </div>
                  </div>

                  {/* Weekly Progress Bar */}
                  <div className="space-y-1.5 py-1">
                    <div className="flex justify-between text-xs text-[#64748B]">
                      <span>2º Trimestre (Semana 26 de 40)</span>
                      <span className="text-[#852A91] font-bold">65% concluído</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={65}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Progresso da gestação"
                      className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0 border border-slate-200"
                    >
                      <div
                        className="h-full bg-gradient-to-r from-[#852A91] to-[#D83C91] rounded-full transition-all duration-500"
                        style={{ width: '65%' }}
                      />
                    </div>
                    <p className="text-xs text-[#64748B] font-medium pt-1">
                      ✨ Seu bebê tem o tamanho aproximado de uma <strong className="text-[#1E293B]">berinjela</strong> (~35 cm e 760g).
                    </p>
                  </div>

                  {/* Button: Acessar Cartão da Gestante */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => onNavigateSection?.('cartao-gestante')}
                      className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#852A91] text-[#852A91] hover:bg-[#F7ECF8] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
                    >
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        badge
                      </span>
                      <span>Acessar Cartão da Gestante</span>
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-[#852A91] text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      health_and_safety
                    </span>
                    <h2 className="text-base font-bold text-[#1E293B]">
                      Prevenção &amp; Saúde da Mulher
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    Check-up em dia
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-[#1E293B]">Papanicolau &amp; Check-up Preventivo</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Mantenha seus exames preventivos atualizados. Seu último rastreamento preventivo ginecológico está em dia.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigateSection?.('consultas')}
                    className="py-2 px-3.5 rounded-xl bg-[#F7ECF8] hover:bg-[#EAD0EC] text-[#852A91] font-semibold text-xs inline-flex items-center gap-2"
                  >
                    <span>Agendar Preventivo de Rotina</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Acesso Rápido (Bento Grid 4 Colunas no Desktop / 2x2 Mobile) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Acesso Rápido
            </h2>
            <span className="text-xs text-[#64748B]">Serviços da paciente</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Item 1: Minhas Consultas */}
            <button
              type="button"
              onClick={() => onNavigateSection?.('consultas')}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#852A91]/50 shadow-xs transition-all duration-150 hover:-translate-y-0.5 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F7ECF8] text-[#852A91] flex items-center justify-center mb-3 group-hover:bg-[#852A91] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              </div>
              <h3 className="text-sm font-bold text-[#1E293B] group-hover:text-[#852A91] transition-colors">
                Minhas Consultas
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                1 agendada • Ver histórico
              </p>
            </button>

            {/* Item 2: Exames Anexados */}
            <button
              type="button"
              onClick={() => onNavigateSection?.('exames')}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#852A91]/50 shadow-xs transition-all duration-150 hover:-translate-y-0.5 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:bg-[#852A91] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[22px]">description</span>
              </div>
              <h3 className="text-sm font-bold text-[#1E293B] group-hover:text-[#852A91] transition-colors">
                Exames Anexados
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Laudos e imagens (8)
              </p>
            </button>

            {/* Item 3: Cartão da Gestante */}
            <button
              type="button"
              onClick={() => onNavigateSection?.('cartao-gestante')}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#852A91]/50 shadow-xs transition-all duration-150 hover:-translate-y-0.5 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F7ECF8] text-[#852A91] flex items-center justify-center mb-3 group-hover:bg-[#852A91] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[22px]">auto_stories</span>
              </div>
              <h3 className="text-sm font-bold text-[#1E293B] group-hover:text-[#852A91] transition-colors">
                Cartão da Gestante
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Histórico obstétrico digital
              </p>
            </button>

            {/* Item 4: Falar com a Clínica */}
            <button
              type="button"
              onClick={() => onNavigateSection?.('contato')}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#852A91]/50 shadow-xs transition-all duration-150 hover:-translate-y-0.5 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:bg-[#852A91] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[22px]">chat</span>
              </div>
              <h3 className="text-sm font-bold text-[#1E293B] group-hover:text-[#852A91] transition-colors">
                Falar com a Clínica
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Recepção e enfermagem
              </p>
            </button>
          </div>
        </section>

        {/* Lembrete & Plantão Obstétrico 24h */}
        <section className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              emergency
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#1E293B]">
              Plantão Obstétrico 24h
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Nossa equipe médica obstétrica e ginecológica está de prontidão contínua para suporte imediato a qualquer sintoma atípico.
            </p>
            <div className="pt-1.5 flex items-center gap-3">
              <a
                className="text-xs font-bold text-[#852A91] hover:underline inline-flex items-center gap-1"
                aria-label="Ligar para Emergência 24h - Plantão Obstétrico 24h"
                href="tel:08007702262"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                Ligar para Emergência 24h (Plantão Obstétrico 24h)
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav
        aria-label="Navegação Principal Mobile"
        className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 h-16 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(30,41,59,0.05)] md:hidden"
      >
        <button
          type="button"
          className="flex flex-col items-center justify-center text-[#852A91] font-bold gap-1 active:scale-90 transition-transform duration-150"
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            home
          </span>
          <span className="text-xs">Início</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab?.('agendar')}
          className="flex flex-col items-center justify-center text-[#64748B] font-medium gap-1 hover:text-[#852A91] active:scale-90 transition-transform duration-150"
        >
          <span className="material-symbols-outlined text-[24px]">calendar_add_on</span>
          <span className="text-xs">Agendar</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab?.('consultas')}
          className="flex flex-col items-center justify-center text-[#64748B] font-medium gap-1 hover:text-[#852A91] active:scale-90 transition-transform duration-150"
        >
          <span className="material-symbols-outlined text-[24px]">calendar_month</span>
          <span className="text-xs">Consultas</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab?.('prenatal')}
          className="flex flex-col items-center justify-center text-[#64748B] font-medium gap-1 hover:text-[#852A91] active:scale-90 transition-transform duration-150"
        >
          <span className="material-symbols-outlined text-[24px]">pregnant_woman</span>
          <span className="text-xs">Pré-natal</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab?.('perfil')}
          className="flex flex-col items-center justify-center text-[#64748B] font-medium gap-1 hover:text-[#852A91] active:scale-90 transition-transform duration-150"
        >
          <span className="material-symbols-outlined text-[24px]">person</span>
          <span className="text-xs">Perfil</span>
        </button>
      </nav>
    </div>
  );
};
