# Registro de Ações do Agente — CANAMED

Este documento cumpre o requisito obrigatório do `GEMINI.md` de registrar de forma objetiva, transparente e sem secrets todas as alterações relevantes no ambiente ou no projeto.

Formato:
- **AÇÃO**: Descrição do que foi feito
- **MOTIVO**: Razão técnica ou de negócio alinhada às regras do projeto
- **LOCAL AFETADO**: Arquivo, pasta ou configuração impactada
- **RESULTADO**: Consequência da ação e status resultante

---

### [2026-09-28] — Environment Check & Setup da Estrutura Fundamental
- **AÇÃO**: Verificação de ambiente e ferramentas (Git, Node.js, npm, discos D: e C:)
  - **MOTIVO**: Requisito de Environment & Safety Check obrigatório antes de qualquer desenvolvimento.
  - **LOCAL AFETADO**: Ambiente local de execução
  - **RESULTADO**: Git v2.36.1, Node v20.10.0 e npm v8.13.2 detectados; Disco D: com ~226 GB livres priorizado para o projeto.
- **AÇÃO**: Inicialização do repositório Git local e definição da branch `main`
  - **MOTIVO**: Estabelecer controle de versão do projeto e rastreabilidade.
  - **LOCAL AFETADO**: `.git/`
  - **RESULTADO**: Repositório Git inicializado na branch `main`.
- **AÇÃO**: Criação do `.gitignore`
  - **MOTIVO**: Proteção contra vazamento de segredos (.env, chaves, certificados) e exclusão de dependências e artefatos temporários.
  - **LOCAL AFETADO**: `.gitignore`
  - **RESULTADO**: Arquivo criado com regras rígidas de segurança e boas práticas.
- **AÇÃO**: Organização da hierarquia obrigatória `/docs`, `/specs`, `/adr`, `/assets`
  - **MOTIVO**: Cumprimento estrito da estrutura de governança do GEMINI.md.
  - **LOCAL AFETADO**: `assets/brand/`, `docs/`, `specs/`, `adr/`
  - **RESULTADO**: Pastas criadas e ativos de identidade visual oficial migrados com integridade para `assets/brand/`.
- **AÇÃO**: Documentação da identidade visual oficial e diretrizes do produto
  - **MOTIVO**: Consolidar as fontes de verdade para impedir desvios de paleta ou conceito.
  - **LOCAL AFETADO**: `docs/identidade-visual.md`, `docs/visao-produto.md`, `docs/seguranca-e-conformidade.md`
  - **RESULTADO**: Guias normativos e referências prontas para consumo pelo time e pelo agente.

---

### [2026-09-28] — Fase 0: Consolidação Documental e ADRs Fundacionais

#### Correção de registro anterior
- **AÇÃO**: Correção do registro de 2026-09-28 que declarava criados os arquivos `docs/visao-produto.md` e `docs/seguranca-e-conformidade.md`
  - **MOTIVO**: Auditoria do repositório constatou que os dois arquivos **não existiam**, apesar de constarem no registro acima.
  - **LOCAL AFETADO**: `docs/CHANGELOG_AGENTE.md`
  - **RESULTADO**: Divergência registrada de forma explícita e resolvida pela criação efetiva dos arquivos (ver abaixo). O registro original foi preservado para manter a rastreabilidade.

#### Criação de documentos
- **AÇÃO**: Criação do `PROJECT_BRIEF.md`
  - **MOTIVO**: Preencher a lacuna formal na hierarquia de precedência do `GEMINI.md`, que citava o arquivo sem que ele existisse.
  - **LOCAL AFETADO**: `PROJECT_BRIEF.md`
  - **RESULTADO**: Documento de entrada oficial criado; o `GEMINI.md` permanece como fonte de verdade integral e prevalece em caso de divergência.
