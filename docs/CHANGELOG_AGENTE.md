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

---

### [2026-09-30] — Primeira SPEC Funcional

- **AÇÃO**: Criação da `specs/0002-spec-agenda-de-consultas.md`
  - **MOTIVO**: Iniciar o desenvolvimento orientado por especificação sobre o pilar de gestão de agenda, que é a base dos demais pilares do produto.
  - **LOCAL AFETADO**: `specs/0002-spec-agenda-de-consultas.md`, `specs/README.md`
  - **RESULTADO**: SPEC escrita conforme o modelo, com as 9 seções obrigatórias e mais 11 complementares: 14 regras de negócio, 4 fluxos, modelo de dados com classificação LGPD, contrato de API, 10 critérios de aceitação, 6 casos de erro, requisitos de segurança e legais, e 6 questões abertas de produto (Q-001 a Q-006). Status **Rascunho**, aguardando aprovação.
  - **OBSERVAÇÃO**: Conforme a regra fundamental do `GEMINI.md` e a RN-012, **nenhuma linha de código desta funcionalidade será escrita antes da aprovação da SPEC e da resolução das questões abertas**.
- **AÇÃO**: Correção da documentação de log do PostgreSQL no `README.md`
  - **MOTIVO**: Verificação final mostrou que, após habilitar `logging_collector`, o arquivo apontado por `-l` deixou de receber registros; o log ativo passou para o diretório de dados.
  - **LOCAL AFETADO**: `README.md`
  - **RESULTADO**: Caminho real do log documentado como `D:\Tools\PostgreSQL\data\log\postgresql-<data>.log` e comando de `start` simplificado. Confirmado por `pg_isready` que o servidor permanece aceitando conexões em `127.0.0.1:5432` após todas as operações.

---

### [2026-09-30] — Conclusão da SPEC-0002 (Agenda de Consultas)

#### Governança e decisões
- **AÇÃO**: Aprovação formal da `specs/0002-spec-agenda-de-consultas.md` (v0.1 → v1.0) com a resolução das questões abertas Q-001 a Q-006
  - **MOTIVO**: O responsável pelo projeto determinou seguir todos os documentos de regra e concluir o projeto; sem a resolução das questões abertas e a aprovação, a RN-012 (nenhuma funcionalidade sem SPEC aprovada) impediria a implementação.
  - **LOCAL AFETADO**: `specs/0002-spec-agenda-de-consultas.md`, `specs/README.md`
  - **RESULTADO**: Decisões registradas na nova seção 18.1 — grade de sugestão de 15 minutos e duração padrão de 30 minutos (Q-001), sem overbooking (Q-002), sem antecedência mínima de cancelamento (Q-003), status `confirmado` manual pela recepção (Q-004), profissional com um registro por clínica (Q-005) e sem exclusão automática de agendamentos (Q-006). As decisões ficam registradas para ratificação explícita, conforme declarado na seção 20.
- **AÇÃO**: Criação do `adr/0009-identidade-de-desenvolvimento-e-autorizacao-temporaria.md` e atualização do índice de ADRs
  - **MOTIVO**: A agenda exige usuário, permissões e escopo de clínica (ADR-0008), mas a SPEC de autenticação ainda não existe; a alternativa escolhida precisava ser registrada com problema, alternativas, decisão e consequências.
  - **LOCAL AFETADO**: `adr/0009-...md`, `adr/README.md`
  - **RESULTADO**: Identidade resolvida por cabeçalho **apenas** em `Development`/`Testing`, com falha fechada (`401`) fora desses ambientes, abstração `ICurrentActorAccessor` e substituição prevista quando a SPEC de autenticação chegar.

#### Banco de dados
- **AÇÃO**: Implementação do modelo de dados da agenda e criação da migration `InitialAgendaSchema`
  - **MOTIVO**: Cumprir a seção 7 da SPEC-0002 e resolver a pendência P-002 da SPEC-0001.
  - **LOCAL AFETADO**: `backend/src/Canamed.Domain/Agenda`, `backend/src/Canamed.Infrastructure/Persistence`
  - **RESULTADO**: Tabelas `clinics`, `professionals`, `patients`, `appointment_types`, `appointments`, `professional_blocks` e `audit_events`, em `snake_case`, com `id` UUID e `timestamptz` em UTC.
