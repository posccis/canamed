# SPEC-0031 — Redesign Visual e Padrão de Interface: Dashboard Administrativo e Área do Médico

| Campo | Valor |
| :--- | :--- |
| **ID** | SPEC-0031 |
| **Título** | Redesign Visual e Padrão de Interface: Dashboard Administrativo e Área do Médico |
| **Status** | Aprovado para Implementação |
| **Versão** | 1.0.0 |
| **Data** | 2026-10-14 |
| **Autor** | Time Multidisciplinar Cana Med (Planejador, Medical Systems Domain Expert, UI/UX Reviewer) |
| **Módulos afetados** | `frontend/src/styles/theme.css`, `frontend/src/features/layout/`, `frontend/src/features/dashboard/`, `frontend/src/features/medical/`, `frontend/public/assets/brand/` |
| **ADRs relacionados** | ADR-0004, ADR-0006, ADR-0008, ADR-0010, ADR-0011 |

---

## 1. Objetivo

Absorver e aplicar integralmente o design e o padrão de interface do protótipo oficial [`assets/prototypes/dashboard_administrativo_canamed.html`](../assets/prototypes/dashboard_administrativo_canamed.html) tanto para o **Dashboard Administrativo** quanto para a **Área do Médico (`/medico`)**, atualizando a identidade visual com os tokens oficiais do Cana Med Mulher, corrigindo o dimensionamento das logos através de componentes/arquivos SVG calibrados, e preservando e adaptando todas as funcionalidades preexistentes (filtros de período, métricas de caixa, exportação CSV e ações clínicas).

Pergunta de controle do `GEMINI.md`: **isso reduz atrito na rotina da clínica?**
**Sim.** Um design moderno, limpo, de alto contraste e ergonomia clínica reduz a sobrecarga cognitiva da recepção, da gestão e do corpo clínico, permitindo rápida visualização do fluxo ambulatorial e tomada de decisão ágil sem poluição visual.

---

## 2. Contexto

O projeto Cana Med evoluiu sua especialização para clínicas ginecológicas e saúde da mulher (Cana Med Mulher). O protótipo canônico [`assets/prototypes/dashboard_administrativo_canamed.html`](../assets/prototypes/dashboard_administrativo_canamed.html) estabeleceu a paleta de cores definitiva da marca (Brand Primary `#852A91`, Brand Soft `#F7ECF8`, Base Neutra `#F7F8FA`, bordas suaves `#E2E6EC` e sombras suaves `shadow-soft`). 

Além disso, as imagens PNG/SVG das logomarcas possuíam caixas delimitadoras (`viewBox`) com margens vazias desproporcionais, fazendo com que as logos aparecessem excessivamente reduzidas na interface.

Esta especificação define a unificação visual completa da plataforma administrativa e médica, garantindo coerência estética, nitidez gráfica das logos e continuidade operacional estrita das funcionalidades existentes.

---

## 3. Escopo

### 3.1 Dentro do escopo

1. **Tokens de Design e Estilos Globais (`theme.css`):**
   - Incorporação das variáveis de cor da marca Cana Med Mulher:
     - `--brand-primary: #852A91` (ações principais, estados ativos e destaques)
     - `--brand-hover: #6F217B`
     - `--brand-magenta: #D83C91`
     - `--brand-lilac: #B77AD8`
     - `--brand-soft: #F7ECF8` (destaques sutis, fundos selecionados, chips de avatar)
     - `--base-bg: #F7F8FA` (fundo geral neutro)
     - `--base-surface: #FFFFFF` (cards, painéis, formulários)
     - `--base-muted: #F1F3F6` (áreas secundárias, hovers)
     - `--base-border: #E2E6EC` (divisores e bordas sutis)
     - `--content-primary: #202631` (títulos e textos de alta prioridade)
     - `--content-secondary: #626B79` (labels e apoios)
     - `--content-muted: #858D99` (textos discretos)
     - `--status-success: #237A52` / `--status-success-bg: #E9F5EC`
     - `--status-warning: #A96512` / `--status-warning-bg: #FDF0E1`
     - `--status-error: #C33D49` / `--status-error-bg: #FCECEE`
     - `--status-info: #2866B0` / `--status-info-bg: #E6F0F9`
   - Sombras semânticas: `shadow-soft` (`0 2px 10px -2px rgba(32, 38, 49, 0.05)`) e `shadow-dropdown`.
   - Focus ring suave: `0 0 0 2px rgba(133, 42, 145, 0.2)`.

2. **Logos em SVG com Visualização Proporcional Impecável:**
   - Criação de componentes/arquivos SVG calibrados (`CanamedLogoLonga` com `viewBox="45 130 580 110"` e `CanamedLogoCurta` com `viewBox="180 80 305 210"`).
   - Eliminação do espaço em branco vertical inútil das logos originais, permitindo que preencham com destaque e nitidez os cabeçalhos das sidebars.

3. **Sidebar e Topbar Administrativos (`Sidebar.tsx`, `Topbar.tsx`):**
   - Header da Sidebar com 80px (`h-20`), transição suave entre a logo longa e curta.
   - Botão flutuante na borda direita (`w-6 h-6 rounded-full border bg-base-surface`) com ícone chevron para colapso/expansão.
   - Itens de navegação com cantos arredondados (`rounded-xl`), indicador lateral esquerdo de 4px no item ativo (`bg-brand-primary`), ícones consistentes e tooltips ao colapsar.
   - Topbar com breadcrumb semântico (`Administração > Dashboard`), título de página, alternância de clínica e menu de perfil com avatar estilizado (`bg-brand-soft text-brand-primary border-brand-lilac/30`) e ação de logout.

