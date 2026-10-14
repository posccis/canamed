# SPEC-0032 — Consolidação da Área Administrativa: Agenda & Recepção, Configurações da Clínica e Padronização de Entradas Financeiras

| Campo | Valor |
| :--- | :--- |
| **ID** | SPEC-0032 |
| **Título** | Consolidação da Área Administrativa: Agenda & Recepção, Configurações da Clínica e Padronização de Entradas Financeiras |
| **Status** | Aprovado para Implementação |
| **Versão** | 1.0.0 |
| **Data** | 2026-10-14 |
| **Autor** | Time Multidisciplinar Cana Med (Product Architect, Planejador, Medical Systems Domain Expert, UI/UX Reviewer) |
| **Módulos afetados** | `frontend/src/features/layout/`, `frontend/src/features/agenda/`, `frontend/src/features/queue/`, `frontend/src/features/clinics/`, `frontend/src/features/admin/`, `frontend/src/navigation/` |
| **ADRs relacionados** | ADR-0004, ADR-0006, ADR-0008, ADR-0010, ADR-0011 |

---

## 1. Objetivo

Consolidar a arquitetura de informação e a experiência da área administrativa do **Cana Med**, implementando:
1. **Unificação da Operação Diária:** Fusão das telas de Agenda e Recepção no módulo **"Agenda & Recepção"** (`/app/operacao-dia`), com alternador de visão de 1 clique (`[ Grade da Agenda | Fila & Recepção ]`).
2. **Central de Configurações da Clínica em Abas:** Unificação de Salas, Convênios, Regras de Agendamento/Políticas, Usuários/Equipe Administrativa, Links/TV e Privacidade LGPD em uma página integrada (`/app/configuracoes`), acessível no rodapé da sidebar e no topo direito (perfil do usuário).
3. **Formulário de Padronização de Tipos de Entrada Financeira:** Parametrização dos tipos e categorias de entradas do caixa e faturamento da clínica (Consultas Particulares, Procedimentos Ginecológicos, Coparticipações de Convênios, Venda de Insumos/DIU, Outras Receitas) dentro de Configurações, garantindo lançamentos organizados e relatórios limpos no caixa diário.
4. **Navegação Operacional Enxuta:** Limpeza da barra lateral para manter apenas 5 itens principais (`Dashboard`, `Agenda & Recepção`, `Pacientes`, `Equipe Médica`, `Caixa & Financeiro Básico`) + `Configurações da Clínica` no rodapé.

Pergunta de controle do `GEMINI.md`: **isso reduz atrito na rotina da clínica?**
**Sim.** Elimina o vaivém contínuo entre telas da secretária, concentra o suporte da recepção em um ponto único e padroniza as fontes de receita da clínica ginecológica sem a sobrecarga de um ERP complexo.

---

## 2. Contexto e Decisões de Produto

Com base na Auditoria Funcional do MVC e na validação do usuário:
* **Decisão 1:** A tela consolidada do fluxo operacional diário adota oficialmente o nome **"Agenda & Recepção"**.
* **Decisão 2:** O acesso às **"Configurações da Clínica"** fica posicionado de forma ergonômica no rodapé da barra lateral e no menu de contexto do usuário no topo, mantendo o menu lateral 100% focado no fluxo operacional diário.
* **Decisão 3:** O controle financeiro do MVP foca no **Caixa Diário** e exige a criação de um **formulário de padronização dos tipos de entrada** nas Configurações da Clínica. Módulos avançados de DRE contábil e repasses multifacetados permanecem postergados.

---

## 3. Escopo

