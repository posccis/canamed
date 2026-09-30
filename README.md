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
2. Garanta um banco PostgreSQL local acessível conforme `ConnectionStrings__Canamed`.
3. Aplique as migrations do backend (quando existirem).
4. Instale as dependências do frontend: `npm --prefix frontend install`.

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
