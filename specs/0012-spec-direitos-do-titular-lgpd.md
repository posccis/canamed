# SPEC-0012 — Governança de Privacidade e Direitos do Titular (LGPD)

- **Versão:** 1.0
- **Status:** Implementada
- **Data:** 2026-10-02
- **Autor:** Agente CANAMED
- **Módulos afetados:** `backend/src/Canamed.Domain`, `backend/src/Canamed.Application`, `backend/src/Canamed.Infrastructure`, `backend/src/Canamed.Api`, `frontend/src/features/clinics`
- **Relacionados:** [GEMINI.md](../GEMINI.md), [SPEC-0001](0001-spec-de-fundacao.md), [SPEC-0002](0002-spec-agenda-de-consultas.md), [SPEC-0006](0006-spec-gestao-operacional-da-clinica.md), ADR-0001, ADR-0003, ADR-0008

---

## 1. Objetivo

Implementar a camada formal de atendimento aos **Direitos dos Titulares de Dados** (pacientes) em conformidade estrita com o Art. 18 da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), articulada com a exigência de retenção mínima legal de registros de saúde (Lei nº 13.787/2018 e resoluções do CFM).

Esta especificação cumpre o item **D-07** do [backlog](../docs/backlog-proximas-funcionalidades.md) e atende ao requisito mandatório de conformidade legal previsto no [GEMINI.md](../GEMINI.md).

---

## 2. Contexto e Problema

O CANAMED lida diretamente com dados pessoais sensíveis de saúde. A LGPD assegura aos cidadãos:
1. **Confirmação e Acesso aos Dados (Art. 18, I e II):** O paciente tem o direito de saber se a clínica trata seus dados e obter um relatório completo e inteligível de todos os seus registros;
2. **Portabilidade dos Dados (Art. 18, V):** Obter um arquivo estruturado, legível por máquina (JSON interoperável), contendo seu histórico cadastral, consultas, triagens e pagamentos;
3. **Anonimização ou Eliminação (Art. 18, VI):** O paciente pode solicitar a exclusão de seus dados. Todavia, a LGPD (Art. 16, I) ressalva o cumprimento de obrigação legal: prontuários e registros de atendimento clínico devem ser guardados por no mínimo **20 anos** (Lei nº 13.787/2018 e CFM). Portanto, a eliminação de dados de saúde deve ser tratada como **anonimização dos identificadores pessoais de contato**, mantendo os dados estatísticos e o histórico clínico desprovidos de vínculo direto, ou recusa fundamentada caso haja consultas recentes em período ativo de guarda probatória.

---

## 3. Escopo

### 3.1 Dentro do escopo
- Endpoint de Confirmação e Portabilidade: `GET /api/v1/patients/{id}/data-portability`
  - Retorna um dossiê completo em JSON estruturado com:
    - Dados cadastrais do titular (nome, contato, nascimento, documento);
    - Histórico de agendamentos realizados (datas, profissional, especialidade, status);
    - Registros de triagem (sinais vitais, queixas, classificação de risco);
    - Histórico de transações de pagamento emitidas no balcão;
    - Termo de confirmação de tratamento e base legal aplicável (Tutela da saúde / Obrigação legal).
- Endpoint de Solicitação de Anonimização: `POST /api/v1/patients/{id}/anonymize`
  - Recebe a justificativa do pedido e operador responsável.
  - Verifica se o paciente possui consultas ativas agendadas para o futuro (se houver agendamento futuro pendente, o pedido é rejeitado informando a necessidade de cancelamento prévio).
  - Executa a anonimização irreversível dos dados cadastrais diretos:
    - `Name` substituído por `[TITULAR ANONIMIZADO - LGPD]`;
    - `Phone`, `Email` e `Document` substituídos por valores descaracterizados/nulos;
    - Inativação definitiva do cadastro (`IsActive = false`).
  - Preserva os registros históricos de atendimento com o ID desvinculado de dados de contato, garantindo cumprimento da Lei nº 13.787/2018.
  - Trilha de auditoria obrigatória: registro do evento `AuditActions.PatientAnonymized` (`patients.anonymized`) contendo a justificativa, data/hora e identificação do operador.
- Interface no frontend (dentro da Gestão de Pacientes):
  - Botão "Exportar Dados (LGPD)" que faz download do dossiê em formato JSON.
  - Ação "Anonimizar Cadastro (LGPD)" com modal de confirmação solene e alerta de irreversibilidade.

### 3.2 Fora do escopo
- Exclusão física das tabelas do banco de dados (DROP/DELETE) de histórico clínico (vedado pela Lei nº 13.787/2018).

---

## 4. Personas e Permissões

| Papel | Permissões | Ações Permitidas |
| :--- | :--- | :--- |
| **gestor** | `privacy:export`, `privacy:anonymize` | Exportar dossiê e executar anonimização de titulares |
| **recepcionista** | `privacy:export` | Emitir relatório de portabilidade a pedido do paciente |
| **profissional** | Nenhuma | Não gerencia solicitações de privacidade |

---

## 5. Regras de Negócio

| # | Regra |
| :--- | :--- |
| RN-001 | Apenas operadores da mesma clínica do paciente podem consultar ou anonimizar seus dados. |
| RN-002 | Pacientes com consultas futuras agendadas ou confirmadas não podem ser anonimizados sem cancelamento prévio. |
| RN-003 | A anonimização é irreversível; o paciente anonimizado não pode receber novas consultas. |
| RN-004 | Toda exportação e anonimização é compulsoriamente registrada na trilha de auditoria para fins de prestação de contas à ANPD (Art. 50 da LGPD). |

---

## 6. Critérios de Aceitação

| # | Critério |
| :--- | :--- |
| CA-001 | Exportar dossiê de portabilidade com todos os dados e histórico do paciente em formato JSON válido. |
| CA-002 | Impedir anonimização de paciente com consulta futura ativa (400 Bad Request). |
| CA-003 | Executar anonimização com sucesso descaracterizando nome, contato e documento. |
| CA-004 | Rejeitar operação de privacidade por operador sem permissão (403 Forbidden). |
| CA-005 | Registrar na trilha de auditoria o evento de anonimização e de exportação. |
