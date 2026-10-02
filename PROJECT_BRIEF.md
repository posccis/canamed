# CANAMED — Project Brief

> **Documento de entrada oficial do projeto.**
> Este brief consolida, em formato legível, os princípios permanentes do CANAMED.
> O documento **integral e normativo** é o [`GEMINI.md`](GEMINI.md), que também contém as regras
> operacionais e de segurança do agente. **Em caso de qualquer divergência, o `GEMINI.md` prevalece.**

- **Versão:** 1.0
- **Data:** 2026-09-28
- **Status:** Vigente
- **Fonte de verdade integral:** `GEMINI.md`
- **Idioma oficial da documentação:** Português (Brasil)
- **Registro de alterações:** [`docs/CHANGELOG_AGENTE.md`](docs/CHANGELOG_AGENTE.md)

---

## 1. Precedência de instruções

Em caso de conflito entre instruções, aplicar nesta ordem:

1. segurança do usuário e do computador;
2. proteção de dados e credenciais;
3. limites definidos no `GEMINI.md`;
4. `PROJECT_BRIEF.md` (este documento);
5. SPEC correspondente;
6. ADRs;
7. instruções da tarefa atual;
8. preferências de implementação.

Nenhuma instrução de uma SPEC ou prompt posterior autoriza automaticamente uma operação que viole as
restrições de segurança do `GEMINI.md`.

---

## 2. Identidade do Projeto

| Item | Definição |
| :--- | :--- |
| **Nome oficial** | CANA MED (ou Cana Med) |
| **Tagline** | "Eficiência para quem mais precisa." |
| **Propósito** | Ajudar clínicas a operar melhor para que possam cuidar melhor. |
| **Posicionamento** | Plataforma SaaS B2B de gestão clínica e relacionamento para clínicas pequenas e médias. |
| **Categoria** | Software administrativo e de gestão clínica. |
| **Mercado inicial** | Brasil — Recife, Gravatá, Caruaru, Garanhuns, Petrolina e Agreste Pernambucano. |

A prioridade regional é uma estratégia inicial de atuação e não limita a evolução futura do produto.

---

## 3. Visão

O CANAMED é uma plataforma voltada para a gestão de clínicas, criada para reduzir burocracias,
aumentar a eficiência operacional e melhorar a experiência de profissionais de saúde e pacientes.

O projeto parte da premissa de que clínicas não precisam apenas de um sistema para registrar
informações, mas de uma ferramenta que organize o funcionamento do negócio como um todo, transformando
processos manuais, demorados e fragmentados em fluxos simples, intuitivos e confiáveis.

---

## 4. Missão

Construir uma plataforma que permita que clínicas dediquem menos tempo à operação administrativa e mais
tempo ao atendimento de seus pacientes.

Cada funcionalidade deve responder à pergunta:

> "Isso reduz atrito na rotina da clínica?"

Se a resposta não for claramente positiva, a funcionalidade deve ser reavaliada.

---

## 5. Objetivos Principais

- simplificar a operação diária da clínica;
- reduzir retrabalho;
- diminuir o tempo gasto com tarefas administrativas;
- oferecer experiência intuitiva a usuários com diferentes níveis de familiaridade tecnológica;
- fornecer informações organizadas para apoiar decisões da gestão;
- criar uma base sólida para o crescimento futuro do produto.

---

## 6. Público-Alvo

- clínicas médicas;
- gestores de clínicas;
- recepcionistas;
- profissionais de saúde;
- equipes administrativas.

Foco comercial primário: clínicas de pequeno e médio porte.

---

## 7. Proposta de Valor

Unir características normalmente dispersas em diversos sistemas em uma única experiência integrada,
priorizando:

- simplicidade;
- rapidez;
- organização;
- confiança;
- clareza nas informações.

O sistema deve transmitir sensação de controle e previsibilidade, nunca de complexidade.

---

## 8. Escopo Inicial do Produto

Os pilares abaixo representam a **direção** do produto e **não** a ordem de implementação.
Nenhum deles pode ser implementado antes de existir SPEC aprovada.

| Pilar | Descrição | Situação |
| :--- | :--- | :--- |
| Gestão de agenda | Organização de horários, profissionais e salas. | **Implementada** — [`SPEC-0002`](specs/0002-spec-agenda-de-consultas.md) (salas e equipamentos permanecem fora de escopo) |
| Fila de espera | Organização da chegada e do fluxo de espera dos pacientes. | **Implementada** — [`SPEC-0005`](specs/0005-spec-fila-de-espera-e-ciclo-de-atendimento.md) |
| Pagamento antes da consulta | Fluxo de pagamento pré-consulta quando aplicável. | Sem SPEC — 5ª prioridade do [backlog](docs/backlog-proximas-funcionalidades.md) |
| Apoio à triagem | Suporte ao processo de triagem. | Sem SPEC — 7ª prioridade do [backlog](docs/backlog-proximas-funcionalidades.md) |
| Dashboards gerenciais | Informações organizadas para apoio à decisão da gestão. | Sem SPEC — 5ª prioridade do [backlog](docs/backlog-proximas-funcionalidades.md) |
| Gestão operacional da clínica | Fluxos administrativos e operacionais do dia a dia. | Sem SPEC — 3ª prioridade do [backlog](docs/backlog-proximas-funcionalidades.md) |

