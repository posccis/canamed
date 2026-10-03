# SPEC-0025 — Políticas Parametrizáveis de Encaixe e Cancelamento

| Campo | Valor |
| :--- | :--- |
| **ID** | SPEC-0025 |
| **Título** | Políticas Parametrizáveis de Encaixes (Overbooking), Cotas Diárias e Prazos de Cancelamento |
| **Status** | Implementada |
| **Versão** | 1.0 |
| **Data** | 2026-10-03 |
| **Autor** | Antigravity AI / Equipe CANAMED |
| **Revisores** | Responsável pelo Projeto CANAMED |
| **Módulos afetados** | backend (Domain, Application, Infrastructure, Api), frontend (Gestão Operacional / Políticas da Agenda), banco de dados (schema `clinics` e `agenda`) |
| **ADRs relacionados** | ADR-0003, ADR-0006, ADR-0007, ADR-0008 |

---

## 1. Objetivo

Permitir que a gestão da clínica configure regras e limites objetivos para a concessão de encaixes de urgência/sobre-agenda (*overbooking*) por médico e por turno, evitando a sobrecarga e atrasos excessivos nos consultórios, bem como definir prazos mínimos e políticas de cancelamento e liberação automática de horários vagos para reencaixe imediato da fila de espera.

Pergunta de controle do `GEMINI.md`: **isso reduz atrito na rotina da clínica?**  
Sim. Evita discussões desgastantes entre recepcionistas e médicos sobre excesso de pacientes encaixados sem aviso, padroniza as regras da clínica e aproveita desistências com rapidez.

---

## 2. Contexto

A [SPEC-0002](0002-spec-agenda-de-consultas.md) e a [SPEC-0006](0006-spec-gestao-operacional-da-clinica.md) estabeleceram a criação de horários de atendimento. No entanto, na prática diária, pacientes buscam atendimento sem agendamento prévio ou necessitam de urgência. Sem uma política configurável, a recepção encaixa pacientes sem limites, gerando salas de espera superlotadas, atrasos de mais de 2 horas e desgaste da equipe médica.

---

## 3. Escopo

### 3.1 Dentro do escopo
- Parametrização por clínica e/ou por profissional de saúde:
  - **Limite Diário de Encaixes:** Quantidade máxima permitida de agendamentos em regime de sobre-agenda por turno/dia (ex: máx. 3 encaixes por médico);
  - **Antecedência Mínima para Agendamento Online:** Tempo mínimo antes do horário da consulta para permitir marcação pública (ex: 2 horas de antecedência);
  - **Prazo Limite de Cancelamento sem Custos:** Janela mínima permitida para cancelamento pelo paciente (ex: 24h ou 12h de antecedência);
- Bloqueio inteligente na interface da recepção quando o limite de encaixes do dia para aquele médico for atingido;
- Mecanismo de *Bypass* com autorização de supervisor: gestor pode autorizar encaixe emergencial excedente mediante justificativa clínica obrigatória registrada em auditoria;
- Alerta automático de vaga liberada para pacientes que solicitaram notificação de desistência.

### 3.2 Fora do escopo
- Cobrança automática de multa no cartão de crédito em caso de no-show (fora da política amigável do CANAMED na fase atual).

---

## 4. Atores e Permissões

| Ator | Permissão necessária | Observações |
| :--- | :--- | :--- |
| `recepcionista` | `appointment:write` | Pode realizar encaixes até o teto da cota diária permitida. |
| `gestor`, `admin` | `agenda:policy-manage`, `appointment:override-quota` | Configura as cotas e pode autorizar encaixes acima do teto com justificativa. |

---

## 5. Regras de Negócio

| ID | Regra | Justificativa / origem |
| :--- | :--- | :--- |
| **RN-001** | **Respeito à Cota Máxima de Encaixes:** Ao tentar marcar um encaixe na agenda, o sistema verifica a contagem de encaixes já concedidos para o profissional naquela data. Se `TotalEncaixes >= LimiteConfigurado`, a ação é bloqueada com aviso explicativo. | Preservação da qualidade assistencial e pontualidade da clínica. |
| **RN-002** | **Exceção Justificada (Bypass):** Um usuário com permissão `appointment:override-quota` pode confirmar o encaixe excedente, sendo obrigatório registrar o motivo (ex: "Paciente de urgência encaminhado da triagem"). | Flexibilidade para emergências médicas sem perda de controle. |
| **RN-003** | **Classificação Visual na Agenda:** Todo agendamento criado como encaixe recebe um badge visual destacado `[ENCAIXE]` na grade da agenda e na fila de espera. | Clareza e previsibilidade para a equipe. |
| **RN-004** | **Reaproveitamento de Horários:** Ao cancelar uma consulta dentro do prazo configurado, o horário volta automaticamente ao estado `disponivel` para o portal online e para a recepção. | Minimização de ociosidade médica. |

---

## 6. Fluxos

### 6.1 Tentativa de Encaixe com Validação de Limite
1. Recepcionista tenta adicionar um paciente em horário já ocupado ou fora da grade padrão como encaixe.
2. O sistema calcula os encaixes do médico no dia (ex: 3 de 3 utilizados).
3. A tela informa: *"Limite diário de encaixes atingido para Dr. Roberto (3/3). Solicite liberação da supervisão."*
4. Se o gestor autenticar a liberação com justificativa, o agendamento é concluído e auditado.

---

## 7. Critérios de Aceitação

- [x] Parâmetros de cota diária de encaixes e prazos de cancelamento configuráveis na gestão.
- [x] Bloqueio automático de encaixes excedentes pela recepção.
- [x] Permissão de liberação emergencial por gestor com registro de motivo.
- [x] Identificação visual explícita de consultas do tipo encaixe na agenda e na fila.

---

## 8. Requisitos de Segurança e Legais

- **Auditoria de Exceções:** Todo encaixe que violar a cota padrão gera registro detalhado na trilha de auditoria para acompanhamento da diretoria médica.
