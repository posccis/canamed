# CANAMED

Plataforma SaaS B2B de gestão clínica — *"Eficiência para quem mais precisa."*

## Documentação obrigatória

Antes de qualquer alteração, leia:

- [`GEMINI.md`](GEMINI.md) — briefing integral e regras de conduta do agente (fonte de verdade).
- [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) — brief consolidado do projeto.
- [`specs/README.md`](specs/README.md) — processo spec-driven. **Nenhuma funcionalidade sem SPEC aprovada.**
- [`adr/README.md`](adr/README.md) — decisões arquiteturais.
- [`docs/`](docs) — visão de produto, identidade visual e segurança/conformidade.

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
2. Suba o PostgreSQL local (abaixo) e aplique as migrations do backend (quando existirem).
3. Instale as dependências do frontend: `npm --prefix frontend install`.

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
```

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
