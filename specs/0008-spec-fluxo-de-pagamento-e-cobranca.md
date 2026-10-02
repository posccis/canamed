# SPEC-0008 — Fluxo de Pagamento e Cobrança no Balcão

- **Versão:** 1.0
- **Status:** Aprovada
- **Data:** 2026-10-01
- **Autor:** Agente CANAMED
- **Relacionados:** [SPEC-0001](0001-spec-de-fundacao.md), [SPEC-0002](0002-spec-agenda-de-consultas.md), [SPEC-0004](0004-spec-catalogo-e-classificacao-das-consultas.md), [SPEC-0005](0005-spec-fila-de-espera-e-ciclo-de-atendimento.md), [SPEC-0006](0006-spec-gestao-operacional-da-clinica.md), [SPEC-UI-001](UI/SPEC-UI-001.md), ADR-0001, ADR-0003

## 1. Objetivo

Fornecer um fluxo ágil, seguro e integrado para registrar a cobrança e o pagamento de atendimentos no balcão da clínica antes ou no momento da consulta. Esta especificação atende ao pilar fundamental previsto no briefing do CANAMED ("fluxo de pagamento antes da consulta quando aplicável") e entrega o item **P-04** do [backlog](../docs/backlog-proximas-funcionalidades.md).

## 2. Contexto e Problema

Em clínicas médicas de pequeno e médio porte, a cobrança é frequentemente tratada de forma desconectada da agenda e da recepção — recepcionistas usam cadernos, planilhas paralelas ou maquininhas de cartão sem conciliação com o agendamento. Isso acarreta:
1. Insegurança operacional: consultas realizadas sem confirmação prévia de pagamento particular ou autorização do convênio;
2. Dificuldade de conferência de caixa no fechamento do dia da recepção;
3. Filas e retrabalho na recepção por falta de visualização clara do status financeiro (`Pendente`, `Pago`, `Isento/Conveniado`).

Com esta funcionalidade, a recepção tem controle imediato do status financeiro de cada agendamento, emitindo recibos, registrando o meio de pagamento e garantindo idoneidade com trilha de auditoria e proteção contra cobranças em duplicidade.

## 3. Escopo

### 3.1 Dentro do escopo

- Gestão do status financeiro do agendamento: `pendente`, `pago`, `isento`, `estornado`.
- Registro de transação de pagamento no balcão (`POST /api/v1/payments`):
  - Formas de pagamento: `dinheiro`, `pix`, `cartao_debito`, `cartao_credito`, `convenio_faturado`.
  - Suporte a valor pago, descontos concedidos com justificativa e observações.
  - Chave de idempotência (`Idempotency-Key` ou campo payload) para evitar dupla cobrança por duplo clique.
- Estorno/cancelamento de pagamento com registro de justificativa (`POST /api/v1/payments/{id}/refund`).
- Consulta de transações e histórico financeiro por agendamento (`GET /api/v1/payments/appointment/{appointmentId}`).
- Resumo financeiro diário por forma de pagamento para fechamento de caixa do balcão (`GET /api/v1/payments/summary?date=YYYY-MM-DD`).
- Emissão de comprovante/recibo com dados essenciais da clínica, paciente, profissional, valor e meio de pagamento.
- Exibição de indicador (badge) de status financeiro na Agenda e na Fila de Espera.
- Trilha de auditoria obrigatória (`AuditActions.PaymentReceived`, `AuditActions.PaymentRefunded`).

### 3.2 Fora do escopo

- Integração direta via webhooks com adquirentes reais de cartão (Cielo, Stone, PagBank) — neste estágio, utiliza-se adaptador simulado (mock) conforme definido na tabela de integrações do backlog.
- Emissão direta de Nota Fiscal de Serviço Eletrônica (NFS-e) junto a prefeituras municipais (escopo futuro).
- Conciliação bancária automatizada via OFX/Open Finance.

## 4. Personas e Permissões

| Papel | Permissões | Ações Permitidas |
| :--- | :--- | :--- |
| **gestor** | `payments:read`, `payments:write`, `payments:refund` | Consulta pagamentos, registra recebimentos, realiza estornos e visualiza fechamento de caixa |
| **recepcionista** | `payments:read`, `payments:write` | Consulta pagamentos, registra recebimentos no balcão e emite recibos |
| **profissional** | `payments:read` | Visualiza se a consulta de seu paciente foi quitada/autorizada |

## 5. Regras de Negócio

