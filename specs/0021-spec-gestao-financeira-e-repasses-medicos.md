# SPEC-0021 — Gestão Financeira Avançada e Repasses Médicos

| Campo | Valor |
| :--- | :--- |
| **ID** | SPEC-0021 |
| **Título** | Gestão Financeira da Clínica, Contas a Pagar/Receber e Cálculo Automatizado de Repasse Médico |
| **Status** | Aprovada |
| **Versão** | 1.0 |
| **Data** | 2026-10-03 |
| **Autor** | Antigravity AI / Equipe CANAMED |
| **Revisores** | Responsável pelo Projeto CANAMED |
| **Módulos afetados** | backend (Domain, Application, Infrastructure, Api), frontend (Financeiro / Repasses e DRE), banco de dados (schema `financial`) |
| **ADRs relacionados** | ADR-0003, ADR-0006, ADR-0007, ADR-0008 |

---

## 1. Objetivo

Automatizar o cálculo de honorários e repasses médicos aos profissionais de saúde credenciados na clínica com base nas consultas efetivamente realizadas e pagas, eliminando conferências manuais e divergências em dias de pagamento, além de fornecer uma visão financeira consolidada de contas a pagar, contas a receber e resultado operacional (DRE simplificado) da clínica.

Pergunta de controle do `GEMINI.md`: **isso reduz atrito na rotina da clínica?**  
Sim. O fechamento de repasse médico é um dos processos mais desgastantes da gestão de clínicas de pequeno e médio porte. O sistema calcula automaticamente os percentuais acordados, gera o extrato analítico para o médico conferir e registra a quitação financeira com 1 clique.

---

## 2. Contexto

A clínica atua como prestadora e intermediadora do atendimento. Cada profissional possui um contrato ou acordo comercial que define a divisão dos valores das consultas particulares ou de convênio. Sem um módulo integrado de repasse, a administração precisa cruzar a agenda, as notas fiscais e os comprovantes de caixa no Excel, gastando dias de trabalho ao final de cada mês.

---

## 3. Escopo

### 3.1 Dentro do escopo
- Configuração de regras contratuais de repasse por profissional de saúde:
  - Modalidade **Percentual** (ex: 70% para o profissional, 30% de retenção da clínica);
  - Modalidade **Valor Fixo** (ex: R$ 90,00 por consulta independente do valor cobrado);
- Filtro e consolidação da produção médica por período (semanal, quinzenal ou mensal);
- Exibição de extrato detalhado por consulta (data, paciente, procedimento/especialidade, valor bruto pago, taxa de retenção da clínica, valor líquido a repassar);
- Lançamento de adiantamentos, acréscimos ou deduções operacionais no repasse;
- Liquidação de repasse com registro de data de quitação, meio de pagamento (PIX, TED) e comprovante;
- Módulo simplificado de Contas a Pagar (despesas da clínica: aluguel, luz, insumos) e Contas a Receber (faturas de convênio e particulares pendentes);
- DRE simplificado (Demonstrativo do Resultado do Exercício) com Receita Bruta, Deduções, Repasses Médicos, Despesas Operacionais e Resultado Líquido.

### 3.2 Fora do escopo
- Integração de emissão de NFSe direta com prefeituras (escopo de módulo fiscal posterior);
- Conciliação bancária automática com arquivos OFX/CNAB.

---

## 4. Atores e Permissões

| Ator | Permissão necessária | Observações |
| :--- | :--- | :--- |
| `gestor`, `admin` | `financial:admin`, `payout:manage` | Acesso total ao financeiro, configuração de regras de repasse e liquidação. |
| `profissional` | `payout:view-own` | Pode visualizar exclusivamente o seu próprio extrato de repasse e comprovantes de quitação. |

---

## 5. Regras de Negócio

| ID | Regra | Justificativa / origem |
| :--- | :--- | :--- |
| **RN-001** | **Elegibilidade para Repasse:** Apenas consultas que estejam simultaneamente com status `atendido` (ou `finalizado`) na agenda e com faturamento `pago` na [SPEC-0008](0008-spec-fluxo-de-pagamento-e-cobranca.md) entram no cálculo do repasse. Consultas canceladas ou com pagamento pendente não geram repasse. | Princípio financeiro de competência e caixa. |
| **RN-002** | **Não Duplicação de Pagamento:** Uma consulta já liquidada em um lote de repasse não pode ser computada em lotes posteriores. | Integridade contábil. |
| **RN-003** | **Segregação de Acesso:** O profissional de saúde nunca visualiza os valores de repasse, percentuais ou faturamento de outros médicos da clínica. | Confidencialidade comercial e ética médica. |
| **RN-004** | **Imutabilidade de Lote Liquidado:** Lotes de repasse marcados como `liquidado` não podem ter itens alterados ou removidos; qualquer correção posterior deve ser lançada como ajuste avulso em novo lote. | Rastreabilidade e conformidade fiscal. |

---

## 6. Fluxos

### 6.1 Geração de Lote de Repasse Médico
1. Gestor acessa `Financeiro > Repasses Médicos`.
2. Seleciona a clínica, o médico e o período de competência (ex: 01/10/2026 a 31/10/2026).
3. O sistema calcula a produção elegível, aplica as regras contratuais do profissional e apresenta o resumo (Quantidade de consultas, Total Bruto, Retenção da Clínica, Valor a Repassar).
4. Gestor clica em "Gerar Lote de Repasse".
5. O lote fica em status `aberto` para conferência do gestor e do profissional.

### 6.2 Liquidação do Repasse
1. Após a realização da transferência bancária/PIX, o gestor acessa o lote e clica em "Registrar Liquidação".
2. Informa data de pagamento e código/comprovante da transação.
3. O sistema altera o status para `liquidado`, gera lançamento automático no contas a pagar/saídas da clínica e notifica o médico em seu painel.

---

## 7. Critérios de Aceitação

- [x] Regras de repasse (percentual e fixo) são configuráveis por profissional de saúde.
- [x] Consultas atendidas e pagas são computadas com precisão centesimal.
- [x] Médico consegue visualizar seu extrato transparente no perfil profissional.
- [x] Quitação de lote bloqueia duplicidade e alimenta o demonstrativo de resultado da clínica.
- [x] DRE simplificado exibe faturamento, repasses, despesas e saldo líquido por competência.

---

## 8. Requisitos de Segurança e Legais

- **Segregação de Sigilo:** Restrição total de dados de faturamento entre profissionais autônomos.
- **Auditoria:** Registro indelével de quem gerou, conferiu e liquidou cada repasse médico.
