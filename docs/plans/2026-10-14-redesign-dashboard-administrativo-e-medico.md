# Plano de Implementação — Redesign do Dashboard Administrativo e da Área do Médico

> **Para executores:** Executar este plano passo a passo com rigor estrito em TDD (Red-Green-Refactor). Cada tarefa é atômica e possui passos verificáveis com comandos reais.

**Objetivo:** Aplicar integralmente o design e o padrão de interface do protótipo [`assets/prototypes/dashboard_administrativo_canamed.html`](../../assets/prototypes/dashboard_administrativo_canamed.html) tanto no Dashboard Administrativo quanto na Área do Médico (`/medico`), corrigindo as logos com SVGs vetorizados de alta proporção e preservando todas as funcionalidades preexistentes.

**Arquitetura:** Modernização visual baseada em Design Tokens CSS centralizados em `theme.css`, componentes SVG reutilizáveis com `viewBox` recortado rente à arte, reformulação da `Sidebar` e `Topbar` de ambos os módulos (admin e médico) com botão de colapso flutuante e avatar em chip, e reconstrução dos layouts de Dashboard em grid semântico (4 KPIs com radar pulsante no "Em Atendimento", tabela de próximos atendimentos com badges semânticos e coluna lateral de ações rápidas).

**Tech Stack:** React 19, TypeScript, Lucide React, Vitest, CSS Tokens.

**Especificação de Referência:** [`specs/0031-spec-redesign-dashboard-administrativo-e-medico.md`](../../specs/0031-spec-redesign-dashboard-administrativo-e-medico.md)

---

## Restrições Globais

- Cores de marca obrigatórias: Brand Primary `#852A91`, Brand Hover `#6F217B`, Brand Soft `#F7ECF8`, Base `#F7F8FA`, Borda `#E2E6EC`.
- Logos em SVG devem ser nítidas e legíveis, com `viewBox="45 130 580 110"` (versão longa) e `viewBox="180 80 305 210"` (versão curta).
- Nenhuma funcionalidade existente (períodos, métricas, ações rápidas, exportação CSV) pode ser removida.
- A segregação de acesso (RBAC) e as rotas `/app/*` e `/medico/*` permanecem inalteradas.
- Todos os 114 testes do frontend devem passar a cada etapa.

---

## Tarefas de Implementação

### Tarefa 1: Design Tokens CSS e Componentes de Logo em SVG

**Arquivos:**
- Modificar: `frontend/src/styles/theme.css`
- Criar: `frontend/src/shared/CanamedLogo.tsx`
- Criar: `frontend/src/shared/CanamedLogo.test.tsx`
- Criar/Atualizar: `frontend/public/assets/brand/canamed-mulher-logolonga.svg`, `frontend/public/assets/brand/canamed-mulher-logocurta.svg`

- [x] **Passo 1.1:** Escrever teste unitário `CanamedLogo.test.tsx` verificando que `CanamedLogoLonga` e `CanamedLogoCurta` renderizam com o `viewBox` correto, atributos de acessibilidade e classes CSS.
- [x] **Passo 1.2:** Executar o teste e confirmar que falha (Red).
- [x] **Passo 1.3:** Implementar `CanamedLogo.tsx` com os elementos vetoriais SVG exatos da marca com viewBox ajustado e preenchimentos oficiais.
- [x] **Passo 1.4:** Atualizar `theme.css` adicionando as variáveis CSS `--brand-primary: #852A91`, `--brand-hover: #6F217B`, `--brand-soft: #F7ECF8`, `--base-bg: #F7F8FA`, `--base-surface: #FFFFFF`, `--base-muted: #F1F3F6`, `--base-border: #E2E6EC`, status semânticos e sombras suaves.
- [x] **Passo 1.5:** Criar os arquivos SVG em `frontend/public/assets/brand/` para compatibilidade com tags `img`.
- [x] **Passo 1.6:** Executar os testes e confirmar que passam (Green).

---

### Tarefa 2: Redesign da Sidebar e Topbar Administrativas

**Arquivos:**
- Modificar: `frontend/src/features/layout/Sidebar.tsx`
- Modificar: `frontend/src/features/layout/Topbar.tsx`
- Modificar: `frontend/src/features/layout/Sidebar.test.tsx`
- Modificar: `frontend/src/styles/theme.css` (estilos de sidebar e topbar)

