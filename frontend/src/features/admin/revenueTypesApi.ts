/**
 * Módulo de Gerenciamento e Padronização de Tipos de Entrada Financeira
 * Cana Med Mulher (SPEC-0032).
 */

export type RevenueCategory = 'consulta' | 'procedimento' | 'exame' | 'outros';

export type RevenueTypeDto = {
  id: string;
  clinicId: string;
  name: string;
  category: RevenueCategory;
  defaultAmount: number;
  description?: string;
  active: boolean;
  createdAt: string;
};

export type CreateRevenueTypeInput = {
  name: string;
  category: RevenueCategory;
  defaultAmount: number;
  description?: string;
};

export type UpdateRevenueTypeInput = {
  name?: string;
  category?: RevenueCategory;
  defaultAmount?: number;
  description?: string;
  active?: boolean;
};

const STORAGE_KEY_PREFIX = 'canamed_revenue_types_';

/** Tipos de entrada pré-configurados padrão para clínicas de ginecologia */
function getDefaultGynRevenueTypes(clinicId: string): RevenueTypeDto[] {
  const now = new Date().toISOString();
  return [
    {
      id: `${clinicId}-rev-1`,
      clinicId,
      name: 'Primeira Consulta Ginecológica',
      category: 'consulta',
      defaultAmount: 250.0,
      description: 'Anamnese completa, exame físico geral e exame especular ginecológico',
      active: true,
      createdAt: now,
    },
    {
      id: `${clinicId}-rev-2`,
      clinicId,
      name: 'Consulta de Retorno de Exames',
      category: 'consulta',
      defaultAmount: 0.0,
      description: 'Avaliação de resultados dentro do prazo regulamentar (CFM 1.958/2010)',
      active: true,
      createdAt: now,
    },
    {
      id: `${clinicId}-rev-3`,
      clinicId,
      name: 'Inserção de Dispositivo Intrauterino (DIU)',
      category: 'procedimento',
      defaultAmount: 600.0,
      description: 'Procedimento ambulatorial com assepsia e orientação contraceptiva',
      active: true,
      createdAt: now,
    },
    {
      id: `${clinicId}-rev-4`,
      clinicId,
      name: 'Coleta de Exame Preventivo (Papanicolau / Citologia)',
      category: 'exame',
      defaultAmount: 90.0,
      description: 'Coleta ecto e endocervical para rastreamento de câncer de colo de útero',
      active: true,
      createdAt: now,
    },
    {
      id: `${clinicId}-rev-5`,
      clinicId,
      name: 'Coparticipação de Consulta (Convênio)',
      category: 'consulta',
      defaultAmount: 40.0,
      description: 'Valor de coparticipação retido no balcão de acordo com a operadora',
      active: true,
      createdAt: now,
    },
  ];
}

function getStored(clinicId: string): RevenueTypeDto[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${clinicId}`);
    if (!raw) {
      const defaults = getDefaultGynRevenueTypes(clinicId);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${clinicId}`, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw) as RevenueTypeDto[];
  } catch {
    return getDefaultGynRevenueTypes(clinicId);
  }
}

function saveStored(clinicId: string, items: RevenueTypeDto[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${clinicId}`, JSON.stringify(items));
  } catch {
    // Tratamento silencioso
  }
}

/** Lista todos os tipos de entrada financeira cadastrados para a clínica */
export async function listRevenueTypes(clinicId: string): Promise<RevenueTypeDto[]> {
  return Promise.resolve(getStored(clinicId));
}

/** Cadastra um novo tipo de entrada financeira padronizado */
export async function createRevenueType(
  clinicId: string,
  input: CreateRevenueTypeInput,
): Promise<RevenueTypeDto> {
  const current = getStored(clinicId);
  const newItem: RevenueTypeDto = {
    id: `${clinicId}-rev-${Date.now()}`,
    clinicId,
    name: input.name.trim(),
    category: input.category,
    defaultAmount: Math.max(0, input.defaultAmount),
    description: input.description?.trim(),
    active: true,
    createdAt: new Date().toISOString(),
  };

  current.push(newItem);
  saveStored(clinicId, current);
  return Promise.resolve(newItem);
}

/** Atualiza campos de um tipo de entrada financeira */
export async function updateRevenueType(
  clinicId: string,
  typeId: string,
  input: UpdateRevenueTypeInput,
): Promise<RevenueTypeDto> {
  const current = getStored(clinicId);
  const index = current.findIndex((item) => item.id === typeId);
  if (index === -1) {
    throw new Error('Tipo de entrada não encontrado.');
  }

  const existing = current[index];
  const updated: RevenueTypeDto = {
    ...existing,
    name: input.name !== undefined ? input.name.trim() : existing.name,
    category: input.category !== undefined ? input.category : existing.category,
    defaultAmount: input.defaultAmount !== undefined ? Math.max(0, input.defaultAmount) : existing.defaultAmount,
    description: input.description !== undefined ? input.description.trim() : existing.description,
    active: input.active !== undefined ? input.active : existing.active,
  };

  current[index] = updated;
  saveStored(clinicId, current);
  return Promise.resolve(updated);
}

/** Alterna status ativo/inativo de um tipo de entrada */
export async function toggleRevenueTypeActive(
  clinicId: string,
  typeId: string,
): Promise<RevenueTypeDto> {
  const current = getStored(clinicId);
  const target = current.find((item) => item.id === typeId);
  if (!target) {
    throw new Error('Tipo de entrada não encontrado.');
  }

  return updateRevenueType(clinicId, typeId, { active: !target.active });
}
