# ESPECIFICAÇÃO DE DESIGN — REDESIGN DA ANAMNESE GINECOLÓGICA
**Documento de Planejamento de UX/UI — Cana Med Mulher**
**Destino de Persistência:** `docs/plans/2026-10-23-redesign-anamnese-ginecologica.md`
**Autor:** Cana Med Mulher UI/UX Design Planner Agent
**Data:** 23 de Outubro de 2026
**Status:** Aprovado para Implementação

---

## 1. Objetivo da Página e Componentes

### 1.1. Missão do Redesign
Proporcionar à médica ginecologista um ambiente de anamnese altamente eficiente, acolhedor e ágil, reduzindo o tempo de digitação repetitiva de 10 minutos para menos de 3 minutos, eliminando a dispersão cognitiva e o scrolling vertical excessivo, enquanto eleva a precisão dos registros clínicos e diagnósticos da saúde da mulher.

### 1.2. Escopo Funcional & Limites Clínicos
- **Em Escopo:**
  - Centralização da coleta da **Queixa Principal** (QP) com chips de atalho rápido para os 8 arquétipos ambulatoriais mais frequentes.
  - Estruturação assistida da **História da Moléstia Atual (HMA)** com guias visuais para cronologia, intensidade e correlação com o ciclo menstrual.
  - Integração do controle menstrual (**DUM**, regularidade, status climatérico) e cálculo gestacional FEBRASGO imediato.
  - Acesso e edição rápida in-place do **Perfil Gineco-Obstétrico Longitudinal** (GPA, menarca, contracepção, cirurgias e rastreamento de câncer familiar) sem desviar a atenção do prontuário em andamento.
  - Sincronização automática e bidirecional com o campo `subjective` do prontuário SOAP tradicional.
- **Fora de Escopo:**
  - Não automatizar diagnósticos ou condutas terapêuticas (conformidade com ANVISA RDC nº 657/2022).
  - Não alterar esquemas relacionais no banco de dados (reutilizar a API já existente `updateGynecologicalConsultationData` e `updateDraftMedicalRecord`).
  - Não misturar exame físico especular/toque bimanual ou procedimentos dentro da anamnese (esses continuam em seus blocos dedicados subsequentes).

---

## 2. Diagnóstico Atual

### 2.1. Problemas Identificados na Arquitetura de Informação
1. **Dispersão Espacial (Três Ilhas Isoladas):**
   - **Ilha 1 (Topo):** Banner resumido de histórico longitudinal ginecológico que força clique em link externo ("Ver Ficha Completa ↗") para qualquer consulta ou ajuste de dados prévios.
   - **Ilha 2 (Meio - Bloco 1):** Bloco cinza cru com DUM, checkbox de incerteza, select de vida sexual ativa e dispareunia, e calculadora obstétrica embutida de forma vertical e volumosa.
   - **Ilha 3 (Fundo - Bloco 4):** Seção SOAP tradicional onde o campo `[S] Subjetivo` é uma `textarea` genérica de 3 linhas, desprovida de qualquer contexto ginecológico.
2. **Carga Cognitiva e Digitação Duplicada:**
   - A médica precisa lembrar mentalmente de perguntar: início, relação com a menstruação, uso prévio de medicamentos, características do fluxo/corrimento.
   - Toda queixa precisa ser redigida caractere por caractere, gerando atrito e atraso na fila de atendimento ambulatorial.
3. **Subutilização de Recursos do Backend:**
   - O backend já contempla colunas estruturadas para `chiefComplaint` e `hma` em `GynecologicalConsultationData`, mas o frontend copiava a mesma string bruta para ambos os campos (`chiefComplaint: subjective || null, hma: subjective || null`).
4. **Descompasso Visual com o Design System:**
   - Uso de cores concorrendo com a paleta institucional oficial da Cana Med Mulher (`#005F6A` Petróleo, `#008080` Teal e `#66CDAA` Menta).
   - Falta de contraste semântico entre dados históricos (imutáveis na consulta) e dados dinâmicos do episódio atual.

---

## 3. Direção Visual Proposta

