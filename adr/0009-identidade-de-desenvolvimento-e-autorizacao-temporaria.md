# ADR-0009 — Identidade de desenvolvimento e autorização temporária

- **Status:** Substituído por [ADR-0010](0010-sessao-de-usuario-e-substituicao-da-identidade-de-desenvolvimento.md)
- **Data:** 2026-09-30
- **Aprovado em:** 2026-09-30, pelo responsável pelo projeto (por instrução direta de conclusão do projeto)
- **Decisores:** Responsável pelo projeto CANAMED
- **Relacionados:** ADR-0003, ADR-0004, ADR-0008, [`specs/0001-spec-de-fundacao.md`](../specs/0001-spec-de-fundacao.md),
  [`specs/0002-spec-agenda-de-consultas.md`](../specs/0002-spec-agenda-de-consultas.md)

## Contexto

O [ADR-0008](0008-autenticacao-autorizacao-e-auditoria.md) decidiu que a autenticação será por sessão
em cookie `httpOnly` com Argon2id, MFA e RBAC por clínica. Essa decisão depende de uma **SPEC própria**
de autenticação, auditoria e gestão de usuários, que ainda não existe.

A primeira funcionalidade de produto (SPEC-0002 — Agenda de Consultas) exige:

- usuário identificado para a trilha de auditoria (RN-013);
- verificação de permissões no backend, por recurso (`agenda:read`, `agenda:write`, `agenda:block`,
  `agenda:configure`);
- isolamento obrigatório por `clinic_id` (RN-004);
- autorização funcional para que a funcionalidade possa ser usada e testada ponta a ponta.

Sem uma fonte de identidade, a funcionalidade ficaria inutilizável em desenvolvimento, os testes de
integração não teriam como exercitar autorização e auditoria, e o frontend não poderia operar.

## Problema

Como prover identidade, permissões e escopo de clínica para a agenda enquanto a SPEC de autenticação
não existe, sem reduzir a segurança do produto e sem criar trabalho que precise ser descartado?

## Alternativas consideradas

| Alternativa | Prós | Contras |
| :--- | :--- | :--- |
| A. Implementar agora a autenticação completa do ADR-0008 | Resolve definitivamente | Antecipa uma SPEC que não existe, contrariando a regra fundamental do `GEMINI.md` (nenhuma funcionalidade sem SPEC); alto retrabalho |
| **B. Abstração de identidade com implementação de desenvolvimento resolvida por cabeçalho e *fail closed* fora de DEV/TEST** | Permite operar e testar a agenda hoje; a fronteira de autorização já nasce no backend, por recurso; a troca futura é substituir uma implementação de interface | Exige disciplina para não promover o mecanismo a produção; é uma superfície que não pode existir fora de desenvolvimento |
| C. Desligar autorização na agenda nesta fase | Menos código | Viola o ADR-0008 e o `GEMINI.md` ("nunca confiar apenas na interface"); risco de a regra nunca ser reintroduzida |
| D. Dados de clínica e usuário fixos no código | Muito simples | Mistura dado de demonstração com regra de negócio; não permite testar perfis nem isolamento |

## Decisão

Adotar a alternativa **B**, com as seguintes diretrizes:

1. Toda a aplicação depende da abstração `ICurrentActorAccessor`, que devolve o ator corrente
   (`UserId`, `Name`, `ClinicId`, `Permissions`, `ProfessionalId` opcional).
2. A implementação atual (`DevelopmentActorAccessor`) resolve o ator **apenas** em `Development` e
   `Testing`, a partir de cabeçalhos HTTP:

   | Cabeçalho | Uso |
   | :--- | :--- |
   | `X-Canamed-Actor-Id` | Identificador do usuário registrado na auditoria |
   | `X-Canamed-Actor-Name` | Nome do usuário para leitura humana da trilha |
   | `X-Canamed-Clinic-Id` | Clínica ativa (escopo multi-clínica) |
   | `X-Canamed-Permissions` | Permissões separadas por vírgula |
   | `X-Canamed-Professional-Id` | Profissional vinculado ao usuário (`agenda:read:own`) |

3. **Fail closed:** fora de `Development`/`Testing` o ator nunca é resolvido e a API responde
   `401` em Problem Details (`authentication-required`). Não existe *fallback* permissivo.
4. As permissões são exigidas **no backend**, rota a rota, e o acesso negado gera evento de auditoria
   (`clinic.access_denied`) com usuário, data, hora e recurso.
5. Sem cabeçalhos em desenvolvimento, o ator recebe as permissões de agenda completas para permitir a
   operação local; com cabeçalhos, valem exatamente as permissões informadas (permite testar perfis).
6. O frontend envia a identidade de desenvolvimento a partir de variáveis `VITE_DEV_*` do `.env` local,
   versionadas apenas como exemplo no `.env.example` (não são segredos).

> Esta decisão é **temporária e explícita**: a SPEC de autenticação e auditoria do ADR-0008 substituirá
> esta implementação, mantendo a abstração `ICurrentActorAccessor`. Este ADR será então marcado como
> `Substituído por SPEC-XXXX`/novo ADR.

## Consequências

### Positivas

- A funcionalidade de produto pode evoluir agora sem violar o processo spec-driven.
- A autorização por recurso e a auditoria já existem no backend e são exercitadas por testes de
  integração, reduzindo o risco de regressão quando a autenticação real chegar.
- O isolamento por `clinic_id` é verificável hoje (um usuário de outra clínica recebe `404`).

### Negativas / trade-offs

- Existe uma superfície de identificação que só é segura porque está restrita a DEV/TEST.
- Um ambiente de produção configurado incorretamente responderia `401` a todas as rotas privadas
  (comportamento desejado: falha segura, não acesso indevido).

### Mitigações

- Verificação explícita de ambiente na implementação, sem configuração que a habilite fora de DEV/TEST.
- Testes automatizados cobrindo `401`/`403` e isolamento entre clínicas.
- Registro desta decisão no `docs/CHANGELOG_AGENTE.md` e na seção de pendências do `PROJECT_BRIEF.md`.

## Impacto

- **Documentação:** `docs/guia-de-uso-e-execucao.md` descreve o uso e a remoção futura.
- **SPECs:** a SPEC de autenticação deverá substituir a implementação e manter os contratos de
  permissão já declarados na SPEC-0002.
- **Código:** `Canamed.Application.Identity` (abstração), `Canamed.Infrastructure.Identity`
  (implementação de desenvolvimento) e filtro de permissões na API.
- **Segurança / LGPD:** nenhuma permissão é concedida fora de DEV/TEST; a trilha de auditoria continua
  registrando usuário, data, hora, ação e recurso afetado.

## Referências

- [`GEMINI.md`](../GEMINI.md) — Controle de acesso, Auditoria e Regras Permanentes.
- [`adr/0008-autenticacao-autorizacao-e-auditoria.md`](0008-autenticacao-autorizacao-e-auditoria.md)
- [`docs/seguranca-e-conformidade.md`](../docs/seguranca-e-conformidade.md)
