import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GynecologicalProceduresSection } from './GynecologicalProceduresSection';

describe('GynecologicalProceduresSection', () => {
  it('renderiza os chips rápidos de procedimentos e o campo de seleção', () => {
    const handleProcChange = vi.fn();
    render(
      <GynecologicalProceduresSection
        procedurePerformed=""
        onProcedurePerformedChange={handleProcChange}
        procedureBatch=""
        onProcedureBatchChange={vi.fn()}
        procedureNotes=""
        onProcedureNotesChange={vi.fn()}
      />
    );

    expect(screen.getByText('Procedimentos Ambulatoriais Especializados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Inserção de DIU de Cobre/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Biópsia de Colo Uterino/i })).toBeInTheDocument();
  });

  it('seleciona um procedimento com 1 clique no chip', () => {
    const handleProcChange = vi.fn();
    render(
      <GynecologicalProceduresSection
        procedurePerformed=""
        onProcedurePerformedChange={handleProcChange}
        procedureBatch=""
        onProcedureBatchChange={vi.fn()}
        procedureNotes=""
        onProcedureNotesChange={vi.fn()}
      />
    );

    const chipDiu = screen.getByRole('button', { name: /Inserção de DIU de Cobre/i });
    fireEvent.click(chipDiu);

    expect(handleProcChange).toHaveBeenCalledWith('Inserção de DIU de Cobre');
  });

  it('exibe atalhos de histerometria e fios quando procedimento for DIU', () => {
    const handleNotesChange = vi.fn();
    render(
      <GynecologicalProceduresSection
        procedurePerformed="Inserção de DIU Hormonal (Mirena/Kyleena)"
        onProcedurePerformedChange={vi.fn()}
        procedureBatch="LOTE-12345"
        onProcedureBatchChange={vi.fn()}
        procedureNotes="Procedimento asséptico."
        onProcedureNotesChange={handleNotesChange}
      />
    );

    expect(screen.getByText('+ Histerometria 7.0 cm')).toBeInTheDocument();
    const btnFios = screen.getByText('+ Fios cortados a 2.5 cm');
    fireEvent.click(btnFios);

    expect(handleNotesChange).toHaveBeenCalledWith(
      expect.stringContaining('Fios visíveis cortados a 2.5 cm')
    );
  });

  it('ao selecionar procedimento LARC, renderiza campos estruturados de lote, histerometria e cálculo de validade', () => {
    render(
      <GynecologicalProceduresSection
        procedurePerformed="Inserção de DIU Hormonal (Mirena/Kyleena)"
        onProcedurePerformedChange={vi.fn()}
        procedureBatch="LOTE-84920"
        onProcedureBatchChange={vi.fn()}
        procedureNotes="Inserção estéril"
        onProcedureNotesChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Dispositivo LARC/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Histerometria \(cm\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Validade Calculada/i)).toBeInTheDocument();
    expect(screen.getByText(/USG de Controle/i)).toBeInTheDocument();
  });
});
