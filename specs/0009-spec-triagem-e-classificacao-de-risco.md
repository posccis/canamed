# SPEC-0009 — Apoio ao Processo de Triagem e Classificação de Risco

- **Versão:** 1.0
- **Status:** Aprovada
- **Data:** 2026-10-01
- **Autor:** Agente CANAMED
- **Relacionados:** [SPEC-0002](0002-spec-agenda-de-consultas.md), [SPEC-0005](0005-spec-fila-de-espera-e-ciclo-de-atendimento.md), [SPEC-UI-001](UI/SPEC-UI-001.md), ADR-0001, ADR-0003, RDC ANVISA nº 657/2022

## 1. Objetivo

Fornecer aos profissionais da recepção e equipe de enfermagem um fluxo ágil para registrar sinais vitais preliminares e classificação de risco administrativa dos pacientes que aguardam na fila de espera. Esta especificação cumpre o pilar fundamental previsto no briefing do CANAMED ("apoio ao processo de triagem") e entrega o item **P-03** do [backlog](../docs/backlog-proximas-funcionalidades.md).

## 2. Contexto e Enquadramento Regulatório (ANVISA RDC nº 657/2022)

Conforme destacado no `GEMINI.md`:
> *"O CANAMED é concebido como uma plataforma de gestão clínica. Enquanto permanecer exclusivamente como software administrativo e de gestão, a RDC nº 657/2022 prevê que essa categoria pode não se enquadrar como Software como Dispositivo Médico (SaMD). Entretanto, caso futuramente sejam adicionadas funcionalidades como diagnóstico automatizado ou algoritmos de decisão clínica, o impacto regulatório deverá ser reavaliado."*

Portanto, esta funcionalidade foi desenhada estritamente como **apoio ao fluxo operacional e documentação assistencial**:
- O sistema **não realiza diagnóstico autônomo** nem indica condutas terapêuticas automatizadas;
- O sistema registra e exibe fielmente os parâmetros aferidos pelo operador humano (pressão, batimentos, temperatura, saturação, glicemia, peso e altura) e a classificação de prioridade de espera atribuída pela equipe.

## 3. Escopo

### 3.1 Dentro do escopo

- Registro de triagem vinculado à entrada na fila de espera (`POST /api/v1/queue/{id}/triage`):
  - **Sinais Vitais:** Pressão Arterial (ex.: `120/80`), Frequência Cardíaca (bpm), Temperatura Corporal (°C), Saturação O₂ (%), Glicemia capilar (mg/dL), Peso (kg) e Altura (cm).
  - Cálculo automático de IMC apenas como indicador informativo auxiliar.
  - Queixa principal descritiva e alergias relatadas.
  - **Classificação de Risco Administrativa (Protocolo de Cores):**
    - `vermelho` (Emergência — Prioridade 1)
    - `laranja` (Muito Urgente — Prioridade 2)
    - `amarelo` (Urgente — Prioridade 3)
    - `verde` (Pouco Urgente / Rotina — Prioridade 4)
    - `azul` (Não Urgente — Prioridade 5)
- Atualização dinâmica da prioridade na fila de espera para que pacientes mais urgentes subam na ordenação de chamada do médico.
- Consulta da triagem realizada (`GET /api/v1/queue/{id}/triage`).
- Visualização de badge de risco (com cores correspondentes) e resumo de sinais vitais no card do paciente na Fila e no Dashboard.
- Trilha de auditoria obrigatória (`AuditActions.TriageRecorded`).

### 3.2 Fora do escopo

- Prescrição de medicamentos na triagem (pertence ao escopo futuro de prontuário e prescrição).
- Integração telemétrica direta com monitores multiparamétricos via HL7/FHIR (escopo futuro).

## 4. Personas e Permissões

| Papel | Permissões | Acesso |
| :--- | :--- | :--- |
| **gestor** | `triage:read`, `triage:write` | Acesso total e configuração |
| **recepcionista** | `triage:read`, `triage:write` | Registro de triagem e visualização |
| **profissional** | `triage:read`, `triage:write` | Visualização detalhada dos sinais vitais antes de chamar o paciente |

## 5. Regras de Negócio