### 3.1 Dentro do escopo
1. **Navegação (`Sidebar.tsx`, `Topbar.tsx`, `routes.ts`, `StaffApp.tsx`):**
   - Reduzir os itens principais da sidebar para os 5 essenciais:
     - `Dashboard` (`/app/dashboard`)
     - `Agenda & Recepção` (`/app/operacao-dia` ou `/app/agenda`)
     - `Pacientes` (`/app/pacientes`)
     - `Equipe Médica` (`/app/profissionais`)
     - `Caixa & Financeiro Básico` (`/app/caixa`)
   - Posicionar `Configurações da Clínica` (`/app/configuracoes`) como item utilitário fixo no rodapé da barra lateral e na topbar.
   - Manter compatibilidade de rotas legadas no `StaffApp.tsx` com redirects suaves para evitar qualquer quebra.
2. **Módulo Unificado "Agenda & Recepção" (`AgendaRecepcaoPanel.tsx`):**
   - Header unificado com seletor de data, filtro por médico e sala.
   - Alternador de visão em *Segmented Control*: `[ 📅 Grade da Agenda | 📋 Fila & Recepção ]`.
   - Atalhos de ação no topo: `+ Novo Agendamento` e `+ Encaixe Rápido`.
   - Modal contextual de check-in integrado com registro imediato de pagamento/entrada no caixa.
3. **Módulo "Configurações da Clínica" (`ClinicSettingsPanel.tsx`):**
   - Abas organizadas:
     - `Dados da Clínica & Salas`
     - `Convênios Aceitos`
     - `Tipos de Atendimento & Duração`
     - `Tipos de Entrada Financeira` (novo formulário padronizado)
     - `Regras de Agendamento & Encaixes` (antiga tela de Políticas)
     - `Equipe & Acessos` (antiga tela de Usuários simplificada)
     - `Integrações, TV & Links` (links públicos e URL da TV do saguão)
     - `Privacidade & LGPD` (antigo painel DPO)
4. **Padronização dos Tipos de Entrada Financeira:**
   - Cadastro e listagem dos tipos de receita aceitos na clínica:
     - Código/Identificador
     - Nome descritivo (ex: *Consulta Particular Ginecológica*, *Inserção de DIU*, *Retorno sem custo*, *Coparticipação Unimed*, *Procedimento Biópsia*)
     - Categoria (Consulta, Procedimento, Exame, Outros)
     - Valor Padrão Sugerido (R$)
     - Ativo / Inativo
   - Integração com o modal de pagamento do caixa diário e do check-in.

### 3.2 Fora do escopo
- DRE contábil, conciliação bancária automática com arquivos OFX e lotes de remessa bancária.
- WMS e rastreio de múltiplos lotes farmacêuticos em estoque.
- Exclusão física de registros do banco de dados (preservação estrita das tabelas e integridade do histórico).

---

## 4. Atores e Permissões (RBAC)

| Ator | Permissões |
| :--- | :--- |
| **Recepcionista** | Operação diária completa em `Agenda & Recepção`, visualização cadastral de `Pacientes`, registro de recebimentos em `Caixa`. Bloqueado para alterar `Configurações da Clínica` e dados clínicos do prontuário. |
| **Médico(a)** | Visualização de seus horários e fila em `Agenda & Recepção`, acesso total ao prontuário clínico e prescrição (`/medico`). Bloqueado para configurações financeiras globais da clínica. |
| **Gestor da Clínica** | Acesso total à operação diária, fechamento de caixa, relatórios e gestão de todas as abas de `Configurações da Clínica`. |
| **Admin Geral (TI)** | Suporte técnico, gestão de contas e auditoria. |

---

## 5. Regras de Negócio