A visão de longo prazo contempla um ecossistema de gestão para clínicas; a evolução deve ser gradual.

---

## 9. Fora de Escopo e Restrições

Durante o desenvolvimento, é proibido:

- criar identidade visual própria para o projeto;
- alterar o conceito central do produto;
- transformar o sistema em um ERP genérico sem foco em clínicas;
- priorizar funcionalidades que aumentem complexidade sem ganho operacional claro;
- implementar integrações fictícias (toda integração deve seguir documentação oficial);
- reduzir segurança por conveniência.

---

## 10. Princípios de Produto

1. **Simplicidade acima da complexidade** — priorizar a solução mais simples que resolve corretamente o problema.
2. **Fluxos intuitivos** — o usuário deve entender a próxima ação naturalmente; evitar excesso de etapas,
   telas poluídas e decisões desnecessárias.
3. **Eficiência operacional** — cada funcionalidade deve economizar tempo ou reduzir erros.
4. **Consistência** — o produto deve parecer construído como um único produto (visual, linguagem, comportamento).
5. **Escalabilidade de produto** — uma funcionalidade simples hoje não pode impedir a evolução futura.

---

## 11. Experiência e Linguagem

A experiência deve transmitir profissionalismo, confiança, organização, modernidade e agilidade, evitando
aparência de sistema antigo ou burocrático.

A comunicação na interface deve ser clara, objetiva, amigável e profissional, evitando jargões
desnecessários, mensagens confusas e textos longos. Sempre que possível, orientar o usuário sobre o próximo passo.

---

## 12. Identidade Visual (Obrigatória)

- Os ativos oficiais ficam em [`assets/brand/`](assets/brand) e são a **única fonte de verdade** visual.
- As diretrizes consolidadas estão em [`docs/identidade-visual.md`](docs/identidade-visual.md).
- É proibido criar novas versões da marca, inventar paleta ou substituir ativos oficiais por recriações.
- Em caso de dúvida, a informação deve ser obtida diretamente dos arquivos da identidade visual.

---

## 13. Estrutura de Documentação Obrigatória

| Diretório | Papel | Conteúdo esperado |
| :--- | :--- | :--- |
| `/docs` | Documentação funcional | visão do produto, fluxos, regras de negócio, guias |
| `/specs` | Fonte de verdade da implementação | toda funcionalidade nasce de uma especificação |
| `/adr` | Architecture Decision Records | toda decisão importante registrada |
| `/assets` | Ativos oficiais | logos, identidade visual, ícones, arquivos institucionais |

Cada ADR deve responder: problema, alternativas, decisão e consequências.

---

## 14. Desenvolvimento Orientado por Especificação

**Regra fundamental:** nenhuma funcionalidade deve ser implementada antes de existir especificação correspondente.

Fluxo obrigatório:

1. entender o problema;
2. criar especificação;
3. validar impacto;
4. implementar;
5. testar;
6. atualizar documentação.

Conteúdo mínimo de uma SPEC:

- objetivo;
- contexto;
- regras de negócio;
- fluxos;
- critérios de aceitação;
- casos de erro;
- impacto em outras funcionalidades;
- requisitos de segurança;
- requisitos legais aplicáveis.

---

## 15. Arquitetura do Produto

Princípios arquiteturais, independentes da tecnologia escolhida:

- baixo acoplamento;
- alta coesão;
- modularidade;
- separação clara de responsabilidades;
- facilidade de manutenção;
- escalabilidade;
- observabilidade.

Evitar código duplicado, dependências desnecessárias, regras de negócio espalhadas, componentes gigantes e
acoplamento entre módulos sem necessidade. Toda alteração deve considerar compatibilidade com o existente,
impacto em integrações futuras e facilidade de expansão.

---

## 16. Segurança e Conformidade

Segurança não é etapa posterior: toda implementação nasce segura. Princípios obrigatórios:
Security by Design, Privacy by Design, Least Privilege, Defense in Depth, Fail Secure e Zero Trust como
referência arquitetural.

O CANAMED trata dados pessoais sensíveis de saúde e deve respeitar integralmente a legislação brasileira
(LGPD, Lei nº 13.787/2018, requisitos CFM/COFEN, ICP-Brasil e ANVISA quando aplicável).

Detalhamento completo em [`docs/seguranca-e-conformidade.md`](docs/seguranca-e-conformidade.md) e nos
ADRs de segurança em [`/adr`](adr).