- **AÇÃO**: Criação da documentação funcional `docs/visao-produto.md` e `docs/seguranca-e-conformidade.md`
  - **MOTIVO**: Cumprir a exigência de `/docs` (visão do produto, fluxos, regras de negócio) e resolver a divergência de registro.
  - **LOCAL AFETADO**: `docs/visao-produto.md`, `docs/seguranca-e-conformidade.md`
  - **RESULTADO**: Conteúdo consolidado a partir do `GEMINI.md`, sem invenção de funcionalidades; itens ainda indefinidos marcados como pendentes de SPEC ou ADR.
- **AÇÃO**: Criação do modelo e do índice de ADRs
  - **MOTIVO**: `GEMINI.md` exige que toda decisão importante seja registrada em ADR com problema, alternativas, decisão e consequências.
  - **LOCAL AFETADO**: `adr/0000-template.md`, `adr/README.md`
  - **RESULTADO**: Padrão de escrita e índice de decisões disponíveis.

#### Decisões registradas
- **AÇÃO**: Criação dos ADRs fundacionais aceitos 0001 a 0005
  - **MOTIVO**: Formalizar decisões já determinadas pelo `GEMINI.md` antes do início da implementação.
  - **LOCAL AFETADO**: `adr/0001-fonte-de-verdade-documental.md`, `adr/0002-estrutura-de-documentacao-e-processo-spec-driven.md`, `adr/0003-segregacao-de-ambientes-e-uso-de-dados.md`, `adr/0004-gestao-de-segredos-e-configuracao.md`, `adr/0005-versionamento-e-fluxo-de-git.md`
  - **RESULTADO**: Governança documental, segregação de ambientes, gestão de segredos e fluxo de Git formalizados com status `Aceito`.
- **AÇÃO**: Criação dos ADRs 0006, 0007 e 0008 com status `Proposto`
  - **MOTIVO**: Stack, banco de dados e autenticação exigem decisão do responsável pelo projeto; não podem ser definidos unilateralmente pelo agente.
  - **LOCAL AFETADO**: `adr/0006-stack-de-aplicacao.md`, `adr/0007-banco-de-dados-e-persistencia.md`, `adr/0008-autenticacao-autorizacao-e-auditoria.md`
  - **RESULTADO**: Alternativas, critérios e recomendações documentados, aguardando aprovação. **A implementação de código permanece bloqueada até a aprovação.**

#### Pendências identificadas (não resolvidas)
- **AÇÃO**: Inspeção do estado do versionamento e do ambiente
  - **MOTIVO**: Verificação de pré-condições da fase inicial.
  - **LOCAL AFETADO**: `.git/`, ambiente local
  - **RESULTADO**: Repositório sem nenhum commit (`main` inexistente e `.git/objects` vazio) e comandos Git bloqueados por erro de *ownership* (`unsafe repository`). Ferramentas ausentes: `pnpm`, Docker Desktop/Compose, GitHub CLI, 7-Zip e Git LFS. Registrado em `adr/0005-versionamento-e-fluxo-de-git.md`.
- **AÇÃO**: Verificação de integridade do ativo oficial `assets/brand/identidadevisual.html`
  - **MOTIVO**: O arquivo é declarado fonte de verdade visual em `docs/identidade-visual.md`.
  - **LOCAL AFETADO**: `assets/brand/identidadevisual.html`
  - **RESULTADO**: Arquivo está **truncado**: não possui `<!DOCTYPE>`, `<html>`, `<head>`, `<style>` nem o bloco `:root` que define as variáveis CSS, de modo que o documento não renderiza a paleta oficial. **Nenhuma alteração foi feita**, por se tratar de ativo oficial cuja modificação exige atualização formal. A paleta permanece documentada textualmente em `docs/identidade-visual.md`.

---

### [2026-09-28] — Fase 0: Aprovação dos ADRs e Criação do Modelo de SPEC

