# ADR-0005 — Versionamento e fluxo de Git

- **Status:** Aceito
- **Data:** 2026-09-28
- **Decisores:** Responsável pelo projeto CANAMED
- **Relacionados:** `.gitignore`, ADR-0002, ADR-0004

## Contexto

O `GEMINI.md` autoriza o agente a executar `git status`, `git diff`, `git log`, criar branches, alterar
arquivos versionados e preparar commits, mas exige autorização explícita para `git push`, releases e
alterações de configuração remota.

O repositório local já foi inicializado na branch `main` e, no momento desta decisão, **não possuía
nenhum commit** (nenhum
objeto em `.git/objects`) e os comandos Git estão bloqueados por erro de *ownership* do diretório
(`unsafe repository ... owned by someone else`).

## Problema

Qual fluxo de versionamento o projeto adota e como evitar perda de trabalho e vazamento de segredos?

## Alternativas consideradas

| Alternativa | Prós | Contras |
| :--- | :--- | :--- |
| A. Trunk-based: branch única `main` + branches curtas por tarefa | Simples, alinhado a equipe pequena, menos cerimônia | Exige disciplina de commits pequenos |
| B. Git Flow completo (`develop`, `release/*`, `hotfix/*`) | Formal | Complexidade desnecessária para o estágio atual |
| C. Sem versionamento até existir código | Nenhum esforço | Perde histórico e rastreabilidade exigidos pelo briefing |

## Decisão

Adotar a alternativa **A**, com as seguintes regras:

1. Branch principal: `main`. Branches de trabalho curtas e descartáveis por tarefa.
2. Commits pequenos, em português, com mensagem objetiva no formato `tipo: descrição`
   (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `adr`, `spec`).
3. Nenhum commit sem antes verificar ausência de segredos e de dados reais (ADR-0004 e ADR-0003).
4. Nenhuma decisão arquitetural entra no código sem ADR correspondente (ADR-0002).
5. `git push`, criação de release e alterações de configuração remota exigem autorização explícita do usuário.
6. Operações destrutivas de Git (`git reset --hard`, `git clean`) exigem confirmação explícita.

## Consequências

### Positivas

- Histórico rastreável desde a fase de documentação.
- Fluxo leve, adequado ao tamanho atual da equipe.

### Negativas / trade-offs

- Requer cuidado para não usar `main` como área de rascunho.

### Mitigações

- Branches curtas por tarefa e commits frequentes.

## Pendências

1. Realizar o **commit inicial** versionando documentação, ativos e ADRs existentes.
   — **Concluído em 2026-09-28**: commit `a272f36` ("initial commit") na branch `main`.
2. Corrigir o erro de *ownership* do diretório para permitir comandos Git — requer
   `git config --global --add safe.directory` (alteração de configuração global, exige autorização do usuário).

## Impacto

- **Documentação:** `PROJECT_BRIEF.md`, `docs/` e `adr/` passam a ser versionados.
- **SPECs:** receberão o mesmo tratamento.
- **Código:** nenhum.
- **Segurança / LGPD:** reforça a verificação de segredos antes do commit.

## Referências

- [`GEMINI.md`](../GEMINI.md) — seção "Git".
