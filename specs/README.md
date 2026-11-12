# Especificações — CANAMED

Diretório que guarda a **fonte de verdade da implementação**, conforme exigido pelo
[`GEMINI.md`](../GEMINI.md).

## Regra fundamental

**Nenhuma funcionalidade deve ser implementada antes de existir uma SPEC aprovada.** O fluxo obrigatório é:

1. entender o problema;
2. criar a especificação;
3. validar impacto;
4. implementar;
5. testar;
6. atualizar documentação.

## Nomenclatura e ciclo de vida

- Nome do arquivo: `NNNN-titulo-em-kebab-case.md`, com numeração sequencial (`0001`, `0002`, ...).
- Um número de SPEC **nunca** é reutilizado.
- Após `Aprovada`, a SPEC só muda por **revisão registrada** na seção "Histórico de revisões"; mudanças de
  escopo relevantes devem gerar uma nova SPEC ou um ADR.
- Status válidos: `Rascunho`, `Em revisão`, `Aprovada`, `Implementada`, `Obsoleta`,
  `Substituída por SPEC-XXXX`.

## Conteúdo mínimo obrigatório

Toda SPEC deve conter, no mínimo, as seções exigidas pelo `GEMINI.md`:

| Exigência | Seção do modelo |
| :--- | :--- |
| objetivo | 1. Objetivo |
| contexto | 2. Contexto |
| regras de negócio | 5. Regras de negócio |
| fluxos | 6. Fluxos |
| critérios de aceitação | 10. Critérios de aceitação |
| casos de erro | 11. Casos de erro |
| impacto em outras funcionalidades | 12. Impacto em outras funcionalidades |
| requisitos de segurança | 13. Requisitos de segurança |
| requisitos legais aplicáveis | 14. Requisitos legais aplicáveis |

## Definition of Ready (antes de implementar)

- SPEC escrita com todas as seções obrigatórias preenchidas.
- Regras de negócio numeradas, sem contradição entre si.
- Critérios de aceitação verificáveis e casos de erro descritos.
- Requisitos de segurança e legais preenchidos (ou marcados como "não aplicável" com justificativa).
- ADRs necessários já aprovados.
- Dúvidas abertas resolvidas ou explicitamente marcadas como pendência fora do escopo.

## Definition of Done (antes de considerar concluída)

- Critérios de aceitação atendidos e verificados por teste.
- Testes automatizados criados (unitário, integração e/ou comportamento, conforme o caso).
- Nenhum segredo, dado real ou dado pessoal em código, teste ou log.
- Auditoria registrando os eventos definidos na seção 17 do modelo.
- Documentação e ADRs atualizados; seção "Histórico de revisões" preenchida.
- Status da SPEC atualizado para `Implementada`.

## Índice

