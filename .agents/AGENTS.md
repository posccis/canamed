# Ecossistema Multiagente — Cana Med

Este diretório (`.agents/`) define o ecossistema autônomo de inteligência artificial para o projeto **Cana Med**, projetado para atuar tanto no ciclo de engenharia de software (backend .NET C#, frontend React TypeScript, modelagem de dados, regras clínicas e conformidade LGPD) quanto na estratégia de marca, copywriting e produção visual no Canva via Canvas MCP.

---

## Catálogo de Agentes Especializados

### 1. Trilha de Engenharia de Software & Prontuário Clínico (PEP Ginecológico)

| Agente | Arquivo de Definição | Modelo | Papel Principal | Skills Habilitadas |
| :--- | :--- | :--- | :--- | :--- |
| **Orquestrador** | [`agents/orquestrador.md`](./agents/orquestrador.md) | **`flash`** | Coordena o ciclo de ponta a ponta, gerencia branches isoladas (worktrees), despacha subagentes e governa o ledger. | `subagent-driven-development`<br>`dispatching-parallel-agents`<br>`using-git-worktrees`<br>`finishing-a-development-branch`<br>`using-superpowers`<br>`find-skills`<br>`diagnosing-superpowers` |
| **Planejador** | [`agents/planejador.md`](./agents/planejador.md) | **`flash`** | Redige especificações formais de produto (`specs/`) no padrão canônico e decompõe cada feature em planos atômicos de tarefas (`docs/plans/`). | `brainstorming`<br>`writing-plans`<br>`using-superpowers`<br>`find-skills`<br>`writing-skills` |
| **Medical Systems Domain Expert** | [`agents/medical-systems-domain-expert.md`](./agents/medical-systems-domain-expert.md) | **`pro`** | Especialista sênior em HIS, PEP Ginecológico, CFM, LGPD e fluxos ambulatoriais. Valida criticamente SPECs (Fase A) e audita integridade clínica pós-implementação (Fase C). | `verification-before-completion`<br>`requesting-code-review` |
| **UI/UX Reviewer** | [`agents/ui-ux-reviewer.md`](./agents/ui-ux-reviewer.md) | **`pro`** | Especialista em ergonomia clínica, consistência de design system (`theme.css`) e acessibilidade. Revisa SPECs (Fase A) e audita a interface renderizada (Fase C). | `verification-before-completion`<br>`requesting-code-review` |
| **Implementador** | [`agents/implementador.md`](./agents/implementador.md) | **`flash`** | Executa as tarefas de código estritamente sob o método TDD (Red-Green-Refactor) com investigação sistemática de causa-raiz. | `test-driven-development`<br>`executing-plans`<br>`systematic-debugging`<br>`receiving-code-review`<br>`using-superpowers` |
| **Validador** | [`agents/validador.md`](./agents/validador.md) | **`flash`** | Auditor técnico de qualidade e conformidade com as specs. Aplica a regra "Evidência antes de afirmações", executando testes reais e emitindo relatórios de revisão. | `verification-before-completion`<br>`requesting-code-review`<br>`systematic-debugging`<br>`using-superpowers` |

---

### 2. Trilha de Marca, Conteúdo e Design Visual (Canva / Canvas MCP)

| Agente | Arquivo de Definição | Modelo | Papel Principal | Insumos e Materiais Obrigatórios |
| :--- | :--- | :--- | :--- | :--- |
| **Design Content Creator** | [`agents/cana-med-design-content-creator.md`](./agents/cana-med-design-content-creator.md) | **`inherit`** | Estrategista de conteúdo e copywriting para os designs do Canvas MCP. Consulta todas as informações não técnicas da plataforma, define a narrativa, dores das clínicas, copy slide a slide e seleção de materiais oficiais. | `GEMINI.md`, `docs/visao-produto.md`, `docs/identidade-visual.md`, `assets/brand/` (logos oficiais, ícones 2px outline e paleta oficial #008080 teal, #005F6A petróleo, #66CDAA menta). |
| **Social Media Designer** | [`agents/cana-med-social-designer-agent.md`](./agents/cana-med-social-designer-agent.md) | **`inherit`** | Designer de execução visual. Opera diretamente as ferramentas do Canvas MCP no Canva, estruturando diagramação, hierarquia visual, contraste, responsividade mobile e revisão dos designs editáveis. | Pacote de conteúdo do Content Creator, ferramentas Canva MCP, assets oficiais em `assets/brand/`. |

---

## Fluxos de Trabalho Integrados

### Fluxo 1: Engenharia de Software Clínico (Ciclo de 4 Fases — GEMINI.md)

```
[Demanda / Épico Clínico]
        │
        ▼
 1. ORQUESTRADOR ──► Prepara Worktree / Branch Isolada (using-git-worktrees)
        │
        ▼
 2. FASE A: PLANEJAMENTO
    ├── PLANEJADOR redige proposta de SPEC formal em specs/
    ├── MEDICAL SYSTEMS EXPERT valida requisitos clínicos, CFM e fluxos de ginecologia
    └── UI/UX REVIEWER valida ergonomia de tela, tokens visuais e acessibilidade
        │
        ▼ Planejador consolida SPEC aprovada e Plano de Tasks (docs/plans/)
        │
 3. FASE B: IMPLEMENTAÇÃO ATÔMICA (Subagent-Driven Development)
    ┌────────────────────────────────────────────────────────┐
    │ Para cada task atômica do plano:                       │
    │ 3.1 IMPLEMENTADOR  ──► TDD: Red -> Green -> Refactor   │
    │                        (test-driven-development)       │
    │        │                                               │
    │        ▼                                               │
    │ 3.2 VALIDADOR     ──► Evidências de Testes & Auditoria │
    │                       (verification-before-completion) │
    │        │                                               │
    │   Aprovado? ──► [Não] ──► Retorna ao Implementador     │
    │        │                                               │
    │       [Sim]                                            │
    │        ▼                                               │
    │   Ledger atualizado & Próxima tarefa                   │
    └────────────────────────────────────────────────────────┘
        │
        ▼
 4. FASE C: VALIDAÇÃO INTEGRAL
    ├── VALIDADOR executa suíte completa de testes (dotnet test, npm test, build)
    ├── MEDICAL SYSTEMS EXPERT audita coerência clínica e integridade de prontuário
    └── UI/UX REVIEWER audita interface renderizada e conformidade estética
        │
        ▼
 5. ORQUESTRADOR ──► Conclusão da Branch e Integração / PR (finishing-a-development-branch)
```

---

### Fluxo 2: Produção de Conteúdo e Design Visual no Canva (Canvas MCP)

```
[Demanda de Design / Post / Carrossel / Story / Destaques]
        │
        ▼
 1. ORQUESTRADOR ──► Despacha a demanda com objetivo e público-alvo
        │
        ▼
 2. DESIGN CONTENT CREATOR (Estratégia e Redação Não Técnica)
    ├── Consulta GEMINI.md, Visão de Produto e desafios reais das clínicas
    ├── Define personas (médicos ginecologistas, gestores, recepcionistas, pacientes)
    ├── Redige o roteiro slide a slide com gancho forte, corpo e CTA claro
    ├── Seleciona os materiais oficiais corretos em assets/brand/ (logos, cores, ícones)
    └── Produz a legenda completa da publicação com hashtags estratégicas
        │
        ▼ Entrega Pacote de Conteúdo Estruturado
        │
 3. SOCIAL MEDIA DESIGNER (Execução no Canva via Canvas MCP)
    ├── Cria/abre design editável no Canva no formato correto (1080x1350, 1080x1920)
    ├── Aplica a paleta oficial (#008080, #005F6A, #66CDAA) e insere logos e ícones
    ├── Diagrama os textos respeitando hierarquia tipográfica e margens de respiro
    ├── Revisa legibilidade em tela de celular e contraste WCAG
    └── Entrega link do design editável e preview
        │
        ▼
 4. ORQUESTRADOR ──► Valida fidelidade com a marca e entrega ao usuário
```

---

## Como Utilizar no Antigravity / Gemini CLI

- **Descoberta Automática:** Todos os agentes em `.agents/agents/*.md` são automaticamente registrados na sessão.
- **Invocação Direta:**
  - `@orquestrador` (ou `@orchestrator`): para gerenciar épicos, releases e fluxos completos.
  - `@planejador` (ou `@planner`): para desenhar SPECs e planos de tasks.
  - `@medical-systems-domain-expert`: para análise clínica e regulatória de saúde da mulher.
  - `@ui-ux-reviewer`: para auditoria e padronização visual do frontend.
  - `@implementador` (ou `@implementer`): para codificação e testes TDD.
  - `@validador` (ou `@validator`): para revisão de código e evidência de testes.
  - `@cana-med-design-content-creator`: para criar conteúdos, narrativas, copys e seleção de ativos para designs.
  - `@cana-med-social-designer`: para criar e editar designs diretamente no Canva via MCP.
