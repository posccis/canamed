# Architecture Decision Records — CANAMED

Registro das decisões arquiteturais relevantes do projeto, conforme exigido pelo
[`GEMINI.md`](../GEMINI.md): **toda decisão importante deve ser registrada** e cada ADR deve responder a
problema, alternativas, decisão e consequências.

## Como usar

1. Copie `0000-template.md` para `NNNN-titulo-em-kebab-case.md` usando o próximo número livre.
2. Preencha contexto, problema, alternativas, decisão e consequências.
3. Abra com status `Proposto` e promova para `Aceito` somente após aprovação do responsável pelo projeto.
4. ADRs aceitos não são editados: para mudar uma decisão, crie um novo ADR que supersede o anterior e
   atualize o status do antigo para `Substituído por ADR-XXXX`.
5. Registre a criação/alteração em [`docs/CHANGELOG_AGENTE.md`](../docs/CHANGELOG_AGENTE.md).

Nunca inclua segredos, credenciais ou dados reais de pacientes em um ADR.

## Índice

| ADR | Título | Status | Data |
| :--- | :--- | :--- | :--- |
| [0000](0000-template.md) | Modelo de Architecture Decision Record | Modelo | — |
| [0001](0001-fonte-de-verdade-documental.md) | Fonte de verdade documental | Aceito | 2026-09-28 |
| [0002](0002-estrutura-de-documentacao-e-processo-spec-driven.md) | Estrutura de documentação e processo spec-driven | Aceito | 2026-09-28 |
| [0003](0003-segregacao-de-ambientes-e-uso-de-dados.md) | Segregação de ambientes e uso de dados | Aceito | 2026-09-28 |
| [0004](0004-gestao-de-segredos-e-configuracao.md) | Gestão de segredos e configuração | Aceito | 2026-09-28 |
| [0005](0005-versionamento-e-fluxo-de-git.md) | Versionamento e fluxo de Git | Aceito | 2026-09-28 |
| [0006](0006-stack-de-aplicacao.md) | Stack de aplicação | Proposto | 2026-09-28 |
| [0007](0007-banco-de-dados-e-persistencia.md) | Banco de dados e persistência | Proposto | 2026-09-28 |
| [0008](0008-autenticacao-autorizacao-e-auditoria.md) | Autenticação, autorização e auditoria | Proposto | 2026-09-28 |

## Decisões pendentes de aprovação

Os ADRs com status `Proposto` (0006, 0007 e 0008) **bloqueiam o início da implementação**, pois definem
stack, persistência e autenticação. Nenhuma SPEC pode ser implementada antes da aprovação deles.
