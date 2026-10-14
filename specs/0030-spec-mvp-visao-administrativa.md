# SPEC-0030 — MVP da Visão Administrativa | Cana Med Mulher

> **Status:** Aprovado para Implementação  
> **Data:** 12 de Outubro de 2026  
> **Autor:** Time Multidisciplinar Cana Med (Orquestrador, Planejador, Medical Systems Domain Expert, UI/UX Reviewer)  
> **Versão:** 1.0.0  
> **Módulos Afetados:** Dashboard Administrativo, Gestão de Pacientes, Gestão de Profissionais, Agenda Diária/Semanal, Regras de Agendamento, Autoatendimento do Paciente, Usuários & Permissões, Configurações da Clínica, Financeiro Básico  

---

## 1. Objetivo e Contexto

O objetivo desta especificação é definir a implementação do **MVP da Visão Administrativa do Cana Med Mulher**, consolidando a operação ambulatorial de clínicas ginecológicas em uma plataforma SaaS segura, eficiente e humanizada.

A administração permite gerenciar a operação diária da clínica (pacientes, corpo clínico, agenda diária/semanal, regras de agendamento público e políticas de cancelamento/encaixe) sem necessidade de intervenções manuais no banco de dados e com rigorosa segregação entre dados administrativos e dados clínicos confidenciais (LGPD Art. 5º/11, CFM e Lei nº 13.787/2018).

---

## 2. Inventário de Funcionalidades Existentes vs Escopo do MVP

| Módulo do MVP | Estado Atual no Repositório | Gaps Identificados | Ação de Implementação |
| :--- | :--- | :--- | :--- |
| **3.1 Dashboard Administrativo** | `DashboardPanel.tsx` possui KPIs operacionais diários pontuais e lista de próximos atendimentos do dia. Endpoint `GET /dashboard/summary?date=...`. | Falta filtro por período (semana/mês), indicadores gerenciais consolidados (total pacientes, médicos ativos, volume no período) e atalhos de ação rápida. | Separar em dois blocos: "Pulso de Hoje" e "Desempenho no Período", adicionar filtros de período e botões de atalho rápido de 1 clique. |
| **3.2 Gestão de Pacientes** | Pacientes existem como aba secundária simples no `CatalogPanel.tsx` e endpoints `GET/POST /patients`. | Sem busca em tempo real com debounce, sem paginação, sem histórico de agendamentos associado, sem drawer lateral de edição e sem validação estrita de duplicidade. | Criar módulo dedicado de Pacientes (`PatientsPanel.tsx`), busca por Nome/CPF/Telefone, drawer lateral de cadastro/edição, histórico de agendamentos e regras anti-duplicidade e retenção 20 anos. |
| **3.3 Gestão de Profissionais** | Profissionais existem como subseção simples no `CatalogPanel.tsx` e endpoints `GET/POST /professionals`. | Falta registro explícito de CRM/UF e RQE, visualização de agenda vinculada e trava de inativação com consultas futuras ativas. | Criar módulo dedicado de Profissionais (`ProfessionalsPanel.tsx`), cadastro completo com CRM/UF, visualização de horários e trava assistencial contra inativação descuidada. |
| **3.4 Gestão da Agenda** | `AgendaPage.tsx` possui visualização diária com filtros por profissional, criação, cancelamento, encaixe e bloqueio. | Falta alternância entre visualização Diária e Semanal, grid semântico de slots (livres, ocupados com status e bloqueados com hachura). | Implementar segmented control `[ Diária \| Semanal ]`, grade horária com cards semânticos coloridos por status e popover de ações contextuais. |
| **3.5 Regras de Agendamento** | `ClinicPolicyPanel.tsx` (cota de encaixe e horas de antecedência) e `OperationPanel.tsx` (horários e feriados). | Regras dispersas em telas diferentes sem visão consolidada dos parâmetros de autoatendimento. | Conectar políticas e horários em interface unificada de Regras de Agendamento com duracões por tipo de serviço e prazos de cancelamento/remarcação. |
| **3.6 Autoatendimento do Paciente** | Rotas públicas `/public/clinics/{slug}/meta`, `/public/capabilities/{token}/*` e Central de Links em `/app/links`. | Central de Links necessita atalhos diretos e filtros mais claros para cópia humanizada via WhatsApp pela recepção. | Integrar Central de Links com validações de prazos mínimos e desafios de confirmação anti-enumeração. |
| **3.7 Usuários & Permissões** | `UsersPanel.tsx` com criação, redefinição de senha e inativação via `UserEndpoints.cs`. | Falta filtro/busca, badges semânticos de papel e salvaguarda contra auto-revogação de gestor. | Modernizar `UsersPanel.tsx` com busca, badges de perfil (Administrador, Recepção, Médico, DPO) e trava de segurança. |
| **3.8 Configurações da Clínica** | Endpoints de operação (`rooms`, `health-plans`, `operating-hours`, `closures`). | Não há tela para editar dados cadastrais básicos da clínica (nome, telefone, e-mail, logotipo, fuso horário). | Disponibilizar formulário administrativo de dados cadastrais da clínica com validação de permissão `clinic:manage`. |
| **3.9 Financeiro Básico** | `FinancialPanel.tsx` (transações e repasses), `CashRegisterPanel.tsx` (caixa) e resumo diário em pagamentos. | Necessidade de clareza na distinção entre valores previstos e valores recebidos. | Reforçar na interface a segregação entre faturamento recebido em caixa e consultas agendadas pendentes de quitação. |