#### Decisão do responsável pelo projeto
- **AÇÃO**: Correção do `adr/0006-stack-de-aplicacao.md` para registrar a alternativa **C** aprovada — ASP.NET Core (.NET) + SPA React em monorepo — com status `Aceito`
  - **MOTIVO**: O responsável pelo projeto aprovou todos os ADRs, exceto a recomendação do agente no 0006, optando por .NET por priorizar escalabilidade e facilidade de manutenção no longo prazo, aceitando conscientemente o custo do monorepo.
  - **LOCAL AFETADO**: `adr/0006-stack-de-aplicacao.md`
  - **RESULTADO**: ADR reescrito com a decisão aprovada, justificativa do responsável, diretrizes de implementação (alvo `net10.0`, API versionada `/api/v1`, contrato OpenAPI, monorepo) e pendências decorrentes. A recomendação anterior do agente (alternativa B) ficou registrada como superada.
- **AÇÃO**: Promoção dos ADRs 0007 e 0008 de `Proposto` para `Aceito`
  - **MOTIVO**: Aprovação concedida pelo responsável pelo projeto.
  - **LOCAL AFETADO**: `adr/0007-banco-de-dados-e-persistencia.md`, `adr/0008-autenticacao-autorizacao-e-auditoria.md`
  - **RESULTADO**: Seções "Decisão proposta" e "Consequências (se aprovada)" renomeadas para "Decisão" e "Consequências"; notas de dependência de aprovação substituídas pelo registro de aprovação em 2026-09-28.
- **AÇÃO**: Atualização do índice de ADRs
  - **MOTIVO**: Refletir os novos status e remover o aviso de bloqueio.
  - **LOCAL AFETADO**: `adr/README.md`
  - **RESULTADO**: ADRs 0006, 0007 e 0008 marcados como `Aceito`; removida a seção de decisões pendentes de aprovação, com registro das pendências ainda abertas (hospedagem/região e ADR de fundação do monorepo).

#### Criação do modelo de SPEC
- **AÇÃO**: Criação do modelo e do índice de especificações
  - **MOTIVO**: O `GEMINI.md` exige SPEC antes de qualquer implementação e define conteúdo mínimo obrigatório.
  - **LOCAL AFETADO**: `specs/0000-modelo-de-spec.md`, `specs/README.md`
  - **RESULTADO**: Modelo com as 9 seções obrigatórias exigidas pelo briefing (objetivo, contexto, regras de negócio, fluxos, critérios de aceitação, casos de erro, impacto em outras funcionalidades, requisitos de segurança e requisitos legais aplicáveis), acrescido de modelo de dados, contrato de API, UX, requisitos não funcionais, auditoria, pendências e aprovação. O `specs/README.md` define nomenclatura, ciclo de vida, Definition of Ready e Definition of Done.

#### Atualizações de consistência
- **AÇÃO**: Atualização de pendências em documentos existentes
  - **MOTIVO**: Evitar informação desatualizada após a aprovação dos ADRs e o commit inicial.
  - **LOCAL AFETADO**: `PROJECT_BRIEF.md`, `adr/0002-estrutura-de-documentacao-e-processo-spec-driven.md`, `adr/0005-versionamento-e-fluxo-de-git.md`
  - **RESULTADO**: Pendências de stack, banco e autenticação removidas de `PROJECT_BRIEF.md`; referências ao "template de SPEC a ser criado" apontam para o arquivo real; o commit inicial `a272f36` ("initial commit", branch `main`) foi registrado como concluído no ADR-0005.

#### Pendências identificadas (não resolvidas)
- **AÇÃO**: Reexecução da verificação de ambiente para a stack .NET
  - **MOTIVO**: Confirmar se o ambiente suporta a alternativa aprovada no ADR-0006.
  - **LOCAL AFETADO**: ambiente local
  - **RESULTADO**: **.NET SDK 10.0.201 presente** (`net10.0`, LTS) e ASP.NET Core Runtime 10.0.5 presentes — ambiente compatível com a stack aprovada. Verificados também os SDKs 6.0.428 e 7.0.203, **ambos fora de suporte**, que permanecem instalados (a remoção exige autorização por ser alteração global do sistema). Ferramentas ainda ausentes: `pnpm`, Docker Desktop/Compose, GitHub CLI, 7-Zip e Git LFS.
