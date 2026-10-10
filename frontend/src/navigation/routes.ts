/**
 * Mapa de rotas do CANAMED (SPEC-0026 / ADR-0011).
 *
 * O produto é dividido em superfícies com URLs próprias:
 * - `/app`     → sistema interno (recepção, gestão, financeiro);
 * - `/p/:slug` → superfície pública do paciente, mobile-first e sem sidebar;
 * - `/medico`  → superfície do profissional de saúde;
 * - `/sala`    → telas de exibição sem login (TV do saguão).
 *
 * A primeira entrega usa *path*; a evolução para subdomínio reaproveita este mapa trocando apenas o
 * resolvedor de clínica por slug.
 */

export type StaffView =
  | 'dashboard'
  | 'agenda'
  | 'queue'
  | 'operation'
  | 'catalog'
  | 'users'
  | 'cashier'
  | 'tv'
  | 'financial'
  | 'inventory'
  | 'dpo'
  | 'policies'
  | 'links';

export const STAFF_PATHS: Record<StaffView, string> = {
  dashboard: '/app/dashboard',
  agenda: '/app/agenda',
  queue: '/app/recepcao',
  operation: '/app/operacao',
  catalog: '/app/catalogo',
  users: '/app/usuarios',
  cashier: '/app/caixa',
  tv: '/app/tv',
  financial: '/app/financeiro',
  inventory: '/app/estoque',
  dpo: '/app/dpo',
  policies: '/app/politicas',
  links: '/app/links',
};

const PATH_TO_STAFF_VIEW: ReadonlyArray<[string, StaffView]> = [
  ['/app/agenda', 'agenda'],
  ['/app/recepcao', 'queue'],
  ['/app/operacao', 'operation'],
  ['/app/catalogo', 'catalog'],
  ['/app/usuarios', 'users'],
  ['/app/caixa', 'cashier'],
  ['/app/tv', 'tv'],
  ['/app/financeiro', 'financial'],
  ['/app/estoque', 'inventory'],
  ['/app/dpo', 'dpo'],
  ['/app/politicas', 'policies'],
  ['/app/links', 'links'],
  ['/app/dashboard', 'dashboard'],
];

/** Descobre a visão ativa a partir do caminho atual, com fallback no dashboard. */
export function staffViewFromPath(pathname: string): StaffView {
  const match = PATH_TO_STAFF_VIEW.find(([path]) => pathname.startsWith(path));
  return match ? match[1] : 'dashboard';
}

/** Superfície do profissional de saúde (`/medico`). */
export const DOCTOR_PATHS = {
  home: '/medico',
  consultation: '/medico/consultorio',
  agenda: '/medico/agenda',
  queue: '/medico/fila',
  records: '/medico/prontuario',
  patientRecord: (patientId: string) => `/medico/prontuario/${encodeURIComponent(patientId)}`,
  documents: '/medico/documentos',
  returns: '/medico/retornos',
} as const;

/**
 * Caminhos da superfície pública do paciente para uma clínica identificada por slug.
 * Nenhum dado sensível entra em path, query ou fragment (SPEC-0026/RN-006).
 */
export function patientPaths(slug: string) {
  const base = `/p/${encodeURIComponent(slug)}`;

  return {
    base,
    agendar: `${base}/agendar`,
    agendarProfessional: (professionalSlug: string) =>
      `${base}/agendar/profissional/${encodeURIComponent(professionalSlug)}`,
    agendarSpecialty: (specialtySlug: string) =>
      `${base}/agendar/especialidade/${encodeURIComponent(specialtySlug)}`,
    cadastro: `${base}/cadastro`,
    cadastroFor: (token: string) => `${base}/cadastro/${encodeURIComponent(token)}`,
    consultas: `${base}/consultas`,
    appointmentFor: (token: string) => `${base}/c/${encodeURIComponent(token)}`,
    confirm: (token: string) => `${base}/c/${encodeURIComponent(token)}/confirmar`,
    reschedule: (token: string) => `${base}/c/${encodeURIComponent(token)}/remarcar`,
    cancel: (token: string) => `${base}/c/${encodeURIComponent(token)}/cancelar`,
    checkIn: `${base}/check-in`,
    checkInFor: (token: string) => `${base}/check-in/${encodeURIComponent(token)}`,
    fila: `${base}/fila`,
    filaFor: (token: string) => `${base}/fila/${encodeURIComponent(token)}`,
    documentos: `${base}/documentos`,
    documentoFor: (token: string) => `${base}/documentos/${encodeURIComponent(token)}`,
    validar: (token: string) => `${base}/validar/${encodeURIComponent(token)}`,
    privacidade: `${base}/privacidade`,
    privacidadeProtocolo: (protocol: string) =>
      `${base}/privacidade/${encodeURIComponent(protocol)}`,
    waitlistOffer: (token: string) => `${base}/fila-espera/${encodeURIComponent(token)}`,
  };
}

/** Endereço público padrão quando o slug ainda não é conhecido (fallback de desenvolvimento). */
export const DEFAULT_CLINIC_SLUG = 'cana-med';

/** Rota de exibição pública do painel de chamada (SPEC-0020). */
export const LOBBY_TV_PATH = '/sala/tv';