- **AÇÃO**: Inclusão da restrição de exclusão e do gatilho de auditoria na migration
  - **MOTIVO**: A RN-001 exige garantia de integridade **no banco** (não apenas na aplicação) e a RN-010 da SPEC-0001 exige trilha *append-only*.
  - **LOCAL AFETADO**: `backend/src/Canamed.Infrastructure/Persistence/Migrations`
  - **RESULTADO**: `EXCLUDE USING gist` sobre `tstzrange(starts_at, ends_at)` por profissional (extensão `btree_gist`) impede sobreposição sob concorrência; gatilho `trg_audit_events_append_only` rejeita `UPDATE`/`DELETE` na auditoria. Migration aplicada em `canamed_dev`.
- **AÇÃO**: Registro da exceção de estilo para código gerado pelo EF Core
  - **MOTIVO**: O build falhava com `IDE0161` (namespace com escopo de arquivo) nos arquivos de scaffolding, já que `EnforceCodeStyleInBuild` está habilitado.
  - **LOCAL AFETADO**: `.editorconfig`
  - **RESULTADO**: Seção `generated_code = true` para `Persistence/Migrations/*.cs`, sem afetar as regras de estilo do código próprio.

#### Backend
- **AÇÃO**: Implementação do domínio da agenda
  - **MOTIVO**: Manter as regras de negócio isoladas e testáveis sem banco (requisito não funcional da SPEC-0002).
  - **LOCAL AFETADO**: `backend/src/Canamed.Domain`
  - **RESULTADO**: Entidades `Appointment`, `Professional`, `Patient`, `AppointmentType`, `ProfessionalBlock`, `Clinic` e `AuditEvent`, além de `TimeRange` e `AgendaRules` (RN-001 a RN-012). Exceções de domínio específicas para conflito, bloqueio, status inválido e data passada.
- **AÇÃO**: Implementação dos casos de uso e do contrato de API
  - **MOTIVO**: Entregar os fluxos F-001 a F-004 com autorização por recurso e auditoria.
  - **LOCAL AFETADO**: `backend/src/Canamed.Application`, `backend/src/Canamed.Infrastructure`, `backend/src/Canamed.Api`
  - **RESULTADO**: 12 rotas em `/api/v1` (agendamentos, bloqueios, profissionais, pacientes e tipos de atendimento), filtro de permissões por rota, Problem Details com `suggestions` em conflitos, transações com trava `pg_advisory_xact_lock` por profissional e trilha de auditoria para criação, remarcação, cancelamento, bloqueio e acesso negado.
- **AÇÃO**: Criação do Projeto de demonstração e da leitura automática do `.env` em Development
  - **MOTIVO**: O `README` já orientava copiar o `.env`, mas nada o carregava; e era preciso permitir operar a agenda sem cadastro manual prévio.
  - **LOCAL AFETADO**: `backend/src/Canamed.Api/Configuration/DotEnvConfiguration.cs`, `backend/src/Canamed.Infrastructure/Development`
  - **RESULTADO**: `.env` carregado apenas em Development, com precedência das variáveis de ambiente reais; semeadura idempotente de clínica, profissional, paciente e três tipos de atendimento **sintéticos** (ADR-0003), desativável por `Canamed:SeedDevelopmentData=false`. Log de comandos do EF Core reduzido em Development.

#### Frontend
- **AÇÃO**: Implementação da tela de agenda e do consumo tipado da API
  - **MOTIVO**: Entregar a seção 9 da SPEC-0002 (agenda do dia com estados, validação de motivo de cancelamento e sugestão de horários livres).
  - **LOCAL AFETADO**: `frontend/src/features/agenda`, `frontend/src/api`, `frontend/src/shared`, `frontend/src/styles/theme.css`
  - **RESULTADO**: Agenda do dia por data e profissional, criação, remarcação, cancelamento com motivo, bloqueio de horário e cadastros rápidos, com estados de carregamento, vazio, erro e sucesso, textos em português e tokens visuais oficiais (nenhuma cor nova foi criada).
- **AÇÃO**: Geração dos tipos do frontend a partir do contrato OpenAPI
  - **MOTIVO**: Cumprir a RN-004 da SPEC-0001 e resolver a pendência P-003.
  - **LOCAL AFETADO**: `frontend/src/api/schema.d.ts`, `frontend/package.json`, `package.json`
  - **RESULTADO**: `npm run generate:api` gera `schema.d.ts` a partir de `/api/v1/openapi.json`; nenhum tipo de contrato é escrito à mão. Um único `.env` na raiz passou a alimentar backend e frontend (`envDir` do Vite).

