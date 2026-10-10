# SPEC-0010 — Encaixe e Overbooking com Justificativa na Agenda

- **Versão:** 1.0
- **Status:** Implementada
- **Data:** 2026-10-02
- **Autor:** Agente CANAMED
- **Módulos afetados:** `backend/src/Canamed.Domain`, `backend/src/Canamed.Application`, `backend/src/Canamed.Infrastructure`, `backend/src/Canamed.Api`, `frontend/src/features/agenda`, `frontend/src/features/queue`
- **Relacionados:** [SPEC-0001](0001-spec-de-fundacao.md), [SPEC-0002](0002-spec-agenda-de-consultas.md), [SPEC-0005](0005-spec-fila-de-espera-e-ciclo-de-atendimento.md), [SPEC-UI-001](UI/SPEC-UI-001.md), ADR-0001, ADR-0003, ADR-0008

---

## 1. Objetivo

Permitir o agendamento de consultas em modalidade de **encaixe** (sobreposição autorizada de horário na agenda do profissional de saúde), quando houver necessidade assistencial ou administrativa emergencial (ex.: retorno imediato para leitura de exames, paciente vindo de outra comarca/cidade, urgência clínica do dia).

A funcionalidade resolve a dívida funcional **D-04** e formaliza a reavaliação da decisão **Q-002** da [SPEC-0002](0002-spec-agenda-de-consultas.md).

---

## 2. Contexto e Problema

Na rotina diária de clínicas médicas brasileiras, médicos e recepcionistas frequentemente precisam atender pacientes de encaixe entre consultas normais. Na versão anterior, o sistema impunha bloqueio rígido (`409 Conflict`) perante qualquer sobreposição de horário. Isso forçava os operadores a usarem papel ou anotar em horários fictícios no final do expediente, gerando:
1. Perda de previsibilidade da fila de espera;
2. Inconsistência nos relatórios operacionais e de ocupação;
3. Risco de segurança do paciente por falta de rastreabilidade do motivo do encaixe.

Com esta especificação, o sistema aceita sobreposição controlada se, e somente se, o usuário possuir a permissão adequada (`agenda:overbooking`), marcar a opção de encaixe e fornecer uma **justificativa obrigatória** com no mínimo 5 caracteres.

---

## 3. Escopo

### 3.1 Dentro do escopo
- Campo `isOverbooking` (booleano) e `overbookingReason` (texto, mínimo 5 caracteres) no modelo de domínio de `Appointment`.
- Suporte a encaixe nos endpoints `POST /api/v1/appointments` e `POST /api/v1/appointments/{id}/reschedule`.
- Quando `isOverbooking = true`:
  - Não bloquear por conflito de horário do mesmo profissional (`EnsureRangeIsFree` é ignorado para o profissional, porém continua validando regras da clínica: não agendar no passado, respeitar fechamento de feriados e checar concorrência de sala se especificada).
  - Exigir justificativa com no mínimo 5 caracteres.
- Emissão de evento de auditoria específico `AuditActions.AppointmentOverbooked` (`appointments.overbooked`).
- Exibição de destaque visual (Badge `[ENCAIXE]` em tom âmbar/aviso) na visualização da Agenda e na Fila de Espera.
- Exibição do motivo do encaixe no detalhe da consulta e no tooltip/card.

### 3.2 Fora do escopo
- Limite arbitrário de quantidade máxima de encaixes por profissional (pode ser configurado no futuro por clínica).
- Agendamento de encaixe sem justificativa.

---

## 4. Personas e Permissões

| Papel | Permissão | Ação Permitida |
| :--- | :--- | :--- |
| **gestor** | `agenda:write`, `agenda:overbooking` | Criar e remarcar agendamentos normais e de encaixe |
| **recepcionista** | `agenda:write`, `agenda:overbooking` | Criar e remarcar agendamentos normais e de encaixe |
| **profissional** | `agenda:read` | Visualizar seus agendamentos normais e identificar encaixes |

---

## 5. Regras de Negócio

| # | Regra |
| :--- | :--- |
| RN-001 | O agendamento normal sem a flag `isOverbooking = true` continua sendo estritamente rejeitado com `409 Conflict` em caso de sobreposição. |
| RN-002 | Quando `isOverbooking = true`, o campo `overbookingReason` é estritamente obrigatório e deve ter pelo menos 5 caracteres válidos. |
| RN-003 | Encaixes não podem ser retroativos (a validação contra horários no passado permanece inviolável). |
| RN-004 | Encaixes respeitam dias em que a clínica estiver com fechamento cadastrado (`clinic_closures`). |
| RN-005 | O status de encaixe acompanha a consulta no ciclo de vida (check-in na fila, chamada e atendimento). |
| RN-006 | Toda criação ou remarcação em encaixe gera evento de auditoria com o motivo registrado. |

---

## 6. Contrato de API (`/api/v1`)

### 6.1 Agendar Consulta com Encaixe
`POST /api/v1/appointments`

Payload:
```json
{
  "professionalId": "uuid",
  "patientId": "uuid",
  "appointmentTypeId": "uuid",
  "roomId": "uuid",
  "startsAt": "2026-10-02T14:30:00Z",
  "isOverbooking": true,
  "overbookingReason": "Paciente com resultado de ultrassom urgente"
}
```

Resposta `201 Created` contendo `isOverbooking: true` e `overbookingReason: "..."`.

---

## 7. Critérios de Aceitação

| # | Critério |
| :--- | :--- |
| CA-001 | Agendamento com sobreposição e `isOverbooking = false` deve retornar `409 Conflict`. |
| CA-002 | Agendamento com sobreposição, `isOverbooking = true` e justificativa válida deve retornar `201 Created`. |
| CA-003 | Agendamento com `isOverbooking = true` e justificativa em branco ou menor que 5 caracteres deve retornar `400 Bad Request`. |
| CA-004 | Agendamento de encaixe deve registrar `AppointmentOverbooked` na trilha de auditoria. |
| CA-005 | A listagem do dia da agenda (`GET /api/v1/agenda/day`) e da fila de espera (`GET /api/v1/queue`) deve sinalizar as consultas de encaixe. |
| CA-006 | A interface do frontend deve disponibilizar a opção de marcar encaixe e preencher a justificativa. |

---

## 8. Requisitos Legais e Segurança

- **Auditoria Obrigatória (CFM/LGPD):** A inclusão de encaixes altera a ordem natural de atendimento e deve ficar formalmente registrada com o operador que executou a ação e a justificativa clínica/operacional.
- **Transparência e Priorização:** Pacientes que estejam na fila de espera com triagem ou prioridade legal mantêm a precedência prevista pela Lei nº 10.048/2000.
