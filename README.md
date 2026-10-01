# CANAMED

Plataforma SaaS B2B de gestão clínica — *"Eficiência para quem mais precisa."*

## Documentação obrigatória

Antes de qualquer alteração, leia:

- [`GEMINI.md`](GEMINI.md) — briefing integral e regras de conduta do agente (fonte de verdade).
- [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) — brief consolidado do projeto.
- [`specs/README.md`](specs/README.md) — processo spec-driven. **Nenhuma funcionalidade sem SPEC aprovada.**
- [`adr/README.md`](adr/README.md) — decisões arquiteturais.
- [`docs/`](docs) — visão de produto, identidade visual e segurança/conformidade.
- [`docs/guia-de-uso-e-execucao.md`](docs/guia-de-uso-e-execucao.md) — **guia de instalação, execução e uso**.

## Estado atual

| Entrega | Situação |
| :--- | :--- |
| Fundação do monorepo (.NET 10 + React/Vite) | Implementada — [SPEC-0001](specs/0001-spec-de-fundacao.md) |
| Agenda de consultas (agendar, remarcar, cancelar, bloquear) | Implementada — [SPEC-0002](specs/0002-spec-agenda-de-consultas.md) |
| Login, sessão, papéis por clínica, segundo fator e usuários | Implementada — [SPEC-0003](specs/0003-spec-autenticacao-autorizacao-e-auditoria.md) |
| Fila de espera, triagem, pagamentos, dashboards e gestão operacional | Pendente — [backlog priorizado](docs/backlog-proximas-funcionalidades.md) |

## Estrutura

| Caminho | Conteúdo |
| :--- | :--- |
| `backend/` | ASP.NET Core (`net10.0`), camadas Domain / Application / Infrastructure / Api |
| `frontend/` | SPA React + TypeScript (build via Vite) |
| `docs/`, `specs/`, `adr/`, `assets/` | Documentação e ativos oficiais |

## Pré-requisitos

| Ferramenta | Versão | Observação |
| :--- | :--- | :--- |
| .NET SDK | 10.0.201 | Fixado em [`global.json`](global.json) |
| Node.js | >= 20 | Fixado em `engines` do [`package.json`](package.json) |
| PostgreSQL | 16 ou superior | Instalação local; ver [`SPEC-0001`](specs/0001-spec-de-fundacao.md) |

## Provisionamento local

1. Copie `.env.example` para `.env` e preencha os valores locais (o `.env` não é versionado).
2. Suba o PostgreSQL local (abaixo) e aplique as migrations do backend (abaixo).
3. Instale as dependências do frontend: `npm --prefix frontend install`.

### Migrations

```powershell
dotnet ef database update --project backend/src/Canamed.Infrastructure --startup-project backend/src/Canamed.Api
```

### PostgreSQL portátil (ambiente atual)

Instalado em `D:\Tools\PostgreSQL\18.6` a partir dos binários oficiais, **sem serviço do Windows**,
com dados em `D:\Tools\PostgreSQL\data`.

```powershell
$pg = 'D:\Tools\PostgreSQL\18.6\pgsql\bin'
& "$pg\pg_ctl.exe" -D 'D:\Tools\PostgreSQL\data' start
& "$pg\pg_ctl.exe" -D 'D:\Tools\PostgreSQL\data' status
& "$pg\pg_ctl.exe" -D 'D:\Tools\PostgreSQL\data' stop -m fast
```

- Log do servidor: `D:\Tools\PostgreSQL\data\log\postgresql-<data>.log` (coleta nativa habilitada).
- Bancos: `canamed_dev` e `canamed_test`. Usuário da aplicação: `canamed_app`.
- Senha do superusuário `postgres`: em `D:\Tools\PostgreSQL\postgres-superuser.txt`, **fora do repositório**.
- Senha da aplicação: apenas no `.env` local, que não é versionado.
- O servidor **não** sobe automaticamente com a máquina: use o comando `start` acima quando necessário.

## Comandos unificados

```bash
npm run build   # compila backend e frontend
npm run test    # executa os testes das duas stacks
npm run test:e2e       # testes de comportamento no navegador (Playwright)
npm run generate:api   # regenera os tipos do frontend a partir do OpenAPI (API em execução)
```

Os testes de integração do backend usam o banco `canamed_test` e exigem o PostgreSQL em execução.
Os testes de comportamento usam o banco de desenvolvimento e o gestor criado a partir do `.env`
([`docs/guia-de-uso-e-execucao.md`](docs/guia-de-uso-e-execucao.md), seção 9).

## Execução local

```bash
dotnet run --project backend/src/Canamed.Api   # API em http://localhost:5080
npm --prefix frontend run dev                 # SPA em http://localhost:5173
```

Em Development, a API cria dados sintéticos de demonstração (clínica, profissional, paciente e tipos de
atendimento) e o primeiro usuário gestor — cujo e-mail e senha vêm de `Canamed__Development__SeedUser*`
no `.env` — quando o banco está vazio. O acesso é sempre pelo login, com verificação em duas etapas
obrigatória para o papel de gestor. Detalhes, roteiro de uso e solução de problemas estão no
[`docs/guia-de-uso-e-execucao.md`](docs/guia-de-uso-e-execucao.md).

Equivalentes por stack:

```bash
dotnet build Canamed.sln
dotnet test Canamed.sln
npm --prefix frontend run build
npm --prefix frontend run test
```

## Segurança

- Nunca utilize dados reais de pacientes em desenvolvimento ou testes.
- Nunca versione `.env`, chaves, certificados ou credenciais.
- Nunca coloque segredos em código, logs ou mensagens de erro.

Detalhes em [`docs/seguranca-e-conformidade.md`](docs/seguranca-e-conformidade.md).
