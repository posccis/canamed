# ADR-0002 — Estrutura de documentação e processo spec-driven

- **Status:** Aceito
- **Data:** 2026-09-28
- **Decisores:** Responsável pelo projeto CANAMED
- **Relacionados:** `GEMINI.md`, `PROJECT_BRIEF.md`, `docs/visao-produto.md`

## Contexto

O `GEMINI.md` exige uma hierarquia mínima de documentação (`/docs`, `/specs`, `/adr`, `/assets`) e
estabelece que **nenhuma funcionalidade deve ser implementada antes de existir especificação
correspondente**. A estrutura de diretórios já existia, mas `/specs` e `/adr` estavam vazios.

## Problema

Como organizar a documentação viva do projeto e qual processo obrigatório rege a passagem de
especificação para implementação?

## Alternativas consideradas

| Alternativa | Prós | Contras |
| :--- | :--- | :--- |
| A. Manter as quatro pastas obrigatórias e adotar template único de SPEC e de ADR | Alinhado ao briefing; previsível; rastreável | Exige disciplina e revisão |
| B. Documentação livre em wiki externa | Flexível | Foge do escopo do repositório; perde rastreabilidade junto ao código |
| C. Documentar apenas no código | Sem burocracia | Contraria o briefing; dificulta validação legal e de produto |

## Decisão

Adotar a alternativa **A**, com as seguintes regras:

1. Papéis fixos: `/docs` (funcional), `/specs` (fonte de verdade da implementação), `/adr` (decisões),
   `/assets` (ativos oficiais).
2. Fluxo obrigatório: entender o problema → criar especificação → validar impacto → implementar → testar →
   atualizar documentação.
3. Toda SPEC deve conter, no mínimo: objetivo, contexto, regras de negócio, fluxos, critérios de aceitação,
   casos de erro, impacto em outras funcionalidades, requisitos de segurança e requisitos legais aplicáveis.
4. Toda decisão arquitetural relevante gera um ADR (ver [`adr/README.md`](README.md)).
5. Nomenclatura: SPECs nomeadas por funcionalidade; ADRs numerados sequencialmente em `NNNN-titulo.md`.

## Consequências

### Positivas

- Rastreabilidade entre requisito, decisão e implementação.
- Requisitos de segurança e legais passam a ser verificados antes do código.

### Negativas / trade-offs

- Aumenta o esforço inicial por funcionalidade.

### Mitigações

- Manter templates enxutos: [`adr/0000-template.md`](0000-template.md) e
  [`specs/0000-modelo-de-spec.md`](../specs/0000-modelo-de-spec.md).

## Impacto

- **Documentação:** `docs/visao-produto.md` e `docs/seguranca-e-conformidade.md` criados; índice de ADRs criado.
- **SPECs:** o modelo foi criado em [`specs/0000-modelo-de-spec.md`](../specs/0000-modelo-de-spec.md);
  nenhuma SPEC funcional existe ainda.
- **Código:** nenhum.
- **Segurança / LGPD:** requisitos legais tornam-se item obrigatório de toda SPEC.

## Referências

- [`GEMINI.md`](../GEMINI.md) — seções "Estrutura de Documentação (Obrigatória)" e
  "Desenvolvimento Orientado por Especificação".