| ID | Regra | Justificativa |
| :--- | :--- | :--- |
| **RN-001** | A secretária deve poder alternar entre a Grade da Agenda e a Fila de Espera em menos de 1 segundo sem recarregar a página e sem perder a data/médico selecionados. | Ergonomia operacional e agilidade no atendimento presencial e telefônico. |
| **RN-002** | O check-in da paciente deve permitir disparar o registro opcional de pagamento no caixa no mesmo diálogo, vinculando o atendimento ao lançamento financeiro. | Redução de retrabalho e prevenção de inadimplência de consultas particulares. |
| **RN-003** | Todo lançamento no caixa diário deve ter obrigatoriamente um "Tipo de Entrada" padronizado selecionado. | Rastreabilidade e relatórios financeiros claros sem categorias genéricas ou digitação livre inconsistente. |
| **RN-004** | Tipos de entrada com status inativo não aparecem nas novas seleções de recebimento, mas permanecem visíveis nos históricos e relatórios passados. | Integridade contábil e auditoria (não-destrutividade). |
| **RN-005** | Nenhuma rota antiga (`/app/agenda`, `/app/recepcao`, `/app/operacao`, etc.) deve resultar em tela branca ou erro 404; devem redirecionar ou renderizar a visão unificada apropriada. | Preservação da experiência de navegação e compatibilidade retroativa. |

---

## 6. Interface e Experiência

### 6.1 Sidebar Consolidada
* **Seção Principal (4 itens):**
  1. `Dashboard` (Ícone `LayoutDashboard`)
  2. `Agenda & Recepção` (Ícone `CalendarDays`)
  3. `Pacientes` (Ícone `Users`)
  4. `Equipe Médica` (Ícone `UserCog`)
* **Seção Financeiro (1 item):**
  5. `Caixa Diário` (Ícone `Wallet` ou `Receipt`)
* **Rodapé Utilitário:**
  - `Configurações da Clínica` (Ícone `Settings`)
  - Perfil do Usuário com avatar e menu dropdown

### 6.2 "Agenda & Recepção"
* Alternador de Visão no topo estilizado com tokens da marca:
  * `[ 📅 Grade de Horários ]` e `[ 📋 Fila de Chegadas & Recepção ]`.
* Se a visão for **Grade**, exibe slots de horários com filtros por profissional e sala.
* Se a visão for **Fila**, exibe a lista corrida das pacientes do dia com botões de 1 clique (`Check-in`, `Chamar TV`, `Receber`, `Ausente`).

### 6.3 "Configurações da Clínica"
* Layout com Abas Horizontais com scroll responsivo e visual limpo:
  * `[ Salas ] [ Convênios ] [ Tipos de Atendimento ] [ Tipos de Entrada Financeira ] [ Regras de Agendamento ] [ Equipe ] [ TV & Links ] [ LGPD ]`.
* Tabela de Tipos de Entrada com botão `+ Novo Tipo de Entrada`, switches de status Ativo/Inativo e edição inline de valores sugeridos.

---

## 7. Critérios de Aceitação

| ID | Critério |
| :--- | :--- |
| **CA-001** | **Dado** que a secretária acessa `/app/operacao-dia`, **Quando** clica no alternador "Fila & Recepção", **Então** a lista de pacientes do dia é exibida instantaneamente mantendo o filtro do médico e da data selecionada. |
| **CA-002** | **Dado** que a secretária realiza o check-in de uma paciente com consulta particular, **Quando** clica em "Confirmar Chegada & Registrar Pagamento", **Então** o sistema abre o modal de recebimento com o tipo de entrada pré-selecionado e atualiza o caixa diário. |
| **CA-003** | **Dado** que o gestor acessa `Configurações > Tipos de Entrada Financeira`, **Quando** cadastra um novo tipo "Inserção de DIU Mirena" com valor R$ 800,00, **Então** esse item passa a constar imediatamente na lista suspensa de opções de recebimento do caixa. |
| **CA-004** | **Dado** que um usuário clica no item `Configurações da Clínica` na barra lateral ou no menu do topo, **Quando** a página carrega, **Então** o painel em abas é renderizado permitindo configurar salas, convênios, regras e usuários em um só lugar. |
| **CA-005** | **Dado** que a suíte de testes é executada (`npm test`), **Então** 100% dos testes passam sem quebra de regressão. |

---

## 8. Histórico de Revisões

| Versão | Data | Autor | Alteração |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-10-14 | Time Multidisciplinar Cana Med | Criação e aprovação da especificação de consolidação administrativa. |
