# Ecossistema de Agentes Especializados — Cana Med (Ginecologia)

Este diretório contém as definições dos agentes autônomos configurados especificamente para a arquitetura, regras de engenharia, governança clínica ginecológica e consistência de interface do **Cana Med** (.NET 10, PostgreSQL, React 19 / CSS Tokens e conformidade com CFM, LGPD e ANVISA).

---

## 🤖 Catálogo de Agentes

| Agente | Arquivo | Perfil / Modelo | Papel Principal |
| :--- | :--- | :--- | :--- |
| **`orchestrator`** | [`orchestrator.md`](orchestrator.md) | Gemini 3.1 Pro (`model: pro`) | **Maestro & Tech Lead:** Conduz o ciclo de vida do desenvolvimento em 4 fases (Planejamento, Implementação, Validação, Conclusão), acionando os especialistas antes e depois do código. |
| **`medical-systems-domain-expert`** | [`medical-systems-domain-expert.md`](medical-systems-domain-expert.md) | Gemini 3.1 Pro (`model: pro`) | **Especialista em Domínio Clínico Ginecológico:** Validador crítico de fluxos de saúde da mulher, anamnese ginecológica, histórico menstrual/obstétrico, rastreamento preventivo, exame físico, PEP/SOAP e regras CFM/LGPD. |
| **`ui-ux-reviewer`** | [`ui-ux-reviewer.md`](ui-ux-reviewer.md) | Gemini 3.1 Pro (`model: pro`) | **Especialista em UI/UX e Qualidade Visual:** Revisor de consistência estética, tokens do design system (`theme.css`), ergonomia clínica, acessibilidade WCAG e estados visuais completos no frontend. |

---

## 🔄 Fluxo de Trabalho Integrado em Quatro Fases

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Usuário / Desenvolvedor
    participant O as Orchestrator (Cana Med)
    participant M as Medical Domain Expert (Ginecologia)
    participant U as UI/UX Reviewer (Frontend)
    participant S as Specs & Código (Cana Med)
    participant V as Validador Técnico (Build/Testes)

    Note over O,U: Fase A — Planejamento
    Dev->>O: Demanda clínica (PEP Ginecológico)
    O->>M: invoke_subagent("medical-systems-domain-expert")
    M-->>O: Parecer clínico (pertinência, anamnese, exames, CFM/LGPD)
    O->>U: invoke_subagent("ui-ux-reviewer")
    U-->>O: Parecer visual (ergonomia, agrupamento, tokens, estados)
    O->>S: Elabora SPEC formal em specs/ com critérios Given/When/Then

    Note over O,S: Fase B — Implementação
    O->>S: Implementa backend (.NET 10) e frontend (React 19) com estados completos

    Note over O,V: Fase C — Validação
    O->>V: Executa dotnet test (100% green) e npm test (100% green)
    O->>M: Audita fidelidade clínica pós-implementação
    O->>U: Inspeciona acabamento visual renderizado e acessibilidade
    
    alt Há Bloqueadores P0 (Clínicos, Técnicos ou Visuais)
        O->>S: Dispara correções imediatas antes da homologação
    else 100% Aprovado sem Bloqueadores
        Note over O,Dev: Fase D — Conclusão
        O->>S: Registra entrega no docs/CHANGELOG_AGENTE.md
        O-->>Dev: Entrega homologada com laudos e evidências
    end
```

---

## 🎯 Mecanismo de Ativação em Tempo de Execução

Os subagentes estão registrados no runtime do Antigravity via `define_subagent` e podem ser invocados diretamente pelo orquestrador:

```yaml
invoke_subagent:
  Subagents:
    - TypeName: "medical-systems-domain-expert"
      Role: "Medical Systems Domain Expert"
      Model: "pro"
      Prompt: "Validar criticamente o fluxo clínico de anamnese ginecológica..."
    - TypeName: "ui-ux-reviewer"
      Role: "UI/UX Reviewer"
      Model: "pro"
      Prompt: "Avaliar o agrupamento visual de campos e estados de interação do prontuário..."
```
