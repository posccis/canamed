# SPEC-0022 — Gestão de Insumos e Materiais Médicos (Estoque Clínico)

| Campo | Valor |
| :--- | :--- |
| **ID** | SPEC-0022 |
| **Título** | Controle de Estoque de Insumos, Materiais Médicos, Medicamentos e Descartáveis |
| **Status** | Implementada |
| **Versão** | 1.0 |
| **Data** | 2026-10-03 |
| **Autor** | Antigravity AI / Equipe CANAMED |
| **Revisores** | Responsável pelo Projeto CANAMED |
| **Módulos afetados** | backend (Domain, Application, Infrastructure, Api), frontend (Gestão Operacional / Estoque), banco de dados (schema `inventory`) |
| **ADRs relacionados** | ADR-0003, ADR-0006, ADR-0007, ADR-0008 |

---

## 1. Objetivo

Fornecer um controle ágil, direto e sem burocracias desnecessárias para o gerenciamento de insumos médicos, medicamentos básicos de sala de curativos, EPIs e descartáveis consumidos na rotina da clínica, com rastreabilidade de entradas e saídas, controle de ponto de reposição (estoque mínimo) e alertas de lotes com validade próxima do vencimento (ANVISA).

Pergunta de controle do `GEMINI.md`: **isso reduz atrito na rotina da clínica?**  
Sim. Evita faltas imprevistas de materiais essenciais no meio de consultas e procedimentos, previne o descarte de medicamentos por vencimento esquecido no armário e elimina planilhas paralelas de controle de almoxarifado.

---

## 2. Contexto

Consultórios e salas de triagem demandam constante reposição de agulhas, seringas, luvas, gazes, fitas de glicemia e soluções antissépticas. Em clínicas de médio porte, a falta de controle resulta em compras urgentes e caras de última hora ou uso inadvertently de itens vencidos, o que representa grave risco sanitário perante a Vigilância Sanitária (ANVISA).

---

## 3. Escopo

### 3.1 Dentro do escopo
- Cadastro de materiais e insumos da clínica:
  - Nome do produto;
  - Categoria (`Descartáveis`, `Medicamentos`, `Curativos`, `EPIs / Higiene`, `Odonto / Instrumental`);
  - Unidade de medida (`unidade`, `caixa`, `frasco`, `pacote`, `ampola`);
  - Quantidade em estoque atual;
  - Estoque mínimo recomendado (ponto de ressuprimento);
  - Identificação de Lote e Data de Validade;
- Registro de Movimentações:
  - **Entrada:** Reposição por compra com data, quantidade, custo unitário opcional e fornecedor;
  - **Saída:** Consumo em procedimento/atendimento, transferência interna ou perda/descarte por avaria;
- Painel de Alertas Operacionais:
  - Indicador de itens em "Estoque Crítico" (abaixo do estoque mínimo);
  - Indicador de itens "Próximos ao Vencimento" (vencem em até 30 dias) e "Vencidos" (com destaque em vermelho);
- Trilha de auditoria das movimentações com identificação do colaborador responsável, data/hora e justificativa.

### 3.2 Fora do escopo
- Módulo complexo de cotação com múltiplos fornecedores e leilão reverso (fora do foco de clínicas ágeis);
- Dispensação de farmácia hospitalar de alta complexidade com rastreabilidade por código de barras unitário Datamatrix (escopo hospitalar).

---

## 4. Atores e Permissões

| Ator | Permissão necessária | Observações |
| :--- | :--- | :--- |
| `recepcionista`, `profissional` | `inventory:read`, `inventory:movement` | Pode consultar saldo e registrar saídas de materiais consumidos. |
| `gestor`, `admin` | `inventory:admin` | Pode cadastrar novos itens, registrar compras de entrada, ajustar inventário e auditar perdas. |

---

## 5. Regras de Negócio

| ID | Regra | Justificativa / origem |
| :--- | :--- | :--- |
| **RN-001** | **Não Negatividade de Saldo:** O sistema não permite saídas que resultem em saldo negativo de estoque. Se houver discrepância física, o gestor deve registrar um ajuste formal de inventário com justificativa auditada. | Integridade contábil e de controle de ativos. |
| **RN-002** | **Alerta Obrigatório de Validade (ANVISA):** Medicamentos e insumos com data de validade expirada exibem alerta crítico de bloqueio para prevenir uso acidental em pacientes. | Boas Práticas Farmacêuticas e Sanitárias (ANVISA). |
| **RN-003** | **Cálculo Automático de Status:** O status do item é dinamicamente classificado em: `Normal`, `Abaixo do Mínimo`, `Próximo do Vencimento` (≤ 30 dias) ou `Vencido`. | Prevenção proativa de rupturas e desperdícios. |
| **RN-004** | **Auditoria de Descartes:** Toda saída classificada como "Perda / Descarte" exige campo de justificativa obrigatório (mínimo de 5 caracteres). | Prevenção de extravios e controle patrimonial. |

---

## 6. Fluxos

### 6.1 Cadastro e Entrada de Estoque
1. Gestor clica em "Novo Insumo" ou "Registrar Entrada".
2. Seleciona o item, informa quantidade recebida, lote, validade e custo unitário.
3. O sistema atualiza o saldo da clínica, recalcula os alertas e registra o histórico de movimentação.

### 6.2 Baixa de Material Consumido
1. Profissional ou recepcionista acessa `Estoque > Dar Baixa`.
2. Localiza o insumo (ex: "Gaze Estéril 7.5x7.5"), informa quantidade consumida (ex: 3 unidades) e o motivo (ex: "Consumo em procedimento").
3. O sistema deduz imediatamente do saldo e registra a data/hora e o operador.

---

## 7. Critérios de Aceitação

- [x] Cadastro de materiais com nome, categoria, unidade, lote, validade e estoque mínimo.
- [x] Movimentações de entrada e saída com validação de saldo não negativo.
- [x] Alertas visuais destacados no painel para itens abaixo do mínimo e vencendo.
- [x] Registro detalhado de histórico com usuário, quantidade, tipo de movimentação e motivo.

---

## 8. Requisitos de Segurança e Legais

- **Vigilância Sanitária:** Atendimento às normas de controle de validade e descarte seguro de produtos de saúde.
- **Rastreabilidade:** Nenhuma movimentação física ocorre sem vínculo ao usuário autenticado que a registrou.
