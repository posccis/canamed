import { useState, useEffect, useRef } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseAutoSaveOptions<T> {
  key: string;
  data: T;
  onSave: (data: T) => Promise<void>;
  delayMs?: number;
  enabled?: boolean;
}

export interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  errorMessage: string | null;
  lastSavedAt: Date | null;
  saveNow: () => Promise<void>;
}

export function useAutoSave<T>({
  key,
  data,
  onSave,
  delayMs = 5000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<T>(data);
  const isFirstRender = useRef(true);
  const onSaveRef = useRef(onSave);

  onSaveRef.current = onSave;
  dataRef.current = data;

  const storageKey = `canamed:draft:${key}`;

  const executeSave = async (currentData: T) => {
    setStatus('saving');
    setErrorMessage(null);
    try {
      await onSaveRef.current(currentData);
      setStatus('saved');
      setLastSavedAt(new Date());
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Falha no salvamento automático.');
    }
  };

  useEffect(() => {
    if (!enabled) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // 1. Gravação espelhada imediata em localStorage (backup offline / crash protection)
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // Ignorar erros de quota de storage
    }

    // 2. Debounce para salvamento remoto via backend
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void executeSave(data);
    }, delayMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, delayMs, enabled, storageKey]);

  const saveNow = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    await executeSave(dataRef.current);
  };

  return {
    status,
    errorMessage,
    lastSavedAt,
    saveNow,
  };
}