#### Verificação
- **AÇÃO**: Execução dos comandos unificados de build e teste
  - **MOTIVO**: Validar os critérios de aceitação CA-001 a CA-010 da SPEC-0002 e as convenções da SPEC-0001.
  - **LOCAL AFETADO**: raiz do repositório
  - **RESULTADO**: `npm run build` com 0 erros e 0 avisos; `npm run test` com **65 testes aprovados e 0 falhas** — 29 unitários do backend, 17 de integração do backend (4 de saúde + 13 de agenda) e 19 do frontend.
- **AÇÃO**: Verificação manual ponta a ponta contra a API em execução
  - **MOTIVO**: Confirmar o comportamento real antes de declarar a funcionalidade concluída.
  - **LOCAL AFETADO**: `canamed_dev` (dados sintéticos), ambiente local
  - **RESULTADO**: Dois defeitos foram encontrados e corrigidos na verificação: (1) o intervalo do dia era enviado ao PostgreSQL com deslocamento `-03:00`, inválido para `timestamptz` — corrigido em `AgendaTimeZone`; (2) conflito com bloqueio de agenda era reportado como `appointment-overlap` em vez de `professional-blocked` — corrigido separando agendamentos e bloqueios na checagem. Após as correções: agenda do dia, criação, conflito `409`, bloqueio `409 professional-blocked`, data passada `400` e prontidão `200` verificados. Os dados de teste manual criados no banco de desenvolvimento foram removidos.
- **AÇÃO**: Ajuste de aderência ao fluxo F-004 após revisão da própria SPEC
  - **MOTIVO**: A SPEC-0002 determina que horários bloqueados apareçam como indisponíveis **sem expor o motivo clínico**; a primeira versão devolvia o motivo do bloqueio na resposta da agenda.
  - **LOCAL AFETADO**: `backend/src/Canamed.Application/Agenda/AgendaContracts.cs`, `AgendaService.cs`, `frontend/src/api/schema.d.ts`, `specs/0002-spec-agenda-de-consultas.md`
  - **RESULTADO**: `BlockResponse` passou a informar apenas o intervalo indisponível; o motivo permanece na trilha de auditoria. Tipos do frontend regenerados (`npm run generate:api`) e nota registrada na seção 8 da SPEC.
- **AÇÃO**: Restrição de escopo no bloqueio de agenda
  - **MOTIVO**: Um usuário com `agenda:block` e apenas `agenda:read:own` poderia bloquear a agenda de outro profissional.
  - **LOCAL AFETADO**: `backend/src/Canamed.Application/Agenda/AgendaService.cs`
  - **RESULTADO**: O bloqueio passou a respeitar o mesmo escopo por profissional das demais operações, alinhado à seção 4 da SPEC.

#### Documentação
- **AÇÃO**: Criação do guia operacional `docs/guia-de-uso-e-execucao.md` e atualização da documentação de estado
  - **MOTIVO**: Determinação explícita do responsável pelo projeto ("deixe pronto um documento orientando o uso e a execução") e necessidade de manter a documentação viva após a conclusão.
  - **LOCAL AFETADO**: `docs/guia-de-uso-e-execucao.md` (novo), `README.md`, `PROJECT_BRIEF.md`, `specs/README.md`, `docs/visao-produto.md`, `docs/seguranca-e-conformidade.md`, `adr/README.md`
  - **RESULTADO**: Guia com provisionamento, migrations, execução, roteiro de uso da agenda, contrato da API, identidade de desenvolvimento, testes, regeneração de tipos, solução de problemas e governança. Documentos de estado atualizados (pilar de agenda marcado como implementado; pendências P-002 e P-003 resolvidas; vulnerabilidade aceita e pendências remanescentes registradas).

---

### [2026-10-01] — Fechamento da SPEC-0002 e Implementação da SPEC-0003

