# Regra Obrigatória: Fluxo de Desenvolvimento Multiagente (Cana Med)

## Princípio Fundamental
Para **QUALQUER** solicitação de criação de funcionalidades, modificação de código, correção de bugs ou refatoração no projeto **Cana Med**, o agente principal **DEVE obrigatoriamente assumir o papel de Orquestrador** (`orquestrador`) e conduzir a execução utilizando os 4 agentes especializados configurados em `.agents/agents/`.

> **É proibido** escrever código de produção diretamente na sessão principal ignorando as etapas de planejamento, TDD e validação independente.

---

## O Workflow Obrigatório Passo a Passo

```
1. Solicitação do Usuário
       │
       ▼
2. ORQUESTRADOR: Verifica o workspace / git worktree
       │
       ▼
3. PLANEJADOR: Redige/atualiza a SPEC formal em specs/ e decompõe em Tasks atômicas em docs/plans/
       │
       ▼
4. ORQUESTRADOR: Para cada task atômica do plano, aciona:
   ├── IMPLEMENTADOR: Escreve teste falhando -> Código mínimo -> Refatoração (TDD)
   └── VALIDADOR: Executa testes reais, audita o diff e exige evidências
       │
       ▼
5. VALIDADOR: Conduz a auditoria final da branch inteira
       │
       ▼
6. ORQUESTRADOR: Integra o trabalho aprovado (finishing-a-development-branch)
```

---

## Regras de Execução dos Agentes

1. **Autoria Obrigatória de SPEC e Tasks (Planejador):**
   - Nenhuma feature pode ser implementada sem uma SPEC formal registrada em `specs/NNNN-titulo-em-kebab-case.md` seguindo rigorosamente o modelo canônico `specs/0000-modelo-de-spec.md` e indexada em `specs/README.md`.
   - A partir da SPEC, o `planejador` deve decompor o trabalho em tasks atômicas em `docs/plans/` com critérios de aceite explícitos e checklists de ciclos TDD (`- [ ]`).

2. **Isolamento de Contexto:**
   - Cada subagente despachado pelo Orquestrador deve receber apenas o *brief* de sua tarefa, evitando poluição de contexto.

3. **TDD Inegociável:**
   - O `implementador` nunca deve escrever código de produção sem antes comprovar a falha de um teste automatizado (`test-driven-development`).

4. **Evidência Antes de Conclusão:**
   - O `validador` nunca aceita alegações de sucesso sem rodar comandos reais de teste e build (`dotnet test`, `npm test`, linters) através da skill `verification-before-completion`.

5. **Modelo Padronizado:**
   - Todos os agentes operam no modelo `flash` conforme configurado em suas definições.
