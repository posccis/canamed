# SPEC-0007 — Painel Gerencial e Indicadores Operacionais (Dashboard)

- **Versão:** 1.0
- **Status:** Aprovada
- **Data:** 2026-10-01
- **Autor:** Agente CANAMED
- **Relacionados:** [SPEC-0002](0002-spec-agenda-de-consultas.md), [SPEC-0005](0005-spec-fila-de-espera-e-ciclo-de-atendimento.md), [SPEC-0006](0006-spec-gestao-operacional-da-clinica.md), [SPEC-UI-001](UI/SPEC-UI-001.md), ADR-0008

## 1. Objetivo

Fornecer aos gestores, recepcionistas e profissionais de saúde uma visão consolidada, acionável e em tempo real dos indicadores operacionais da clínica — agendamentos do dia, faltas, cancelamentos, pacientes na fila de espera, tempo médio de espera e ocupação de salas e profissionais. Esta SPEC entrega o item **P-05** do [backlog](../docs/backlog-proximas-funcionalidades.md) e materializa a seção 7 da [SPEC-UI-001](UI/SPEC-UI-001.md).

## 2. Contexto

A clínica possui agendamento de consultas (SPEC-0002), fila de espera (SPEC-0005) e gestão de salas/convênios (SPEC-0006). Contudo, a recepção e a gestão precisavam navegar entre múltiplas telas para saber:
- Quantos pacientes compareceram hoje e quantos faltaram;
- Quantos pacientes aguardam na recepção e há quanto tempo;
- Quais profissionais e salas estão com maior demanda;
- Quais são os próximos atendimentos imediatos.

O Dashboard operacional unifica esses indicadores em um único ponto de partida, permitindo intervenções rápidas (ex.: remanejamento de horários ou priorização de chamadas).

## 3. Escopo

### 3.1 Dentro do escopo

- Endpoint consolidado `GET /api/v1/dashboard/summary?date=YYYY-MM-DD` com isolamento estrito por `clinic_id`.
- Indicadores agregados do dia:
  - Total de agendamentos, confirmados, atendidos, faltas e cancelados.
  - Taxa de comparecimento e taxa de faltas (no-show).
  - Status da fila de espera: pacientes aguardando, em atendimento, atendidos e tempo médio de espera em minutos.
  - Produção agregada por profissional (total agendado, atendido e faltas).
  - Ocupação de salas (agendamentos por sala).
  - Próximos atendimentos agendados do dia.
- Interface visual no frontend (`DashboardPanel`), com cards de indicadores (KPIs), pulso operacional, alertas de tempo de espera e atalhos rápidos.

### 3.2 Fora do escopo

- Relatórios financeiros complexos, DRE e fluxo de caixa (pertencem ao pilar financeiro P-04).
- Exportação em PDF/Excel (pertence à evolução futura de relatórios).
- Métricas clínicas de diagnóstico ou desfecho de saúde (o CANAMED permanece no escopo administrativo/gestão).

## 4. Personas e permissões

| Papel | Permissão | Acesso |
| :--- | :--- | :--- |
| **gestor** | `dashboard:read` | Visão completa de todos os profissionais, salas e fila da clínica |
| **recepcionista** | `dashboard:read` | Visão operacional completa para conduzir o fluxo diário |
| **profissional** | `dashboard:read` | Visão operacional da clínica |

Permissão nova:
- `dashboard:read` — concedida aos papéis `gestor`, `recepcionista` e `profissional`.

## 5. Regras de negócio

| # | Regra |
| :--- | :--- |
| RN-001 | O resumo operacional é sempre restrito à clínica (`clinic_id`) autenticada na sessão. |
| RN-002 | Quando o parâmetro `date` não é informado na requisição, assume-se a data corrente no fuso horário da clínica (`America/Fortaleza`). |
| RN-003 | O tempo médio de espera é calculado com base nas entradas da fila com status `atendido` ou `em_atendimento` na data, medindo o intervalo entre `arrived_at` e `called_at`. |
| RN-004 | Pacientes que deixaram a fila (`saiu`) ou cancelamentos não são contabilizados como tempo de espera atendido. |
| RN-005 | O cálculo de taxas percentuais é protegido contra divisão por zero, retornando 0% caso não haja registros no dia. |
| RN-006 | Os indicadores operacionais não expõem dados clínicos ou prontuário; preservam o princípio da minimização da LGPD. |