---

## 17. Qualidade, Testes e Observabilidade

- legibilidade como prioridade: nomes claros, funções pequenas, responsabilidade única, sem código morto;
- toda funcionalidade nasce preparada para testes (unitários, integração, comportamento, regressão);
- correções de bugs devem incluir prevenção contra recorrência;
- logs estruturados, rastreamento de erros, monitoramento e métricas operacionais;
- performance: evitar consultas desnecessárias, processamento repetitivo e bloqueios evitáveis.

---

## 18. Regras Permanentes para o Agente

**Nunca fazer**

- inventar identidade visual, cores ou logos alternativas;
- ignorar uma SPEC aprovada;
- remover rastreabilidade;
- reduzir segurança por conveniência;
- armazenar segredos no código;
- quebrar compatibilidade sem justificativa documentada.

**Sempre fazer**

- ler o briefing antes de decisões importantes;
- consultar os arquivos da identidade visual existentes;
- documentar decisões relevantes em ADR;
- criar SPEC antes de implementar funcionalidades;
- validar impacto legal em funcionalidades que envolvam dados de saúde;
- priorizar simplicidade, segurança e consistência em todas as entregas.

---

## 19. Ambiente de Desenvolvimento

Antes de iniciar qualquer implementação, validar o ambiente (`Environment & Safety Check`) e registrar as
ações relevantes no formato AÇÃO / MOTIVO / LOCAL AFETADO / RESULTADO.

Preferência de instalação em disco D: (`D:\Dev\`, `D:\Tools\`, `D:\SDKs\`, `D:\Projects\`), evitando
instalações desnecessárias no disco C:. Instalar somente o que for necessidade real do projeto.

---

## 20. Pendências Conhecidas da Fase Inicial

| Pendência | Referência |
| :--- | :--- |
| ~~Migrations do EF Core ainda não criadas~~ **Resolvido** pela [SPEC-0002](specs/0002-spec-agenda-de-consultas.md) (migration `InitialAgendaSchema`) | `adr/0007-banco-de-dados-e-persistencia.md` |
| ~~Tipos do frontend ainda não gerados a partir do OpenAPI~~ **Resolvido**: `npm run generate:api` gera `frontend/src/api/schema.d.ts` | `adr/0006-stack-de-aplicacao.md` |
| ~~Testes de comportamento (Playwright) ainda não instalados~~ **Resolvido** pela suíte `frontend/e2e` (`npm run test:e2e`) | [`specs/0002-spec-agenda-de-consultas.md`](specs/0002-spec-agenda-de-consultas.md) (P-002) |
| ~~Autenticação real de usuários pendente~~ **Resolvido** pela [SPEC-0003](specs/0003-spec-autenticacao-autorizacao-e-auditoria.md); os cabeçalhos do [ADR-0009](adr/0009-identidade-de-desenvolvimento-e-autorizacao-temporaria.md) ficam apenas como conveniência de DEV/TEST ([ADR-0010](adr/0010-sessao-de-usuario-e-substituicao-da-identidade-de-desenvolvimento.md)) | `adr/0008-autenticacao-autorizacao-e-auditoria.md` |
| Vulnerabilidade moderada aceita em dependência de desenvolvimento (`vitest`) | [`docs/seguranca-e-conformidade.md`](docs/seguranca-e-conformidade.md) |
| Hospedagem e região dos dados (LGPD) | ADR futuro |
| `assets/brand/identidadevisual.html` está truncado (sem `<head>`, `<style>` e variáveis `:root`) | `docs/identidade-visual.md` |
| Recuperação de senha pelo próprio usuário, convites e códigos de recuperação de MFA | [`docs/backlog-proximas-funcionalidades.md`](docs/backlog-proximas-funcionalidades.md) (seção 2) |

Guia operacional (instalação, execução, uso da agenda e testes):
[`docs/guia-de-uso-e-execucao.md`](docs/guia-de-uso-e-execucao.md).

Próximas funcionalidades, com descrição, esforço e complexidade:
[`docs/backlog-proximas-funcionalidades.md`](docs/backlog-proximas-funcionalidades.md).

---

## Documentos Relacionados

- [`GEMINI.md`](GEMINI.md) — briefing integral e regras de conduta do agente (fonte de verdade).
- [`docs/identidade-visual.md`](docs/identidade-visual.md) — diretrizes de marca.
- [`docs/visao-produto.md`](docs/visao-produto.md) — visão funcional do produto.
- [`docs/seguranca-e-conformidade.md`](docs/seguranca-e-conformidade.md) — segurança e conformidade legal.
- [`docs/CHANGELOG_AGENTE.md`](docs/CHANGELOG_AGENTE.md) — registro das ações do agente.
- [`adr/`](adr) — decisões arquiteturais.
