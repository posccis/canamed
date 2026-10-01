# Visão do Produto — CANAMED

> Documento funcional consolidado a partir do [`GEMINI.md`](../GEMINI.md) e do
> [`PROJECT_BRIEF.md`](../PROJECT_BRIEF.md). Em caso de divergência, o `GEMINI.md` prevalece.
> Este documento **não** substitui uma SPEC: detalhes de execução são definidos por especificação.

- **Versão:** 1.1
- **Data:** 2026-09-30
- **Status:** Vigente

---

## 1. Resumo

O CANAMED é uma plataforma SaaS B2B de gestão clínica e relacionamento, voltada a clínicas de pequeno e
médio porte. Seu objetivo é reduzir a carga administrativa e organizar o funcionamento da clínica como um
todo, para que profissionais e gestores concentrem energia no cuidado com o paciente.

## 2. Problema

A rotina das clínicas de pequeno e médio porte é marcada por processos manuais, fragmentados e demorados.
As consequências típicas são retrabalho, tempo excessivo em tarefas administrativas, informação dispersa e
dificuldade de enxergar a operação como um todo.

O CANAMED não se propõe a ser apenas mais um sistema de registro: a proposta é organizar o negócio.

## 3. Público-Alvo

| Perfil | Necessidade principal |
| :--- | :--- |
| Clínicas médicas (pequeno e médio porte) | Operar com menos atrito e mais previsibilidade |
| Gestores de clínicas | Visibilidade sobre a operação e apoio à decisão |
| Recepcionistas | Fluxos simples de agenda, espera e atendimento |
| Profissionais de saúde | Menos burocracia, mais tempo de atendimento |
| Equipes administrativas | Redução de retrabalho e de erro manual |

Regiões prioritárias iniciais: Recife, Gravatá, Caruaru, Garanhuns, Petrolina e Agreste Pernambucano.

## 4. Proposta de Valor

Reunir, em uma experiência única e integrada, características hoje dispersas entre vários sistemas,
priorizando simplicidade, rapidez, organização, confiança e clareza. O sistema deve transmitir controle e
previsibilidade, nunca complexidade.

## 5. Pilares do Produto

Cada pilar depende de SPEC própria antes de qualquer implementação. A ordem de implementação ainda não
foi definida.

### 5.1 Gestão de agenda

Organização de horários considerando profissionais, disponibilidade, duração de atendimento e salas.
Objetivos de eficiência: eliminar conflitos de horário, reduzir tempo de marcação e dar visibilidade
imediata da ocupação.

**Situação:** implementada pela [SPEC-0002](../specs/0002-spec-agenda-de-consultas.md) — agendamento, remarcação,
cancelamento com motivo, bloqueio de agenda e visão do dia por profissional. Salas, equipamentos e
telemedicina permanecem fora de escopo (ver a seção 3.2 da SPEC).

### 5.2 Fila de espera

Organização da chegada e da ordem de atendimento dos pacientes, tornando a espera visível e previsível
para a recepção e para o paciente.

### 5.3 Pagamento antes da consulta

Fluxo de pagamento pré-consulta quando aplicável ao modelo da clínica, reduzindo inadimplência e
retrabalho de cobrança no balcão.

### 5.4 Apoio à triagem

Suporte ao processo de triagem, organizando a passagem do paciente da recepção para o atendimento.

### 5.5 Dashboards gerenciais

Informações organizadas para apoiar decisões da gestão, priorizando clareza sobre volume de dados.

### 5.6 Gestão operacional da clínica

Fluxos administrativos e operacionais do dia a dia da clínica.

## 6. Fluxos Macro (preliminares)

Os fluxos abaixo são um recorte de alto nível para orientar as SPECs. Nenhum deles está especificado:
detalhes de regra de negócio, estados e casos de erro devem ser definidos na SPEC correspondente.

1. **Chegada e agendamento** — paciente chega ou é agendado; horário é reservado; conflitos são evitados.
2. **Espera e triagem** — paciente entra na fila; ordem e tempo de espera ficam visíveis; triagem é registrada.
3. **Atendimento** — profissional realiza o atendimento; informações pertinentes ficam registradas.
4. **Pagamento** — quando aplicável, o pagamento ocorre antes da consulta.
5. **Pós-atendimento** — retorno, remarcação e demais desdobramentos operacionais.
6. **Gestão** — gestor acompanha a operação por dashboards e indicadores.

## 7. Princípios de Experiência e Linguagem

- interpretar a próxima ação naturalmente, sem excesso de etapas ou decisões desnecessárias;
- linguagem clara, objetiva, amigável e profissional;
- consistência visual, de linguagem e de comportamento em todo o produto;
- orientar o usuário sobre o próximo passo sempre que possível.

## 8. Restrições de Produto

- não criar identidade visual própria;
- não alterar o conceito central;
- não transformar o sistema em ERP genérico;
- não adicionar complexidade sem ganho operacional claro;
- não implementar integrações fictícias.

## 9. Itens a Definir

| Tema | Onde será decidido |
| :--- | :--- |
| Ordem de implementação dos pilares | SPEC / planejamento de produto |
| Regras de negócio de cada pilar | SPEC correspondente |
| Stack de aplicação | `adr/0006-stack-de-aplicacao.md` |
| Banco de dados e persistência | `adr/0007-banco-de-dados-e-persistencia.md` |
| Autenticação, autorização e auditoria | `adr/0008-autenticacao-autorizacao-e-auditoria.md` |
| Requisitos legais por funcionalidade | SPEC + `docs/seguranca-e-conformidade.md` |

## Referências

- [`GEMINI.md`](../GEMINI.md) — briefing integral (fonte de verdade).
- [`PROJECT_BRIEF.md`](../PROJECT_BRIEF.md) — brief consolidado.
- [`docs/seguranca-e-conformidade.md`](seguranca-e-conformidade.md) — segurança e conformidade.