---

## 3. Requisitos Clínicos, Regulatórios e de Segurança (Medical Systems Review)

Com base no Parecer Clínico do **Medical Systems Domain Expert**, os seguintes requisitos são **mandatórios**:

1. **[MED-01 / P0] Segregação Absoluta de Dados Clínicos vs Administrativos:**
   - Usuários com papéis administrativos (`gestor`, `recepcionista`) **nunca** têm acesso a anotações de evolução clínica, diagnósticos (CID/hipóteses), histórico menstrual/reprodutivo ou exames íntimos.
   - O backend filtra rigorosamente DTOs administrativos para conter apenas dados cadastrais, horários, profissionais, status operacional, financeiro e categoria geral do serviço.
   - Observações de agendamento registradas pela recepção são estritamente administrativas com aviso em tela: *"Anotações operacionais (não registrar informações clínicas íntimas)"*.

2. **[MED-02 / P0] Identificação Unívoca e Inativação Lógica sem Expurgo:**
   - Validação de duplicidade na criação de pacientes: CPF unívoco por clínica; para pacientes sem CPF, checar triangulação Nome Completo + Data de Nascimento.
   - Proibição de exclusão física (`DELETE FROM patients`). A desativação é estritamente lógica (`IsActive = false`), garantindo a preservação legal por 20 anos (Lei nº 13.787/2018).

3. **[MED-03 / P0] Registro Profissional e Trava Assistencial de Inativação:**
   - Cadastro de médico exige CRM e UF válidos.
   - O sistema bloqueia a inativação de um profissional caso existam consultas futuras agendadas ou confirmadas, exigindo o remanejamento assistencial prévio.

4. **[MED-04 / P0] Autoatendimento Seguro e Anti-Enumeração:**
   - Tokens de autoatendimento gerados criptograficamente com alta entropia.
   - Operações de visualização detalhada, cancelamento ou alteração exigem desafio de verificação (ex: data de nascimento da paciente).
   - O link público nunca expõe diagnósticos, prontuário ou CPF desprotegido.

5. **[MED-05 / P1] Duração Clínica Diferenciada por Serviço:**
   - *Primeira Consulta Ginecológica:* Padrão 45–60 min (anamnese, histórico GPA/ciclo, exame das mamas e ginecológico).
   - *Retorno de Exames:* Padrão 20–30 min.
   - *Procedimentos Ambulatoriais (DIU / Biópsia):* Padrão 30–45 min + intervalo de assepsia de sala.

