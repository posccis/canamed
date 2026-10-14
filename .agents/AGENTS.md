# Ecossistema Multiagente — Cana Med

Este diretório (`.agents/`) define o ecossistema de inteligência artificial autônoma para o projeto **Cana Med**, projetado para atuar no desenvolvimento do backend (.NET C#), frontend (React TypeScript), modelagem de dados, regras clínicas e conformidade LGPD.

---

## Os 4 Agentes Especializados

| Agente | Arquivo de Definição | Modelo Configurado | Papel Principal | Skills Habilitadas (.agents/skills) |
| :--- | :--- | :--- | :--- | :--- |
| **Orquestrador** | [`agents/orquestrador.md`](./agents/orquestrador.md) | **`flash`** (Gemini Flash) | Coordena o ciclo de ponta a ponta, gerencia branches isoladas (worktrees), despacha tarefas para implementadores e validações com revisores, registrando decisões no ledger. | `subagent-driven-development`<br>`dispatching-parallel-agents`<br>`using-git-worktrees`<br>`finishing-a-development-branch`<br>`using-superpowers`<br>`find-skills`<br>`diagnosing-superpowers` |
| **Planejador** | [`agents/planejador.md`](./agents/planejador.md) | **`flash`** (Gemini Flash) | Redige as especificações formais de produto (`specs/`) no modelo canônico e decompõe cada feature em planos de tasks atômicas com checklist TDD (`docs/plans/`). | `brainstorming`<br>`writing-plans`<br>`using-superpowers`<br>`find-skills`<br>`writing-skills` |
| **Implementador** | [`agents/implementador.md`](./agents/implementador.md) | **`flash`** (Gemini Flash) | Executa as tarefas de código estritamente sob o método TDD (Red-Green-Refactor). Aplica correções com base em investigação sistemática de causa-raiz. | `test-driven-development`<br>`executing-plans`<br>`systematic-debugging`<br>`receiving-code-review`<br>`using-superpowers` |
| **Validador** | [`agents/validador.md`](./agents/validador.md) | **`flash`** (Gemini Flash) | Auditor de qualidade e conformidade com as specs. Aplica a regra "Evidência antes de afirmações", executando testes reais de verificação e emitindo relatórios formais de revisão de código. | `verification-before-completion`<br>`requesting-code-review`<br>`systematic-debugging`<br>`using-superpowers` |

---

## Modelo Unificado: Flash (`flash`)

Todos os 4 agentes foram configurados com o modelo **`flash`** (Gemini Flash) para garantir:
1. **Velocidade Extrema:** Respostas quase instantâneas em loops de iteração rápida (TDD, dispatching, compilações e checagem de testes).
2. **Eficiência de Custo e Tokens:** Consumo otimizado de recursos em execuções contínuas e multiagente.
3. **Alto Rendimento:** Excelente equilíbrio entre precisão técnica na esteira e tempo de resposta ágil.

---

## Fluxo de Trabalho Integrado

```
[Demanda / Épico]
        │
        ▼
 1. ORQUESTRADOR ──► Prepara Worktree Isolado (using-git-worktrees)
        │
        ▼
 2. PLANEJADOR   ──► Redige SPEC formal em specs/ e Plano de Tasks em docs/plans/
        │
        ▼
 ┌────────────────────────────────────────────────────────┐
 │ CICLO POR TAREFA ATÔMICA (Subagent-Driven Development) │
 │                                                        │
 │ 3. IMPLEMENTADOR  ──► TDD: Red -> Green -> Refactor    │
 │                       (test-driven-development)       │
 │        │                                               │
 │        ▼                                               │
 │ 4. VALIDADOR     ──► Evidências de Testes & Auditoria │
 │                      (verification-before-completion)  │
 │        │                                               │
 │   Aprovado? ──► [Não] ──► Retorna apontamentos ao      │
 │        │                  Implementador                │
 │       [Sim]                                            │
 │        ▼                                               │
 │   Ledger atualizado & Próxima tarefa                   │
 └────────────────────────────────────────────────────────┘
        │
        ▼
 5. VALIDAÇÃO GERAL DA BRANCH INTEIRA (Validador)
        │
        ▼
 6. ORQUESTRADOR ──► Conclusão e Integração da Branch (finishing-a-development-branch)
```

---

## Como Utilizar

- **No Antigravity / Gemini CLI:** Os agentes configurados em `.agents/agents/*.md` são automaticamente descobertos. Você pode invocá-los utilizando a sintaxe `@orquestrador`, `@planejador`, `@implementador`, `@validador` (ou seus equivalentes em inglês `@orchestrator`, `@planner`, `@implementer`, `@validator`).
- **Pelo Orquestrador:** O Orquestrador tem capacidade de invocar o Planejador, Implementador e Validador de forma dinâmica, mantendo cada subagente com contexto limpo e isolado.
