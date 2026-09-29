# ADR-0001 — Fonte de verdade documental

- **Status:** Aceito
- **Data:** 2026-09-28
- **Decisores:** Responsável pelo projeto CANAMED
- **Relacionados:** `GEMINI.md`, `PROJECT_BRIEF.md`

## Contexto

O `GEMINI.md` é, ao mesmo tempo, o briefing do projeto e o documento de regras operacionais e de
segurança do agente. A regra de precedência do próprio `GEMINI.md` cita `PROJECT_BRIEF.md` como fonte de
verdade, mas esse arquivo não existia — o que deixava uma lacuna formal na hierarquia de instruções.

Manter o conteúdo integral em dois arquivos cria risco de divergência e de contradição entre documentos.

## Problema

Qual documento é a fonte de verdade do projeto e qual é o papel do `PROJECT_BRIEF.md`?

## Alternativas consideradas

| Alternativa | Prós | Contras |
| :--- | :--- | :--- |
| A. `GEMINI.md` como fonte integral; `PROJECT_BRIEF.md` como entrada consolidada derivada | Sem duplicação normativa; mantém intactas as regras do agente; atende à hierarquia citada no próprio briefing | Exige disciplina para não editar o brief como se fosse norma |
| B. Duplicar integralmente o briefing no `PROJECT_BRIEF.md` | Leitura centralizada | Duplicação e risco alto de divergência; conflito com o princípio de evitar duplicação |
| C. `PROJECT_BRIEF.md` como fonte única e `GEMINI.md` substituído | Um só local | Removeria o arquivo que o agente lê automaticamente; risco de perda de regras de segurança |

## Decisão

Adotar a alternativa **A**:

1. O `GEMINI.md` permanece como **fonte de verdade integral e normativa** (briefing + regras de conduta).
2. O [`PROJECT_BRIEF.md`](../PROJECT_BRIEF.md) é o **documento de entrada oficial**, consolidado e legível,
   derivado do `GEMINI.md`.
3. Em caso de qualquer divergência entre os dois, **o `GEMINI.md` prevalece**.
4. A ordem de precedência do `GEMINI.md` é mantida sem alteração.

## Consequências

### Positivas

- Elimina a lacuna formal na hierarquia de instruções.
- Preserva as regras de segurança do agente em um único local.
- Oferece um ponto de entrada curto para humanos sem duplicar a norma.

### Negativas / trade-offs

- Duas leituras possíveis exigem que colaboradores saibam qual prevalece.

### Mitigações

- Aviso explícito de prevalência no topo do `PROJECT_BRIEF.md`.
- Alterações de conteúdo normativo continuam acontecendo apenas no `GEMINI.md`.

## Impacto

- **Documentação:** `PROJECT_BRIEF.md` criado; nenhuma alteração em `GEMINI.md`.
- **SPECs:** nenhuma dependência direta.
- **Código:** nenhum.
- **Segurança / LGPD:** nenhuma mudança; as regras permanecem as do `GEMINI.md`.

## Referências

- [`GEMINI.md`](../GEMINI.md) — seções "Regra de Precedência" e "Como interpretar este documento".
