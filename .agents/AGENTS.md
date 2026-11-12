# Ecossistema Multiagente — Cana Med

Este diretório (`.agents/`) define o ecossistema autônomo de inteligência artificial para o projeto **Cana Med**, projetado para atuar no ciclo completo de engenharia de software clínico com execução paralela isolada, roteamento centralizado de modelos (Gemini Flash vs Gemini Pro) e esteira de design de marca e redes sociais no Canva via Canvas MCP.

---

## Catálogo de Agentes Especializados

### 1. Trilha de Engenharia de Software & Prontuário Clínico (PEP Ginecológico)

| Agente | Arquivo de Definição | Modelo Designado | Papel Principal e Atuação | Skills Habilitadas |
| :--- | :--- | :---: | :--- | :--- |
| **`@orquestrador`**<br>*(alias: `@orchestrator`)* | [`agents/orquestrador.md`](./agents/orquestrador.md) | **`flash`** | **Coordenador Central**: Conduz a esteira de 12 passos, gerencia worktrees isolados (`share`), despacha tarefas paralelas e orquestra validação e QA. | `subagent-driven-development`<br>`dispatching-parallel-agents`<br>`using-git-worktrees`<br>`finishing-a-development-branch`<br>`using-superpowers`<br>`find-skills`<br>`diagnosing-superpowers` |
| **`@planejador`**<br>*(alias: `@planner`)* | [`agents/planejador.md`](./agents/planejador.md) | **`flash`** | **Arquiteto de Requisitos**: Redige especificações formais (`specs/`) e decompõe cada feature em planos atômicos de tarefas (`docs/plans/`). | `brainstorming`<br>`writing-plans`<br>`using-superpowers`<br>`find-skills`<br>`writing-skills` |
| **`@medical-systems-domain-expert`** | [`agents/medical-systems-domain-expert.md`](./agents/medical-systems-domain-expert.md) | **`pro`** | **Validador Médico Sênior**: Especialista em HIS, CFM, Lei 13.787/2018, LGPD e protocolos de saúde da mulher (FEBRASGO/INCA). | `verification-before-completion`<br>`requesting-code-review` |
| **`@ui-ux-design-planner`** | [`agents/ui-ux-design-planner.md`](./agents/ui-ux-design-planner.md) | **`pro`** | **Planejador de Ergonomia Clínica**: Elabora planos visuais de 12 seções orientados a redução de atrito e consistência visual para consultórios. | `frontend-design`<br>`impeccable`<br>`ui-styling`<br>`ui-ux-pro-max`<br>`web-design-guidelines`<br>`security-auditor` |
| **`@ui-ux-reviewer`** | [`agents/ui-ux-reviewer.md`](./agents/ui-ux-reviewer.md) | **`pro`** | **Auditor de Interface e Design System**: Avalia conformidade estética com `theme.css`, acessibilidade (WCAG AA) e ergonomia médica. | `verification-before-completion`<br>`requesting-code-review` |
| **`@integration-engineer`** | [`agents/integration-engineer.md`](./agents/integration-engineer.md) | **`flash`** | **Engenheiro de Contratos & Integração**: Define DTOs, schemas OpenAPI, rotas de API (.NET 10), clients fetch e merge das branches de trabalho. | `test-driven-development`<br>`executing-plans`<br>`systematic-debugging`<br>`receiving-code-review`<br>`using-superpowers` |
| **`@database-engineer`** | [`agents/database-engineer.md`](./agents/database-engineer.md) | **`flash`** | **Engenheiro de Banco de Dados**: Modela schemas PostgreSQL, migrations EF Core 10, interceptors de imutabilidade e criptografia em repouso. | `test-driven-development`<br>`executing-plans`<br>`systematic-debugging`<br>`receiving-code-review`<br>`using-superpowers` |
| **`@backend-implementer`** | [`agents/backend-implementer.md`](./agents/backend-implementer.md) | **`flash`** | **Engenheiro de Backend**: Implementa regras clínicas de domínio (.NET 10 / C# 13), calculadoras obstétricas/ginecológicas e testes unitários TDD. | `test-driven-development`<br>`executing-plans`<br>`systematic-debugging`<br>`receiving-code-review`<br>`using-superpowers` |
| **`@frontend-implementer`** | [`agents/frontend-implementer.md`](./agents/frontend-implementer.md) | **`flash`** | **Engenheiro de Frontend**: Constrói telas React 19, formulários dinâmicos, componentes vetoriais SVG (Mapa Cervical, Curvas Atalah/AU) e auto-save. | `test-driven-development`<br>`executing-plans`<br>`systematic-debugging`<br>`receiving-code-review`<br>`ui-styling`<br>`using-superpowers` |
| **`@implementador`**<br>*(alias: `@implementer`)* | [`agents/implementador.md`](./agents/implementador.md) | **`flash`** | **Implementador Geral (Fallback)**: Executor de correções atômicas pontuais que não demandam divisão em frentes paralelas. | `test-driven-development`<br>`executing-plans`<br>`systematic-debugging`<br>`receiving-code-review`<br>`using-superpowers` |
| **`@validador`**<br>*(alias: `@validator`)* | [`agents/validador.md`](./agents/validador.md) | **`flash`** | **Auditor Técnico de Qualidade**: Garante a regra "Evidência antes de afirmações", rodando testes (`dotnet test`, `npm test`) com 0 falhas. | `verification-before-completion`<br>`requesting-code-review`<br>`systematic-debugging`<br>`using-superpowers` |
| **`@cana-med-qa-engineer`**<br>*(alias: `@qa-engineer`)* | [`agents/cana-med-qa-engineer.md`](./agents/cana-med-qa-engineer.md) | **`pro`** | **Engenheiro de QA E2E**: Executa testes de ponta a ponta simulando usuários reais no navegador com Playwright. | `playwright`<br>`playwright-cli`<br>`verification-before-completion`<br>`systematic-debugging`<br>`requesting-code-review` |
| **`@canamed-go-auditor`** | [`agents/canamed-go-auditor.md`](./agents/canamed-go-auditor.md) | **`pro`** | **Auditor Chefe de Produto GO & Compliance**: Conduz auditorias end-to-end de produto médico, segurança (DevSecOps) e conformidade legal. | `security-auditor`<br>`frontend-design`<br>`impeccable`<br>`firecrawl`<br>`verification-before-completion`<br>`requesting-code-review` |

---

### 2. Trilha de Marca, Conteúdo e Design Visual (Canva / Canvas MCP)

| Agente | Arquivo de Definição | Modelo Designado | Papel Principal | Insumos Obrigatórios |
| :--- | :--- | :---: | :--- | :--- |
| **`@cana-med-design-content-creator`** | [`agents/cana-med-design-content-creator.md`](./agents/cana-med-design-content-creator.md) | **`inherit`** | Estrategista de conteúdo e copywriting não técnico. Define narrativas, personas médicas/pacientes, roteiros slide a slide e seleção de ativos oficiais. | `GEMINI.md`, `docs/visao-produto.md`, `docs/identidade-visual.md`, `assets/brand/` (#008080 teal, #005F6A petróleo, #66CDAA menta). |
| **`@cana-med-social-designer`**<br>*(alias: `@social-designer`)* | [`agents/cana-med-social-designer-agent.md`](./agents/cana-med-social-designer-agent.md) | **`inherit`** | Designer de execução visual. Opera as ferramentas do Canvas MCP no Canva, diagramando peças no formato Instagram (1080x1350 ou 1080x1920) com tipografia limpa. | Pacote de conteúdo do Content Creator, ferramentas Canva MCP, assets oficiais em `assets/brand/`. |

---

## Fluxo Operacional Paralelo em 5 Fases

```
[Demanda Clínica / Épico]
        │
        ▼
 1. ORQUESTRADOR ──► Interpretação da Demanda e Consulta às SPECs
        │
        ▼
 2. FASE 1: PLANEJAMENTO E CONTRATOS
    ├── PLANEJADOR redige proposta de SPEC formal em specs/
    ├── MEDICAL SYSTEMS EXPERT valida regras clínicas, CFM e protocolos
    ├── UI/UX DESIGN PLANNER desenha especificações ergonômicas de interface
    └── INTEGRATION ENGINEER define DTOs compartilhados e schemas OpenAPI
        │
        ▼ Orquestrador provisiona Worktrees Isolados (Workspace: "share")
        │
 3. FASE 2: EXECUÇÃO PARALELA ISOLADA (TDD Rigoroso)
    ┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
    │     DATABASE ENGINEER     │    BACKEND IMPLEMENTER    │   FRONTEND IMPLEMENTER    │
    │  (Worktree: *-database)   │   (Worktree: *-backend)   │  (Worktree: *-frontend)   │
    │                           │                           │                           │
    │ • Modelagem de entidades  │ • Regras de domínio (.NET)│ • Telas e blocos (React)  │
    │ • Interceptors imutáveis  │ • Calculadoras clínicas   │ • Componentes SVG e temas │
    │ • Migrations EF Core 10   │ • Casos de uso / handlers │ • Auto-save com debounce  │
    │ • Criptografia LGPD       │ • Testes unitários xUnit  │ • Testes Vitest c/ mocks  │
    └───────────────────────────┴───────────────────────────┴───────────────────────────┘
        │
        ▼ Todas as frentes com testes unitários locais aprovados
        │
 4. FASE 3: INTEGRAÇÃO E WIRE-UP
    ├── INTEGRATION ENGINEER realiza merge das frentes na branch "integration/*"
    ├── Mapeamento de rotas de API (.NET 10) e conexão do client fetch frontend
    └── Execução e aprovação dos testes de integração de API
        │
        ▼
 5. FASE 4: VALIDAÇÃO TÉCNICA E QA
    ├── VALIDADOR TÉCNICO audita compilação geral e suítes completas com 0 falhas
    └── CANA MED QA ENGINEER executa testes funcionais E2E no navegador (Playwright)
        │
        ▼
 6. FASE 5: AUDITORIA FINAL E MERGE
    ├── AUDITOR MESTRE GO & ESPECIALISTAS validam conformidade ética e usabilidade
    └── ORQUESTRADOR realiza merge seguro na "main" e conclui a limpeza de worktrees
```

---

## Política de Governança de Arquivos (Zero Conflict Ownership)

Para impedir sobrescritas acidentais em execução concorrente:

| Agente | Diretórios Exclusivos de Escrita (Ownership) |
| :--- | :--- |
| **`@database-engineer`** | `backend/src/Canamed.Infrastructure/Persistence/**`, migrations e scripts SQL. |
| **`@backend-implementer`** | `backend/src/Canamed.Domain/**`, `backend/src/Canamed.Application/**`, `backend/tests/Canamed.UnitTests/**`. |
| **`@frontend-implementer`** | `frontend/src/features/**`, `frontend/src/components/**`, `frontend/src/styles/**`, testes Vitest. |
| **`@integration-engineer`** | `backend/src/Canamed.Api/Endpoints/**`, `frontend/src/api/**`, `backend/tests/Canamed.IntegrationTests/**`. |
| **`@planejador`** | `specs/**`, `docs/plans/**`. |
| **`@orquestrador`** | Merges finais, branches principais e relatórios consolidados. |

---

## Como Invocar no Antigravity / Gemini CLI

- **Orquestração Geral:** `@orquestrador` para gerenciar releases, épicos clínicos e novas funcionalidades.
- **Planejamento de Produto:** `@planejador` para novas SPECs e decomposição de tarefas.
- **Planejamento de Interface:** `@ui-ux-design-planner` para especificações detalhadas de UI/UX clínica.
- **Consultoria Clínica:** `@medical-systems-domain-expert` para validações de regras médicas e CFM.
- **Persistência & Dados:** `@database-engineer` para migrations, índices e interceptors.
- **Lógica de Backend:** `@backend-implementer` para serviços clínicos e regras de negócio em C#.
- **Interface & Componentes:** `@frontend-implementer` para componentes React e estilização.
- **Contratos & Integração:** `@integration-engineer` para DTOs, OpenAPI, endpoints e unificação.
- **Qualidade & Revisão:** `@validador` para checagem técnica e `@cana-med-qa-engineer` para testes E2E Playwright.
- **Design no Canva:** `@cana-med-design-content-creator` (copy/estratégia) e `@cana-med-social-designer` (execução Canvas MCP).
