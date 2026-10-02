# SPEC-0011 — Fechamento de Caixa, Sangria e Conferência por Operador

- **Versão:** 1.0
- **Status:** Implementada
- **Data:** 2026-10-02
- **Autor:** Agente CANAMED
- **Módulos afetados:** `backend/src/Canamed.Domain`, `backend/src/Canamed.Application`, `backend/src/Canamed.Infrastructure`, `backend/src/Canamed.Api`, `frontend/src/features/payments`
- **Relacionados:** [SPEC-0001](0001-spec-de-fundacao.md), [SPEC-0008](0008-spec-fluxo-de-pagamento-e-cobranca.md), [SPEC-UI-001](UI/SPEC-UI-001.md), ADR-0001, ADR-0003, ADR-0008

---

## 1. Objetivo

Fornecer controle financeiro de tesouraria de balcão na clínica através de registro de abertura de turno/caixa, movimentações de **suprimento** (troco inicial), **sangria** (retirada física de dinheiro por segurança) e **fechamento de caixa discriminado por operador** com conferência cega ou comparativa dos valores físicos em espécie vs. sistema.

Esta especificação cumpre o item **B-04** do [backlog](../docs/backlog-proximas-funcionalidades.md).

---

## 2. Contexto e Problema

Com a SPEC-0008 implementada, a recepção registra cobranças por dinheiro, PIX e cartões. Contudo, em clínicas médicas presenciais:
1. O caixa em dinheiro físico (cédulas e moedas) necessita de troco no início da manhã (**suprimento**);
2. Durante o dia, por segurança física contra furtos, o excesso de dinheiro acumulado na gaveta deve ser recolhido para o cofre da administração (**sangria**);
3. No final do expediente de cada recepcionista ou turno, a conferência de caixa precisa confrontar o montante físico contado com o total computado pelo sistema, apurando eventuais sobras ou quebras de caixa com justificativa auditada.

Sem isso, a clínica corre o risco de desvios, erros humanos de troco não detectados e desorganização contábil.

---

## 3. Escopo

### 3.1 Dentro do escopo
- Modelo de domínio `CashRegisterShift` (Turno/Caixa):
  - Identificador da clínica (`clinic_id`) e operador (`operator_id`).
  - Status do caixa: `aberto`, `fechado`.
  - Saldo inicial / suprimento de abertura.
  - Horário de abertura (`opened_at`) e fechamento (`closed_at`).
  - Movimentações de caixa (`CashMovement`):
    - Tipo: `suprimento` (entrada extra de troco) ou `sangria` (retirada para cofre).
    - Valor, motivo obrigatório e data/hora.
  - Fechamento:
    - Valor físico contado em dinheiro informado pelo operador (`declared_cash`).
    - Valor esperado pelo sistema em dinheiro: `saldo_inicial + total_dinheiro_recebido - total_estornos_dinheiro + total_suprimentos - total_sangrias`.
    - Diferença apurada: `declared_cash - expected_cash` (positiva = sobra, negativa = falta/quebra de caixa).
    - Totais do turno em PIX, Cartão Débito, Cartão Crédito e Convênios para conferência de comprovantes.
    - Observações/justificativa de divergência.
- Endpoints de API:
  - `POST /api/v1/cash-register/open` — Abrir caixa com saldo inicial.
  - `POST /api/v1/cash-register/movement` — Registrar sangria ou suprimento.
  - `GET /api/v1/cash-register/current` — Consultar status do caixa ativo do operador com resumo em tempo real.
  - `POST /api/v1/cash-register/close` — Fechar caixa com valor físico informado e emitir relatório de fechamento.
  - `GET /api/v1/cash-register/history` — Consultar histórico de fechamentos da clínica por data/operador.
- Interface visual no Frontend integrada ao painel de pagamentos.
- Trilha de auditoria obrigatória (`AuditActions.CashRegisterOpened`, `AuditActions.CashMovementRegistered`, `AuditActions.CashRegisterClosed`).

### 3.2 Fora do escopo
- Comunicação com gaveta automática via porta serial/USB (comando ESC/POS de abertura de gaveta física).
- Integração bancária direta para recolhimento de carro-forte.

---

## 4. Personas e Permissões

| Papel | Permissões | Ações Permitidas |
| :--- | :--- | :--- |
| **gestor** | `payments:read`, `payments:write`, `cashier:manage` | Abre, movimenta, fecha e visualiza relatórios de fechamento de todos os caixas |
| **recepcionista** | `payments:read`, `payments:write`, `cashier:operate` | Abre, movimenta sangria/suprimento e fecha o seu próprio caixa diário |
| **profissional** | Nenhuma | Não opera caixa |

---

## 5. Regras de Negócio

| # | Regra |
| :--- | :--- |
| RN-001 | Um operador não pode ter mais de um caixa aberto simultaneamente na mesma clínica. |
| RN-002 | Movimentações de sangria não podem exceder o saldo atual em dinheiro físico disponível no caixa. |
| RN-003 | Toda sangria ou suprimento exige justificativa com no mínimo 5 caracteres. |
| RN-004 | Ao fechar o caixa, o sistema calcula a diferença exata entre o dinheiro físico informado e o apurado pelo sistema. |
| RN-005 | Uma vez fechado, o caixa torna-se imutável (nenhuma nova transação ou sangria pode ser vinculada ao caixa encerrado). |
| RN-006 | Pagamentos registrados em dinheiro só podem ser efetuados se houver um caixa aberto pelo operador (ou aviso formal caso o operador trabalhe em modo simplificado). |

---

## 6. Critérios de Aceitação

| # | Critério |
| :--- | :--- |
| CA-001 | Operador consegue abrir um novo turno com suprimento inicial positivo ou zerado. |
| CA-002 | Registrar sangria com valor e justificativa válidos reduzindo o saldo disponível. |
| CA-003 | Rejeitar sangria com valor superior ao saldo físico em dinheiro do caixa (400). |
| CA-004 | Fechar o caixa informando o valor em espécie apurado, calculando corretamente quebra ou sobra. |
| CA-005 | Histórico de caixas encerrados permanece consultável com todos os totais e eventos de auditoria. |
