# Backlog de Próximas Funcionalidades — CANAMED

> Lista consolidada e priorizada do que ainda **não** existe no produto. Reúne três fontes antes
> dispersas: os pilares em [`docs/visao-produto.md`](visao-produto.md) e [`PROJECT_BRIEF.md`](../PROJECT_BRIEF.md)
> (seção 8), as pendências das SPECs e a seção 13 do [`guia de uso e execução`](guia-de-uso-e-execucao.md).
>
> **Regra que vale para todo item:** nenhum entra em implementação sem SPEC aprovada
> ([`specs/README.md`](../specs/README.md)). A ordem abaixo é uma recomendação técnica de dependências;
> a priorização comercial é decisão do responsável pelo projeto.

- **Versão:** 1.1
- **Data:** 2026-10-01
- **Estado do produto:** fundação (SPEC-0001), agenda (SPEC-0002), autenticação (SPEC-0003) e catálogo
  assistencial (SPEC-0004) implementadas

## Progresso desta rodada

| Item | Situação |
| :--- | :--- |
| Classificação das consultas: natureza (avulsa, acompanhamento), custeio (particular, plano de saúde) e especialidade | **Implementado** — [SPEC-0004](../specs/0004-spec-catalogo-e-classificacao-das-consultas.md) |
| D-01 Desbloquear horário | **Implementado** na SPEC-0004 |
| D-02 Editar e desativar tipo de consulta | **Implementado** na SPEC-0004 |
| D-03 Editar dados do paciente | **Implementado** na SPEC-0004 |
| P-01 a P-08, T-04 a T-06, I-01 a I-06, D-04 a D-07 | Pendentes — seguem na sequência sugerida abaixo |

## Como ler esforço e complexidade

| Escala | Esforço | Complexidade |
| :--- | :--- | :--- |
| **P / Baixa** | até 1 dia de trabalho | regra simples, sem integração externa, sem dado sensível novo |
| **M / Média** | 2 a 5 dias | várias telas ou regras, exige testes de integração, alguma decisão de produto |
| **G / Alta** | 1 a 3 semanas ou mais | integração externa, dado sensível, requisito legal, concorrência ou risco de segurança |

Complexidade considera regra de negócio, risco de segurança, impacto legal (LGPD/CFM/ANVISA) e
dependências externas — não apenas linhas de código.

---

## 1. Fundação técnica (destrava todo o resto)

| # | Funcionalidade | Descrição curta | Esforço | Complexidade | Dependências |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T-01 | Hospedagem e região dos dados | Definir provedor, região brasileira, criptografia em repouso gerenciada e política de retenção física dos dados | M | Alta | ADR novo (LGPD); bloqueia a ida a produção |
| T-02 | Backups automatizados e teste de restauração | Rotina de backup do PostgreSQL com retenção definida e restauração verificada periodicamente | M | Média | T-01 |
| T-03 | Pipeline de CI hospedada | Executar `npm run build`, `npm run test` e `npm run test:e2e` em cada alteração | M | Média | Acesso a um serviço de CI (exige decisão e conta externa) |
| T-04 | Observabilidade de produção | Coleta de logs estruturados, métricas, alertas de erro e correlação por `traceId` | M | Média | T-01 |
| T-05 | Atualização do Node.js e dependências | Sair do Node 20.10 e reavaliar a vulnerabilidade aceita em `vitest` | P | Baixa | Janela de manutenção do ambiente |
| T-06 | Limite de requisições nas demais rotas | Estender o rate limiting hoje restrito ao login e registrar bloqueios | P | Baixa | SPEC de observabilidade |

## 2. Identidade e acesso (continuação da SPEC-0003)

| # | Funcionalidade | Descrição curta | Esforço | Complexidade | Dependências |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-01 | Recuperação de senha por e-mail | Fluxo de "esqueci minha senha" com token de uso único e expiração curta | M | Média | Serviço de e-mail (conta externa) e SPEC de notificações |
| I-02 | Convite de usuário por e-mail | Criar usuário sem senha inicial, com convite para definir a própria credencial | P | Média | I-01 |
| I-03 | Códigos de recuperação de MFA | Códigos de uso único para acesso quando o autenticador é perdido | P | Média | Decisão de produto sobre armazenamento (hash) e revogação |
| I-04 | Interface de troca de clínica ativa | Selecionar a clínica da sessão quando o usuário tem mais de um vínculo (API já existe) | P | Baixa | Uso real de multi-clínica |
| I-05 | Auditoria de sessões para o usuário | Tela em que a pessoa vê e encerra as próprias sessões ativas | P | Baixa | — |
| I-06 | SSO / federação corporativa | Login com provedor de identidade de grandes redes de clínicas | G | Alta | Decisão de arquitetura (novo ADR) e negociação comercial |

## 3. Pilares de produto (visão do produto, seção 5)