4. **Dashboard Administrativo (`DashboardPanel.tsx`):**
   - Barra de filtro superior com ícone e seletor de data (`Resumo do Dia`), integrando também os filtros por período (`Hoje`, `7 dias`, `Mês Atual`).
   - 4 Cards de KPI estilizados com ícones em badges circulares, números em destaque (`text-3xl font-bold`) e o card "Em Atendimento" com destaque de marca e radar pulsante (`animate-ping`).
   - Tabela de "Próximos Atendimentos" com colunas Horário, Paciente (+ tag de tipo de consulta), Profissional, Status badge semântico e Ações de 1 clique (Dar Entrada, Iniciar, etc.).
   - Coluna lateral direita com "Ações Rápidas" (`Novo Agendamento`, `Cadastrar Paciente`, `Bloquear Horário`, `Fila & Check-in`) e "Resumo Cadastral / Operacional".
   - Preservação da exportação CSV (`Exportar Relatório`) e dos indicadores financeiros/caixa.

5. **Propagação do Padrão para a Área do Médico (`/medico`):**
   - `DoctorSidebar`: mesma identidade visual com roxo de marca, logos SVG otimizadas, botão flutuante, indicador ativo e tooltips.
   - `DoctorTopbar`: breadcrumb clínico (`🌸 Cana Med Mulher • Espaço Clínico > Dashboard`), seletor de clínica e menu de perfil do médico.
   - `DoctorDashboardPage`: redesenhado com o mesmo layout de 4 KPIs, banner de consulta em andamento com radar pulsante, tabela de atendimentos do dia com ação imediata "Iniciar Consulta" e painel lateral com ações rápidas do consultório.

### 3.2 Fora do escopo

- Alterações em schemas de banco de dados ou criação de novas migrations (o backend já fornece os contratos e endpoints necessários).
- Módulos de telemedicina ou pré-natal de alto risco não constantes no briefing.

---

## 4. Atores e Permissões

| Ator | Permissões Relevantes | Escopo Visual / Superfície |
| :--- | :--- | :--- |
| **Gestor Clínico (`gestor`)** | `clinic:manage`, `users:manage`, `agenda:*`, `financial:*` | Acesso completo ao Dashboard Administrativo, financeiro, regras e gestão de usuários. |
| **Recepcionista (`recepcionista`)** | `agenda:read`, `agenda:write`, `patients:manage`, `queue:read`, `queue:write` | Acesso ao Dashboard Administrativo operacional, fila, pacientes e agendamento. Sem acesso a prontuário clínico íntimo. |
| **Médico (`profissional`)** | `records:read`, `records:write`, `prescriptions:manage`, `agenda:read:own` | Acesso à Área do Médico (`/medico`), Dashboard Clínico, Consultório e PEP ginecológico. |

---

## 5. Regras de Negócio e Diretrizes de Design

| ID | Regra | Justificativa / Origem |
| :--- | :--- | :--- |
| **RN-001** | A paleta de cores deve utilizar estritamente os tokens extraídos da marca oficial Cana Med Mulher (`#852A91`, `#F7ECF8`, etc.). | Identidade visual oficial e [GEMINI.md](../GEMINI.md). |
| **RN-002** | As logos em SVG devem utilizar `viewBox` recortado rente à arte vetorial, garantindo nitidez e escala legível na barra lateral. | Requisito explícito do usuário e ergonomia visual. |
| **RN-003** | Todas as ações existentes de navegação e filtros (período 'Hoje'/'7 dias'/'Mês', 'Novo Agendamento', 'Cadastrar Paciente', 'Exportar CSV') devem permanecer acessíveis e funcionais. | Prevenção de regressão funcional. |
| **RN-004** | A Área do Médico (`/medico`) deve adotar a exata mesma linguagem visual e componentes de casca (Sidebar, Topbar, KPIs e Tabelas), preservando a segregação de superfície (RBAC). | Requisito explícito do usuário e SPEC-0026 / SPEC-0028. |
| **RN-005** | O estado de colapso da sidebar deve persistir fluidez na transição CSS e fornecer tooltips acessíveis quando colapsada. | Ergonomia clínica (telas de consultório e recepção). |
| **RN-006** | Nenhum teste automatizado existente (`vitest`, `playwright`) deve ser quebrado pela atualização visual. | Garantia de qualidade contínua. |

---

## 6. Critérios de Aceitação e Testabilidade

1. **Tokens e Temas:**
   - Variáveis CSS `--brand-primary`, `--brand-soft`, `--base-bg`, etc., declaradas em `theme.css`.
   - Botões primários e estados ativos refletem a cor de marca `#852A91`.

2. **Logos em SVG:**
   - Componentes ou arquivos SVG exibidos no cabeçalho da Sidebar sem bordas vazias excessivas, legíveis tanto na versão expandida quanto na colapsada.

3. **Dashboard Administrativo:**
   - Renderização correta dos 4 KPIs operacionais com destaque visual no "Em Atendimento".
   - Tabela de próximos atendimentos exibindo paciente, profissional, horário e status semântico.
   - Filtros de período e botões de ação rápida acionando os callbacks corretos de navegação.

4. **Área do Médico:**
   - `DoctorSidebar` com a mesma linguagem visual e logos SVG otimizadas.
   - `DoctorDashboardPage` exibindo KPIs clínicos e tabela de atendimentos do dia com o novo padrão estético.

5. **Suíte de Testes:**
   - Todos os 114 testes do frontend continuam passando com sucesso (`npm --prefix frontend test`).