6. **[MED-06 / P1] Cota de Encaixes (Overbooking) e Transição de Status:**
   - Cota máxima diária de encaixes por profissional gerenciável na administração.
   - Estados operacionais: `Agendado` -> `Confirmado` -> `Aguardando (Check-in)` -> `Em Atendimento` -> `Concluído` / `Faltou` / `Cancelado`.

---

## 4. Diretrizes de Interface e UI/UX (UI/UX Review)

Com base no Laudo de UI/UX do **UI/UX Reviewer**, os seguintes padrões devem ser aplicados:

1. **[UI-01 / P1] Navegação na Sidebar SaaS Branca:**
   - Fundo `#ffffff` com borda direita `#e2e8f0` e indicador ativo no Accent Mint `#66CDAA`.
   - Inclusão das entidades de primeiro nível na navegação:
     - **Principal:** Dashboard, Agenda, Consultório (médico), Recepção/Fila.
     - **Cadastros:** Pacientes, Profissionais.
     - **Administração:** Operação & Salas, Catálogo, Usuários, Central de Links, Políticas, Painel TV, DPO.
   - Ocultação estrita via RBAC dos itens não autorizados.

2. **[UI-02 / P1] Dashboard com Visão Dupla:**
   - **Pulso de Hoje (Tempo Real):** 4 KPIs compactos (Agendamentos Hoje, Pacientes em Espera, Em Atendimento, Faltas/Cancelamentos) e lista de próximos pacientes.
   - **Desempenho no Período:** Seletor de período (`Hoje`, `Últimos 7 dias`, `Mês Atual`) com total de consultas, pacientes novos e resumo financeiro.
   - Atalhos de Ação Rápida de 1 clique: `+ Novo Agendamento`, `+ Cadastrar Paciente`, `Bloquear Horário`.

3. **[UI-03 / P1] Drawer Lateral para Cadastros Rápidos:**
   - Implementação de Drawer lateral direito (largura 500px–520px com backdrop suave) para criação e edição de Pacientes e Profissionais, mantendo a listagem visível ao fundo.

4. **[UI-04 / P1] Agenda com Alternância Diária / Semanal:**
   - Segmented control `[ Diária | Semanal ]`.
   - Visão Diária: Colunas por profissional ativo na clínica.
   - Visão Semanal: Colunas de Segunda a Sábado com slots organizados por hora.
   - Cards com borda esquerda de 4px semântica de status e textura hachurada com cadeado para horários bloqueados.

5. **[UI-05 / P2] Componente Unificado de Estado Vazio (`EmptyState`):**
   - Ilustração ou ícone sutil, mensagem amigável e botão CTA direto para cadastrar ou reiniciar filtros.

---

## 5. Arquitetura Técnica e Modelagem

### 5.1 Backend (.NET 10 / C# / PostgreSQL)
- **Camada de Domínio:** `Canamed.Domain.Agenda`, `Canamed.Domain.Clinics`, `Canamed.Domain.Identity`.
- **Camada de Aplicação:**
  - `DashboardService`: Evoluir método para suporte a consulta por intervalo de datas (`fromUtc`, `toUtc`) além do dia único.
  - `CatalogService` & `AgendaService`: Métodos específicos de consulta paginada e busca de pacientes/profissionais com histórico de consultas.
  - `ClinicService`: Suporte à leitura e atualização dos dados gerais da clínica.
- **Camada de Apresentação (Endpoints Minimal API):**
  - `DashboardEndpoints`: Parâmetros `from` e `to` opcionais.
  - `CatalogEndpoints`: Endpoints com suporte a filtros de busca e paginação.
  - `ClinicOperationEndpoints`: Endpoint para leitura e atualização de perfil da clínica.

