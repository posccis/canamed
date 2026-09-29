# ADR-0006 — Stack de aplicação

- **Status:** Proposto (aguardando aprovação do responsável pelo projeto)
- **Data:** 2026-09-28
- **Decisores:** Responsável pelo projeto CANAMED
- **Relacionados:** ADR-0002, ADR-0003, ADR-0007, ADR-0008, `docs/visao-produto.md`

## Contexto

O CANAMED é um SaaS B2B multi-clínica cujo domínio é majoritariamente **API-first**: agenda, fila, triagem,
dashboards e gestão operacional. O `GEMINI.md` exige baixo acoplamento, alta coesão, modularidade,
separação clara de responsabilidades, escalabilidade, observabilidade e preparo para integrações futuras
de saúde digital.

Ambiente verificado: Node.js v20.10.0 presente; `npm` presente; `pnpm` **ausente**; Docker Desktop
**ausente**; Python 3.10 e Java presentes; disco D: com ~211 GB livres.

## Problema

Qual stack de aplicação usar na primeira versão do produto?

## Alternativas consideradas

| Alternativa | Prós | Contras |
| :--- | :--- | :--- |
| A. TypeScript ponta a ponta em framework full-stack (ex.: Next.js) | Um só repositório, entrega rápida de MVP, curva baixa | Tende a acoplar UI e domínio; regras de negócio em rotas de página; menos aderente a "baixo acoplamento" |
| B. TypeScript API-first (ex.: NestJS ou Fastify) + SPA React (Vite) | Domínio isolado e testável; fronteira de API explícita; alinhado a modularidade e a futuras integrações | Dois projetos para orquestrar |
| C. .NET (ASP.NET Core) + SPA React | Tipagem forte, ecossistema corporativo maduro | Exige runtime adicional; menor reaproveitamento do ambiente já validado |
| D. Java Spring Boot + SPA React | Robusto e corporativo | Mais cerimônia e consumo de recursos para o estágio atual |

### Critérios de avaliação

1. aderência ao `GEMINI.md` (modularidade, separação de responsabilidades, testabilidade);
2. velocidade de entrega com equipe pequena;
3. reaproveitamento do ambiente já verificado (Node 20);
4. disponibilidade de mão de obra e custo de manutenção na região de atuação;
5. facilidade de expor API para integrações futuras de saúde digital;
6. compatibilidade com os requisitos de segurança e auditoria (ADR-0008).

## Decisão proposta

Adotar a alternativa **B**: monolito modular **API-first** com backend TypeScript (NestJS ou Fastify, a
decidir em SPEC) e frontend SPA React + Vite, com tipos compartilhados em um pacote comum.

Justificativa: mantém o domínio isolado e testável, evita regras de negócio dentro de componentes de
interface e prepara o produto para integrações futuras — sem exigir novas linguagens além do Node já
presente no ambiente. A alternativa A permanece como opção caso a prioridade seja velocidade máxima de MVP.

> **Esta decisão depende de aprovação explícita.** Enquanto o status for `Proposto`, nenhuma
> implementação de código pode começar (regra do `GEMINI.md`: SPEC + decisão antes de implementar).

## Consequências (se aprovada)

### Positivas

- Fronteira de API clara, com versionamento desde o início.
- Testabilidade do domínio independente da interface.
- Mesma linguagem no frontend e no backend, reduzindo troca de contexto.

### Negativas / trade-offs

- Dois projetos e alguma orquestração local adicional.
- Requer escolha de ferramenta de *workspace* e de testes.

### Mitigações

- Monorepo simples com *workspace* nativo ou `pnpm` (instalação pendente, ver ADR-0004 e seção de pendências).

## Impacto

- **Documentação:** define o conteúdo de `.env.example` e de futuros ADRs de infraestrutura.
- **SPECs:** habilita a primeira SPEC (tema ainda não definido).
- **Código:** define estrutura de pastas, ferramentas de lint/teste e pipeline.
- **Segurança / LGPD:** precisa atender OWASP Top 10 e OWASP API Security Top 10 (ADR-0008).

## Pendências relacionadas

- Instalar `pnpm` (ou definir o gerenciador de pacotes) — somente após aprovação.
- Decidir hospedagem/região (impacto direto em LGPD) — ADR futuro.

## Referências

- [`GEMINI.md`](../GEMINI.md) — seções "Arquitetura do Produto" e "Ambiente de Desenvolvimento".
- [`docs/visao-produto.md`](../docs/visao-produto.md)