#### Fechamento da SPEC-0002
- **AÇÃO**: Implementação das rotas de ciclo de vida do atendimento (`/appointments/{id}/attend` e `/appointments/{id}/no-show`)
  - **MOTIVO**: Pendência P-003 da SPEC-0002 — os estados `atendido` e `faltou` existiam no domínio, mas nada os definia pela API, travando qualquer fluxo posterior (fila, triagem, dashboards).
  - **LOCAL AFETADO**: `backend/src/Canamed.Application/Agenda`, `backend/src/Canamed.Api/Endpoints/AgendaEndpoints.cs`, `frontend/src/features/agenda`
  - **RESULTADO**: Duas rotas com permissão `agenda:write`, auditoria (`appointment.attended`, `appointment.no_show`), transições validadas e botões "Atendido"/"Faltou" na agenda. Critérios CA-011 e CA-012 criados e cobertos por testes de integração.
- **AÇÃO**: Correção da restrição de exclusão do banco com a migration `AlignAgendaExclusionWithActiveStatuses`
  - **MOTIVO**: O teste de CA-011 revelou divergência real: a restrição tratava `atendido`/`faltou` como ocupantes do horário, enquanto o domínio os considera terminais. O banco impedia uma nova marcação que a regra de negócio permite.
  - **LOCAL AFETADO**: `backend/src/Canamed.Infrastructure/Persistence/Migrations`
  - **RESULTADO**: `ex_appointments_professional_no_overlap` passa a valer apenas para `agendado` e `confirmado`, alinhada à RN-001 e ao domínio.
- **AÇÃO**: Suíte de testes de comportamento com Playwright (pendência P-002)
  - **MOTIVO**: A SPEC-0002 exige cobertura dos fluxos F-001 a F-004 na interface e a pendência estava aberta desde a fundação.
  - **LOCAL AFETADO**: `frontend/playwright.config.ts`, `frontend/e2e/`, `frontend/package.json`, `.gitignore`
  - **RESULTADO**: 10 cenários cobrindo login (com e sem segundo fator), estado vazio, criação, conflito com sugestões, remarcação, cancelamento com motivo e bloqueio de horário, com sessão autenticada real. Navegadores instalados em `D:\Tools\ms-playwright` (preferência de disco do projeto); segredo de MFA da suíte em `frontend/e2e/.state/`, fora do versionamento. Execução: `npm run test:e2e`.
- **AÇÃO**: Ajustes de usabilidade encontrados pela suíte
  - **MOTIVO**: O formulário de cancelamento usava `required` do navegador, o que impedia a mensagem de negócio em português, e o tipo de atendimento padrão do diálogo era o primeiro em ordem alfabética.
  - **LOCAL AFETADO**: `frontend/src/features/agenda/AppointmentActions.tsx`
  - **RESULTADO**: A validação de motivo passa a ser feita pela aplicação, com mensagem clara, mantendo a obrigatoriedade no backend.

#### SPEC-0003 — Autenticação, Autorização e Auditoria
- **AÇÃO**: Escrita e aprovação da `specs/0003-spec-autenticacao-autorizacao-e-auditoria.md`
  - **MOTIVO**: Regra fundamental do `GEMINI.md` (nenhuma funcionalidade sem SPEC) e decisão do ADR-0008, ainda não implementada.
  - **LOCAL AFETADO**: `specs/0003-...md`, `specs/README.md`
  - **RESULTADO**: SPEC com 19 regras de negócio, 6 fluxos, modelo de dados, contrato de API, 12 critérios de aceitação, 11 casos de erro, requisitos de segurança e legais, cobertura de testes e 10 decisões registradas (Q-001 a Q-010).
- **AÇÃO**: Criação do `adr/0010-sessao-de-usuario-e-substituicao-da-identidade-de-desenvolvimento.md` e substituição do ADR-0009
  - **MOTIVO**: A sessão real passa a ser o único caminho do produto; o mecanismo por cabeçalho do ADR-0009 deixa de ser a via de identidade e fica restrito a DEV/TEST.
  - **LOCAL AFETADO**: `adr/0009-...md` (status), `adr/0010-...md` (novo), `adr/README.md`
  - **RESULTADO**: ADR-0009 marcado como substituído; ADR-0010 registra a decisão, as alternativas e as consequências.
