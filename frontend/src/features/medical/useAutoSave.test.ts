import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAutoSave } from './useAutoSave';

describe('useAutoSave Hook (SPEC-0035 / RN-009)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('salva localmente no localStorage imediatamente ao alterar os dados', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const initialData = { text: 'hello' };

    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ key: 'test-record-1', data, onSave, delayMs: 5000 }),
      { initialProps: { data: initialData } }
    );

    // Altera os dados
    rerender({ data: { text: 'hello world' } });

    // Backup local imediato
    const stored = localStorage.getItem('canamed:draft:test-record-1');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual({ text: 'hello world' });
  });

  it('dispara onSave após 5 segundos de inatividade (debounce)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { rerender, result } = renderHook(
      ({ data }) => useAutoSave({ key: 'test-record-2', data, onSave, delayMs: 5000 }),
      { initialProps: { data: { count: 1 } } }
    );

    rerender({ data: { count: 2 } });
    expect(result.current.status).toBe('idle');
    expect(onSave).not.toHaveBeenCalled();

    // Avança 3 segundos (ainda não deve ter salvo)
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onSave).not.toHaveBeenCalled();

    // Avança mais 2 segundos (total 5s)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ count: 2 });
    expect(result.current.status).toBe('saved');
  });

  it('cancela timer e reinicia a contagem quando novos dados continuam sendo digitados', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ key: 'test-record-3', data, onSave, delayMs: 5000 }),
      { initialProps: { data: { query: 'a' } } }
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    rerender({ data: { query: 'ab' } });

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(onSave).not.toHaveBeenCalled();

    // Completa 5s desde a última digitação
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ query: 'ab' });
  });

  it('reflete status de erro quando a chamada de onSave falha', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Network error'));

    const { rerender, result } = renderHook(
      ({ data }) => useAutoSave({ key: 'test-record-4', data, onSave, delayMs: 1000 }),
      { initialProps: { data: { step: 1 } } }
    );

    rerender({ data: { step: 2 } });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('Network error');
  });
});
