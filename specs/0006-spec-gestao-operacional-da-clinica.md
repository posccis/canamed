# SPEC-0006 — Gestão Operacional da Clínica

- **Versão:** 1.0
- **Status:** Aprovada
- **Data:** 2026-10-01
- **Autor:** Agente CANAMED
- **Relacionados:** [SPEC-0002](0002-spec-agenda-de-consultas.md), [SPEC-0004](0004-spec-catalogo-e-classificacao-das-consultas.md), ADR-0007, ADR-0008

## 1. Objetivo

Completar o cadastro operacional da clínica — convênios, salas, horários de funcionamento e feriados —
e ampliar o cadastro de profissionais e pacientes, de modo que a agenda passe a respeitar a realidade de
funcionamento da clínica e a ocupação de salas. Esta SPEC resolve a pendência **P-005** da
[SPEC-0002](0002-spec-agenda-de-consultas.md) e entrega o item **P-06** do
[backlog](../docs/backlog-proximas-funcionalidades.md).

## 2. Contexto

A agenda atual (SPEC-0002) e o catálogo assistencial (SPEC-0004) permitem agendar por profissional, tipo de
consulta, natureza e custeio, mas:

- não existe cadastro de convênios, embora o custeio `plano_saude` já exista;
- não existe cadastro de salas, apesar de o `PROJECT_BRIEF.md` citar "organização de horários,
  profissionais e salas" como pilar;
- a clínica não declara horário de funcionamento nem feriados, de modo que o bloqueio de agenda
  (SPEC-0002, RN-011) é o único mecanismo de indisponibilidade;
- o cadastro de profissional não guarda registro profissional (CRM) e o de paciente não guarda documento
  nem convênio, o que hoje impede conferência administrativa e faturamento.

## 3. Escopo

### 3.1 Dentro do escopo

- Cadastro de **convênios** (nome e código ANS opcional), com ativação/desativação.
- Cadastro de **salas**, com ativação/desativação.
- Cadastro de **horário de funcionamento** por dia da semana, com múltiplos intervalos por dia.
- Cadastro de **feriados/exceções** por data, com descrição.
- Ampliação do **profissional** com registro profissional (CRM) e do **paciente** com documento e convênio.
- Vínculo opcional de **sala** ao agendamento, com bloqueio de conflito de sala.
- Validação do agendamento contra o horário de funcionamento e o calendário de feriados da clínica.
- Aba **Operação** no frontend para toda a manutenção acima.

### 3.2 Fora do escopo

- Equipamentos, telemedicina e agenda por sala (a sala é um atributo do agendamento).
- Tabela de preços por convênio e faturamento/TISS (pertence a P-04 e a uma SPEC de faturamento futura).
- Sincronização automática de feriados nacionais (entram por cadastro manual).
- Dados clínicos de paciente, que pertencem ao prontuário (P-08).

## 4. Personas e permissões

| Papel | Pode |
| :--- | :--- |
| **gestor** | Tudo nesta SPEC |
| **recepcionista** | Consultar convênios, salas, horários e feriados; escolher sala ao agendar |
| **profissional** | Consultar convênios, salas, horários e feriados da própria clínica |

Permissões novas:

- `clinic:read` — consulta de convênios, salas, horários e feriados. Concedida a todos os papéis.
- `clinic:manage` — manutenção de convênios, salas, horários e feriados. Exclusiva do **gestor**.

## 5. Regras de negócio

| # | Regra |
| :--- | :--- |
| RN-001 | O nome do convênio é único por clínica, sem diferenciar maiúsculas/minúsculas. |
| RN-002 | O nome da sala é único por clínica, sem diferenciar maiúsculas/minúsculas. |
| RN-003 | Convênio com paciente ativo vinculado não pode ser desativado. |
| RN-004 | Sala com agendamento ativo futuro não pode ser desativada. |
| RN-005 | O horário de funcionamento exige `início < fim`; intervalos do mesmo dia não podem se sobrepor. |
| RN-006 | A data do feriado é única por clínica. |
| RN-007 | Quando a clínica possui horário de funcionamento cadastrado para o dia da semana do agendamento, o intervalo do agendamento precisa estar contido em um dos intervalos do dia. |
| RN-008 | Agendamento em data marcada como feriado/exceção é recusado. |
| RN-009 | Clínica sem horário de funcionamento cadastrado permanece sem restrição de horário (compatibilidade com o comportamento atual). |
| RN-010 | A sala informada precisa existir, estar ativa e pertencer à clínica da sessão. |
| RN-011 | Dois agendamentos ativos do mesmo profissional não podem ocupar a mesma sala em horários sobrepostos. |
| RN-012 | A desativação de convênio, sala, horário ou feriado é lógica (ativação/desativação), preservando histórico. |
| RN-013 | Toda alteração emite evento de auditoria com usuário, clínica, ação e recurso. |
| RN-014 | Documento do paciente e registro profissional são dados pessoais: nunca aparecem em log e são normalizados (somente dígitos) quando aplicável. |