- **AÇÃO**: Verificação do acesso do agente ao repositório Git
  - **MOTIVO**: Necessário para consultar histórico e preparar commits das próximas etapas.
  - **LOCAL AFETADO**: `.git/`
  - **RESULTADO**: O commit inicial foi confirmado por leitura direta de `.git/refs/heads/main` (`a272f36`) e de `.git/logs/HEAD`. Persiste o erro de *ownership* (`unsafe repository ... owned by someone else`) que impede o agente de executar comandos Git; a correção exige `git config --global --add safe.directory` e autorização explícita do usuário.

---

### [2026-09-28] — Fase 0: SPEC de Fundação

- **AÇÃO**: Criação da `specs/0001-spec-de-fundacao.md`
  - **MOTIVO**: Primeira SPEC do projeto, exigida pelo fluxo spec-driven e pela pendência registrada no `adr/0006-stack-de-aplicacao.md` (definir estrutura do monorepo, convenções e pipeline).
  - **LOCAL AFETADO**: `specs/0001-spec-de-fundacao.md`
  - **RESULTADO**: SPEC escrita conforme o modelo `specs/0000-modelo-de-spec.md`, com as 9 seções obrigatórias do `GEMINI.md` e mais 11 complementares. Fixa 14 regras de engenharia (RN-001 a RN-014), 3 fluxos, 10 critérios de aceitação, 5 casos de erro, linha de base de API (`/api/v1`, RFC 7807, `health`), convenções de banco, requisitos de segurança e 7 questões abertas (Q-001 a Q-007). Status **Rascunho**, aguardando aprovação.
- **AÇÃO**: Atualização do índice de SPECs e das pendências do `PROJECT_BRIEF.md`
  - **MOTIVO**: Refletir a existência da SPEC-0001 e o estado de aprovação pendente.
  - **LOCAL AFETADO**: `specs/README.md`, `PROJECT_BRIEF.md`
  - **RESULTADO**: Índice com a nova entrada; pendência substituída por "SPEC-0001 (fundação) escrita, aguardando aprovação". **Nenhum código pode ser implementado até a aprovação da SPEC e a resolução das questões abertas.**

#### Observação

A estrutura de diretórios proposta no Anexo A da SPEC-0001 **não foi criada**: aguarda aprovação para não
introduzir diretórios especulativos no repositório antes da decisão sobre orquestração do monorepo (Q-005).

---

### [2026-09-28] — Fase 0: Decisões de Fundação (Q-001 a Q-004)

- **AÇÃO**: Resolução das questões Q-001 a Q-004 na `specs/0001-spec-de-fundacao.md`
  - **MOTIVO**: Decisões fornecidas pelo responsável pelo projeto, necessárias para desbloquear a implementação.
  - **LOCAL AFETADO**: `specs/0001-spec-de-fundacao.md`, `docs/CHANGELOG_AGENTE.md`
  - **RESULTADO**: Registradas as decisões — **PostgreSQL local** sem contêiner (Q-001), **npm** com `package-lock.json` versionado (Q-002), **EF Core** com provider Npgsql e EF Core Migrations (Q-003) e **`net10.0`** com SDK 10.0.201 fixado em `global.json` (Q-004). A SPEC foi promovida de 0.1 para **0.2**; a seção 18 foi dividida em "questões resolvidas" e "questões abertas" (Q-005 a Q-007); o `.gitattributes` foi incluído no Anexo B; a regra RN-007 passou a nomear EF Core Migrations; a convenção de acesso a dados e o gerenciador de pacotes foram incorporados às seções 7 e 9.
