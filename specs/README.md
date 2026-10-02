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
| [UI-001](UI/SPEC-UI-001.md) | CANAMED UI/UX Design System | Implementada | 2026-10-01 |

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
