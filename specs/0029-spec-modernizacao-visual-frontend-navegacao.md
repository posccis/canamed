# SPEC-0029: Modernização Visual do Frontend, Controles de Formulário e Redesign da Navegação Médica

> **Status:** Implementada e Validada (Aprovada pelos Especialistas: Medical Systems Domain Expert & UI/UX Reviewer)  
> **Versão:** 1.2.0  
> **Data:** 2026-10-09  
> **Autores:** Agente Orquestrador & Engenharia Cana Med  
> **Revisores Obrigatórios:** UI/UX Reviewer & Medical Systems Domain Expert  

---

## 1. Objetivo e Visão Geral

Esta especificação define o plano completo de modernização visual, refinamento de controles de formulário e redesign da navegação médica do **Cana Med Mulher** (`/medico`). O objetivo é elevar a interface para um padrão contemporâneo de SaaS médico comercial de alta fidelidade, garantindo ergonomia clínica, eficiência operacional e adesão irrestrita à identidade visual oficial da marca.

As metas prioritárias contemplam:
1. **Modernização Profunda de Controles de Formulário:** Criar uma infraestrutura definitiva de estilos para inputs de texto, números, datas/horas, selects/comboboxes estilizados, textareas clínicas com respiro visual, checkboxes, radios e toggles, com hierarquia clara entre labels, campos obrigatórios, dicas e mensagens de erro.
2. **Resolução de Lacunas de CSS:** Diagnosticar e implementar as classes semânticas (`.form__group`, `.form__label`, `.form__input`, `.form__select`, `.form__textarea`, `.form__checkbox`, `.form__error`, etc.) que eram utilizadas nos componentes TSX mas não existiam formalmente no arquivo global de temas (`theme.css`), causando regressão para controles brutos do navegador.
3. **Redesign do Botão "Sair" e Menu de Perfil Médico:** Remover o botão "Sair" do rodapé da sidebar e criar o componente `DoctorProfileMenu` no cabeçalho superior (`doctor-topbar`), exibindo identificação médica (avatar/iniciais, nome, especialidade, CRM e clínica), indicador de dropdown acessível (teclado, Escape, clique externo) e encerramento de sessão seguro.
4. **Correção Definitiva do Botão "Encolher" da Sidebar:** Corrigir as causas do comportamento anômalo do colapso da barra lateral (`DoctorSidebar`), eliminando transbordamentos de logo, desalinhamento de ícones, falta de `overflow: hidden`, tooltips cortados e sobreposição sobre o conteúdo principal (`.doctor-content-wrapper`), adaptando com perfeição para desktop e mobile.
5. **Avaliação Técnica de Bibliotecas Gratuitas:** Análise fundamentada de pacotes e primitivos compatíveis com a stack (React 19, Vite, TypeScript, `lucide-react`) sem introduzir dependências conflitantes ou frameworks pesados.
6. **Aplicação Consistente em Todo o Módulo Médico:** Atualização e refinamento visual de todas as páginas médicas (`DoctorDashboardPage`, `DoctorWorkspace`, `DoctorMedicalRecordsPage`, `DoctorAgendaPage`, `DoctorDocumentsPage`, `DoctorReturnsPage`, `DocumentModal`, `GynecologicalProfileCard`, `GynecologicalExamSection`, `PatientExamAttachmentsSection`).

---

## 2. Contexto e Diagnóstico Técnico

### 2.1. Diagnóstico dos Controles de Formulário
- **Causa Raiz Identificada:** Em componentes como `DoctorWorkspace.tsx`, `GynecologicalProfileCard.tsx`, `DocumentModal.tsx` e `PatientExamAttachmentsSection.tsx`, os elementos utilizavam `className="form__input"`, `className="form__select"` e `className="form__textarea"`. No entanto, em `frontend/src/styles/theme.css`, apenas a classe `.field__input` havia sido tipada timidamente, deixando `.form__input`, `.form__select` e `.form__textarea` inexistentes.
- **Sintoma:** Os campos de entrada apareciam como controles HTML padrão do sistema operacional, sem bordas sutis, sem estados de foco elegantes (`focus-visible` ring), com selects usando setas nativas duras do sistema e campos de texto sem padding ou tipografia adequados.

