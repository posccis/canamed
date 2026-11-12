import React from 'react';
import '../patient-serene.css';

export interface PublicEntryLandingProps {
  clinicName?: string;
  whatsappPhone?: string;
  onSelectGuestBooking?: () => void;
  onSelectCreateAccount?: () => void;
  onSelectLogin?: () => void;
}

export const PublicEntryLanding: React.FC<PublicEntryLandingProps> = ({
  clinicName = 'Clínica Serena Saúde da Mulher',
  whatsappPhone = '5511999998888',
  onSelectGuestBooking,
  onSelectCreateAccount,
  onSelectLogin,
}) => {
  const whatsappUrl = `https://wa.me/${whatsappPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
    'Olá! Gostaria de tirar dúvidas sobre o agendamento no Cana Med Mulher.'
  )}`;

  return (
    <div className="relative min-h-screen bg-[#F7F8FA] text-[#1E293B] font-body-md antialiased flex flex-col justify-between selection:bg-[#F7ECF8] selection:text-[#852A91] overflow-x-hidden">
      {/* Background Ambient Glows (Serene Bloom Luminescence) */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#F7ECF8] opacity-70 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-28 w-80 h-80 bg-[#F7ECF8] opacity-50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-slate-100 opacity-60 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Container Mobile First */}
      <main className="relative z-10 w-full max-w-lg mx-auto px-4 py-8 flex-1 flex flex-col justify-between">
        {/* Header & Identity Section */}
        <header className="flex flex-col items-center text-center">
          {/* Brand Logo Container */}
          <div className="mb-4 transition-transform duration-200 hover:scale-[1.02]">
            <img
              alt="Cana Med Mulher - Eficiência para quem mais precisa"
              className="h-16 w-auto object-contain mx-auto drop-shadow-sm"
              src="/assets/brand/canamed_logo-removebg-preview.png"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Trust & Clinic Context Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-[#852A91] shadow-xs text-xs font-semibold mb-6">
            <span className="material-symbols-outlined text-[#852A91] text-base" data-icon="verified_user">
              verified_user
            </span>
            <span className="tracking-wide">
              Agendamento Oficial • {clinicName}
            </span>
          </div>

          {/* Welcome Hero Messaging */}
          <div className="space-y-2 px-2">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1E293B] tracking-tight">
              Vamos cuidar de você?
            </h1>
            <p className="text-sm md:text-base text-[#64748B] max-w-md mx-auto mt-2 leading-relaxed">
              Escolha como deseja agendar sua consulta. Você pode continuar sem criar uma conta ou criar seu acesso para acompanhar seus atendimentos.
            </p>
          </div>

          {/* LGPD & Encrypted Status */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[#64748B]">
            <span className="material-symbols-outlined text-sm text-[#852A91]" data-icon="lock">
              lock
            </span>
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Ambiente Seguro Criptografado • Conformidade LGPD
            </span>
          </div>
        </header>

        {/* Choice Options: Bento-Style Dual Modality Cards */}
        <section aria-label="Modalidades de agendamento" className="my-6 space-y-4">
          {/* CARD 1: Consulta Avulsa (Primary Streamlined Entry) */}
          <article className="group relative bg-white rounded-2xl p-6 border-2 border-[#852A91]/20 hover:border-[#852A91] shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            {/* Top Pill Tag */}
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F7ECF8] text-[#852A91] text-xs font-bold">
                <span className="material-symbols-outlined text-sm" data-icon="bolt">
                  bolt
                </span>
                Mais Rápido • Menos de 1 min
              </span>
              <div className="w-8 h-8 rounded-full bg-[#F7ECF8] flex items-center justify-center text-[#852A91] group-hover:bg-[#852A91] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg" data-icon="edit_calendar">
                  edit_calendar
                </span>
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              <h2 className="text-lg font-bold text-[#1E293B]">
                Agendar sem criar conta
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Quer marcar sua consulta rapidamente? Informe seus dados básicos e continue sem precisar criar senha.
              </p>
            </div>

            {/* Benefits List */}
            <ul className="space-y-2 mb-5 text-xs text-slate-700">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#F7ECF8] flex items-center justify-center text-[#852A91] flex-shrink-0">
                  <span className="material-symbols-outlined text-sm font-bold" data-icon="check">
                    check
                  </span>
                </span>
                <span>Sem necessidade de login ou senha</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#F7ECF8] flex items-center justify-center text-[#852A91] flex-shrink-0">
                  <span className="material-symbols-outlined text-sm font-bold" data-icon="check">
                    check
                  </span>
                </span>
                <span>Preenchimento ágil apenas com dados essenciais</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#F7ECF8] flex items-center justify-center text-[#852A91] flex-shrink-0">
                  <span className="material-symbols-outlined text-sm font-bold" data-icon="check">
                    check
                  </span>
                </span>
                <span>Acompanhamento e confirmação enviados pelo WhatsApp</span>
              </li>
            </ul>

            {/* Action Button Primário */}
            <button
              type="button"
              aria-label="Agendar Agora - Continuar sem conta"
              onClick={onSelectGuestBooking}
              className="w-full py-3.5 bg-[#852A91] hover:bg-[#6F217B] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#852A91]/20 active:scale-[0.98]"
            >
              <span>Continuar sem conta</span>
              <span className="material-symbols-outlined text-lg" data-icon="arrow_forward">
                arrow_forward
              </span>
            </button>
          </article>

          {/* CARD 2: Criar Minha Conta (Full Patient Portal Access) */}
          <article className="group relative bg-white rounded-2xl p-6 border border-slate-200 hover:border-[#852A91]/50 shadow-sm transition-all">
            {/* Top Pill Tag */}
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                <span className="material-symbols-outlined text-sm" data-icon="auto_awesome">
                  auto_awesome
                </span>
                Experiência Completa
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-[#F7ECF8] group-hover:text-[#852A91] transition-colors">
                <span className="material-symbols-outlined text-lg" data-icon="shield_person">
                  shield_person
                </span>
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              <h2 className="text-lg font-bold text-[#1E293B]">
                Quero criar minha conta
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Tenha acesso à sua área do paciente para acompanhar suas consultas e acessar os recursos disponibilizados pela clínica.
              </p>
            </div>

            {/* Benefits List */}
            <ul className="space-y-2 mb-5 text-xs text-slate-700">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                  <span className="material-symbols-outlined text-sm font-bold" data-icon="check">
                    check
                  </span>
                </span>
                <span>Acompanhe o histórico de consultas</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                  <span className="material-symbols-outlined text-sm font-bold" data-icon="check">
                    check
                  </span>
                </span>
                <span>Cartão da Gestante e pré-natal digital (quando aplicável)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                  <span className="material-symbols-outlined text-sm font-bold" data-icon="check">
                    check
                  </span>
                </span>
                <span>Notificações e lembretes automáticos</span>
              </li>
            </ul>

            {/* Action Button Secundário */}
            <button
              type="button"
              onClick={onSelectCreateAccount}
              className="w-full py-3.5 bg-white border border-[#852A91] text-[#852A91] hover:bg-[#F7ECF8] font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg text-[#852A91]" data-icon="person_add">
                person_add
              </span>
              <span>Criar minha conta</span>
            </button>
          </article>
        </section>

        {/* Support / Help Block (Humanized WhatsApp Contact) */}
        <div className="bg-white rounded-xl p-3.5 mb-6 border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F7ECF8] flex items-center justify-center text-[#852A91] shadow-xs flex-shrink-0">
              <span className="material-symbols-outlined text-xl" data-icon="support_agent">
                support_agent
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1E293B]">
                Dúvidas com o agendamento?
              </p>
              <p className="text-xs text-[#64748B]">
                Fale com a recepção pelo WhatsApp
              </p>
            </div>
          </div>
          <a
            aria-label="Iniciar conversa com a recepção no WhatsApp"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#852A91] text-white hover:bg-[#6F217B] transition-colors flex-shrink-0 shadow-xs"
            href={whatsappUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="material-symbols-outlined text-xl" data-icon="chat">
              chat
            </span>
          </a>
        </div>

        {/* Já tem conta? Acessar */}
        {onSelectLogin && (
          <div className="text-center pb-4">
            <button
              type="button"
              onClick={onSelectLogin}
              className="text-xs font-bold text-[#852A91] hover:underline inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm" data-icon="login">
                login
              </span>
              <span>Já possui cadastro? Acessar área da paciente</span>
            </button>
          </div>
        )}

        {/* Security & Institutional Footer */}
        <footer className="text-center pt-2 space-y-3">
          <div className="flex items-center justify-center gap-4 text-xs text-[#64748B]">
            <a className="hover:text-[#852A91] transition-colors hover:underline" href="#privacidade">
              Política de Privacidade
            </a>
            <span className="text-slate-300">•</span>
            <a className="hover:text-[#852A91] transition-colors hover:underline" href="#termos">
              Termos de Uso
            </a>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Ambiente seguro e certificado Cana Med Mulher • Resoluções CFM &amp; LGPD.
          </p>
        </footer>
      </main>
    </div>
  );
};
