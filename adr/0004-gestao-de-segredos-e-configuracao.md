# ADR-0004 — Gestão de segredos e configuração

- **Status:** Aceito
- **Data:** 2026-09-28
- **Decisores:** Responsável pelo projeto CANAMED
- **Relacionados:** `.gitignore`, `docs/seguranca-e-conformidade.md`, ADR-0003

## Contexto

O `GEMINI.md` proíbe armazenar tokens, chaves, certificados e credenciais no código-fonte ou no
versionamento, e exige gerenciamento seguro de segredos. O projeto ainda não possui código, mas a decisão
precisa estar registrada antes da primeira linha de implementação. O `.gitignore` já cobre `.env`,
`.env.*`, `*.pem`, `*.key`, `*.cert`, `*.crt`, `credentials.*`, `secrets.*`, `*.pfx` e `*.p12`.

## Problema

Como configurar a aplicação em cada ambiente sem versionar segredos?

## Alternativas consideradas

| Alternativa | Prós | Contras |
| :--- | :--- | :--- |
| A. Variáveis de ambiente carregadas por `.env` local + `.env.example` versionado + cofre gerenciado em produção | Padrão de mercado; simples em DEV; seguro em produção | Exige disciplina para manter o modelo atualizado |
| B. Segredos em arquivo de configuração versionado | Simples | Viola o `GEMINI.md`; risco grave de vazamento |
| C. Somente cofre gerenciado desde o início | Seguro | Atrito desnecessário antes de existir deploy |

## Decisão

Adotar a alternativa **A**:

1. `.env` (e variações de ambiente) **nunca** versionado; permanece coberto pelo `.gitignore`.
2. Um `.env.example` versionado, contendo apenas **nomes** de variáveis e valores de exemplo não sensíveis.
3. Nenhum segredo em código, SPEC, ADR, documentação, logs, mensagens de erro ou prompts.
4. Em produção, segredos fornecidos por cofre/gerenciador de segredos do provedor — a escolha concreta
   fica pendente do ADR de stack/infraestrutura.
5. Credenciais de desenvolvimento, quando existirem, são descartáveis e diferentes das de produção.
6. Antes de cada commit, verificar ausência de segredos versionados.

## Consequências

### Positivas

- Base de código única para todos os ambientes (ADR-0003), sem segredos no repositório.
- Facilita auditoria de conformidade.

### Negativas / trade-offs

- Onboarding exige criar o `.env` local a partir do exemplo.

### Mitigações

- `.env.example` documentado e mantido atualizado a cada nova variável.

## Impacto

- **Documentação:** regra registrada em `docs/seguranca-e-conformidade.md`.
- **SPECs:** nenhuma dependência direta.
- **Código:** nenhuma variável de ambiente pode ter valor sensível como padrão (*fallback*).
- **Segurança / LGPD:** controle direto de proteção de credenciais.

## Pendências

- Criar o `.env.example` quando a stack for definida (ver `adr/0006-stack-de-aplicacao.md`).

## Referências

- [`GEMINI.md`](../GEMINI.md) — seção "Credenciais e Segredos".
- [`.gitignore`](../.gitignore)
