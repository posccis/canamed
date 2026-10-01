# ADR-0010 — Sessão de usuário e substituição da identidade de desenvolvimento

- **Status:** Aceito
- **Data:** 2026-10-01
- **Aprovado em:** 2026-10-01, pelo responsável pelo projeto (por instrução direta de implementação)
- **Substitui:** [ADR-0009](0009-identidade-de-desenvolvimento-e-autorizacao-temporaria.md)
- **Relacionados:** ADR-0003, ADR-0004, ADR-0007, ADR-0008, [`specs/0003-spec-autenticacao-autorizacao-e-auditoria.md`](../specs/0003-spec-autenticacao-autorizacao-e-auditoria.md)

## Contexto

O [ADR-0009](0009-identidade-de-desenvolvimento-e-autorizacao-temporaria.md) permitiu desenvolver a
agenda resolvendo o usuário por cabeçalho HTTP, exclusivamente em DEV/TEST, enquanto a SPEC de
autenticação não existia.

A [SPEC-0003](../specs/0003-spec-autenticacao-autorizacao-e-auditoria.md) foi escrita e implementada,
entregando sessão, papéis por clínica, MFA e auditoria de identidade conforme o
[ADR-0008](0008-autenticacao-autorizacao-e-auditoria.md). Com isso, o mecanismo temporário deixou de ser
o caminho do produto.

## Problema

Como substituir a identidade de desenvolvimento por autenticação real sem reescrever as funcionalidades
já prontas e sem perder a ergonomia de desenvolvimento local?

## Alternativas consideradas

| Alternativa | Prós | Contras |
| :--- | :--- | :--- |
| A. Remover completamente os cabeçalhos de desenvolvimento | Superfície mínima | Quebra a ergonomia de scripts, testes manuais e da suíte de integração, que passariam a exigir login em todo cenário |
| **B. Sessão real como único caminho do produto, com cabeçalhos restritos a DEV/TEST, atrás de configuração** | Mantém segurança em produção e a ergonomia local; nenhuma rota precisa mudar | Exige disciplina documental para não habilitar a conveniência fora de DEV/TEST |
| C. Manter os cabeçalhos também em produção, com *feature flag* | Simples | Falha de segurança grave (bypass de autenticação); inaceitável sob o `GEMINI.md` |

## Decisão

Adotar a alternativa **B**, com as seguintes diretrizes:

1. A sessão em *cookie* `httpOnly` é a única via de identidade fora de DEV/TEST: sem sessão válida, a
   resposta é `401`, mesmo que os cabeçalhos sejam enviados.
2. Os cabeçalhos do ADR-0009 passam a ser **conveniência de desenvolvimento**, habilitada apenas quando
   o ambiente é `Development` ou `Testing`, lida sempre depois da tentativa de sessão.
3. A abstração `ICurrentActorAccessor` é preservada: as funcionalidades existentes não mudam.
4. Papéis por clínica (`clinic_memberships`) definem as permissões; a clínica ativa fica na sessão.
5. Segredos de MFA são cifrados com Data Protection, com chaves em diretório do projeto ignorado pelo Git.
6. O ADR-0009 é marcado como substituído; seu conteúdo histórico é preservado.

## Consequências

### Positivas

- O produto passa a cumprir o ADR-0008 sem reescrever agenda, auditoria ou autorização por recurso.
- A suíte de integração e os scripts locais continuam simples, sem enfraquecer produção.
- A trilha de auditoria passa a identificar pessoas reais, não identificadores de desenvolvimento.

### Negativas / trade-offs

- Duas formas de resolver identidade em desenvolvimento, o que exige documentação clara.
- O fluxo de MFA pendente adiciona um estado de sessão a ser considerado em telas e testes.

### Mitigações

- Testes automatizados garantem que os cabeçalhos não funcionam fora de DEV/TEST.
- A conveniência está registrada na SPEC-0003 (RN-017) e no guia de uso e execução.

## Impacto

- **Documentação:** SPEC-0003, `docs/guia-de-uso-e-execucao.md` e `docs/seguranca-e-conformidade.md`.
- **SPECs:** SPEC-0002 permanece válida; as permissões declaradas nela passam a ser atribuídas por papel.
- **Código:** `Canamed.Application.Identity`, `Canamed.Infrastructure.Identity`, `Canamed.Api.Authorization`.
- **Segurança / LGPD:** autenticação forte com MFA para administradores, revogação de sessão e auditoria
  de identidade; dados de sessão minimizados (sem IP ou *user agent*).

## Referências

- [`GEMINI.md`](../GEMINI.md) — Autenticação, Controle de acesso e Auditoria.
- [`adr/0008-autenticacao-autorizacao-e-auditoria.md`](0008-autenticacao-autorizacao-e-auditoria.md)
- [`adr/0009-identidade-de-desenvolvimento-e-autorizacao-temporaria.md`](0009-identidade-de-desenvolvimento-e-autorizacao-temporaria.md)