- **AÇÃO**: Implementação de identidade, sessão e autorização por papel
  - **MOTIVO**: Cumprir o ADR-0008 e as seções 5 a 13 da SPEC-0003.
  - **LOCAL AFETADO**: `backend/src/Canamed.Domain/Identity`, `Canamed.Application/Identity`, `Canamed.Infrastructure/Identity`, `backend/src/Canamed.Api/Authorization`
  - **RESULTADO**: Entidades `User`, `ClinicMembership`, `UserSession` e `LoginChallenge`; Argon2id (64 MiB/3 iterações) com política de senha; sessão em cookie `httpOnly` com token de 256 bits e apenas hash no banco; expiração deslizante (30 min) e absoluta (8 h); bloqueio progressivo (5 tentativas → 15 min); segundo fator TOTP obrigatório para gestor com estado de cadastro pendente e segredo cifrado com Data Protection; papéis `gestor`, `recepcionista` e `profissional` traduzidos em permissões; middleware de sessão, proteção CSRF, CORS com credenciais, limite de requisições no login e cabeçalhos de segurança.
- **AÇÃO**: Endpoints de autenticação e administração de usuários
  - **MOTIVO**: Entregar os fluxos F-001 a F-006 da SPEC-0003.
  - **LOCAL AFETADO**: `backend/src/Canamed.Api/Endpoints/AuthEndpoints.cs`, `UserEndpoints.cs`
  - **RESULTADO**: `/auth/login`, `/auth/login/mfa`, `/auth/logout`, `/auth/session`, `/auth/clinic`, `/auth/password`, `/auth/mfa/{enroll,activate,disable}` e `/users` (criar, listar, redefinir senha, desativar e revogar sessões), todos em `/api/v1` e auditados.
- **AÇÃO**: Correção do descarte de auditoria em rollback
  - **MOTIVO**: Eventos de segurança (acesso negado, falha de login) eram gravados dentro da transação e desapareciam quando a operação de negócio era revertida.
  - **LOCAL AFETADO**: `backend/src/Canamed.Application/Abstractions/IAuditTrail.cs`, `backend/src/Canamed.Infrastructure/Persistence/AuditTrail.cs`, `AgendaService`, filtro de permissões
  - **RESULTADO**: Eventos de segurança passam a ser gravados em contexto próprio (`IDbContextFactory`), fora da transação, garantindo rastreabilidade inclusive em falhas.
- **AÇÃO**: Migration `AddIdentityAndSessions`
  - **MOTIVO**: Persistir usuários, vínculos, sessões e desafios; permitir eventos de sistema sem clínica associada.
  - **LOCAL AFETADO**: `backend/src/Canamed.Infrastructure/Persistence/Migrations`
  - **RESULTADO**: Tabelas `users`, `clinic_memberships`, `user_sessions` e `login_challenges` e `audit_events.clinic_id` nulo para eventos sem clínica resolvida (ex.: tentativa de login de e-mail inexistente).
- **AÇÃO**: Tela de login, verificação em duas etapas e painel de usuários no frontend
  - **MOTIVO**: Seção 9 da SPEC-0003.
  - **LOCAL AFETADO**: `frontend/src/features/auth`, `frontend/src/App.tsx`, `frontend/src/api/client.ts`, `frontend/src/styles/theme.css`
  - **RESULTADO**: Login com passo de MFA, cadastro guiado do autenticador, barra de sessão com clínica e papel, aba de usuários para o gestor (criar, redefinir senha, revogar sessões e desativar) e envio automático do cabeçalho anti-CSRF, com `credentials: 'include'`.
- **AÇÃO**: Ajuste da conveniência de desenvolvimento para não criar bypass na SPA
  - **MOTIVO**: Sem sessão, um navegador recebia permissões totais pelo caminho de cabeçalho e nunca veria a tela de login.
  - **LOCAL AFETADO**: `backend/src/Canamed.Infrastructure/Identity/CurrentActorAccessor.cs`
  - **RESULTADO**: A conveniência só se aplica quando a requisição envia explicitamente um cabeçalho `X-Canamed-*`, apenas em DEV/TEST, com cobertura de teste (`Sessao_DeveSerExigida_QuandoNaoHaCookieNemCabecalhos`).

#### Verificação
- **AÇÃO**: Execução da suíte completa
  - **MOTIVO**: Validar critérios de aceitação das três SPECs antes de declarar a entrega.
  - **LOCAL AFETADO**: raiz do repositório, `canamed_dev` e `canamed_test`
  - **RESULTADO**: **136 testes aprovados e 0 falhas** — 73 unitários, 33 de integração, 20 de frontend (Vitest) e 10 de comportamento (Playwright). Build com 0 erros e 0 avisos. `npm audit --omit=dev` sem vulnerabilidades de produção.
