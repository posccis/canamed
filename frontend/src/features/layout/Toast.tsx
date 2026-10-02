import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      <div
        className="toast-container"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          maxWidth: '24rem',
          width: 'calc(100% - 3rem)',
          pointerEvents: 'none'
        }}
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const bg =
            toast.type === 'success'
              ? 'var(--color-accent-subtle)'
              : toast.type === 'error'
              ? '#FFF5F5'
              : 'var(--color-surface)';

          const border =
            toast.type === 'success'
              ? 'var(--color-accent)'
              : toast.type === 'error'
              ? 'var(--color-danger)'
              : 'var(--color-border)';

          const color =
            toast.type === 'success'
              ? 'var(--color-primary-dark)'
              : toast.type === 'error'
              ? 'var(--color-danger)'
              : 'var(--color-text)';

          const icon =
            toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ';

          return (
            <div
              key={toast.id}
              role="alert"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.875rem 1.125rem',
                backgroundColor: bg,
                border: `1px solid ${border}`,
                borderLeft: `4px solid ${border}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                color,
                fontSize: '0.875rem',
                fontWeight: 500,
                animation: 'slideUp 0.25s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontWeight: 700 }}>{icon}</span>
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  fontSize: '1rem',
                  lineHeight: 1,
                  opacity: 0.7
                }}
                aria-label="Fechar notificação"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

const fallbackToast: ToastContextValue = {
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  return context ?? fallbackToast;
}