| SPEC | Título | Status | Data |
| :--- | :--- | :--- | :--- |
| [0000](0000-modelo-de-spec.md) | Modelo de Especificação | Modelo | 2026-09-28 |
| [0001](0001-spec-de-fundacao.md) | Fundação do Projeto (monorepo .NET + React) | Implementada | 2026-09-29 |
| [0002](0002-spec-agenda-de-consultas.md) | Agenda de Consultas | Implementada | 2026-09-30 |
| [0003](0003-spec-autenticacao-autorizacao-e-auditoria.md) | Autenticação, Autorização e Auditoria | Implementada | 2026-10-01 |
| [0004](0004-spec-catalogo-e-classificacao-das-consultas.md) | Catálogo Assistencial e Classificação das Consultas | Implementada | 2026-10-01 |
| [0005](0005-spec-fila-de-espera-e-ciclo-de-atendimento.md) | Fila de Espera e Ciclo de Atendimento | Implementada | 2026-10-01 |
| [0006](0006-spec-gestao-operacional-da-clinica.md) | Gestão Operacional da Clínica (Convênios, Salas, Horários e Feriados) | Implementada | 2026-10-01 |
| [0007](0007-spec-painel-gerencial-e-indicadores-operacionais.md) | Painel Gerencial e Indicadores Operacionais (Dashboard) | Implementada | 2026-10-01 |
| [0008](0008-spec-fluxo-de-pagamento-e-cobranca.md) | Fluxo de Pagamento e Cobrança no Balcão | Implementada | 2026-10-01 |
| [0009](0009-spec-triagem-e-classificacao-de-risco.md) | Apoio ao Processo de Triagem e Classificação de Risco | Implementada | 2026-10-01 |
| [0010](0010-spec-prontuario-eletronico-do-paciente.md) | Prontuário Eletrônico do Paciente (PEP) | Implementada | 2026-10-02 |
| [0011](0011-spec-prescricao-eletronica-atestados-e-documentos-clinicos.md) | Prescrição Eletrônica, Atestados e Exames (ICP-Brasil) | Implementada | 2026-10-02 |
| [0012](0012-spec-consultorio-virtual-e-workspace-medico.md) | Consultório Virtual e Workspace Médico Integrado | Implementada | 2026-10-02 |
| [0013](0013-spec-gestao-de-retornos-e-prazos-assistenciais.md) | Gestão de Retornos e Prazos Assistenciais (CFM 1.958/2010) | Rascunho | 2026-10-02 |
| [0014](0014-spec-notificacoes-e-lembretes-ativos-whatsapp-sms.md) | Notificações e Lembretes Ativos (WhatsApp / SMS) | Implementada | 2026-10-03 |
| [0015](0015-spec-agendamento-online-e-portal-do-paciente.md) | Agendamento Online e Portal do Paciente (OTP) | Implementada | 2026-10-03 |
| [0016](0016-spec-carteira-digital-e-acesso-a-documentos-clinicos.md) | Carteira Digital e Acesso a Documentos Clínicos | Implementada | 2026-10-03 |
| [0017](0017-spec-checkin-autonomo-totem-e-qrcode.md) | Check-in Autônomo na Recepção (Totem / QR Code) | Substituída por SPEC-0026 (parcialmente) | 2026-10-03 |
| [0018](0018-spec-portal-de-autonomia-e-direitos-do-titular-lgpd.md) | Portal de Autonomia e Direitos do Titular (LGPD) | Implementada | 2026-10-03 |
| [0019](0019-spec-fechamento-e-conferencia-de-caixa.md) | Fechamento e Conferência de Caixa por Operador | Implementada | 2026-10-03 |
| [0020](0020-spec-painel-de-chamada-tv-recepcao.md) | Painel de Chamada para TV na Recepção (Tempo Real) | Implementada | 2026-10-03 |
| [0021](0021-spec-gestao-financeira-e-repasses-medicos.md) | Gestão Financeira Avançada e Repasses Médicos | Implementada | 2026-10-03 |
| [0022](0022-spec-gestao-de-insumos-e-estoque-clinico.md) | Gestão de Insumos e Materiais Médicos (Estoque) | Implementada | 2026-10-03 |
| [0023](0023-spec-painel-do-dpo-governanca-lgpd.md) | Painel do DPO / Governança LGPD | Implementada | 2026-10-03 |
| [0024](0024-spec-multi-clinica-e-alternancia-de-contexto.md) | Alternância de Multi-Clínica na Interface | Implementada | 2026-10-03 |
| [0025](0025-spec-politicas-de-encaixe-e-cancelamento.md) | Políticas Parametrizáveis de Encaixe e Cancelamento | Implementada | 2026-10-03 |
| [0026](0026-spec-jornada-digital-do-paciente-e-portais-dedicados.md) | Jornada Digital do Paciente, Superfícies Dedicadas e Links Compartilháveis | Aprovada | 2026-10-03 |
| [0027](0027-spec-prontuario-eletronico-ginecologico.md) | Prontuário Eletrônico do Paciente Especializado em Ginecologia (PEP Ginecológico) | Implementada | 2026-10-09 |
| [0028](0028-spec-evolucao-modulo-medico-dashboard-anexos-sidebar.md) | Evolução do Módulo Médico: Dashboard Clínico, Anexo de Exames Anteriores, Início de Atendimento e Sidebar Moderna | Implementada | 2026-10-09 |
| [0029](0029-spec-modernizacao-visual-frontend-navegacao.md) | Modernização Visual do Frontend, Controles de Formulário e Redesign da Navegação Médica | Implementada | 2026-10-09 |
| [0030](0030-spec-mvp-visao-administrativa.md) | MVP da Visão Administrativa \| Cana Med Mulher | Aprovada | 2026-10-12 |
| [0031](0031-spec-redesign-dashboard-administrativo-e-medico.md) | Redesign Visual e Padrão de Interface: Dashboard Administrativo e Área do Médico | Aprovada | 2026-10-14 |
| [0032](0032-spec-consolidacao-area-administrativa-agenda-recepcao-configuracoes.md) | Consolidação da Área Administrativa: Agenda & Recepção, Configurações da Clínica e Padronização de Entradas Financeiras | Aprovada | 2026-10-14 |
| [0033](0033-spec-portal-do-paciente-cana-med-mulher.md) | Portal do Paciente CANA MED Mulher: Acesso Segmentado, Agendamento Inteligente em 5 Etapas e Autoatendimento Acolhedor | Aprovada | 2026-10-14 |
| [0034](0034-spec-seguranca-imutabilidade-e-governanca-de-prontuario.md) | Segurança, Imutabilidade e Governança de Prontuário (P0) | Em implementação | 2026-10-21 |
| [0035](0035-spec-consolidacao-pep-ginecologico-e-agendamento-paciente.md) | Consolidação do PEP Ginecológico & Obstétrico e Experiência de Agendamento do Paciente | Aprovada | 2026-10-26 |
| [0036](0036-spec-substituicao-integral-area-do-paciente-cana-med-mulher.md) | Substituição Integral da Área do Paciente: Cana Med Mulher Mobile & Web (Design System Serene Bloom) | Aprovada | 2026-10-28 |
| [0037](0037-spec-diferenciais-larc-mapa-cervical-e-curvas.md) | Gestão de Dispositivos LARC, Mapa Cervical e Curvas Obstétricas (P2) | Rascunho (Backlog) | 2026-10-21 |
| [0038](0038-spec-prevencao-oncologica-ginecologica-bethesda-birads.md) | Core de Ginecologia e Prevenção Oncológica: Bethesda e BI-RADS (P1) | Rascunho (Backlog) | 2026-10-21 |
| [UI-001](UI/SPEC-UI-001.md) | CANAMED UI/UX Design System | Implementada | 2026-10-01 |

