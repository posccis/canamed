import { useState } from 'react';
import {
  Building2,
  Receipt,
  SlidersHorizontal,
  UserCog,
  Tv,
  ShieldCheck,
} from 'lucide-react';
import { OperationPanel } from './OperationPanel';
import { RevenueTypesSettings } from '../admin/RevenueTypesSettings';
import { ClinicPolicyPanel } from '../admin/ClinicPolicyPanel';
import { UsersPanel } from '../auth/UsersPanel';
import { LinksPanel } from '../layout/LinksPanel';
import { DpoWorkspace } from '../admin/DpoWorkspace';
import { useSession } from '../auth/useSession';

export type ClinicSettingsTab =
  | 'operation'
  | 'revenue-types'
  | 'policies'
  | 'users'
  | 'links'
  | 'dpo';

type TabConfig = {
  id: ClinicSettingsTab;
  label: string;
  icon: typeof Building2;
  description: string;
};

const TABS: TabConfig[] = [
  {
    id: 'operation',
    label: 'Salas & Convênios',
    icon: Building2,
    description: 'Gestão de salas de atendimento, convênios aceitos, horários de funcionamento e feriados.',
  },
  {
    id: 'revenue-types',
    label: 'Tipos de Entrada Financeira',
    icon: Receipt,
    description: 'Padronização de consultas, procedimentos ginecológicos e valores de recebimento no caixa.',
  },
  {
    id: 'policies',
    label: 'Regras de Agendamento',
    icon: SlidersHorizontal,
    description: 'Políticas de cota diária de encaixes e prazos mínimos de cancelamento/antecedência.',
  },
  {
    id: 'users',
    label: 'Equipe & Acessos',
    icon: UserCog,
    description: 'Gestão de usuários da clínica, recepcionistas, gestores e permissões de acesso.',
  },
  {
    id: 'links',
    label: 'Link de Agendamento',
    icon: Tv,
    description: 'Link público compartilhável para agendamentos online e cadastro de pacientes.',
  },
  {
    id: 'dpo',
    label: 'Privacidade LGPD',
    icon: ShieldCheck,
    description: 'Atendimento aos direitos do titular de dados (Lei nº 13.709/2018) e trilha de auditoria.',
  },
];

export function ClinicSettingsPanel() {
  const { state: authState } = useSession();
  const clinicId = authState.status === 'authenticated' ? authState.session.clinicId : '';
  const [activeTab, setActiveTab] = useState<ClinicSettingsTab>('operation');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
      {/* Header com estilo SaaS Oficial */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚙️</span>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--content-primary, #202631)' }}>
              Configurações da Clínica
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--content-secondary, #626B79)', fontSize: '0.9rem' }}>
            Centralize parâmetros operacionais, regras de agendamento, financeiro e equipe em um só lugar.
          </p>
        </div>
      </div>

      {/* Navegação por Abas Horizontais com Design Tokens */}
      <div
        role="tablist"
        aria-label="Abas de Configuração da Clínica"
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--base-border, #E2E6EC)',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                fontSize: '0.88rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--brand-primary, #852A91)' : 'var(--content-secondary, #626B79)',
                background: isActive ? 'var(--brand-soft, #F7ECF8)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--brand-primary, #852A91)' : '2px solid transparent',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo da Aba Selecionada */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          background: 'var(--base-surface, #FFFFFF)',
          border: '1px solid var(--base-border, #E2E6EC)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-soft, 0 2px 10px -2px rgba(32, 38, 49, 0.05))',
        }}
      >
        {activeTab === 'operation' && <OperationPanel />}
        {activeTab === 'revenue-types' && <RevenueTypesSettings clinicId={clinicId} />}
        {activeTab === 'policies' && <ClinicPolicyPanel />}
        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'links' && <LinksPanel />}
        {activeTab === 'dpo' && <DpoWorkspace />}
      </div>
    </div>
  );
}
