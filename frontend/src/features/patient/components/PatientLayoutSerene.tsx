import React from 'react';
import '../patient-serene.css';

export type SereneNavTab =
  | 'inicio'
  | 'agendar'
  | 'consultas'
  | 'cartao-gestante'
  | 'plantao'
  | 'perfil';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PatientLayoutSereneProps {
  children: React.ReactNode;
  activeTab?: SereneNavTab;
  hideBottomNav?: boolean;
  hideTopBar?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  patientName?: string;
  gestationalWeekText?: string;
  onTabChange?: (tab: SereneNavTab) => void;
  onLogout?: () => void;
  clinicSlug?: string;
  emergencyPhone?: string;
}

export const PatientLayoutSerene: React.FC<PatientLayoutSereneProps> = ({
  children,
  activeTab = 'inicio',
  hideBottomNav = false,
  hideTopBar = false,
  breadcrumbs,
  patientName = 'Juliana Rocha Mendes',
  gestationalWeekText = '26ª Semana',
  onTabChange,
  onLogout,
  emergencyPhone = 'tel:08007702262',
}) => {
  const handleNavClick = (tab: SereneNavTab) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const desktopNavItems: Array<{
    id: SereneNavTab;
    label: string;
    icon: string;
    badge?: string;
    hasIndicator?: boolean;
  }> = [
    { id: 'inicio', label: 'Início', icon: 'home' },
    { id: 'agendar', label: 'Agendar consulta', icon: 'calendar_month' },
    { id: 'consultas', label: 'Minhas consultas', icon: 'event_available', badge: '1' },
    {
      id: 'cartao-gestante',
      label: 'Cartão da Gestante',
      icon: 'pregnant_woman',
      hasIndicator: true,
    },
    { id: 'plantao', label: 'Consulta Avulsa / Plantão', icon: 'medical_services' },
    { id: 'perfil', label: 'Meu perfil', icon: 'account_circle' },
  ];

  const mobileNavItems: Array<{
    id: SereneNavTab;
    label: string;
    icon: string;
  }> = [
    { id: 'inicio', label: 'Início', icon: 'home' },
    { id: 'agendar', label: 'Agendar', icon: 'calendar_add_on' },
    { id: 'consultas', label: 'Consultas', icon: 'calendar_month' },
    { id: 'cartao-gestante', label: 'Pré-natal', icon: 'pregnant_woman' },
    { id: 'perfil', label: 'Perfil', icon: 'person' },
  ];

  return (
    <div className="serene-page min-h-screen text-[var(--color-serene-on-surface)]">
      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR (w-72 / 288px)                            */}
      {/* ======================================================== */}
      <aside
        aria-label="Menu Lateral Desktop"
        className="hidden lg:flex fixed left-0 top-0 h-screen w-72 flex-col justify-between p-6 z-40 bg-white border-r border-slate-200 shadow-sm"
      >
        <div className="flex flex-col gap-6">
          {/* Logo Brand / Identity */}
          <div className="flex flex-col gap-1 px-1">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/brand/canamed_logo-removebg-preview.png"
                alt="Cana Med Mulher"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  // Fallback se asset não carregar no ambiente de teste
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-[#852A91]">
                  Cana Med Mulher
                </span>
                <span className="text-xs text-slate-500 font-medium tracking-wide">
                  Portal da Paciente
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Navegação Principal Desktop" className="flex flex-col space-y-1">
            {desktopNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-[#F7ECF8] text-[#852A91] font-bold border-l-4 border-l-[#852A91] rounded-r-xl shadow-xs'
                      : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-50 font-medium rounded-xl'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[22px] ${
                      isActive ? 'text-[#852A91]' : 'text-slate-500'
                    }`}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F7ECF8] text-[#852A91]">
                      {item.badge}
                    </span>
                  )}
                  {item.hasIndicator && (
                    <span
                      className="w-2 h-2 rounded-full bg-[#852A91] animate-pulse"
                      title="Gestação ativa"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Footer: Patient Snapshot & Logout */}
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-slate-50">
            <div className="w-10 h-10 rounded-full bg-[#F7ECF8] flex items-center justify-center font-bold text-sm text-[#852A91] border border-[#B77AD8]/30 shrink-0">
              {patientName.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-[#1E293B] truncate leading-tight">
                {patientName}
              </span>
              <span className="text-[11px] text-[#852A91] font-medium">
                {gestationalWeekText}
              </span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Sair da conta"
            onClick={onLogout}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-left"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* DESKTOP TOP BAR                                          */}
      {/* ======================================================== */}
      {!hideTopBar && (
        <header
          aria-label="Barra Superior Desktop"
          className="hidden lg:flex fixed top-0 right-0 left-72 h-18 z-30 items-center justify-between px-8 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs"
        >
          {/* Breadcrumbs or Page Title */}
          <div className="flex items-center gap-2">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-400">/</span>}
                    {crumb.href ? (
                      <a
                        href={crumb.href}
                        className="text-slate-600 hover:text-[#852A91] font-medium transition-colors"
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="text-[#852A91] font-bold">
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#1E293B]">
                  Painel do Paciente
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Conectada
                </span>
              </div>
            )}
          </div>

          {/* Emergency Trailing Action */}
          <div className="flex items-center gap-3">
            <a
              href={emergencyPhone}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#852A91] hover:bg-[#6F217B] text-white text-xs font-bold shadow-xs hover:shadow-sm active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                emergency
              </span>
              <span>Plantão de Emergência</span>
            </a>
          </div>
        </header>
      )}

      {/* ======================================================== */}
      {/* MAIN VIEWPORT / OUTLET WRAPPER                           */}
      {/* ======================================================== */}
      <div className={`lg:ml-72 ${!hideTopBar ? 'lg:pt-18' : ''} ${hideBottomNav ? '' : 'pb-20 lg:pb-8'}`}>
        {children}
      </div>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION (RN-020 / [P0-2] De-stacking)   */}
      {/* ======================================================== */}
      {!hideBottomNav && (
        <nav
          aria-label="Navegação Principal Mobile"
          className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-1.5 h-16 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(30,41,59,0.05)]"
        >
          {mobileNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 gap-0.5 active:scale-90 transition-transform ${
                  isActive
                    ? 'text-[#852A91] font-bold'
                    : 'text-[#64748B] font-medium hover:text-[#852A91]'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="text-[11px] leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};