### 5.2 Frontend (React 19 / TypeScript / Vite)
- **Rotas (`routes.ts` & `StaffApp.tsx`):**
  - Adição das rotas administrativas: `/app/pacientes` (`patients`), `/app/profissionais` (`professionals`).
- **Componentes:**
  - `PatientsPanel.tsx`: Tabela com busca, paginação, badges, drawer de cadastro/edição e aba de histórico de agendamentos.
  - `ProfessionalsPanel.tsx`: Tabela de profissionais com especialidade, CRM/UF, status e horários de atendimento.
  - `AgendaPage.tsx`: Extensão para alternância entre modo Diário e Semanal.
  - `DashboardPanel.tsx`: Incorporação dos blocos "Pulso de Hoje", "Desempenho no Período" e atalhos rápidos.
  - `Sidebar.tsx`: Organização harmoniosa com novos links e respeito estrito a permissões RBAC.

---

## 6. Fases de Execução e Plano de Trabalho

### Fase 1: Diagnóstico e Especificação (Concluída)
- Inventário de funcionalidades, análise de gaps, parecer médico especializado e laudo UI/UX.
- Elaboração desta SPEC formal e do plano de tarefas detalhado.

### Fase 2: Fundação Administrativa & Navegação
- Atualização do mapa de rotas (`routes.ts`, `StaffApp.tsx`) e da `Sidebar.tsx` com novas seções semânticas (Pacientes e Profissionais).
- Criação dos componentes compartilhados `Drawer.tsx` e `EmptyState.tsx`.

### Fase 3: Gestão de Pacientes & Profissionais
- Implementação do `PatientsPanel.tsx` com busca por Nome/CPF/Telefone, drawer lateral, validação anti-duplicidade e histórico de consultas.
- Implementação do `ProfessionalsPanel.tsx` com CRM/UF, especialidade, status e trava contra inativação descuidada.

### Fase 4: Agenda Diária/Semanal & Regras de Agendamento
- Aprimoramento da `AgendaPage.tsx` com alternador Diário/Semanal e grid semântico de slots.
- Integração refinada das regras de agendamento e políticas de cancelamento.

### Fase 5: Dashboard Operacional & Gerencial
- Atualização do `DashboardPanel.tsx` com KPIs em tempo real ("Pulso de Hoje"), métricas consolidadas ("Desempenho no Período") e atalhos rápidos.

### Fase 6: Validação Integral, Testes e Conformidade
- Testes automatizados em todos os novos componentes e fluxos (`npm test`, `dotnet test`).
- Auditoria de segurança e verificação de zero regressões.

---

## 7. Critérios de Aceitação (Gherkin)

```gherkin
Cenário: Segregação RBAC no cadastro de pacientes
  Dado que um recepcionista acessa o painel de pacientes
  Quando visualiza a ficha de uma paciente
  Então os campos cadastrais administrativos (nome, CPF, telefone, endereço, convênio) são exibidos
  E nenhum dado de anamnese, prontuário ou evolução clínica é exposto na tela ou retornado na API

Cenário: Trava assistencial na inativação de médico
  Dado que o Dr. Marcos possui 4 consultas agendadas para os próximos dias
  Quando o gestor tenta inativar o cadastro do Dr. Marcos
  Então o sistema bloqueia a inativação
  E exibe mensagem informativa exigindo o remanejamento das pacientes antes de inativar o profissional

Cenário: Alternância da agenda entre visão diária e semanal
  Dado que a secretária está na página da agenda
  Quando clica no alternador "Semanal"
  Então a grade é reconfigurada exibindo os dias de Segunda a Sábado
  E os horários ocupados apresentam status colorido e os bloqueados apresentam textura hachurada

Cenário: Busca em tempo real de pacientes
  Dado que a recepcionista digita "123.456" no campo de busca de pacientes
  Quando o tempo de digitação (debounce) expira
  Então a lista de pacientes é filtrada localizando a paciente pelo CPF correspondente
```