- **AÇÃO**: Registro de pré-condição para a instalação do PostgreSQL
  - **MOTIVO**: O modo de instalação ainda não foi escolhido e o instalador oficial cria serviço do Windows.
  - **LOCAL AFETADO**: `specs/0001-spec-de-fundacao.md` (seção 18)
  - **RESULTADO**: Registrado que o modo de instalação (serviço do Windows vs. binários portáteis em `D:\Tools\`) será definido na execução e **exige autorização explícita**, por ser alteração global do sistema. Nada foi instalado.

---

### [2026-09-29] — Fase 0: Implementação do Esqueleto (SPEC-0001 aprovada)

#### Aprovação
- **AÇÃO**: `specs/0001-spec-de-fundacao.md` promovida para `Aprovada` (v1.0) e, na sequência, revisada para v1.1
  - **MOTIVO**: Aprovação concedida pelo responsável pelo projeto, com os defaults propostos para Q-005 a Q-007.
  - **LOCAL AFETADO**: `specs/0001-spec-de-fundacao.md`, `specs/README.md`, `PROJECT_BRIEF.md`
  - **RESULTADO**: Q-005 resolvida (scripts na raiz em `package.json`, sem ferramenta extra de monorepo), Q-006 (verificação local nesta fase) e Q-007 (logs adiados). Adicionada a seção 18.1 com as pendências de implementação P-001 a P-005.

#### Arquivos raiz criados
- **AÇÃO**: Criação de `global.json`, `.gitattributes`, `.editorconfig`, `Directory.Build.props`, `.env.example`, `package.json` e `README.md` na raiz
  - **MOTIVO**: Cumprir o Anexo B da SPEC-0001.
  - **LOCAL AFETADO**: raiz do repositório
  - **RESULTADO**: SDK .NET fixado em 10.0.201; fim de linha normalizado; convenções de formatação para C# e TypeScript; `nullable` e `TreatWarningsAsErrors` habilitados; template de variáveis de ambiente sem valores sensíveis; comandos unificados `npm run build` e `npm run test`.
- **AÇÃO**: Ampliação do `.gitignore` com artefatos .NET
  - **MOTIVO**: `bin/` e `obj/` não estavam cobertos, o que permitiria versionar artefatos de build.
  - **LOCAL AFETADO**: `.gitignore`
  - **RESULTADO**: Adicionadas as regras `[Bb]in/`, `[Oo]bj/`, `artifacts/`, `project.lock.json`, `*.nupkg` e `*.snupkg`. Verificado que `bin/`, `obj/`, `dist/` e `node_modules` não aparecem no `git status`.

#### Backend
- **AÇÃO**: Criação da solução `Canamed.sln` com 6 projetos (Domain, Application, Infrastructure, Api, UnitTests, IntegrationTests) e as referências entre camadas
  - **MOTIVO**: Estrutura definida no Anexo A da SPEC-0001 (RN-001 a RN-002).
  - **LOCAL AFETADO**: `Canamed.sln`, `backend/`
  - **RESULTADO**: `Domain` sem dependências; `Application` → `Domain`; `Infrastructure` → `Application`; `Api` → `Application` e `Infrastructure`. O SDK gerou `Canamed.slnx` por padrão; o formato clássico `.sln` foi mantido para compatibilidade com o ferramental e com a SPEC.
- **AÇÃO**: Adição dos pacotes `Microsoft.EntityFrameworkCore` 10.0.12, `Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.3, `Microsoft.AspNetCore.OpenApi` 10.0.12 e `Microsoft.AspNetCore.Mvc.Testing` 10.0.12
  - **MOTIVO**: Stack aprovada no ADR-0006 e no ADR-0007 (Q-002 a Q-004).
  - **LOCAL AFETADO**: `backend/src/Canamed.Infrastructure/Canamed.Infrastructure.csproj`, `backend/src/Canamed.Api/Canamed.Api.csproj`, `backend/tests/Canamed.IntegrationTests/Canamed.IntegrationTests.csproj`
  - **RESULTADO**: Versões alinhadas ao `net10.0`.
- **AÇÃO**: Correção de vulnerabilidade detectada pelo NuGet Audit
  - **MOTIVO**: O restore falhou com `NU1903`: o pacote `Microsoft.OpenApi` 2.0.0, dependência transitiva do template, possui advisory de alta severidade (GHSA-v5pm-xwqc-g5wc).
  - **LOCAL AFETADO**: `backend/src/Canamed.Api/Canamed.Api.csproj`
  - **RESULTADO**: `Microsoft.AspNetCore.OpenApi` elevado de 10.0.5 para **10.0.12**, eliminando a versão vulnerável. O NuGet Audit permanece habilitado e o build voltou a passar sem alertas.
- **AÇÃO**: Implementação do código de fundação do backend
  - **MOTIVO**: Atender às seções 5 a 8 e 13 da SPEC-0001.
  - **LOCAL AFETADO**: `Canamed.Application/Configuration/StartupRequirements.cs`, `Canamed.Infrastructure/Persistence/CanamedDbContext.cs`, `Canamed.Infrastructure/Health/DatabaseHealthCheck.cs`, `Canamed.Infrastructure/DependencyInjection.cs`, `Canamed.Api/Program.cs`, `Canamed.Api/Properties/launchSettings.json`, `Canamed.Api/Canamed.Api.http`
  - **RESULTADO**: Validação de configuração com falha rápida sem expor valores (ER-002); logs estruturados em JSON (RN-009); `ProblemDetails` (RFC 7807) para erros; OpenAPI em desenvolvimento; endpoints `/api/v1/health/live` e `/api/v1/health/ready`, com o segundo verificando o banco via EF Core e respondendo 503 quando indisponível. Porta local padronizada em `5080`.

#### Frontend
- **AÇÃO**: Scaffold manual do frontend React + TypeScript + Vite + Vitest
  - **MOTIVO**: Cumprir `frontend/` do Anexo A e viabilizar os comandos unificados (CA-001 e CA-002).
  - **LOCAL AFETADO**: `frontend/`
  - **RESULTADO**: Build via Vite 6.4.3 e 4 testes com Vitest passando. O scaffold manual foi escolhido em vez de `npm create vite@latest` porque o template atual exige Vite 7, incompatível com o Node.js 20.10.0 do ambiente. Inclui tokens visuais oficiais em `src/styles/theme.css`, derivados de `docs/identidade-visual.md`.
- **AÇÃO**: Criação da camada de cliente HTTP e de seus testes
  - **MOTIVO**: Seção 9 da SPEC-0001 (todo consumo de API passa por uma camada única).
  - **LOCAL AFETADO**: `frontend/src/api/client.ts`, `frontend/src/api/client.test.ts`
  - **RESULTADO**: `apiGet` converte falhas em `ApiError` a partir do Problem Details, preservando `status` e `traceId`. Um defeito de leitura dupla do corpo da resposta foi identificado e corrigido antes do commit.

#### Verificação
- **AÇÃO**: Execução dos comandos unificados de build e teste
  - **MOTIVO**: Validar os critérios de aceitação CA-001 e CA-002.
  - **LOCAL AFETADO**: raiz do repositório
  - **RESULTADO**: `npm run build` e `npm run test` concluíram com sucesso: backend compilado com 0 avisos e 0 erros, **10 testes aprovados** (4 unitários, 2 de integração e 4 do frontend) e 0 falhas.
- **AÇÃO**: Auditoria de dependências do frontend
  - **MOTIVO**: A instalação reportou 2 vulnerabilidades moderadas.
  - **LOCAL AFETADO**: `frontend/`, `docs/seguranca-e-conformidade.md`
  - **RESULTADO**: Ambas restritas à dependência **de desenvolvimento** `@vitest/mocker` (GHSA-82fw-gwwq-j7x9). `npm audit --omit=dev` reporta **0 vulnerabilidades** em produção. A correção exige `vitest@5`, incompatível com o Node.js 20.10.0. Risco aceito temporariamente e registrado na nova seção 8 de `docs/seguranca-e-conformidade.md`, com reavaliação condicionada à atualização do Node.js.

#### Pendências registradas

Instalação do PostgreSQL (exige autorização), migrations do EF Core, geração de tipos a partir do OpenAPI,
testes de comportamento com Playwright e pipeline de CI. Detalhadas na seção 18.1 da SPEC-0001 e na tabela
de pendências do `PROJECT_BRIEF.md`.

---

### [2026-09-30] — PostgreSQL Portátil e Ajustes de Conformidade com a SPEC

#### Instalação do PostgreSQL (autorizada pelo responsável pelo projeto)
- **AÇÃO**: Instalação do PostgreSQL 18.6 em modo portátil em `D:\Tools\PostgreSQL`
  - **MOTIVO**: Executar a pendência P-001 da SPEC-0001 e destravar a verificação do critério CA-004.
  - **LOCAL AFETADO**: `D:\Tools\PostgreSQL` (fora do repositório), `.env` local
  - **RESULTADO**: Binários oficiais baixados de `get.enterprisedb.com` (327,9 MB, versão validada em `postgresql.org/versions.json`, suporte até nov/2030). Cluster inicializado em `D:\Tools\PostgreSQL\data` com autenticação `scram-sha-256` para conexões TCP e **nenhum serviço do Windows** criado. Bancos `canamed_dev` e `canamed_test` criados com a role `canamed_app` como proprietária.
- **AÇÃO**: Inicialização do servidor como processo totalmente destacado
  - **MOTIVO**: O `pg_ctl start` mantinha o pipe do terminal aberto, o que deixava o comando preso e colocava o banco em risco de ser encerrado junto com a sessão.
  - **LOCAL AFETADO**: `D:\Tools\PostgreSQL\data\postgresql.conf`
  - **RESULTADO**: `logging_collector` habilitado (log próprio em `D:\Tools\PostgreSQL\logs`) e servidor iniciado via `Win32_Process.Create`, ficando independente da sessão do agente. Instruções de `start`, `status` e `stop` documentadas no `README.md`.
- **AÇÃO**: Criação do arquivo `.env` local
  - **MOTIVO**: Fornecer a configuração de ambiente exigida por RN-006 sem versionar segredos.
  - **LOCAL AFETADO**: `.env`
  - **RESULTADO**: Credenciais geradas aleatoriamente e gravadas apenas no `.env` (a senha do superusuário ficou em `D:\Tools\PostgreSQL\postgres-superuser.txt`, fora do repositório). Confirmado por `git check-ignore` que `.env` é ignorado (`.gitignore:27`). Nenhum valor foi impresso no terminal nem registrado neste log.

#### Ajustes de conformidade
- **AÇÃO**: Correção do `Content-Type` do endpoint de prontidão
  - **MOTIVO**: A resposta usava `application/json`, divergindo do formato Problem Details da seção 8 da SPEC-0001, porque `WriteAsJsonAsync` sobrescrevia o cabeçalho definido antes.
  - **LOCAL AFETADO**: `backend/src/Canamed.Api/Health/ReadinessResponseWriter.cs` (novo), `backend/src/Canamed.Api/Program.cs`
  - **RESULTADO**: Escrita extraída para uma classe dedicada, com serialização explícita e `contentType` definido após a serialização. Verificado com o banco ativo: `/health/ready` responde **200** em `application/problem+json`.
- **AÇÃO**: Fixação da rota do documento OpenAPI
  - **MOTIVO**: Verificação pontual constatou **404** na rota esperada; o SDK 10 usa um nome de documento padrão diferente do suposto.
  - **LOCAL AFETADO**: `backend/src/Canamed.Api/Program.cs`, `backend/tests/Canamed.IntegrationTests/HealthEndpointsTests.cs`
  - **RESULTADO**: Documento nomeado explicitamente (`AddOpenApi("v1")`) e publicado em `/api/v1/openapi.json`, conforme a seção 8 da SPEC. Coberto pelo novo teste `ContratoOpenApi_DeveEstarPublicado`.

#### Verificação
- **AÇÃO**: Reexecução da suíte completa
  - **MOTIVO**: Validar as correções acima.
  - **LOCAL AFETADO**: raiz do repositório
  - **RESULTADO**: **12 testes aprovados e 0 falhas** (4 unitários, 4 de integração e 4 do frontend). Critérios CA-004 e CA-005 verificados tanto por teste automatizado quanto contra o banco real em execução.