## 6. Fluxos

### F-001 — Consulta do Painel do Dia

1. O usuário acessa a plataforma; a visualização padrão ou o módulo "Dashboard" é selecionado.
2. O frontend requisita `GET /api/v1/dashboard/summary?date=YYYY-MM-DD`.
3. O backend computa os indicadores agregados do dia a partir dos repositórios de agenda, fila e clínicas.
4. O frontend renderiza:
   - Cards de resumo: Total de Agendamentos, Atendidos, Faltas, Na Fila de Espera, Tempo Médio de Espera.
   - Lista rápida dos próximos atendimentos.
   - Distribuição de atendimentos por profissional.
   - Distribuição de ocupação por sala.
5. O usuário pode alternar a data para inspecionar dias anteriores ou futuros.

## 7. Contrato de API (`/api/v1`)

```http
GET /api/v1/dashboard/summary?date=2026-10-05
X-Canamed-Clinic-Id: {clinic_id}
```

**Resposta 200 OK:**
```json
{
  "date": "2026-10-05",
  "totalAppointments": 12,
  "scheduledCount": 4,
  "confirmedCount": 2,
  "attendedCount": 5,
  "noShowCount": 1,
  "cancelledCount": 0,
  "attendanceRate": 83.3,
  "queueWaitingCount": 3,
  "queueInServiceCount": 1,
  "queueCompletedCount": 5,
  "averageWaitMinutes": 14.5,
  "professionals": [
    {
      "professionalId": "uuid",
      "professionalName": "Dra. Ana Silva",
      "totalAppointments": 7,
      "attendedCount": 3,
      "noShowCount": 1
    }
  ],
  "rooms": [
    {
      "roomId": "uuid",
      "roomName": "Consultório 01",
      "appointmentsCount": 6
    }
  ],
  "upcomingAppointments": [
    {
      "id": "uuid",
      "patientName": "Carlos Souza",
      "professionalName": "Dra. Ana Silva",
      "appointmentTypeName": "Consulta Inicial",
      "startsAt": "2026-10-05T14:00:00Z",
      "endsAt": "2026-10-05T14:30:00Z",
      "roomName": "Consultório 01",
      "status": "agendado"
    }
  ]
}
```

## 8. Critérios de aceitação

| # | Critério |
| :--- | :--- |
| CA-001 | Consultar resumo diário retornando contagens corretas de agendamentos por status. |
| CA-002 | Retornar métricas da fila de espera do dia (aguardando, em atendimento e tempo médio). |
| CA-003 | Retornar detalhamento por profissional e ocupação por salas. |
| CA-004 | Isolar completamente os dados por clínica (dados de outra clínica não aparecem no resumo). |
| CA-005 | Calcular corretamente taxas operacionais sem erro de divisão por zero. |
| CA-006 | Usuário sem permissão recebe HTTP 403 Forbidden. |

## 9. Requisitos de segurança e conformidade

- **Segurança:** Autenticação forte via sessão; autorização via permissão `dashboard:read`.
- **Isolamento Multi-tenant:** Filtro obrigatório por `clinic_id`.
- **LGPD:** Apenas dados minimizados de identificação operacional (nome do paciente para fila do dia) são retornados; nenhum dado de prontuário, diagnóstico ou anamnese é exposto.

## 10. Histórico de revisões

| Versão | Data | Alteração |
| :--- | :--- | :--- |
| 1.0 | 2026-10-01 | Criação da especificação do Dashboard Operacional (P-05 do backlog). |