## 6. Fluxos

### F-001 — Manter convênios e salas

1. O gestor abre a aba **Operação** e escolhe a seção de convênios ou salas.
2. Cadastra, renomeia e ativa/desativa itens.
3. O sistema recusa nome duplicado e desativação com vínculo ativo (convênio) ou agenda futura (sala).

### F-002 — Definir horário de funcionamento e feriados

1. O gestor cadastra intervalos por dia da semana (ex.: segunda a sexta, 08:00–12:00 e 14:00–18:00).
2. O gestor cadastra feriados com data e descrição.
3. A agenda passa a recusar agendamentos fora do funcionamento e em feriados.

### F-003 — Agendar com sala

1. A recepção escolhe profissional, tipo, paciente e, opcionalmente, sala.
2. O sistema valida horário de funcionamento, feriado e conflito de sala.
3. O agendamento é criado com a sala e a agenda exibe a sala escolhida.

### F-004 — Cadastro ampliado

1. O gestor cadastra profissional com registro profissional e paciente com documento e convênio.
2. A agenda e a recepção exibem os novos dados quando aplicável.

## 7. Modelo de dados

| Tabela | Colunas principais |
| :--- | :--- |
| `health_plans` | `id`, `clinic_id`, `name`, `ans_code` (nulo), `is_active`, timestamps |
| `rooms` | `id`, `clinic_id`, `name`, `is_active`, timestamps |
| `operating_hours` | `id`, `clinic_id`, `day_of_week` (0–6), `starts_at` (time), `ends_at` (time), timestamps |
| `clinic_closures` | `id`, `clinic_id`, `date` (date), `description`, timestamps |
| `professionals` | + `registration_number` (nulo) |
| `patients` | + `document` (nulo), `health_plan_id` (nulo, FK) |
| `appointments` | + `room_id` (nulo, FK) |

Convenções da [SPEC-0001](0001-spec-de-fundacao.md): UUID, `snake_case`, timestamps UTC.
Restrições de verificação: `ck_operating_hours_period_valid` (`ends_at > starts_at`),
`ck_operating_hours_day_valid` (`day_of_week BETWEEN 0 AND 6`).

## 8. Contrato de API (`/api/v1`)

| Método | Rota | Permissão |
| :--- | :--- | :--- |
| GET | `/health-plans` | `clinic:read` |
| POST | `/health-plans` | `clinic:manage` |
| POST | `/health-plans/{id}` | `clinic:manage` |
| POST | `/health-plans/{id}/deactivate` | `clinic:manage` |
| POST | `/health-plans/{id}/activate` | `clinic:manage` |
| GET | `/rooms` | `clinic:read` |
| POST | `/rooms` | `clinic:manage` |
| POST | `/rooms/{id}` | `clinic:manage` |
| POST | `/rooms/{id}/deactivate` | `clinic:manage` |
| POST | `/rooms/{id}/activate` | `clinic:manage` |
| GET | `/operating-hours` | `clinic:read` |
| PUT | `/operating-hours` | `clinic:manage` |
| GET | `/clinic-closures` | `clinic:read` |
| POST | `/clinic-closures` | `clinic:manage` |
| DELETE | `/clinic-closures/{id}` | `clinic:manage` |

Rotas alteradas: `POST /appointments` e `POST /appointments/{id}/reschedule` aceitam `roomId` opcional e
passam a validar funcionamento, feriado e conflito de sala. `POST /professionals` e `POST /patients`
aceitam os novos campos.

## 9. UX

- Nova aba **Operação** (visível ao gestor; consulta liberada aos demais papéis), com seções Convênios,
  Salas, Funcionamento e Feriados.
- Agenda: seletor de sala no formulário de agendamento e exibição da sala no cartão do agendamento.
- Mensagens claras em português para cada caso de erro.

## 10. Critérios de aceitação

