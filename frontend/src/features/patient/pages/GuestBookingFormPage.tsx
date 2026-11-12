import React, { useState } from 'react';
import '../patient-serene.css';
import { formatCpf, formatPhone, isValidCpf } from '../../../utils/masks';
import { BookGuestResponse, patientApi } from '../patientApi';

export interface GuestBookingFormPageProps {
  clinicId?: string;
  professionalId?: string;
  doctorName?: string;
  doctorCrm?: string;
  price?: string;
  estimatedWait?: string;
  selectedStartsAt?: string;
  initialSymptoms?: string;
  onBack?: () => void;
  onSuccess?: (response: BookGuestResponse) => void;
  onNavigateTab?: (tab: string) => void;
}

export const GuestBookingFormPage: React.FC<GuestBookingFormPageProps> = ({
  clinicId = '00000000-0000-0000-0000-000000000001',
  professionalId = '00000000-0000-0000-0000-000000000002',
  doctorName = 'Dra. Beatriz Faria',
  doctorCrm = 'CRM-SP 184.220 • Ginecologista',
  price = 'R$ 290,00',
  estimatedWait = 'Em ~20 minutos',
  selectedStartsAt,
  initialSymptoms = '',
  onBack,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [allergy, setAllergy] = useState<'Nenhuma' | 'Dipirona' | 'AINEs'>('Nenhuma');
  const [isPregnant, setIsPregnant] = useState<boolean>(false);
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [wantsInvoice, setWantsInvoice] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setCpf(formatted);
    if (formatted.length === 14) {
      setCpfError(isValidCpf(formatted) ? null : 'CPF inválido. Verifique os dígitos digitados.');
    } else {
      setCpfError(null);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!fullName.trim()) {
      setGeneralError('Informe o nome completo da paciente.');
      return;
    }

    if (!cpf || !isValidCpf(cpf)) {
      setCpfError('CPF inválido. Verifique o número informado.');
      return;
    }

    if (!birthDate) {
      setGeneralError('Informe a data de nascimento para prescrição CFM.');
      return;
    }

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setGeneralError('Informe um WhatsApp válido com DDD.');
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const startsAt = selectedStartsAt || new Date(Date.now() + 20 * 60 * 1000).toISOString();
      const response = await patientApi.bookGuestAppointment({
        clinicId,
        professionalId,
        startsAt,
        patientName: fullName.trim(),
        cpf: cpf.trim(),
        phone: phone.trim(),
        birthDate,
        symptoms: symptoms.trim() || undefined,
        allergies: allergy === 'Nenhuma' ? undefined : allergy,
        isPregnant,
        wantsInvoice,
      });

      onSuccess?.(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao concluir agendamento avulso.';
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F7F8FA] text-[#1E293B] antialiased font-body-md min-h-screen selection:bg-[#F7ECF8] selection:text-[#852A91] flex flex-col justify-between">
      {/* Mobile Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 flex items-center justify-between max-w-md mx-auto w-full shadow-xs">
        <div className="flex items-center gap-2">
          <button
            aria-label="Voltar"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors duration-150"
            type="button"
            onClick={onBack}
          >
            <span className="material-symbols-outlined text-[22px]" data-icon="arrow_back">
              arrow_back
            </span>
          </button>
          <div>
            <h1 className="text-base font-bold text-[#1E293B] tracking-tight leading-tight">
              Cadastro Rápido
            </h1>
            <p className="text-xs text-[#64748B]">
              Plantão Imediato Ginecologia
            </p>
          </div>
        </div>
        {/* Live Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F7ECF8] border border-[#B77AD8]/30 text-[#852A91]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#852A91] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#852A91]" />
          </span>
          <span className="text-xs tracking-wide font-bold">Plantão Ativo</span>
        </div>
      </header>

      {/* Main Canvas Content */}
      <main className="w-full max-w-md mx-auto px-4 pt-4 pb-44 space-y-4">
        {/* Welcoming Informative Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#F7ECF8] flex items-center justify-center text-[#852A91] shrink-0 mt-0.5 font-bold">
            <span className="material-symbols-outlined text-lg" data-icon="verified_user">
              verified_user
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#1E293B] leading-tight">
              Dados clínicos essenciais
            </p>
            <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
              Necessários pelo CFM para emissão da sua receita com QR Code, atestado e entrada no plantão em menos de 2 minutos.
            </p>
          </div>
        </div>

        {/* 1. Resumo do Plantão Selecionado */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#852A91]/20 shrink-0 bg-[#F7ECF8] border border-[#B77AD8]/30 flex items-center justify-center text-[#852A91] font-bold">
                <span className="material-symbols-outlined text-2xl">person</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[#1E293B]">
                    {doctorName}
                  </span>
                  <span
                    className="material-symbols-outlined text-[#852A91] text-sm"
                    data-icon="check_circle"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                </div>
                <p className="text-xs text-[#64748B]">
                  {doctorCrm}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                Online agora
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="material-symbols-outlined text-[#852A91] text-lg" data-icon="schedule">
                schedule
              </span>
              <div>
                <p className="text-[11px] text-[#64748B] leading-none">Previsão</p>
                <p className="text-xs text-[#1E293B] mt-0.5 font-bold">
                  {estimatedWait}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="material-symbols-outlined text-[#852A91] text-lg" data-icon="receipt_long">
                receipt_long
              </span>
              <div>
                <p className="text-[11px] text-[#64748B] leading-none">Valor Total</p>
                <p className="text-xs text-[#852A91] mt-0.5 font-bold">
                  {price} <span className="text-[11px] font-normal text-[#64748B]">(c/ NF)</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mensagens de Erro */}
        {generalError && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">error</span>
            <span>{generalError}</span>
          </div>
        )}

        {/* Interactive Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* 2. Dados Obrigatórios para Prescrição (CFM) */}
          <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#F7ECF8] flex items-center justify-center text-[#852A91]">
                <span className="material-symbols-outlined text-[16px]" data-icon="badge">
                  badge
                </span>
              </div>
              <h2 className="text-sm font-bold text-[#1E293B]">
                Dados da Paciente para Prontuário
              </h2>
            </div>

            {/* Nome Completo */}
            <div>
              <label
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                htmlFor="full_name"
              >
                Nome Completo da Paciente <span className="text-[#852A91]">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Mariana Silveira Rocha"
                className="w-full h-11 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:border-[#852A91] focus:ring-2 focus:ring-[#852A91]/20 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* CPF */}
              <div>
                <label
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  htmlFor="cpf"
                >
                  CPF (Obrigatório CFM) <span className="text-[#852A91]">*</span>
                </label>
                <input
                  id="cpf"
                  name="cpf"
                  type="text"
                  required
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className={`w-full h-11 px-3.5 py-2.5 bg-white border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 ${
                    cpfError
                      ? 'border-rose-500 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-[#852A91] focus:ring-[#852A91]/20'
                  }`}
                />
                {cpfError && (
                  <span className="text-xs text-rose-600 font-medium mt-1 block">{cpfError}</span>
                )}
              </div>

              {/* Data de Nascimento */}
              <div>
                <label
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  htmlFor="birthdate"
                >
                  Data de Nascimento <span className="text-[#852A91]">*</span>
                </label>
                <input
                  id="birthdate"
                  name="birthdate"
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full h-11 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:border-[#852A91] focus:ring-2 focus:ring-[#852A91]/20 transition-all"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                htmlFor="phone"
              >
                WhatsApp para Receitas &amp; Acesso <span className="text-[#852A91]">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm font-semibold">
                  +55
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 98765-4321"
                  className="w-full h-11 pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:border-[#852A91] focus:ring-2 focus:ring-[#852A91]/20 transition-all placeholder:text-slate-400"
                />
              </div>
              <span className="text-xs text-[#64748B] mt-1 block">
                O link da videochamada chegará instantaneamente por SMS e WhatsApp.
              </span>
            </div>
          </section>

          {/* 3. Triagem Rápida de Segurança */}
          <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#F7ECF8] flex items-center justify-center text-[#852A91]">
                <span className="material-symbols-outlined text-[16px]" data-icon="medical_services">
                  medical_services
                </span>
              </div>
              <h2 className="text-sm font-bold text-[#1E293B]">
                Triagem Rápida de Segurança
              </h2>
            </div>

            {/* Alergias Prioritárias */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Possui alergia medicamentosa comum?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Nenhuma', 'Dipirona', 'AINEs'] as const).map((opt) => (
                  <label key={opt} className="cursor-pointer">
                    <input
                      type="radio"
                      name="allergy"
                      aria-label={opt}
                      value={opt}
                      checked={allergy === opt}
                      onChange={() => setAllergy(opt)}
                      className="sr-only peer"
                    />
                    <div className="px-2 py-2 text-center rounded-xl border border-slate-200 peer-checked:border-[#852A91] peer-checked:bg-[#852A91] peer-checked:text-white text-xs text-slate-700 transition-all duration-150 font-semibold bg-white hover:border-[#852A91]/40">
                      {opt}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Gestante? */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Você está gestante no momento?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="pregnant"
                    aria-label="Não gestante"
                    checked={!isPregnant}
                    onChange={() => setIsPregnant(false)}
                    className="sr-only peer"
                  />
                  <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 peer-checked:border-[#852A91] peer-checked:bg-[#852A91] peer-checked:text-white text-xs text-slate-700 transition-all duration-150 font-semibold bg-white hover:border-[#852A91]/40">
                    <span className="material-symbols-outlined text-[18px]" data-icon="close">
                      close
                    </span>
                    <span>Não</span>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="pregnant"
                    aria-label="Sim, gestante"
                    checked={isPregnant}
                    onChange={() => setIsPregnant(true)}
                    className="sr-only peer"
                  />
                  <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 peer-checked:border-[#852A91] peer-checked:bg-[#852A91] peer-checked:text-white text-xs text-slate-700 transition-all duration-150 font-semibold bg-white hover:border-[#852A91]/40">
                    <span className="material-symbols-outlined text-[18px]" data-icon="pregnant_woman">
                      pregnant_woman
                    </span>
                    <span>Sim</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Sintoma Curto */}
            <div>
              <label
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                htmlFor="symptoms"
              >
                O que você está sentindo agora? <span className="text-[#64748B] font-normal lowercase">(breve)</span>
              </label>
              <textarea
                id="symptoms"
                name="symptoms"
                rows={2}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Ex: Dor pélvica súbita, cólica intensa, sangramento incomum..."
                className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#852A91] focus:ring-2 focus:ring-[#852A91]/20 transition-all resize-none"
              />
            </div>
          </section>

          {/* 4. Dados para Nota Fiscal / Reembolso */}
          <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={wantsInvoice}
                onChange={(e) => setWantsInvoice(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#852A91] focus:ring-[#852A91]/20 transition-all duration-150 accent-[#852A91]"
              />
              <div>
                <p className="text-xs font-bold text-[#1E293B]">
                  Emitir Nota Fiscal para o mesmo CPF da paciente
                </p>
                <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                  Ideal para solicitar reembolso integral ou parcial no seu plano de saúde (Bradesco, SulAmérica, Amil, etc.).
                </p>
              </div>
            </label>
          </section>

          {/* 5. Fixed Base Action Section */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 max-w-md mx-auto shadow-lg">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[#852A91] hover:bg-[#6F217B] text-white font-bold text-sm shadow-md shadow-[#852A91]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 tracking-wide disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Processando Entrada...' : 'Confirmar e Entrar na Sala Virtual'}</span>
              <span className="material-symbols-outlined text-[20px]" data-icon="arrow_forward">
                arrow_forward
              </span>
            </button>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-[#64748B]">
              <span
                className="material-symbols-outlined text-[15px] text-[#852A91]"
                data-icon="lock"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lock
              </span>
              <span className="text-xs tracking-tight">
                Ambiente médico criptografado • Resolução CFM &amp; LGPD
              </span>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