| # | Funcionalidade | Descrição curta | Esforço | Complexidade | Dependências |
| :--- | :--- | :--- | :--- | :--- | :--- |
| P-01 | Fila de espera | Registrar a chegada do paciente, ordenar a espera por chegada/prioridade e mostrar tempo de espera para recepção e paciente | M | Média | SPEC-0002 (origem do agendamento) e SPEC-0003 (permissões) — ambas prontas |
| P-02 | Ciclo de atendimento completo | Marcar início e fim do atendimento, registrar observações administrativas e fechar o dia da agenda | P | Baixa | P-01; hoje só existem `atendido`/`faltou` |
| P-03 | Apoio à triagem | Registrar sinais vitais e classificação de risco administrativa, encaminhando o paciente para o atendimento | M | Alta | P-01; exige avaliação de impacto clínico/ANVISA (RDC nº 657/2022) |
| P-04 | Pagamento antes da consulta | Registrar cobrança e pagamento no balcão (dinheiro, cartão, PIX manual), com status financeiro do agendamento | M | Alta | P-01; decisão sobre gateway/maquininha e `Idempotency-Key` (SPEC-0001, seção 8) |
| P-05 | Dashboards gerenciais | Indicadores de ocupação, faltas, cancelamentos e produção por profissional | M | Média | P-01 a P-04; depende de dados confiáveis do ciclo de atendimento |
| P-06 | Gestão operacional da clínica | Cadastro completo de profissionais e pacientes, convênios, salas, horários de funcionamento e feriados | G | Média | Resolve pendências P-005 da SPEC-0002 (horário comercial) |
| P-07 | Notificações ao paciente | Lembrete e confirmação de consulta por WhatsApp/e-mail, com registro de consentimento | G | Alta | Conta em provedor externo, LGPD (base legal e opt-out) e SPEC própria |
| P-08 | Prontuário eletrônico | Registro clínico com assinatura, imutabilidade e guarda de 20 anos | G | Alta | Lei nº 13.787/2018, CFM/NGS2, ICP-Brasil; exige ADR e SPEC dedicada |

## 4. Dívidas funcionais herdadas das SPECs atuais

| # | Item | Descrição curta | Esforço | Complexidade | Origem |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ~~D-01~~ | ~~Desbloquear horário da agenda~~ | **Concluído** pela [SPEC-0004](../specs/0004-spec-catalogo-e-classificacao-das-consultas.md) | P | Baixa | — |
| ~~D-02~~ | ~~Editar e desativar tipo de atendimento~~ | **Concluído** pela SPEC-0004, agora com natureza, custeio e especialidade | P | Baixa | — |
| ~~D-03~~ | ~~Editar dados do paciente~~ | **Concluído** pela SPEC-0004 (nome, telefone, e-mail, nascimento e inativação) | P | Baixa | — |
| D-04 | Encaixe/overbooking com justificativa | Reavaliar a decisão Q-002 da SPEC-0002 com dados reais de uso | M | Média | Revisão da SPEC-0002 ou nova SPEC |
| D-05 | Antecedência mínima de cancelamento | Reavaliar a decisão Q-003 da SPEC-0002 com dados reais de uso | P | Baixa | Revisão da SPEC-0002 |
| D-06 | Paginação das listas | Padronizar paginação quando as coleções crescerem (pacientes, agendamentos por período) | P | Baixa | Pendência P-001 da SPEC-0002 e seção 8 da SPEC-0001 |
| D-07 | Direitos do titular (LGPD) | Exportação e eliminação de dados pessoais a pedido do titular, com registro | M | Alta | SPEC de privacidade; ADR-0003 |

---

## Sequência sugerida

1. ~~**D-01, D-02, D-03**~~ — **concluído** na [SPEC-0004](../specs/0004-spec-catalogo-e-classificacao-das-consultas.md), junto da classificação das consultas.
2. **P-01 + P-02** — fila de espera e ciclo de atendimento: maior ganho operacional imediato, sem dependência externa.
3. **P-06** — cadastro completo e horários de funcionamento: reduz retrabalho e destrava agenda por período.
4. **T-04** — observabilidade (T-01 a T-03 estão suspensos por decisão do responsável: hospedagem, backups e CI).
5. **P-04 e P-05** — pagamento e dashboards: dependem de decisão de negócio e de dados confiáveis.
6. **I-01 a I-03** — autoatendimento de senha e MFA: reduzem chamados de suporte.
7. **P-03, P-07 e P-08** — triagem, notificações e prontuário: exigem decisões regulatórias e integrações externas.

## Integrações externas previstas e o que será mockado

Nada de externo será contratado agora: cada item abaixo entra com um **adaptador simulado** e uma pendência
registrada com o que é necessário para ativar a integração real.

| Item | Integração | Mock previsto | Pendência a registrar |
| :--- | :--- | :--- | :--- |
| P-04 | Gateway de pagamento / maquininha | Provedor simulado que aprova, recusa e estorna | Escolha do provedor, credenciais, conta comercial, contrato, taxa e certificação PCI-DSS |
| I-01, I-02 | Envio de e-mail (recuperação de senha e convites) | Remetente simulado que grava a mensagem em log de desenvolvimento | Serviço de e-mail (SMTP ou API), domínio verificado (SPF/DKIM) e template aprovado |
| P-07 | WhatsApp/SMS para lembretes e confirmação | Remetente simulado com fila local | Provedor oficial (API do WhatsApp Business), número verificado, templates aprovados e base legal/opt-out na LGPD |
| T-04 | APM/telemetria (Sentry, Application Insights) | Coletor simulado em arquivo/memória | Escolha do serviço, conta, DSN e política de retenção de dados |
| I-06 | SSO/federação corporativa | — (não iniciado) | Provedor de identidade, contrato e requisitos do cliente |
| P-08 | Assinatura digital (ICP-Brasil) e PACS/DICOM | — (não iniciado) | Certificado A1/A3, integração com PACS e avaliação de conformidade CFM/SBIS (NGS2) |

> Cada item, ao entrar em execução, deve virar SPEC (com regras de negócio, critérios de aceitação,
> casos de erro, requisitos de segurança e legais) e, quando a decisão for arquitetural, um ADR.

## Referências

- [`docs/visao-produto.md`](visao-produto.md) — pilares e posicionamento do produto.
- [`PROJECT_BRIEF.md`](../PROJECT_BRIEF.md) — escopo inicial e pendências da fase.
- [`specs/`](../specs) — especificações aprovadas e implementadas.
- [`docs/guia-de-uso-e-execucao.md`](guia-de-uso-e-execucao.md) — execução e operação atuais.