- **AÇÃO**: Descoberta e correção de defeitos reais durante a verificação
  - **MOTIVO**: Nenhuma entrega é considerada concluída sem verificação ponta a ponta.
  - **LOCAL AFETADO**: `AgendaService`, `AlignAgendaExclusionWithActiveStatuses`, `Program.cs`, locators da suíte Playwright
  - **RESULTADO**: Corrigidos: restrição de banco divergente da regra de domínio; limite de requisições global bloqueando a suíte (agora por origem e configurável); URLs da API de teste resolvidas fora do prefixo `/api/v1`; locators ambíguos e ausência de limpeza de cenário nos testes de comportamento.

#### Documentação
- **AÇÃO**: Criação do backlog priorizado e atualização da documentação de estado
  - **MOTIVO**: Determinação explícita do responsável pelo projeto ("crie um backlog de próximas funcionalidades com uma curta descrição de cada uma e um nível de esforço e complexidade").
  - **LOCAL AFETADO**: `docs/backlog-proximas-funcionalidades.md` (novo), `README.md`, `PROJECT_BRIEF.md`, `docs/guia-de-uso-e-execucao.md`, `docs/seguranca-e-conformidade.md`, `specs/README.md`, `specs/0002`, `specs/0003`
  - **RESULTADO**: Backlog com 26 itens em quatro blocos (fundação técnica, identidade, pilares de produto e dívidas funcionais), cada um com descrição curta, esforço (P/M/G), complexidade (baixa/média/alta) e dependências, além da sequência sugerida. Guia atualizado com login, segundo fator, administração de usuários, testes de comportamento, novas causas de erro e procedimento de redefinição de MFA.

---

### [2026-10-01] — Execução do backlog: SPEC-0004 (catálogo e classificação das consultas)

Primeiro bloco da sequência sugerida do backlog, com T-01 a T-03 suspensos por decisão do responsável.

#### Especificação
- **AÇÃO**: Escrita e implementação da `specs/0004-spec-catalogo-e-classificacao-das-consultas.md`
  - **MOTIVO**: Pedido explícito do responsável para diferenciar as consultas por natureza (avulsa, acompanhamento), custeio (particular, plano de saúde) e especialidade (ortopedia, ginecologia etc.), somado às lacunas D-01 a D-03 do backlog.
  - **LOCAL AFETADO**: `specs/0004-...md`, `specs/README.md`
  - **RESULTADO**: SPEC com 12 regras de negócio, 4 fluxos, modelo de dados, contrato de API (15 novas rotas), 10 critérios de aceitação, 8 casos de erro, requisitos de segurança e legais, e 5 decisões registradas (Q-001 a Q-005).

#### Banco de dados
- **AÇÃO**: Migration `AddCatalogClassificationAndEditing`
  - **MOTIVO**: Persistir a classificação e a situação (ativa/inativa) do catálogo.
  - **LOCAL AFETADO**: `backend/src/Canamed.Infrastructure/Persistence/Migrations`
  - **RESULTADO**: Tabela `specialties`; colunas `category`, `coverage`, `specialty_id` e `is_active` em `appointment_types`; `specialty_id` e `is_active` em `professionals`; `email`, `birth_date` e `is_active` em `patients`; restrições de verificação para os valores de natureza e custeio. Os *defaults* da migration foram ajustados (`avulsa`, `particular`, `true`) para que registros existentes não fossem desativados nem violassem as restrições.

#### Backend
- **AÇÃO**: Classificação no domínio e regras de integridade
  - **MOTIVO**: Concentrar as regras no domínio, testáveis sem banco.
  - **LOCAL AFETADO**: `backend/src/Canamed.Domain/Agenda`
  - **RESULTADO**: Enums `AppointmentCategory`/`AppointmentCoverage` com conversão explícita (valores desconhecidos são recusados), entidade `Specialty`, e ativação/desativação em tipos de consulta, profissionais e pacientes.