- [x] **Passo 2.1:** Atualizar os testes em `Sidebar.test.tsx` para cobrir o botão flutuante de colapso, o uso da logo SVG e o indicador visual do item ativo.
- [x] **Passo 2.2:** Executar os testes e checar as falhas esperadas (Red).
- [x] **Passo 2.3:** Implementar as alterações em `Sidebar.tsx`:
  - Inserir `CanamedLogoLonga` e `CanamedLogoCurta`.
  - Adicionar botão flutuante na borda direita (`w-6 h-6 rounded-full border bg-base-surface`) com ícone chevron.
  - Adicionar indicador de item ativo de 4px (`bg-brand-primary rounded-r-md`), cantos `rounded-xl`, fundo `bg-brand-soft` e tooltips.
- [x] **Passo 2.4:** Implementar as alterações em `Topbar.tsx`:
  - Adicionar breadcrumb estilizado (`Administração > Dashboard`).
  - Estilizar o seletor de clínica e menu de perfil com avatar em chip suave (`bg-brand-soft text-brand-primary border-brand-lilac/30`) e botão de logout.
- [x] **Passo 2.5:** Executar `npm --prefix frontend test src/features/layout/` e confirmar aprovação (Green).

---

### Tarefa 3: Redesign do Dashboard Administrativo

**Arquivos:**
- Modificar: `frontend/src/features/dashboard/DashboardPanel.tsx`
- Modificar: `frontend/src/features/dashboard/DashboardPanel.test.tsx`
- Modificar: `frontend/src/styles/theme.css` (classes auxiliares do dashboard)

- [x] **Passo 3.1:** Atualizar os testes em `DashboardPanel.test.tsx` para validar a nova barra de ferramentas com seletor de data, os 4 KPIs estilizados (incluindo destaque no "Em Atendimento"), a tabela de próximos atendimentos e os botões de ação rápida.
- [x] **Passo 3.2:** Executar os testes e verificar (Red).
- [x] **Passo 3.3:** Implementar o redesign de `DashboardPanel.tsx`:
  - Barra superior "Resumo do Dia" com seletor de data nativo estilizado e controle de período integrado ('Hoje', '7 dias', 'Mês').
  - Grid de 4 KPIs com badges circulares e efeito pulsante no "Em Atendimento".
  - Tabela refinada de "Próximos Atendimentos" com colunas Horário, Paciente (+ tag de tipo), Profissional, Status badge e Ações.
  - Coluna lateral direita com "Ações Rápidas" e "Resumo Cadastral / Operacional".
  - Manter resumo financeiro (quando disponível) e botão de exportação CSV.
- [x] **Passo 3.4:** Executar `npm --prefix frontend test src/features/dashboard/` e confirmar aprovação (Green).

---

### Tarefa 4: Propagação do Padrão para a Área do Médico (`/medico`)

**Arquivos:**
- Modificar: `frontend/src/features/medical/DoctorSidebar.tsx`
- Modificar: `frontend/src/features/medical/DoctorSidebar.test.tsx`
- Modificar: `frontend/src/features/medical/DoctorProfileMenu.tsx`
- Modificar: `frontend/src/app/DoctorApp.tsx`
- Modificar: `frontend/src/features/medical/DoctorDashboardPage.tsx`
- Modificar: `frontend/src/features/medical/DoctorDashboardPage.test.tsx`

- [x] **Passo 4.1:** Escrever/atualizar testes em `DoctorSidebar.test.tsx` e `DoctorDashboardPage.test.tsx` para cobrir o novo design, botão flutuante e tabela de atendimentos do dia.
- [x] **Passo 4.2:** Executar os testes (Red).
- [x] **Passo 4.3:** Atualizar `DoctorSidebar.tsx` incorporando o mesmo padrão: logos SVG, botão flutuante, indicador ativo roxo e itens `rounded-xl`.
- [x] **Passo 4.4:** Atualizar `DoctorProfileMenu.tsx` e o cabeçalho em `DoctorApp.tsx` com breadcrumb clínico e avatar estilizado.
- [x] **Passo 4.5:** Redesenhar `DoctorDashboardPage.tsx` com o layout de 4 KPIs, banner com radar pulsante para a consulta ativa, tabela dos próximos pacientes do médico e ações rápidas do consultório.
- [x] **Passo 4.6:** Executar `npm --prefix frontend test src/features/medical/` e confirmar aprovação (Green).

---

### Tarefa 5: Validação Geral e Verificação de Regressão

**Arquivos:**
- Todos os arquivos afetados

- [x] **Passo 5.1:** Executar toda a suíte de testes do frontend: `npm --prefix frontend test`.
- [x] **Passo 5.2:** Executar build completo do frontend: `npm --prefix frontend run build`.
- [x] **Passo 5.3:** Executar verificação do backend se aplicável: `dotnet test`.
- [x] **Passo 5.4:** Registrar evidências completas e atualizar a documentação.