### 3.1. Princípios Estéticos & Atmosfera
- **Clínica de Precisão e Acolhimento:** Cores sóbrias e calmantes baseadas no Verde Água Teal (`#008080`), Azul Petróleo (`#005F6A`) e toques de Menta (`#66CDAA`), transmitindo higiene, segurança técnica, modernidade e cuidado humanizado.
- **Visão em Painel Ergonômico ("Cockpit Clínico"):** As informações críticas ficam visíveis simultaneamente sem exigir rolagem contínua. Elementos secundários colapsam de forma elegante com indicadores visuais expressivos.
- **Microinterações Sutis e Sem Fricção:** Transições suaves de 150ms a 200ms, chips interativos com feedback tátil de foco/seleção e badges de status nítidos.

### 3.2. Hierarquia Visual
- **Nível 1 (Destaque Imediato):** Identificação da Paciente + Resumo Longitudinal em Cartão Compacto ("Ficha Rápida GO") + Queixa Principal Ativa.
- **Nível 2 (Área de Trabalho Ativa):** Editor de HMA Guiada com atalhos de sintomas ginecológicos + Bloco DUM / Ciclo / Calculadora.
- **Nível 3 (Apoio e Contextualização):** Painel colapsável de antecedentes cirúrgicos, ISTs e câncer familiar, além do status de sincronização com o SOAP.

---

## 4. Estrutura e Hierarquia da Página

### 4.1. Layout da Nova "Central de Anamnese Ginecológica"
A nova seção substitui o fragmentado "Bloco 1" e o campo cru de "Subjetivo" do SOAP, apresentando-se em uma arquitetura de cartão unificado e integrado:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🌸 ANAMNESE GINECOLÓGICA INTEGRADA (Episódio Atual)        [👁️ Modo Privacidade] [✏️ Editar Ficha GO] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. MINI-BARRA LONGITUDINAL GO (Snapshot Rápido da Paciente)                           │
│    G2 P1 (1 PC) A0 F1 │ Menarca: 12a │ Ciclo: 28/4d Regular │ Contracepção: DIU Cobre  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. QUEIXA PRINCIPAL (QP) & ATALHOS AMBULATORIAIS RÁPIDOS                               │
│    [ Seleção Rápida em 1 Clique ]:                                                     │
│    [🔍 Rotina / Preventivo]  [🩸 Sangramento Anormal (SUA)]  [⚡ Dor Pélvica / Dismenorreia]  │
│    [💧 Corrimento / Prurido]  [📅 Atraso Menstrual]  [🌀 Inserção/Revisão DIU]            │
│    [🔥 Climatério / Fogachos] [🤰 Suspeita de Gravidez]                                 │
│                                                                                        │
│    Input QP: [ Rotina ginecológica anual e renovação de preventivo                     ]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. HISTÓRIA DA MOLÉSTIA ATUAL (HMA) GUIADA                                              │
│    Inserir Bloco Rápido: [+ Início/Tempo] [+ Relação com Ciclo] [+ Tratamentos Prévios]│
│    ┌──────────────────────────────────────────────────────────────────────────────────┐│
│    │ Paciente em consulta de rotina assintomática. Nega queixas de dor ou corrimento. ││
│    │ Nega intercorrências com o método contraceptivo atual.                           ││
│    └──────────────────────────────────────────────────────────────────────────────────┘│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. CONTROLE MENSTRUAL & DUM CONTEXTUALIZADA                                            │
│    ┌───────────────────────────┬───────────────────────────┬──────────────────────────┐│
│    │ Data da Última Menstruação│ Vida Sexual Ativa         │ Dispareunia              ││
│    │ [ 12/10/2026 ] [📅]       │ (•) Sim, ativa            │ [ Ausente / Sem dor    ▼]││
│    │ [ ] DUM incerta/esquecida │ ( ) Não ativa             │                          ││
│    │ [ ] Climatério/Menopausa  │ ( ) Não informada         │                          ││
│    └───────────────────────────┴───────────────────────────┴──────────────────────────┘│
│    [ Calculadora Obstétrica FEBRASGO: 32s 4d • DPP: 03/07/2027 (Reconciliada por DUM) ] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Especificação dos Componentes