| # | Regra |
| :--- | :--- |
| RN-001 | A triagem só pode ser registrada para entradas de fila existentes na mesma clínica (`clinic_id`) e com status `aguardando` ou `chamado`. |
| RN-002 | Ao salvar a triagem com classificação de risco, a prioridade da fila (`priority`) é automaticamente ajustada para refletir a urgência médica (ex: Vermelho = 1, Laranja = 2, Amarelo = 3, Verde = 4, Azul = 5). |
| RN-003 | Se uma entrada na fila já possuir triagem, um novo registro atualiza os dados anteriores e gera registro de auditoria da alteração. |
| RN-004 | Valores de sinais vitais, quando preenchidos, devem respeitar faixas fisiológicas razoáveis de validação (ex.: temperatura entre 30°C e 45°C, saturação entre 50% e 100%). |
| RN-005 | A triagem não pode ser realizada após o atendimento já ter sido concluído (`atendido`) ou cancelado (`saiu`). |

## 6. Fluxos de Uso

### F-001 — Triagem Rápida na Fila de Espera
1. Na tela da Fila de Espera, a recepção visualiza o paciente com status `Aguardando`.
2. O operador clica no botão "Triagem".
3. Um modal intuitivo solicita a aferição de sinais vitais (PA, FC, Temp, SatO2, Queixa) e a seleção da cor de classificação de risco.
4. O operador seleciona a classificação (ex.: `Amarelo — Urgente`) e confirma.
5. O sistema salva a triagem, reordena a fila promovendo o paciente e exibe a tag visual colorida no painel da recepção e no consultório do médico.

## 7. Contrato de API (`/api/v1`)

### 7.1 Registrar Triagem
`POST /api/v1/queue/{id}/triage`
Headers: `X-Canamed-Clinic-Id: {clinic_id}`

```json
{
  "bloodPressure": "120/80",
  "heartRate": 76,
  "temperature": 36.6,
  "oxygenSaturation": 98,
  "glucose": 95,
  "weightKg": 70.5,
  "heightCm": 175,
  "chiefComplaint": "Dor de cabeça persistente há 2 dias",
  "allergies": "Dipirona",
  "riskClassification": "amarelo" // vermelho | laranja | amarelo | verde | azul
}
```

**Resposta 200 OK:**
```json
{
  "id": "uuid",
  "queueEntryId": "uuid",
  "clinicId": "uuid",
  "bloodPressure": "120/80",
  "heartRate": 76,
  "temperature": 36.6,
  "oxygenSaturation": 98,
  "glucose": 95,
  "weightKg": 70.5,
  "heightCm": 175,
  "calculatedBmi": 23.02,
  "chiefComplaint": "Dor de cabeça persistente há 2 dias",
  "allergies": "Dipirona",
  "riskClassification": "amarelo",
  "recordedAt": "2026-10-01T14:40:00Z",
  "operatorName": "Maria Recepcionista"
}
```

### 7.2 Obter Triagem da Entrada da Fila
`GET /api/v1/queue/{id}/triage`
Retorna os dados da triagem registrada ou 404 se ainda não foi triado.

## 8. Critérios de Aceitação

| # | Critério |
| :--- | :--- |
| CA-001 | Registrar triagem vinculada à entrada da fila com validação de dados vitais. |
| CA-002 | Atualizar a prioridade da fila conforme a classificação de risco (vermelho/laranja/amarelo/verde/azul). |
| CA-003 | Proibir triagem em fila de outra clínica (404/403). |
| CA-004 | Proibir triagem para entrada já finalizada (`atendido` ou `saiu`) com status 400. |
| CA-005 | Consultar a triagem e calcular IMC corretamente. |
| CA-006 | Auditar o registro da triagem com o operador responsável. |

## 9. Requisitos de Segurança e Legais

- **LGPD:** Acesso restrito a usuários autorizados da clínica. Dados de sinais vitais são mantidos no contexto do atendimento.
- **RDC ANVISA 657/2022:** Ferramenta de registro operacional de triagem sem geração de diagnósticos ou prescrições automáticas.
- **Auditoria:** Gravação obrigatória em log imutável de `triage.recorded`.
