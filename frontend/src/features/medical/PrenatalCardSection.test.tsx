import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PrenatalCardSection, type PrenatalVisitItem } from './PrenatalCardSection';

describe('PrenatalCardSection Component (SPEC-0035 / RN-007 / GO)', () => {
  const dummyVisits: PrenatalVisitItem[] = [
    {
      id: 'visit-1',
      visitDate: '2026-08-15',
      gestationalAgeWeeks: 12,
      gestationalAgeDays: 2,
      weightKg: 63.5,
      bmi: 23.3,
      bloodPressure: '110/70',
      uterineHeightCm: 12.0,
      fetalHeartRateBpm: 152,
      fetalMovementPresent: true,
      edemaClassification: 'Ausente',
      fetalPresentation: 'Cefálica',
      clinicalNotes: 'Paciente sem queixas no 1º trimestre',
    },
  ];

  it('renderiza título do cartão da gestante, resumo obstétrico (DUM, DPP, GPA, Tipagem) e tabela de consultas com 10 colunas', () => {
    render(
      <PrenatalCardSection
        patientId="pat-1"
        patientName="Juliana Silveira"
        visits={dummyVisits}
        dum="2026-04-11"
        dpp="2027-01-16"
        bloodType="A"
        rhFactor="Positivo"
        gynProfile={{
          gravida: 2,
          para: 1,
          cesareans: 0,
          abortions: 0,
          livingChildren: 1,
        }}
      />
    );

    expect(screen.getByText(/Cartão da Gestante & Consultas de Pré-Natal/i)).toBeInTheDocument();
    expect(screen.getByText(/11\/04\/2026/i)).toBeInTheDocument(); // DUM formatada
    expect(screen.getByText(/16\/01\/2027/i)).toBeInTheDocument(); // DPP formatada
    expect(screen.getByText(/G2 P1 C0 A0/i)).toBeInTheDocument(); // GPA
    expect(screen.getByText(/A\+/i)).toBeInTheDocument(); // Tipagem
    expect(screen.getAllByText(/12s 2d/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/110\/70/i)).toBeInTheDocument();
    expect(screen.getByText(/152/i)).toBeInTheDocument();
    expect(screen.getAllByText(/23.3/i).length).toBeGreaterThanOrEqual(1); // Coluna IMC
    expect(screen.getByText(/Cefálica/i)).toBeInTheDocument(); // Apresentação
  });

  it('exibe alerta de vigilância de aloimunização quando a gestante for Rh Negativo', () => {
    render(
      <PrenatalCardSection
        patientId="pat-1"
        patientName="Juliana Silveira"
        visits={dummyVisits}
        bloodType="O"
        rhFactor="Negativo"
      />
    );

    expect(screen.getByText(/^O-$/i)).toBeInTheDocument();
    expect(screen.getByText(/Gestante Rh Negativo/i)).toBeInTheDocument();
    expect(screen.getByText(/Vigilância de Aloimunização/i)).toBeInTheDocument();
  });

  it('permite alternar entre as abas Consultas & Gráficos, Vacinas da Gestante e Sorologias por Trimestre', () => {
    render(
      <PrenatalCardSection
        patientId="pat-1"
        patientName="Juliana Silveira"
        visits={dummyVisits}
      />
    );

    // Aba padrão: Consultas & Gráficos
    expect(screen.getByText(/Curva de Ganho de Peso Gestacional/i)).toBeInTheDocument();

    // Alterna para Vacinas da Gestante
    const vacinasTab = screen.getByRole('button', { name: /Vacinas da Gestante/i });
    fireEvent.click(vacinasTab);

    expect(screen.getByText(/dTpa/i)).toBeInTheDocument();
    expect(screen.getByText(/Influenza/i)).toBeInTheDocument();
    expect(screen.getByText(/Vírus Sincicial Respiratório/i)).toBeInTheDocument();

    // Alterna para Sorologias por Trimestre
    const sorologiasTab = screen.getByRole('button', { name: /Sorologias por Trimestre/i });
    fireEvent.click(sorologiasTab);

    expect(screen.getAllByText(/Sífilis/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/HIV/i)).toBeInTheDocument();
    expect(screen.getByText(/Coombs Indireto/i)).toBeInTheDocument();
  });

  it('abre modal de nova consulta, calcula IMC em tempo real e permite enviar os dados preenchidos', async () => {
    const handleAdd = vi.fn().mockResolvedValue(undefined);

    render(
      <PrenatalCardSection
        patientId="pat-1"
        patientName="Juliana Silveira"
        visits={[]}
        heightCm={160}
        onAddVisit={handleAdd}
      />
    );

    const addBtn = screen.getByRole('button', { name: /\+ Nova Consulta/i });
    fireEvent.click(addBtn);

    expect(screen.getByText(/Registrar Consulta de Pré-Natal/i)).toBeInTheDocument();

    // Preenche peso (64kg) com estatura de 160cm -> IMC 64 / (1.6^2) = 25.0
    const weightInput = screen.getByPlaceholderText(/65.0/i);
    fireEvent.change(weightInput, { target: { value: '64.0' } });

    expect(screen.getByText(/IMC Calculado: 25.0/i)).toBeInTheDocument();

    // Preenche PA
    const bpInput = screen.getByPlaceholderText(/120\/80/i);
    fireEvent.change(bpInput, { target: { value: '115/75' } });

    // Preenche AU
    const auInput = screen.getByPlaceholderText(/24/i);
    fireEvent.change(auInput, { target: { value: '18.0' } });

    // Preenche Notas
    const notesInput = screen.getByPlaceholderText(/Conduta, exames solicitados e queixas/i);
    fireEvent.change(notesInput, { target: { value: 'Prescrito polivitamínico e retorno em 30d' } });

    // Submete formulário
    const submitBtn = screen.getByRole('button', { name: /Salvar Consulta/i });
    fireEvent.click(submitBtn);

    expect(handleAdd).toHaveBeenCalledTimes(1);
    expect(handleAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        weightKg: 64.0,
        bmi: 25.0,
        bloodPressure: '115/75',
        uterineHeightCm: 18.0,
        clinicalNotes: 'Prescrito polivitamínico e retorno em 30d',
      })
    );
  });

  it('aciona o botão de exportar Cartão da Gestante e abre a visualização para salvar em PDF', async () => {
    render(
      <PrenatalCardSection
        patientId="pat-1"
        patientName="Juliana Silveira"
        visits={dummyVisits}
      />
    );

    const exportBtn = screen.getByRole('button', { name: /Exportar Cartão \(PDF\)/i });
    expect(exportBtn).not.toBeDisabled();
  });

  it('abre a modal do Cartão da Gestante (6 páginas) e renderiza as páginas canônicas do protótipo', () => {
    render(
      <PrenatalCardSection
        patientId="pat-1"
        patientName="Juliana Silveira"
        visits={dummyVisits}
        dum="2026-04-11"
        dpp="2027-01-16"
        bloodType="A"
        rhFactor="Positivo"
      />
    );

    const viewBtn = screen.getByRole('button', { name: /Visualizar Cartão \(6 Páginas\)/i });
    expect(viewBtn).toBeInTheDocument();
    fireEvent.click(viewBtn);

    // Modal aberta: verifica elementos do protótipo
    expect(screen.getByText(/Meu acompanhamento pré-natal/i)).toBeInTheDocument();
    expect(screen.getByText(/Carteira de Imunização Materna/i)).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 6/i)).toBeInTheDocument();
    expect(screen.getByText(/Página 3 de 6/i)).toBeInTheDocument();
    expect(screen.getByText(/Página 6 de 6/i)).toBeInTheDocument();
  });

  it('permite registrar novo exame complementar e editar resultados de exames na aba Sorologias', () => {
    render(
      <PrenatalCardSection
        patientId="pat-1"
        patientName="Juliana Silveira"
        visits={dummyVisits}
      />
    );

    // Alterna para Sorologias
    const sorologiasTab = screen.getByRole('button', { name: /Sorologias por Trimestre/i });
    fireEvent.click(sorologiasTab);

    // Botão de registrar novo exame
    const newExamBtn = screen.getByRole('button', { name: /\+ Registrar Novo Exame/i });
    expect(newExamBtn).toBeInTheDocument();
    fireEvent.click(newExamBtn);

    expect(screen.getByText(/Registrar Novo Exame \/ Sorologia/i)).toBeInTheDocument();

    // Preenche novo exame
    const nameInput = screen.getByPlaceholderText(/Ex: Hemograma Completo, TSH/i);
    fireEvent.change(nameInput, { target: { value: 'Hemograma e Ferritina' } });

    // Clica no chip rápido "Normal"
    const normalChip = screen.getByRole('button', { name: /^Normal$/i });
    fireEvent.click(normalChip);

    // Submete
    const saveBtn = screen.getByRole('button', { name: /Salvar Exame/i });
    fireEvent.click(saveBtn);

    // Novo exame aparece na tabela
    expect(screen.getByText('Hemograma e Ferritina')).toBeInTheDocument();
  });
});
