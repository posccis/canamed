import { useEffect, type ReactNode } from 'react';

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** Diálogo simples, acessível por teclado (Esc fecha) e sem dependências externas. */
export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="modal__backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="modal__content">
        <header className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button type="button" className="button button--ghost" onClick={onClose}>
            Fechar
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