### 2.2. Diagnóstico do Botão "Encolher" da Sidebar
- **Causa Raiz 1 (Dimensão dos Ativos):** No estado recolhido (`collapsed = true`), a sidebar passa a ter largura de 72px (`--sidebar-collapsed-width`). No entanto, o container do logo no CSS (`.sidebar__logo-icon`) possuía largura fixa de `130px`, forçando um transbordamento invisível que quebrava o grid flex e deformava os elementos filhos.
- **Causa Raiz 2 (Estrutura Flex e Overflow):** O elemento `<aside className="sidebar">` não possuía `overflow-x: hidden`, permitindo que labels de texto sem quebra de linha empurrassem a largura física do elemento contra o conteúdo principal.
- **Causa Raiz 3 (Localização do Botão):** O botão estava localizado no rodapé abaixo das informações do usuário e do botão de logout, em um layout apertado e inconsistente.
- **Causa Raiz 4 (Mobile Drawer):** Em telas móveis (`@media (max-width: 900px)`), acionar o toggle de colapso recolhia a gaveta para 72px enquanto ela ainda estava aberta, deixando a gaveta móvel inutilizável.

### 2.3. Diagnóstico do Botão "Sair"
- **Situação Anterior:** O botão "Sair" ficava localizado no rodapé da barra lateral esquerda, competindo visualmente com a navegação clínica e suscetível a cliques acidentais.
- **Padrão Requerido:** Menu suspenso de perfil no cabeçalho superior (`doctor-topbar`), à direita, associado à identidade do profissional logado, preservando as diretrizes de ergonomia clínica e padrões de SaaS modernos.

---

## 3. Pesquisa e Avaliação de Bibliotecas e Frameworks

Conforme exigido pelo projeto e pelo escopo do React 19:

