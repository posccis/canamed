# ADR-0006 — Stack de aplicação

- **Status:** Aceito
- **Data:** 2026-09-28
- **Aprovado em:** 2026-09-28, pelo responsável pelo projeto
- **Decisores:** Responsável pelo projeto CANAMED
- **Relacionados:** ADR-0002, ADR-0003, ADR-0007, ADR-0008, `docs/visao-produto.md`

## Contexto

O CANAMED é um SaaS B2B multi-clínica cujo domínio é majoritariamente **API-first**: agenda, fila, triagem,
dashboards e gestão operacional. O `GEMINI.md` exige baixo acoplamento, alta coesão, modularidade,
separação clara de responsabilidades, escalabilidade, observabilidade e preparo para integrações futuras
de saúde digital.

Ambiente verificado em 2026-09-28:

| Ferramenta | Situação |
| :--- | :--- |
| .NET SDK | 10.0.201 presente (LTS) — SDKs 6.0.428 e 7.0.203 também instalados, porém fora de suporte |
| ASP.NET Core Runtime | 10.0.5 presente |
| Node.js | v20.10.0 presente |
| npm | presente |
| pnpm | ausente |
| Docker Desktop | ausente |
| Java / Python | presentes |

## Problema

Qual stack de aplicação usar na primeira versão do produto?

## Alternativas consideradas

| Alternativa | Prós | Contras |
| :--- | :--- | :--- |
| A. TypeScript ponta a ponta em framework full-stack (ex.: Next.js) | Um só repositório, entrega rápida de MVP, curva baixa | Tende a acoplar UI e domínio; regras de negócio em rotas de página; menos aderente a "baixo acoplamento" |
| B. TypeScript API-first (ex.: NestJS ou Fastify) + SPA React (Vite) | Domínio isolado e testável; fronteira de API explícita | Dois projetos para orquestrar; ecossistema menos corporativo |
| **C. .NET (ASP.NET Core) + SPA React** | Tipagem forte; ecossistema corporativo maduro; escalabilidade e manutenção de longo prazo; SDK já presente no ambiente | Duas linguagens no mesmo repositório; exige convenções fortes para não acoplar camadas |
| D. Java Spring Boot + SPA React | Robusto e corporativo | Mais cerimônia e consumo de recursos para o estágio atual |

### Critérios de avaliação

1. aderência ao `GEMINI.md` (modularidade, separação de responsabilidades, testabilidade);
2. escalabilidade e facilidade de manutenção no longo prazo;
3. reaproveitamento do ambiente já verificado;
4. disponibilidade de mão de obra e custo de manutenção na região de atuação;
5. facilidade de expor API para integrações futuras de saúde digital;
6. compatibilidade com os requisitos de segurança e auditoria (ADR-0008).

## Decisão

Adotar a alternativa **C**: **ASP.NET Core (.NET) no backend + SPA React no frontend, em um único
monorepo**.

A decisão foi tomada pelo responsável pelo projeto em 2026-09-28, prevalecendo sobre a recomendação
técnica do agente (alternativa B): a prioridade declarada é **escalabilidade e facilidade de manutenção
de longo prazo**, aceitando-se conscientemente o custo de manter um monorepo com duas stacks.

Diretrizes de implementação:

1. Backend: **ASP.NET Core Web API**, com framework alvo **`net10.0`** (LTS, já instalado), a ser confirmado
   na SPEC de fundação.
2. Frontend: **SPA React + TypeScript**, com *build* via Vite (a confirmar na SPEC de fundação).
3. **Monorepo único** com backend e frontend lado a lado (estrutura de pastas definida na SPEC de fundação).
4. Domínio isolado em camadas (Domain / Application / Infrastructure), evitando *over-engineering* e
   dependências desnecessárias.
5. API versionada (`/api/v1`) e **contrato OpenAPI** gerado a partir do backend.
6. Cliente HTTP e tipos do frontend **gerados a partir do OpenAPI**, para impedir divergência entre as pontas.
7. Testes automatizados no backend e no frontend; o backend concentra as regras de negócio.

> Regra decorrente: a fronteira entre frontend e backend é **exclusivamente a API**. Nenhuma regra de
> negócio, autorização ou validação de integridade pode viver apenas no frontend.

## Consequências

### Positivas

- Tipagem forte e ferramental maduro no backend, favorecendo manutenção de longo prazo.
- Separação clara entre domínio (backend) e interface (frontend).
- Contrato OpenAPI explícito, o que facilita integrações futuras do ecossistema de saúde.
- Ecossistema corporativo consolidado, com boa disponibilidade de profissionais.

### Negativas / trade-offs

- Duas linguagens, dois ecossistemas e dois pipelines de teste no mesmo repositório.
- Requer convenções disciplinares de monorepo para evitar acoplamento indevido.
- Exige presença do SDK .NET no ambiente de desenvolvimento de todos os colaboradores.

### Mitigações

- Geração automática de tipos a partir do OpenAPI.
- Estrutura de pastas e convenções definidas na SPEC de fundação.
- Verificação de build/teste de ambas as partes em um único comando documentado.

## Impacto

- **Documentação:** habilita a SPEC de fundação do projeto e o futuro ADR de hospedagem/infraestrutura.
- **SPECs:** a primeira SPEC passa a poder ser escrita; toda SPEC declara o comportamento de API.
- **Código:** define estrutura do monorepo, ferramentas de lint/teste e pipeline.
- **Segurança / LGPD:** obriga atendimento a OWASP Top 10 e OWASP API Security Top 10 (ADR-0008);
  a região de hospedagem permanece pendente e impacta diretamente a LGPD.

## Pendências decorrentes

1. Definir a estrutura de pastas e as convenções do monorepo na SPEC de fundação.
2. Definir a estratégia de banco local, considerando a ausência do Docker Desktop (ADR-0007).
3. Definir o gerenciador de pacotes do frontend (`npm`, já instalado, ou `pnpm`, ausente).
4. Criar o `.env.example` quando as variáveis de ambiente forem definidas (ADR-0004).
5. Avaliar a remoção dos SDKs .NET 6 e 7 (fora de suporte) — alteração global do sistema, exige autorização.
6. Definir hospedagem e região dos dados — ADR futuro (LGPD).

## Referências

- [`GEMINI.md`](../GEMINI.md) — seções "Arquitetura do Produto" e "Ambiente de Desenvolvimento".
- [`docs/visao-produto.md`](../docs/visao-produto.md)
