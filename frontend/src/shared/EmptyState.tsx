import { type ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

/**
 * Componente unificado para estados vazios (Empty States) acolhedores.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div
      className="empty-state"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px dashed var(--color-border, #e2e8f0)',
        margin: '1rem 0',
      }}
    >
      {Icon && (
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--color-surface, #f0fdfa)',
            color: 'var(--color-primary, #852A91)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <Icon size={24} />
        </div>
      )}

      <h3
        style={{
          margin: '0 0 0.5rem',
          fontSize: '1.1rem',
          fontWeight: 600,
          color: 'var(--color-secondary, #6F217B)',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: '0 0 1.25rem',
          fontSize: '0.9rem',
          color: 'var(--color-text-muted, #64748b)',
          maxWidth: '420px',
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {action && (
        <button
          type="button"
          className="button button--primary"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}

      {children}
    </div>
  );
}

