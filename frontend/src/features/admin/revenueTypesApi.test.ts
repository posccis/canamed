import { describe, it, expect, beforeEach } from 'vitest';
import {
  listRevenueTypes,
  createRevenueType,
  updateRevenueType,
  toggleRevenueTypeActive,
  type RevenueTypeDto,
} from './revenueTypesApi';

describe('revenueTypesApi', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retorna os tipos de entrada padrão para clínicas ginecológicas quando vazio', async () => {
    const list = await listRevenueTypes('clinic-test-1');
    expect(list.length).toBeGreaterThanOrEqual(4);
    expect(list.some((item) => item.name.includes('Primeira Consulta'))).toBe(true);
    expect(list.some((item) => item.name.includes('DIU'))).toBe(true);
    expect(list.some((item) => item.name.includes('Papanicolau'))).toBe(true);
  });

  it('permite cadastrar um novo tipo de entrada financeira padronizado', async () => {
    const created = await createRevenueType('clinic-test-1', {
      name: 'Procedimento Biópsia de Colo',
      category: 'procedimento',
      defaultAmount: 350.0,
      description: 'Coleta de fragmento para análise histopatológica',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Procedimento Biópsia de Colo');
    expect(created.defaultAmount).toBe(350.0);
    expect(created.active).toBe(true);

    const list = await listRevenueTypes('clinic-test-1');
    expect(list.some((t) => t.id === created.id)).toBe(true);
  });

  it('permite atualizar valores e desativar um tipo de entrada', async () => {
    const list = await listRevenueTypes('clinic-test-1');
    const first = list[0];

    const updated = await updateRevenueType('clinic-test-1', first.id, {
      defaultAmount: 280.0,
      description: 'Valor reajustado para o ano corrente',
    });

    expect(updated.defaultAmount).toBe(280.0);
    expect(updated.description).toBe('Valor reajustado para o ano corrente');

    const toggled = await toggleRevenueTypeActive('clinic-test-1', first.id);
    expect(toggled.active).toBe(!first.active);
  });
});