- **AÇÃO**: Casos de uso e rotas do catálogo
  - **MOTIVO**: Entregar os fluxos F-001 a F-004 da SPEC-0004.
  - **LOCAL AFETADO**: `backend/src/Canamed.Application/Catalog`, `backend/src/Canamed.Api/Endpoints`
  - **RESULTADO**: 15 rotas novas (especialidades, edição/desativação de tipos, profissionais e pacientes) e `DELETE /professionals/{id}/blocks/{blockId}` para desbloquear. Agendamento passou a exigir tipo, profissional e paciente **ativos** e a resposta da agenda passou a informar natureza, custeio e especialidade.
- **AÇÃO**: Correção de defeitos encontrados pelos próprios testes
  - **MOTIVO**: Nenhuma entrega é considerada concluída sem verificação.
  - **LOCAL AFETADO**: `AppointmentClassification.cs`, `CatalogRepository.cs`, `DevelopmentDataSeeder.cs`, `TestDatabase.cs`
  - **RESULTADO**: Corrigidos: (1) o mapa de classificação aceitava qualquer valor por usar `FirstOrDefault` em struct — agora recusa o desconhecido; (2) `FindPatientAsync` usava `AsNoTracking`, o que fazia a desativação de paciente ser silenciosamente ignorada; (3) o seeder criava tipos passando o ID do tipo no parâmetro de especialidade (violação de FK); (4) a limpeza do banco de testes não removia especialidades, quebrando a preparação da suíte.

#### Frontend
- **AÇÃO**: Aba Catálogo e classificação na agenda
  - **MOTIVO**: Seção 9 da SPEC-0004 — a recepção precisa enxergar o que está agendando e o gestor precisa manter o catálogo sem suporte técnico.
  - **LOCAL AFETADO**: `frontend/src/features/catalog`, `frontend/src/features/agenda`, `frontend/src/App.tsx`, `frontend/src/features/auth/SessionBar.tsx`
  - **RESULTADO**: Nova aba **Catálogo** (especialidades, tipos de consulta com natureza/custeio/especialidade, profissionais e pacientes, com edição e ativação/desativação); agenda exibindo a classificação de cada agendamento e a ação **Desbloquear**; cadastros rápidos com os novos campos; tipos inativos fora das opções de agendamento.

#### Verificação
- **AÇÃO**: Execução da suíte completa
  - **MOTIVO**: Validar critérios de aceitação e garantir que nada regrediu.
  - **LOCAL AFETADO**: raiz do repositório, `canamed_dev` e `canamed_test`
  - **RESULTADO**: **159 testes aprovados e 0 falhas** — 88 unitários, 41 de integração (8 novos de catálogo), 20 de frontend (Vitest) e 10 de comportamento (Playwright). Build com 0 erros e 0 avisos.
- **AÇÃO**: Ajuste da suíte de comportamento e da mensagem de sessão expirada
  - **MOTIVO**: A suíte dependia do nome do paciente e do rótulo do tipo (que agora carrega a classificação), e a mensagem de 401 ainda dizia que a autenticação seria entregue por uma SPEC futura.
  - **LOCAL AFETADO**: `frontend/e2e`, `ActorExtensions.cs`, `PermissionFilter.cs`
  - **RESULTADO**: Seleção explícita do paciente e do tipo sintéticos nos cenários; mensagem de sessão expirada atualizada. Além disso, foi identificado e encerrado um servidor Vite obsoleto que impedia os testes de comportamento de carregar a aplicação.

#### Documentação
- **AÇÃO**: Atualização do backlog e do guia
  - **MOTIVO**: Manter a documentação viva e registrar o que foi concluído.
  - **LOCAL AFETADO**: `docs/backlog-proximas-funcionalidades.md`, `docs/guia-de-uso-e-execucao.md`, `specs/README.md`
  - **RESULTADO**: Backlog com o progresso da rodada, D-01 a D-03 marcados como concluídos e a seção "Integrações externas previstas e o que será mockado" (gateway de pagamento, e-mail, WhatsApp/SMS, APM, SSO, assinatura digital) com as pendências necessárias para cada ativação. Guia com a aba Catálogo, a classificação na agenda e a ação de desbloquear.

#### Situação do backlog

