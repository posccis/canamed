# ADR-0008 — Autenticação, autorização e auditoria

- **Status:** Proposto (aguardando aprovação do responsável pelo projeto)
- **Data:** 2026-09-28
- **Decisores:** Responsável pelo projeto CANAMED
- **Relacionados:** ADR-0006, ADR-0007, `docs/seguranca-e-conformidade.md`

## Contexto

O CANAMED lida com dados pessoais sensíveis de saúde e será usado por perfis distintos — gestor,
recepcionista, profissional de saúde e equipe administrativa —, possivelmente com múltiplas clínicas
na mesma instalação. O `GEMINI.md` exige autenticação forte, MFA quando necessário, sessões seguras com
revogação, autorização por recurso verificada no backend e trilha de auditoria protegida contra alteração.

## Problema

Como autenticar usuários, autorizar acessos e registrar auditoria de forma compatível com LGPD e com os
princípios do prontuário eletrônico (CFM / NGS2)?

## Alternativas consideradas

| Alternativa | Prós | Contras |
| :--- | :--- | :--- |
| A. Sessão em cookie `httpOnly` + hash Argon2id + RBAC/ABAC + MFA (TOTP) | Revogação imediata de sessão, simples de proteger contra XSS, sem token exposto ao frontend | Requer store de sessão |
| B. JWT *stateless* (access + refresh) | Escala horizontalmente sem store | Revogação difícil; risco de token exposto; complexidade de rotação |
| C. Provedor de identidade externo (Keycloak *self-hosted* ou SaaS) | MFA e federação prontos; menos código próprio | Custo e dependência externa; dados de identidade fora do controle; região/LGPD a validar |

## Decisão proposta

Adotar a alternativa **A**, com as seguintes diretrizes:

1. Autenticação por **sessão em cookie `httpOnly` + `Secure` + `SameSite`**, com revogação individual e
   global; nenhum token de sessão acessível a JavaScript.
2. Credenciais protegidas com **Argon2id** (parâmetros a definir na SPEC), sem senha em texto puro e sem
   *fallback* inseguro.
3. **MFA (TOTP)** obrigatório para perfis administrativos/gestores; opcional para os demais, com evolução
   para obrigatório conforme risco.
4. Autorização **RBAC por clínica** (multi-tenant) com verificação **por recurso no backend**, nunca
   apenas na interface.
5. Trilha de auditoria *append-only* para login, logout, visualização de prontuário, criação, edição,
   exclusão e exportações, preservando usuário, data, hora, ação e recurso afetado.
6. Bloqueio progressivo e registro de tentativas de autenticação malsucedidas.
7. Preparar evolução para ICP-Brasil quando houver assinatura com valor jurídico.

Alternativa C permanece como opção caso o produto passe a exigir federação/SSO corporativo.

> **Esta decisão depende de aprovação explícita** e da definição de stack (ADR-0006).

## Consequências (se aprovada)

### Positivas

- Revogação de acesso efetiva, requisito direto de segurança e de conformidade.
- Modelo de permissões explícito, auditável e testável.

### Negativas / trade-offs

- Sessões exigem armazenamento de estado e estratégia de expiração.
- MFA adiciona atrito ao onboarding de usuários.

### Mitigações

- Expiração deslizante com *timeout* absoluto e fluxo de recuperação de acesso documentado.

## Impacto

- **Documentação:** políticas de sessão, senha e MFA a documentar em `docs/`.
- **SPECs:** toda funcionalidade declara quais permissões e quais eventos de auditoria gera.
- **Código:** middleware de autorização e camada de auditoria transversal obrigatórios.
- **Segurança / LGPD:** controle de acesso, rastreabilidade e identificação do responsável pelo registro.

## Referências

- [`GEMINI.md`](../GEMINI.md) — seções "Controle de acesso" e "Auditoria".
- [`docs/seguranca-e-conformidade.md`](../docs/seguranca-e-conformidade.md)