| # | Critério |
| :--- | :--- |
| CA-001 | Cadastrar convênio, renomear e desativar; nome duplicado é recusado com 409. |
| CA-002 | Convênio com paciente ativo não pode ser desativado (409). |
| CA-003 | Cadastrar sala, renomear e desativar; sala com agendamento futuro não pode ser desativada (409). |
| CA-004 | Definir horário de funcionamento com múltiplos intervalos e listá-lo. |
| CA-005 | Recusar agendamento fora do funcionamento da clínica (409 `outside-operating-hours`). |
| CA-006 | Recusar agendamento em feriado (409 `clinic-closed`). |
| CA-007 | Clínica sem funcionamento cadastrado continua aceitando qualquer horário. |
| CA-008 | Recusar conflito de sala entre dois agendamentos ativos (409 `room-conflict`). |
| CA-009 | Agendar com sala ativa e exibi-la na listagem da agenda. |
| CA-010 | Salvar registro profissional e documento/convênio do paciente e devolvê-los na consulta. |
| CA-011 | Profissional e recepção não conseguem alterar a operação (403). |
| CA-012 | Toda alteração gera evento de auditoria. |

## 11. Casos de erro

| Tipo | Situação | HTTP |
| :--- | :--- | :--- |
| `duplicated-name` | Convênio ou sala com nome repetido | 409 |
| `health-plan-in-use` | Desativar convênio com paciente ativo | 409 |
| `room-in-use` | Desativar sala com agenda futura | 409 |
| `invalid-operating-hours` | Intervalo invertido, sobreposto ou fora de 00:00–23:59 | 400 |
| `invalid-room` | Sala inexistente, inativa ou de outra clínica | 400/404 |
| `outside-operating-hours` | Agendamento fora do funcionamento | 409 |
| `clinic-closed` | Agendamento em feriado | 409 |
| `room-conflict` | Sala ocupada no intervalo | 409 |
| `resource-not-found` | Recurso inexistente no escopo | 404 |

## 12. Impacto em outras funcionalidades

- **Agenda (SPEC-0002):** novas validações no caminho de criação/remarcação e campo opcional de sala.
- **Catálogo (SPEC-0004):** ampliação de profissional e paciente; novas entidades no mesmo serviço.
- **Fila (SPEC-0005):** a fila continua operando; o encaixe sem agendamento não é validado contra funcionamento.
- **Pagamentos e dashboards (P-04/P-05):** passam a contar com convênios e salas.

## 13. Requisitos de segurança

- Autorização por recurso no backend (`clinic:manage`), jamais só na interface.
- Isolamento por `clinic_id` em todas as consultas.
- Validação de entrada (nomes, horas, datas, documento) e respostas em Problem Details (RFC 7807).
- Dados pessoais (documento, registro profissional) não vão para log nem para o `traceId`.

## 14. Requisitos legais aplicáveis

- **LGPD (Lei nº 13.709/2018):** documento do paciente é dado pessoal; tratamento com finalidade
  administrativa e base legal de execução de contrato/legítimo interesse, com minimização.
- **CFM:** o registro profissional compõe a identificação do responsável, exigida em prontuário futuro.
- Sem efeito sobre ANVISA (nenhuma finalidade clínica/diagnóstica é adicionada).

## 15. Requisitos não funcionais

- Consultas indexadas por `clinic_id`.
- Validação de funcionamento em O(número de intervalos do dia), sem consultas adicionais em laço.
- Compatibilidade retroativa: campos novos são nulos e a ausência de funcionamento não restringe a agenda.

## 16. Auditoria

Eventos: `health_plan.created|updated|deactivated|activated`, `room.*`,
`operating_hours.replaced`, `clinic_closure.created|removed`, além dos eventos já existentes de
profissional e paciente em suas alterações.

## 17. Testes

- **Unitários:** regras de horário (sobreposição, contenção, feriado) e ordenação.
- **Integração:** CA-001 a CA-012, incluindo isolamento por clínica e permissões.
- **Frontend:** painel de operação e seletor de sala.

## 18. Pendências e questões abertas

| # | Pendência |
| :--- | :--- |
| P-001 | Conflito de sala é validado por consulta na transação; uma restrição de exclusão dedicada pode ser avaliada se a concorrência exigir. |
| P-002 | Feriados nacionais não são sincronizados automaticamente. |
| P-003 | Tabela de preços por convênio pertence ao faturamento (SPEC futura). |

## 19. Histórico de revisões

| Versão | Data | Alteração |
| :--- | :--- | :--- |
| 1.0 | 2026-10-01 | Criação e implementação (P-06 do backlog). |
