# Visão do Produto — CANAMED

> Documento funcional consolidado a partir do [`GEMINI.md`](../GEMINI.md) e do
> [`PROJECT_BRIEF.md`](../PROJECT_BRIEF.md). Em caso de divergência, o `GEMINI.md` prevalece.
> Este documento **não** substitui uma SPEC: detalhes de execução são definidos por especificação.

- **Versão:** 2.0
- **Data:** 2026-10-09
- **Status:** Vigente (Especialização em Ginecologia)

---

## 1. Resumo

O CANAMED é uma plataforma SaaS B2B especializada na gestão e no atendimento de **clínicas ginecológicas**. Seu objetivo é eliminar burocracias e gargalos operacionais para que profissionais de saúde da mulher e gestores dediquem atenção total ao acolhimento e cuidado clínico de suas pacientes.

Nesta fase do produto, a prioridade máxima é o desenvolvimento do **Prontuário Eletrônico do Paciente (PEP) especializado em ginecologia**, sem abrir mão da arquitetura robusta e dos módulos de apoio já consolidados (agenda, recepção, financeiro básico e superfícies segregadas).

## 2. Problema

A rotina das clínicas ginecológicas é marcada por consultas densas em histórico (menstrual, obstétrico, contraceptivo e exames preventivos periódicos), com prontuários frequentemente fragmentados, demorados ou engessados por formulários genéricos.
As consequências são retrabalho, perda de visão longitudinal da paciente e fadiga administrativa do médico.

O CANAMED transforma essa rotina em um fluxo acolhedor, rápido, intuitivo e clinicamente consistente.

## 3. Público-Alvo

| Perfil | Necessidade principal |
| :--- | :--- |
| Clínicas ginecológicas e obstétricas | Operar com menos atrito, alta segurança de dados e mais previsibilidade |
| Médicos ginecologistas | PEP especializado, anamnese ginecológica ágil e visão longitudinal contínua |
| Gestores de clínicas | Visibilidade sobre a operação, ocupação e conformidade regulatória |
| Recepcionistas | Fluxos ágeis de agendamento, check-in e fila sem sobrecarga de cliques |
| Pacientes | Superfície dedicada e segura para consultas, documentos e privacidade |

Regiões prioritárias iniciais: Recife, Gravatá, Caruaru, Garanhuns, Petrolina e Agreste Pernambucano.

## 4. Proposta de Valor

Unir as demandas administrativas da clínica e as peculiaridades clínicas do atendimento ginecológico em uma única experiência integrada, priorizando simplicidade, rapidez, organização, sigilo de dados sensíveis e clareza. O sistema deve transmitir controle e previsibilidade, nunca complexidade.

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

**Situação:** implementada pela [SPEC-0005](../specs/0005-spec-fila-de-espera-e-ciclo-de-atendimento.md) —
check-in com e sem agendamento, prioridade de atendimento (normal e preferencial), ordem por prioridade e
chegada, chamada, ciclo do atendimento e fechamento do dia. Painel de chamada e aviso ao paciente ficam
para as SPECs de cadastro completo e de notificações.

### 5.3 Pagamento antes da consulta

Fluxo de pagamento pré-consulta quando aplicável ao modelo da clínica, reduzindo inadimplência e
retrabalho de cobrança no balcão.

### 5.4 Apoio à triagem

Suporte ao processo de triagem, organizando a passagem do paciente da recepção para o atendimento.

### 5.5 Dashboards gerenciais

Informações organizadas para apoiar decisões da gestão, priorizando clareza sobre volume de dados.

### 5.6 Gestão operacional da clínica

Fluxos administrativos e operacionais do dia a dia da clínica.

### 5.7 Superfícies dedicadas e jornada digital do paciente

O produto é organizado em superfícies com endereços próprios, para que cada papel veja apenas o que
lhe cabe e cada funcionalidade possa ser compartilhada por link (SPEC-0026 / ADR-0011):

- **Sistema (`/app`)** — recepção, gestão, financeiro, caixa, DPO e a **Central de Links**;
- **Paciente (`/p/{clínica}`)** — agendar, confirmar, reagendar, cancelar, fazer check-in, acompanhar a
  fila, ver documentos e exercer direitos da LGPD, sem nunca entrar no sistema interno;
- **Profissional (`/medico`)** — agenda, fila do dia, atendimento com PEP e documentos;
- **Saguão (`/sala/tv`)** — painel de chamada, sem login.

O totem físico deixa de ser produto: o check-in passa a ser feito no celular do paciente por QR Code/link
e, excepcionalmente, no balcão. A primeira entrega usa rotas em *path*; a evolução para subdomínio por
clínica reaproveita as mesmas telas.

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