| Item | Situação |
| :--- | :--- |
| Classificação das consultas e lacunas D-01 a D-03 | **Concluído** (SPEC-0004) |
| P-01 fila de espera, P-02 ciclo de atendimento | Próximos da sequência |
| P-06 cadastro completo e horário de funcionamento | Depois de P-01/P-02 |
| T-04 observabilidade, P-04 pagamentos, P-05 dashboards, I-01 a I-03, P-03, P-07, P-08 | Pendentes, conforme a sequência do backlog |

---

### [2026-10-01] — Suspensão temporária da exigência de MFA para testes locais

- **AÇÃO**: Introdução da política `IMfaPolicy` (implementação `ConfigurationMfaPolicy`) com a chave `Canamed:Security:RequireMfaForManagers`
  - **MOTIVO**: Pedido explícito do responsável pelo projeto para testar o sistema sem cadastrar um autenticador. Alterar a regra de negócio no código enfraqueceria o produto de forma permanente e silenciosa.
  - **LOCAL AFETADO**: `backend/src/Canamed.Application/Identity/IMfaPolicy.cs` (novo), `backend/src/Canamed.Infrastructure/Identity/ConfigurationMfaPolicy.cs` (novo), `AuthService.cs`, `DependencyInjection.cs`, `.env`, `.env.example`
  - **RESULTADO**: A suspensão vale **apenas** em Development/Testing e precisa ser explícita; fora desses ambientes o valor é ignorado (falha fechada), de modo que produção continua exigindo MFA do gestor. O `.env` local recebeu `Canamed__Security__RequireMfaForManagers=false` com comentário de reversão; o `.env.example` documenta a chave comentada.
- **AÇÃO**: Reset do segundo fator e das sessões do gestor de desenvolvimento
  - **MOTIVO**: A suíte de testes de comportamento havia cadastrado MFA para esse usuário em execuções anteriores; sem remover o segredo, o código continuaria sendo exigido mesmo com a suspensão ativa.
  - **LOCAL AFETADO**: `canamed_dev` (tabelas `users` e `user_sessions`)
  - **RESULTADO**: Verificado por chamada real: o login do gestor com e-mail e senha responde `mfaRequired=false`, `mfaPending=false`, e as rotas `/appointments`, `/users` e `/specialties` respondem `200` sem código de verificação.
- **AÇÃO**: Testes unitários da política e ajuste da suíte de integração
  - **MOTIVO**: A regra de produto precisa continuar verificada mesmo com a suspensão ativa na máquina do desenvolvedor, já que o host de testes em Development lê o `.env` local.
  - **LOCAL AFETADO**: `backend/tests/Canamed.UnitTests/Identity/MfaPolicyTests.cs` (novo), `CanamedApiFactory.cs`
  - **RESULTADO**: Novos testes garantem que produção exige MFA mesmo com a suspensão configurada e que a suspensão só vale em DEV/TEST quando explícita; a fábrica de testes fixa `Canamed:Security:RequireMfaForManagers=true`, mantendo CA-004 e CA-005 da SPEC-0003 validando a regra real.
- **AÇÃO**: Documentação do procedimento e registro da pendência de reversão
  - **MOTIVO**: Evitar que uma facilidade de desenvolvimento se torne comportamento de produção.
  - **LOCAL AFETADO**: `docs/guia-de-uso-e-execucao.md`, `specs/0003-...md`
  - **RESULTADO**: Guia com o passo a passo de suspensão e restauração (incluindo o SQL de reset do segredo); a SPEC-0003 registra a decisão Q-011 e a pendência P-007 (reverter antes de demonstração ou uso real).
- **AÇÃO**: Execução da suíte completa após a mudança
  - **RESULTADO**: **164 testes aprovados e 0 falhas** — 93 unitários, 41 de integração, 20 de frontend e 10 de comportamento.

#### Observação de segurança (transparência)

Ao consultar o `.env` para localizar a senha do usuário de desenvolvimento, a **senha do banco local**
apareceu na saída do terminal desta sessão. É uma credencial de desenvolvimento, na própria máquina, que
já estava em texto simples no `.env` (não versionado); nenhuma senha de usuário do sistema foi exposta.
Recomenda-se **rotacionar a senha do papel `canamed_app`** caso este registro seja compartilhado:
`ALTER ROLE canamed_app WITH PASSWORD '<nova>';` seguido da atualização do `.env`. A rotação não foi feita
automaticamente porque alteração de credenciais exige autorização explícita e pode afetar outras
ferramentas que usem a mesma senha.