| # | Regra |
| :--- | :--- |
| RN-001 | Toda operação financeira é estritamente isolada pela clínica ativa (`clinic_id`). |
| RN-002 | O valor da transação deve ser positivo (> 0), exceto quando o agendamento for expressamente classificado como `isento` ou `convenio_faturado`. |
| RN-003 | Agendamentos com convênio de saúde cadastrado podem ser marcados como `convenio_faturado` com valor R$ 0,00 ou valor de coparticipação. |
| RN-004 | Uma transação já paga não pode ser paga novamente sem que haja saldo devedor remanescente ou estorno prévio. |
| RN-005 | O registro de pagamento atualiza o status de pagamento do agendamento para `pago` (ou `isento`). |
| RN-006 | Em caso de cancelamento do agendamento com pagamento efetuado, o sistema alerta a necessidade de estorno financeiro. |
| RN-007 | O estorno exige permissão `payments:refund` e justificativa obrigatória com no mínimo 5 caracteres. |
| RN-008 | Nunca armazenar dados sensíveis de cartão (PAN completo, CVV ou dados de trilha) — em conformidade com PCI-DSS e LGPD. Apenas bandeira e últimos 4 dígitos são opcionais para conciliação. |
| RN-009 | Todas as operações de pagamento e estorno geram eventos no log de auditoria com identificação do operador, data/hora e valores. |

## 6. Fluxos de Uso

### F-001 — Pagamento no Check-in ou Agendamento Particular
1. A recepcionista visualiza o agendamento na Agenda ou na Fila com indicador `Pendente`.
2. A recepcionista clica em "Registrar Pagamento" / "Cobrança".
3. O modal exibe os dados do paciente, tipo de consulta, valor sugerido e as opções de pagamento (`Dinheiro`, `PIX`, `Cartão Débito`, `Cartão Crédito`, `Convênio`).
4. A recepcionista seleciona o meio, digita o valor recebido e clica em "Confirmar Recebimento".
5. O sistema grava a transação com idempotência, atualiza o status do agendamento para `Pago`, audita a operação e disponibiliza a visualização/impressão do recibo.
6. A tela da Agenda e da Fila atualizam o status visual para `Pago`.

### F-002 — Estorno de Pagamento
1. Em caso de desistência ou cobrança indevida, o gestor localiza o pagamento associado.
2. Clica em "Estornar Pagamento" e preenche a justificativa.
3. O sistema marca a transação como `estornado`, retorna o agendamento para `estornado` ou `pendente`, audita a ação e exibe comprovante de estorno.

## 7. Contrato de API (`/api/v1`)

### 7.1 Registrar Pagamento
`POST /api/v1/payments`
Headers: `X-Canamed-Clinic-Id: {clinic_id}`, `Idempotency-Key: {guid}` (opcional)

```json
{
  "appointmentId": "uuid",
  "amount": 250.00,
  "paymentMethod": "pix", // dinheiro | pix | cartao_debito | cartao_credito | convenio_faturado
  "cardBrand": "Mastercard", // opcional
  "cardLastFourDigits": "1234", // opcional
  "notes": "Pago via chave PIX CNPJ no balcão" // opcional
}
```

**Resposta 201 Created:**
```json
{
  "id": "uuid",
  "clinicId": "uuid",
  "appointmentId": "uuid",
  "patientId": "uuid",
  "patientName": "João da Silva",
  "amount": 250.00,
  "paymentMethod": "pix",
  "status": "pago",
  "cardBrand": "Mastercard",
  "cardLastFourDigits": "1234",
  "paidAt": "2026-10-01T14:30:00Z",
  "operatorId": "uuid",
  "notes": "Pago via chave PIX CNPJ no balcão"
}
```

### 7.2 Estornar Pagamento
`POST /api/v1/payments/{id}/refund`
```json
{
  "reason": "Paciente precisou remarcar e solicitou estorno do PIX"
}
```

### 7.3 Consultar Pagamentos do Agendamento
`GET /api/v1/payments/appointment/{appointmentId}`
Retorna a lista de transações registradas para o agendamento.

### 7.4 Fechamento Diário de Caixa do Balcão
`GET /api/v1/payments/summary?date=YYYY-MM-DD`
Retorna totais consolidados por forma de pagamento (Dinheiro, PIX, Cartão, Convênio) e total geral recebido no dia.

## 8. Critérios de Aceitação

| # | Critério |
| :--- | :--- |
| CA-001 | Registrar pagamento particular com sucesso para agendamento existente na mesma clínica. |
| CA-002 | Impedir pagamento de agendamento pertencente a outra clínica (404/403). |
| CA-003 | Registrar pagamento por convênio (`convenio_faturado`) com valor zerado ou parcial. |
| CA-004 | Rejeitar pagamento com valor negativo ou igual a zero quando o meio for dinheiro/pix/cartão (400). |
| CA-005 | Estornar pagamento existente com registro de motivo válido. |
| CA-006 | Impedir estorno por usuário sem a permissão `payments:refund` (403). |
| CA-007 | Retornar resumo de fechamento de caixa do dia com soma correta por meio de pagamento. |
| CA-008 | Emitir comprovante legível com dados da clínica, paciente e transação. |

## 9. Requisitos de Segurança e Conformidade

- **PCI-DSS:** Nenhum dado sensível de titular de cartão (PAN completo, CVV) é recebido ou armazenado.
- **LGPD:** Acesso restrito por papéis autorizados; apenas operadores da clínica logada acessam valores e recibos.
- **Auditoria:** Gravação de `payments.received` e `payments.refunded` no repositório de auditoria imutável.