| Tecnologia Avaliada | Licença | Compatibilidade | Decisão | Justificativa Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **Angular Material / PrimeNG / NG-ZORRO** | Open Source | Incompatível | **Rejeitado** | Ecossistemas Angular, totalmente incompatíveis com o projeto que utiliza React 19. |
| **Bootstrap** | MIT | Neutra | **Rejeitado** | Polui o DOM com classes utilitárias conflitantes e não atende à identidade visual proprietária do Cana Med. |
| **Tailwind CSS** | MIT | Requer build setup | **Rejeitado** | Exigiria reconfiguração profunda do Vite e reescrita de centenas de arquivos CSS existentes, violando o princípio de não reescrever sem necessidade. |
| **Radix UI Primitives** | MIT | Excelente | **Avaliado / Alternativa Headless** | Excelente para menus e diálogos acessíveis. No entanto, para o perfil e controles do Cana Med, a implementação direta com TypeScript puro e hooks de acessibilidade nativos (`useRef`, `Escape`, `tabIndex`, WAI-ARIA) evita adicionar dependências extras e mantém o bundle ultraleve. |
| **Lucide React (`lucide-react`)** | MIT | 100% Nativo (React 19) | **Adotado & Mantido** | Já instalado e integrado. Oferece consistência iconográfica, excelente legibilidade clínica e zero impacto em runtime. |
| **Design System Próprio via CSS Moderno & Tokens** | Proprietária | 100% Nativo | **Adotado como Base Principal** | Permite total controle da paleta oficial (#008080, #005F6A, #F7FAFC), sombras refinadas, microinterações, foco acessível e alta performance sem dependências vulneráveis. |

---

## 4. Regras de Negócio e Princípios Visuais (RN)

### RN-001: Identidade Visual e Proibição de Desvios Cromáticos
1. As cores fundamentais devem ser estritamente preservadas conforme `docs/identidade-visual.md`:
   - Primária: `#008080` (Teal Verde Água).
   - Secundária: `#005F6A` (Azul Petróleo).
   - Acento / Sucesso: `#66CDAA` (Verde Menta) e `#10b981`.
   - Superfície e Fundo: `#F7FAFC` (Off-white) e `#FFFFFF`.
   - Divisores e Bordas: `#E2E8F0` e `#CBD5E1`.
   - Texto Principal: `#1E293B` e `#333333`.
   - Texto Secundário: `#64748B`.
2. Fica expressamente **proibido** o uso de roxo, marrom, rosa choque, lilás ou gradientes arbitrários.

### RN-002: Ergonomia dos Controles de Formulário Clínico
1. **Inputs de Texto e Números:**
   - Altura padrão de 40px a 42px, com padding horizontal de 0.85rem.
   - Borda neutra de 1.5px (`#CBD5E1`) com cantos arredondados (`border-radius: 8px`).
   - Estado de foco elegante: borda `var(--color-primary)` e anel de foco sutil (`box-shadow: 0 0 0 3px rgba(0, 128, 128, 0.16)`).
   - Transição suave de 0.15s em `border-color` e `box-shadow`.
   - Estado de erro: borda `#EF4444` e anel de foco avermelhado com mensagem auxiliar descritiva.
   - Estado desabilitado: fundo `#F1F5F9`, cursor `not-allowed`, sem transparência excessiva que impeça leitura.
2. **Selects:**
   - Seta personalizada sutil em SVG (chevron teal/grafite) incorporada via data URI, eliminando a seta cinza nativa.
   - Padding à direita com respiro para o ícone sem sobrepor o texto da opção selecionada.
3. **Textareas Clínicas:**
   - Altura mínima ergonômica (80px a 110px), line-height de 1.5, tipografia confortável para redação contínua de anamnese ginecológica e condutas.
   - Respiro vertical adequado e resize restrito ao eixo vertical (`resize: vertical`).
4. **Checkboxes e Radios:**
   - Tamanho padronizado (18x18px), `accent-color: var(--color-primary)`, com alinhamento vertical centralizado ao label e cursor de clique em toda a extensão do texto.
5. **Labels e Hierarquia:**
   - Labels posicionados consistentemente acima do campo, com `font-weight: 600`, tamanho `0.85rem` e indicação clara de campo obrigatório através de asterisco estilizado (`.form__required`).

### RN-003: Arquitetura da Sidebar Médica e Colapso Estável
1. No estado expandido (`collapsed = false`), largura fixa de `250px`.
2. No estado recolhido (`collapsed = true`), largura fixa de `72px`, com `overflow-x: hidden`.
3. O logo no estado recolhido deve utilizar o ícone compacto oficial sem distorção e com tamanho máximo contido na largura de 72px (máx. 36px de largura e altura).
4. Os itens de navegação mantêm os ícones perfeitamente centralizados horizontalmente no modo recolhido, com tooltips acessíveis via atributo `title` e suporte a badge numérico.
5. Em telas móveis (`< 900px`), a sidebar se comporta exclusivamente como gaveta oculta deslizante (`left: -100%` a `left: 0`), e o botão de encolher no desktop fica desabilitado ou oculto no mobile, dando lugar ao botão de fechamento da gaveta.

### RN-004: Menu de Perfil Médico Superior e Logout Seguro
1. O cabeçalho superior (`doctor-topbar`) deve abrigar à direita o componente `DoctorProfileMenu`.
2. O botão de disparo exibe:
   - Avatar circular com as iniciais do médico em fundo Teal (`#008080`) com letras brancas.
   - Nome abreviado ou completo do profissional.
   - Tag identificadora da clínica / especialidade.
   - Ícone de seta / chevron que rotaciona 180° quando o menu está aberto.
3. O menu suspenso (dropdown) exibe:
   - Z-index elevado (`z-index: 100`) e sombra refinada (`box-shadow: var(--shadow-lg)`).
   - Cabeçalho com nome do profissional, CRM (se cadastrado), papel no sistema (`Médico` ou `Gestor`) e clínica ativa.
   - Separador visual suave.
   - Item de ação: **"Encerrar Sessão (Sair)"**, com ícone `LogOut` em vermelho elegante.
4. Comportamento interativo:
   - Fecha ao clicar em qualquer ponto fora do menu.
   - Fecha ao pressionar a tecla `Escape`.
   - Navegável via teclado (`Enter`, `Space`, `Tab`).
   - Dispara a função `end()` do `useSession` limpando com segurança os tokens e redirecionando para login.
5. O botão "Sair" do rodapé da sidebar é **removido**, eliminando redundância e atrito operacional.

### RN-005: Proteção Contra Perda de Dados Clínicos em Edição (Dirty State Protection)
1. Para prevenir perda catastrófica de anamneses extensas (queixa, DUM, exame físico das mamas, especular, biópsia, condutas):
   - O consultório (`DoctorWorkspace`) e formulários de atendimento mantêm controle de estado "sujo" (`isDirty`).
   - Se o médico tiver alterações pendentes não salvas e tentar fechar a aba/janela, um evento `beforeunload` adverte o usuário.
   - Antes de alternar de tela ou iniciar novo atendimento sem salvar, um aviso/confirmação claro é exibido para resguardar o trabalho cognitivo do profissional.

### RN-006: Blocos e Cards Clínicos Estruturados (SOAP Ginecológico)
1. A interface clínica não deve ser "flat" nem monolítica. Os campos devem ser agrupados em blocos seccionados com cabeçalho semântico e bordas suaves (`.card` ou `.clinical-block`):
   - Bloco 1: Identificação e Contexto Clínico (Queixa e DUM).
   - Bloco 2: Exame Físico Ginecológico Segmentado (Mamas, Abdome, Genitália, Especular, Toque Bimanual).
   - Bloco 3: Diagnósticos e Hipóteses (com distinção explícita).
   - Bloco 4: Conduta, Prescrição e Encaminhamentos.


---

## 5. Fluxos de Interação e Estados de Interface

### 5.1. Fluxo de Navegação e Colapso da Sidebar
1. O médico clica no botão "Recolher" localizado na base ou no topo da sidebar.
2. A sidebar transiciona suavemente de 250px para 72px (`transition: width 0.2s ease`).
3. O conteúdo principal (`.doctor-content-wrapper`) se expande naturalmente ocupando o espaço liberado sem overflow horizontal.
4. Os rótulos de texto da sidebar desaparecem suavemente e os ícones centralizam-se, com tooltips nos itens.
5. Um clique no botão "Expandir" (ou chevron) retorna a barra lateral para 250px.

### 5.2. Fluxo do Menu de Perfil e Logout
1. O médico clica na foto/iniciais do perfil no topo direito da tela.
2. O menu suspenso surge com animação sutil de fade-in e escala (`transform: translateY(4px)`).
3. O médico visualiza suas credenciais e seleciona "Encerrar Sessão".
4. O sistema fecha a sessão, revoga o token e apresenta a tela de login.

---

## 6. Critérios de Aceitação

1. **CA-001 (Controles de Formulário):** Todos os inputs (`text`, `number`, `date`, `email`), selects e textareas exibem padding, bordas suaves, fundo adequado e foco com anel suave (`#008080`).
2. **CA-002 (Selects Estilizados):** Nenhum select exibe a seta cinza padrão quebrada do navegador; todos possuem chevron estilizado e consistente.
3. **CA-003 (Sidebar Colapsável):** O botão de encolher/expandir funciona perfeitamente sem quebras visuais, sem transbordamento de imagens e preservando a centralização dos ícones.
4. **CA-004 (Menu de Perfil no Topbar):** O botão "Sair" não existe mais na sidebar e reside exclusivamente no menu suspenso do cabeçalho superior.
5. **CA-005 (Acessibilidade do Menu):** O menu de perfil abre ao clique, fecha ao clicar fora e fecha ao pressionar `Escape`.
6. **CA-006 (Consistência das Telas Médicas):** As telas `DoctorWorkspace`, `DoctorMedicalRecordsPage`, `DoctorAgendaPage`, `DoctorDocumentsPage`, `DoctorReturnsPage` e `DoctorDashboardPage` utilizam a nova infraestrutura sem regressões funcionais.
7. **CA-007 (Cobertura de Testes):** Toda a suíte de testes do frontend continua passando com 100% de sucesso (`npm test`).
8. **CA-008 (Compilação Limpa):** O build de produção (`npm run build`) executa com código 0 e sem erros de TypeScript.

---

## 7. Requisitos de Segurança e Conformidade

- **LGPD (Art. 11):** Os dados exibidos no perfil superior são restritos ao profissional logado e sua clínica ativa, sem expor dados de pacientes em áreas de navegação global.
- **Encerramento de Sessão:** O logout pelo menu de perfil limpa imediatamente o estado de autenticação em memória e notifica o backend via endpoint de revogação.
