# Plano de Implementação — Consolidação Administrativa, Agenda & Recepção e Tipos de Entrada Financeira

> **Para executores:** Executar este plano passo a passo com rigor estrito em TDD (Red-Green-Refactor). Cada tarefa é atômica e possui passos verificáveis com comandos reais.

**Objetivo:** Consolidar a arquitetura de informação e a experiência da área administrativa do **Cana Med**, implementando a tela unificada "Agenda & Recepção", o painel central de "Configurações da Clínica" em abas, o formulário de padronização de tipos de entrada financeira e a limpeza da navegação lateral.

**Tech Stack:** React 19, TypeScript, Lucide React, Vitest, CSS Tokens.

**Especificação de Referência:** [`specs/0032-spec-consolidacao-area-administrativa-agenda-recepcao-configuracoes.md`](../../specs/0032-spec-consolidacao-area-administrativa-agenda-recepcao-configuracoes.md)

---

## Tarefas de Implementação

### Tarefa 1: Form e Armazenamento dos Tipos de Entrada Financeira

**Arquivos:**
- Criar: `frontend/src/features/admin/revenueTypesApi.ts`
- Criar: `frontend/src/features/admin/revenueTypesApi.test.ts`
- Criar: `frontend/src/features/admin/RevenueTypesSettings.tsx`
- Criar: `frontend/src/features/admin/RevenueTypesSettings.test.tsx`

- [ ] **Passo 1.1:** Escrever teste unitário `revenueTypesApi.test.ts` validando a listagem, criação, atualização de valor/status e persistência/recuperação dos tipos de entrada padronizados (ex: Consulta Particular Ginecológica, Inserção de DIU Mirena, Retorno de Exames, Coparticipação Convênio).
- [ ] **Passo 1.2:** Executar os testes e confirmar que falham (Red).
- [ ] **Passo 1.3:** Implementar `revenueTypesApi.ts` com tipos TypeScript robustos, seed padrão com procedimentos ginecológicos e métodos de CRUD.
- [ ] **Passo 1.4:** Escrever teste unitário `RevenueTypesSettings.test.tsx` verificando renderização da tabela, botão de novo cadastro, edição de valor sugerido e toggle de status ativo/inativo.
- [ ] **Passo 1.5:** Implementar o componente `RevenueTypesSettings.tsx` com formulário padronizado, badges de categoria e feedback visual.
- [ ] **Passo 1.6:** Executar os testes e confirmar que passam (Green).

---

### Tarefa 2: Módulo Unificado "Configurações da Clínica" em Abas

**Arquivos:**
- Criar: `frontend/src/features/clinics/ClinicSettingsPanel.tsx`
- Criar: `frontend/src/features/clinics/ClinicSettingsPanel.test.tsx`

- [ ] **Passo 2.1:** Escrever teste unitário `ClinicSettingsPanel.test.tsx` validando que as abas (Salas & Estrutura, Convênios, Tipos de Entrada Financeira, Regras de Agendamento, Equipe & Usuários, TV & Links, Privacidade LGPD) são renderizadas e alternam seu conteúdo corretamente.
- [ ] **Passo 2.2:** Executar os testes e confirmar que falham (Red).
- [ ] **Passo 2.3:** Implementar `ClinicSettingsPanel.tsx` importando os formulários e tabelas existentes (`OperationPanel`, `ClinicPolicyPanel`, `UsersPanel`, `LinksPanel`, `DpoWorkspace` e `RevenueTypesSettings`) organizados sob um *Segmented Tab Control* limpo e ergonômico.
- [ ] **Passo 2.4:** Executar os testes e confirmar que passam (Green).

---

### Tarefa 3: Módulo Unificado "Agenda & Recepção"

**Arquivos:**
- Criar: `frontend/src/features/agenda/AgendaRecepcaoPanel.tsx`
- Criar: `frontend/src/features/agenda/AgendaRecepcaoPanel.test.tsx`

- [ ] **Passo 3.1:** Escrever teste unitário `AgendaRecepcaoPanel.test.tsx` verificando a alternância entre a visão de "Grade da Agenda" e "Fila & Recepção", a preservação dos filtros selecionados e a presença dos botões de ação rápida.
- [ ] **Passo 3.2:** Executar os testes e confirmar que falham (Red).
- [ ] **Passo 3.3:** Implementar `AgendaRecepcaoPanel.tsx` integrando os fluxos da `AgendaPage` e `QueuePanel` em um layout fluido com seletor de visão (`SegmentedControl`).
- [ ] **Passo 3.4:** Executar os testes e confirmar que passam (Green).

---

### Tarefa 4: Reorganização da Navegação e Limpeza da Sidebar

**Arquivos:**
- Modificar: `frontend/src/navigation/routes.ts`
- Modificar: `frontend/src/features/layout/Sidebar.tsx`
- Modificar: `frontend/src/features/layout/Topbar.tsx`
- Modificar: `frontend/src/app/StaffApp.tsx`
- Modificar: `frontend/src/features/layout/Sidebar.test.tsx`

- [ ] **Passo 4.1:** Atualizar os testes em `Sidebar.test.tsx` para esperar apenas a estrutura de 5 itens operacionais (`Dashboard`, `Agenda & Recepção`, `Pacientes`, `Equipe Médica`, `Caixa Diário`) e o item fixo de `Configurações da Clínica` no rodapé.
- [ ] **Passo 4.2:** Executar o teste e checar as falhas esperadas (Red).
- [ ] **Passo 4.3:** Atualizar `routes.ts` adicionando a rota canônica `settings: '/app/configuracoes'` e mapeamento do item `Agenda & Recepção`.
- [ ] **Passo 4.4:** Refatorar `Sidebar.tsx` removendo os itens dispersos da seção principal e inserindo o botão `Configurações da Clínica` no rodapé junto ao perfil.
- [ ] **Passo 4.5:** Atualizar `Topbar.tsx` adicionando atalho para Configurações no menu do usuário e títulos semânticos atualizados.
- [ ] **Passo 4.6:** Atualizar `StaffApp.tsx` para renderizar `AgendaRecepcaoPanel` em `/app/agenda` e `/app/recepcao`, e `ClinicSettingsPanel` em `/app/configuracoes` e rotas secundárias legadas (evitando 404).
- [ ] **Passo 4.7:** Executar todos os testes do frontend (`npm test`) e garantir que 100% passam (Green).