### 5.1. Componente: `QuickChiefComplaintSelector` (Chips Rápidos de Queixa Principal)
- **Função:** Permitir à médica selecionar a queixa clínica predominante com apenas 1 clique ou digitar livremente um motivo customizado.
- **Lista de Chips Padronizados da Ginecologia:**
  1. `Rotina / Preventivo`: Text template: *"Consulta de rotina ginecológica e realização de exames preventivos periódicos."*
  2. `Atraso Menstrual`: Text template: *"Atraso menstrual recente com ciclo previamente regular; investigando possível gestação ou amenorreia secundária."*
  3. `Dor Pélvica / Dismenorreia`: Text template: *"Queixa de dor pélvica/cólica menstrual de intensidade moderada a grave com impacto nas atividades habituais."*
  4. `Corrimento / Prurido`: Text template: *"Corrimento vaginal atípico associado a prurido vulvar, odor desagradável e desconforto local."*
  5. `Sangramento Uterino Anormal (SUA)`: Text template: *"Sangramento uterino anormal fora do período menstrual / fluxo excessivo com eliminação de coágulos."*
  6. `Inserção / Revisão de DIU`: Text template: *"Avaliação para inserção ou revisão periódica de dispositivo intrauterino (fios e posicionamento)."*
  7. `Climatério / Fogachos`: Text template: *"Sintomas climatéricos: queixas de ondas de calor (fogachos), oscilação de humor e irregularidade menstrual."*
  8. `Suspeita de Gravidez`: Text template: *"Atraso menstrual e teste de gravidez domiciliar positivo; cálculo de idade gestacional e pré-natal inicial."*

### 5.2. Componente: `GuidedHmaEditor` (Editor Guiado de História da Moléstia Atual)
- **Função:** Fornecer suporte estruturado para preenchimento de anamnese rápida e qualificada, mantendo a liberdade da digitação livre.
- **Recursos Principais:**
  - **Pílulas de Inserção de Frase Clínica (+ Smart Snippets):**
    - `+ Início/Evolução`: Insere *"Sintomas com início há [X] dias/meses, de evolução progressiva."*
    - `+ Relação com Ciclo`: Insere *"Sintomas com piora perceptível no período pré-menstrual/periovulatório."*
    - `+ Fatores de Melhora/Piora`: Insere *"Refere alívio com analgésicos comuns e repouso. Piora após esforço/relação."*
    - `+ Tratamentos Prévios`: Insere *"Fez uso prévio de medicamentos sem resposta clínica satisfatória."*
    - `+ Nega Sintomas Sistêmicos`: Insere *"Nega febre, disúria, hematúria ou alterações do hábito intestinal."*
  - **Sincronização com o SOAP `[S] Subjetivo`:**
    - O texto final gerado consolida: `Queixa Principal: [QP] | HMA: [HMA] | DUM: [DUM] | Sintomas: [Dispareunia/Vida Sexual]`.

### 5.3. Componente: `GynecologicalProfileSnapshot` (Ficha Longitudinal Embutida)
- **Função:** Trazer a ficha gineco-obstétrica para dentro da visão do atendimento, eliminando a dependência de abas externas.
- **Visualização Primária (Compacta):**
  - Barra superior destacada com pílulas informativas:
    - `Obstétrico`: **G{g} P{p} (PC{pc} A{a} F{f})**
    - `Ciclo`: **{intervalo}d / {duração}d ({regular/irregular})**
    - `Menarca/Sexarca`: **M: {menarca}a • S: {sexarca}a**
    - `Contracepção`: **{método} ({tempo})**
- **Ação Rápida "✏️ Editar Histórico":**
  - Abre modal ou gaveta in-place permitindo atualizar os dados longitudinais imediatamente.

### 5.4. Componente: `MenstrualCycleContextWidget` (DUM, Vida Sexual e Calculadora)
- **Função:** Unificar os dados de ciclo no contexto imediato da consulta.
- **Campos:** DUM, Checkboxes (incerta, menopausa), Vida Sexual Ativa, Dispareunia e Calculadora Obstétrica FEBRASGO integrada.

---

## 6. Tokens e Padrões Visuais

- Primária: `#005F6A` (Petróleo Institucional)
- Acento / Foco: `#008080` (Verde Água Teal)
- Destaque Positivo: `#66CDAA` (Menta)
- Fundo Neutro: `#F7FAFC` e `#FFFFFF`
- Tipografia: Inter / Plus Jakarta Sans