> A [SPEC-0026](0026-spec-jornada-digital-do-paciente-e-portais-dedicados.md) propõe, sobre o
> [ADR-0011](../adr/0011-roteamento-por-url-e-superficies-dedicadas.md), a separação das superfícies de
> sistema, paciente, médico e saguão por URL, bem como a substituição parcial da
> [SPEC-0017](0017-spec-checkin-autonomo-totem-e-qrcode.md) (totem físico) pelo check-in digital por
> QR Code/link. A SPEC-0017 permanece válida quanto às regras de tolerância, prioridade legal e
> emissão de senha até a aprovação da SPEC-0026.

A [SPEC-0001](0001-spec-de-fundacao.md) está **aprovada** (v1.0) e é a base do esqueleto do monorepo.
Está implementada, com P-002 (migrations) e P-003 (tipos do frontend gerados a partir do OpenAPI)
resolvidas pela [SPEC-0002](0002-spec-agenda-de-consultas.md).

A [SPEC-0002](0002-spec-agenda-de-consultas.md) está **aprovada e implementada** (v1.0): agenda de
consultas com criação, remarcação, cancelamento e bloqueio de horário, coberta por testes unitários, de
integração e de frontend. As decisões de produto Q-001 a Q-006 estão registradas na seção 18.1 e as
pendências na seção 18.2.

Guia operacional do projeto: [`docs/guia-de-uso-e-execucao.md`](../docs/guia-de-uso-e-execucao.md).

## Decisões que toda SPEC deve respeitar

- [`adr/0001-fonte-de-verdade-documental.md`](../adr/0001-fonte-de-verdade-documental.md)
- [`adr/0002-estrutura-de-documentacao-e-processo-spec-driven.md`](../adr/0002-estrutura-de-documentacao-e-processo-spec-driven.md)
- [`adr/0003-segregacao-de-ambientes-e-uso-de-dados.md`](../adr/0003-segregacao-de-ambientes-e-uso-de-dados.md)
- [`adr/0004-gestao-de-segredos-e-configuracao.md`](../adr/0004-gestao-de-segredos-e-configuracao.md)
- [`adr/0005-versionamento-e-fluxo-de-git.md`](../adr/0005-versionamento-e-fluxo-de-git.md)
- [`adr/0006-stack-de-aplicacao.md`](../adr/0006-stack-de-aplicacao.md)
- [`adr/0007-banco-de-dados-e-persistencia.md`](../adr/0007-banco-de-dados-e-persistencia.md)
- [`adr/0008-autenticacao-autorizacao-e-auditoria.md`](../adr/0008-autenticacao-autorizacao-e-auditoria.md)

