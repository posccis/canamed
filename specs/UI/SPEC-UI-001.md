# SPEC-UI-001 — CANAMED UI/UX Design System

**Status:** Draft  
**Version:** 1.0  
**Product:** CANAMED  
**Tagline:** Eficiência Para Quem Mais Precisa  
**Scope:** Web Application — UI/UX  
**Priority:** High

---

## 1. Objetivo

Definir a especificação visual e de experiência do usuário do CANAMED, estabelecendo uma base consistente para todas as telas, componentes e fluxos da aplicação.

O objetivo é criar uma interface:

- profissional;
- clara;
- moderna;
- intuitiva;
- eficiente;
- consistente;
- acessível;
- responsiva;
- adequada à rotina operacional de clínicas;
- visualmente alinhada à identidade oficial do CANAMED.

A interface deve reduzir a carga cognitiva do usuário e permitir que tarefas frequentes sejam executadas com o menor número razoável de etapas.

---

# 2. Fonte de verdade da identidade visual

A identidade visual oficial do CANAMED já existe dentro do projeto.

A IA/agent **NÃO deve inventar uma nova identidade visual**.

Antes de implementar qualquer elemento visual, o agente deve:

1. localizar os arquivos de identidade existentes no projeto;
2. identificar logos;
3. identificar PNGs destinados a ícones;
4. identificar cores oficiais;
5. identificar variações permitidas do logo;
6. identificar tipografia existente, caso esteja definida;
7. analisar dimensões, proporções e características dos assets;
8. utilizar esses arquivos como fonte oficial.

### Regra obrigatória

> Nunca inventar cores, logos, ícones ou elementos de identidade visual quando existir um asset oficial correspondente no projeto.

As cores oficiais existentes devem ser preservadas.

Não criar uma nova paleta por preferência estética da IA.

Não substituir os PNGs oficiais por:

- Font Awesome;
- Material Icons;
- Lucide;
- Heroicons;
- emojis;
- SVGs genéricos;
- ícones gerados pela IA;

quando existir um PNG oficial correspondente.

---

# 3. Uso dos PNGs como ícones

Os arquivos PNG existentes no projeto devem ser tratados como **assets oficiais de interface**.

A IA deve identificar quais PNGs representam:

- navegação;
- funcionalidades;
- ações;
- status;
- módulos;
- elementos institucionais;
- outros elementos visuais.

## 3.1 Barra lateral

Os PNGs oficiais devem ser utilizados nos itens da navegação lateral sempre que existir um ícone correspondente.

Exemplo conceitual:

```text
┌─────────────────────────────────────────────┐
│ LOGO                                        │
├─────────────────────────────────────────────┤
│                                             │
│  [PNG] Dashboard                            │
│  [PNG] Agenda                               │
│  [PNG] Pacientes                            │
│  [PNG] Profissionais                        │
│  [PNG] Atendimento                          │
│  [PNG] Financeiro                           │
│  [PNG] Relatórios                           │
│                                             │
│                                             │
│  ─────────────────────────────────────────  │
│  [PNG] Configurações                        │
│  [PNG] Ajuda                                │
│                                             │
├─────────────────────────────────────────────┤
│ USUÁRIO                                     │
└─────────────────────────────────────────────┘
```

Os nomes acima são exemplos estruturais. A navegação final deve refletir os módulos efetivamente definidos nas SPECs do produto.

---

# 4. Arquitetura geral da interface

A aplicação deve utilizar uma estrutura de aplicação administrativa moderna.

Layout base:

```text
┌──────────────────────────────────────────────────────────┐
│                     HEADER / TOPBAR                       │
├───────────────┬──────────────────────────────────────────┤
│               │                                          │
│               │                                          │
│   SIDEBAR     │              MAIN CONTENT                │
│               │                                          │
│   Navigation  │                                          │
│               │                                          │
│               │                                          │
│               │                                          │
│               │                                          │
└───────────────┴──────────────────────────────────────────┘
```

A estrutura deve separar claramente:

1. navegação global;
2. contexto da aplicação;
3. conteúdo principal;
4. ações da página;
5. feedback do sistema.

---

# 5. Sidebar

A sidebar é um elemento estrutural principal do CANAMED.

## 5.1 Comportamento

Desktop:

- sidebar visível por padrão;
- largura consistente;
- navegação vertical;
- agrupamento lógico dos módulos;
- item ativo claramente identificável;
- possibilidade de estado expandido/recolhido quando apropriado.

Collapsed:

```text
┌──────┐
│ LOGO │
├──────┤
│ PNG  │
│ PNG  │
│ PNG  │
│ PNG  │
│ PNG  │
│      │
│ PNG  │
└──────┘
```

Expanded:

```text
┌──────────────────────┐
│ LOGO                 │
├──────────────────────┤
│ [PNG] Dashboard      │
│ [PNG] Agenda         │
│ [PNG] Pacientes      │
│ [PNG] Atendimento    │
│ [PNG] Financeiro     │
│ [PNG] Relatórios     │
│                      │
│ [PNG] Configurações  │
└──────────────────────┘
```

## 5.2 Item ativo

O item correspondente à página atual deve possuir diferenciação visual clara.

A diferenciação deve utilizar exclusivamente os recursos definidos pela identidade visual oficial.

Pode utilizar:

- background;
- borda;
- contraste;
- tipografia;
- indicador lateral;

desde que compatível com a identidade.

Não utilizar efeitos exagerados.

---

# 6. Hierarquia visual

A interface deve possuir uma hierarquia visual consistente.

Ordem:

```text
1. Contexto
2. Título da página
3. Descrição/contexto quando necessário
4. Ações principais
5. Conteúdo
6. Informações secundárias
7. Ações destrutivas/secundárias
```

Exemplo:

```text
Agenda
Gerencie os compromissos e atendimentos da clínica.

                    [+ Novo agendamento]

─────────────────────────────────────────────────

Hoje

[ Calendário ]

09:00  João da Silva
       Consulta

10:00  Maria Oliveira
       Retorno
```

---

# 7. Dashboard

O dashboard deve apresentar informação operacional relevante sem sobrecarregar o usuário.

Priorizar:

- informações acionáveis;
- indicadores importantes;
- agenda;
- pacientes aguardando atendimento;
- próximos atendimentos;
- alertas;
- pendências;
- indicadores financeiros quando aplicável.

Evitar:

- excesso de gráficos;
- informações sem ação associada;
- cards puramente decorativos;
- métricas que não ajudam na operação.

Cada elemento do dashboard deve responder a uma necessidade real do usuário.

---

# 8. Cards

Cards devem ser utilizados para:

- indicadores;
- agrupamento de informações;
- resumo de entidades;
- ações rápidas;
- blocos funcionais.

Não utilizar cards simplesmente porque "ficam bonitos".

Cards devem possuir:

- hierarquia clara;
- espaçamento consistente;
- título;
- conteúdo;
- ação quando aplicável.

---

# 9. Tabelas

Tabelas devem ser utilizadas para informações operacionais que precisam ser comparadas ou pesquisadas.

Devem suportar, quando necessário:

- ordenação;
- paginação;
- busca;
- filtros;
- seleção;
- ações por registro;
- estados vazios;
- carregamento;
- erro.

Exemplo:

```text
Pacientes

[ Buscar paciente... ] [Filtros]

Nome              CPF          Último atendimento    Ações
────────────────────────────────────────────────────────────
João Silva        ***.***      01/09/2026            [...]
Maria Oliveira    ***.***      28/08/2026            [...]
```

Em telas pequenas, tabelas devem possuir comportamento responsivo adequado, evitando overflow horizontal desnecessário.

---

# 10. Formulários

Formulários devem priorizar:

- simplicidade;
- agrupamento lógico;
- labels claras;
- validação próxima ao campo;
- mensagens de erro objetivas;
- indicação de campos obrigatórios;
- preservação dos dados preenchidos quando ocorrer erro.

Evitar formulários excessivamente longos.

Quando necessário, dividir em etapas.

Exemplo:

```text
Dados pessoais
────────────────────────────

Nome completo
[________________________]

Data de nascimento
[____/____/________]

Telefone
[________________________]

────────────────────────────

[Cancelar]              [Continuar]
```

---

# 11. Ações

Ações devem possuir hierarquia.

### Ação primária

Uma ação principal por contexto sempre que possível.

Exemplo:

```text
[ + Novo paciente ]
```

### Ações secundárias

Ações complementares devem possuir menor destaque.

### Ações destrutivas

Ações como:

- excluir;
- cancelar permanentemente;
- remover;
- apagar;

devem possuir diferenciação clara e confirmação quando houver risco de perda de dados.

Nunca esconder consequências importantes de uma ação destrutiva.

---

# 12. Feedback do sistema

Toda ação relevante deve fornecer feedback apropriado.

Exemplos:

### Sucesso

```text
✓ Paciente cadastrado com sucesso.
```

### Erro

```text
Não foi possível salvar o paciente.
Verifique os campos e tente novamente.
```

### Carregamento

Utilizar estados de loading adequados ao contexto.

Evitar deixar o usuário sem indicação sobre o que está acontecendo.

### Empty State

Quando não existirem registros:

```text
Nenhum paciente cadastrado.

Cadastre o primeiro paciente para começar.

[ + Novo paciente ]
```

Empty states devem orientar o próximo passo.

---

# 13. Modal / Dialog

Dialogs devem ser utilizados apenas quando realmente necessários.

Usar para:

- confirmação;
- ações rápidas;
- informações contextuais;
- operações que não justificam uma página inteira.

Evitar transformar operações complexas em modais grandes e difíceis de navegar.

---

# 14. Navegação

A navegação deve ser previsível.

O usuário deve conseguir responder rapidamente:

- onde estou?
- como cheguei aqui?
- o que posso fazer nesta página?
- como volto?
- qual é a próxima ação?

Quando apropriado, utilizar:

- breadcrumbs;
- título de página;
- navegação contextual;
- tabs.

---

# 15. Responsividade

A aplicação deve ser responsiva.

Prioridade:

### Desktop

Experiência completa com sidebar.

### Tablet

Adaptar:

- sidebar;
- grids;
- tabelas;
- formulários;
- cards.

### Mobile

A navegação deve transformar a sidebar em um mecanismo apropriado para telas pequenas, como:

- drawer;
- menu lateral;
- bottom navigation quando fizer sentido.

Não simplesmente reduzir a interface desktop.

---

# 16. Espaçamento

Utilizar um sistema consistente de espaçamento.

A IA deve definir tokens de spacing centralizados, evitando valores arbitrários espalhados pelo código.

Exemplo conceitual:

```text
spacing-xs
spacing-sm
spacing-md
spacing-lg
spacing-xl
spacing-2xl
```

Os valores exatos devem ser definidos pelo design system após análise da identidade visual e da interface.

Não criar dezenas de valores diferentes sem necessidade.

---

# 17. Tipografia

A tipografia deve seguir a identidade visual existente.

Se uma fonte oficial estiver presente no projeto, utilizá-la.

Caso não exista definição oficial:

1. verificar se existe fonte definida nos assets/documentação;
2. verificar se o projeto já possui uma tipografia estabelecida;
3. somente então escolher uma alternativa apropriada;
4. documentar a decisão.

A hierarquia deve diferenciar claramente:

- títulos;
- subtítulos;
- labels;
- conteúdo;
- informação auxiliar;
- estados;
- mensagens.

---

# 18. Ícones

Prioridade:

```text
1. PNG oficial do CANAMED
2. Outro asset oficial existente
3. Ícone de biblioteca somente quando não existir asset oficial
```

Não substituir arbitrariamente os PNGs existentes.

Os PNGs devem manter:

- proporção;
- legibilidade;
- alinhamento;
- escala adequada.

A IA deve evitar distorção dos assets.

---

# 19. Logo

Utilizar somente o logo oficial existente no projeto.

Não:

- alterar proporções;
- modificar cores;
- aplicar filtros;
- recriar o logo;
- gerar uma versão alternativa;
- utilizar o logo como ícone quando existir asset específico.

---

# 20. Acessibilidade

A interface deve seguir boas práticas de acessibilidade.

Requisitos mínimos:

- navegação por teclado;
- foco visível;
- labels associados aos campos;
- contraste adequado;
- textos alternativos quando necessários;
- sem dependência exclusiva de cor;
- mensagens de erro compreensíveis;
- elementos interativos semanticamente corretos;
- tamanho adequado de áreas clicáveis.

Considerar WCAG como referência.

---

# 21. UX para ambiente clínico

A interface deve considerar que os usuários podem estar trabalhando sob pressão e com alta frequência de operações.

Portanto:

- reduzir cliques desnecessários;
- evitar fluxos longos;
- priorizar informações relevantes;
- permitir ações rápidas;
- preservar contexto;
- evitar navegação inesperada;
- evitar mensagens técnicas;
- apresentar erros de maneira acionável;
- reduzir duplicidade de informações.

O sistema deve favorecer velocidade sem sacrificar segurança.

---

# 22. Estados de interface

Todo componente relevante deve considerar seus estados.

Mínimo:

```text
Default
Hover
Focus
Active
Disabled
Loading
Success
Error
Empty
```

Não implementar somente o estado "feliz".

---

# 23. Design System

Os componentes devem ser construídos de maneira reutilizável.

Criar componentes base para:

- Button;
- Input;
- Select;
- Checkbox;
- Radio;
- Switch;
- Textarea;
- DatePicker;
- TimePicker;
- Modal;
- Drawer;
- Toast;
- Alert;
- Badge;
- Card;
- Table;
- Pagination;
- Tabs;
- Dropdown;
- Tooltip;
- Breadcrumb;
- Sidebar;
- Header;
- Avatar;
- Empty State;
- Loading/Skeleton.

Evitar duplicar componentes visualmente equivalentes.

---

# 24. Tokens

Cores, tipografia, spacing, radius, shadows e dimensões recorrentes devem ser centralizados em tokens.

Exemplo:

```text
colors/
typography/
spacing/
radius/
shadows/
breakpoints/
```

Os valores devem ser derivados da identidade oficial existente.

Não hardcodar repetidamente valores visuais no código.

---

# 25. Microinterações

Microinterações podem ser utilizadas para:

- confirmação de ações;
- mudanças de estado;
- loading;
- navegação;
- feedback.

Devem ser:

- rápidas;
- discretas;
- funcionais.

Evitar animações excessivas.

O sistema é uma ferramenta operacional, não uma interface de entretenimento.

---

# 26. Performance visual

A interface deve evitar:

- carregamento desnecessário de imagens;
- assets duplicados;
- imagens sem otimização;
- animações pesadas;
- componentes desnecessariamente complexos;
- renderizações excessivas.

Os PNGs oficiais devem ser reutilizados e otimizados sem alterar sua aparência ou identidade.

---

# 27. Segurança e privacidade na UI

A interface nunca deve depender somente do frontend para segurança.

Elementos visuais relacionados a permissões devem refletir as permissões do usuário, mas:

> Toda autorização deve ser validada no backend.

A UI deve evitar exposição desnecessária de:

- dados clínicos;
- informações pessoais;
- dados financeiros;
- credenciais;
- informações sensíveis.

Informações sensíveis devem ser apresentadas somente quando necessárias para a função do usuário.

---

# 28. Dados sensíveis

Como o CANAMED pode lidar com dados pessoais e potencialmente dados relacionados à saúde:

- não utilizar dados reais de pacientes durante desenvolvimento;
- utilizar dados sintéticos;
- evitar exposição de informações sensíveis em screenshots;
- evitar dados sensíveis em logs do frontend;
- evitar dados sensíveis em mensagens de erro;
- aplicar controle de acesso apropriado.

---

# 29. Regras para o agente de desenvolvimento

Antes de criar ou modificar uma interface, o agente deve:

1. ler `GEMINI.md`;
2. localizar a identidade visual;
3. analisar os PNGs existentes;
4. analisar a estrutura atual da aplicação;
5. verificar componentes existentes;
6. reutilizar componentes quando possível;
7. verificar SPECs relacionadas;
8. verificar ADRs relacionadas;
9. evitar introduzir bibliotecas de UI desnecessariamente;
10. não criar uma nova identidade visual.

Antes de adicionar uma nova biblioteca visual, justificar a necessidade.

---

# 30. Processo de implementação

Para uma nova tela:

```text
SPEC
 ↓
UX Flow
 ↓
Information Architecture
 ↓
Wireframe
 ↓
Visual Design
 ↓
Componentes
 ↓
Implementação
 ↓
Responsive
 ↓
Accessibility
 ↓
Tests
 ↓
Review
```

Não iniciar diretamente pela implementação visual sem compreender o fluxo da funcionalidade.

---

# 31. Critérios de aceitação

Uma implementação de UI somente deve ser considerada concluída quando:

- [ ] segue a identidade oficial;
- [ ] utiliza os assets oficiais existentes;
- [ ] utiliza os PNGs oficiais como ícones quando aplicável;
- [ ] sidebar está implementada e consistente;
- [ ] navegação funciona corretamente;
- [ ] estados de loading estão implementados;
- [ ] estados vazios estão implementados;
- [ ] estados de erro estão implementados;
- [ ] feedback de sucesso está implementado;
- [ ] formulários possuem validação;
- [ ] interface é responsiva;
- [ ] teclado é suportado;
- [ ] foco é visível;
- [ ] contraste é adequado;
- [ ] componentes reutilizáveis foram utilizados;
- [ ] não existem componentes duplicados desnecessariamente;
- [ ] não foram inventadas cores da marca;
- [ ] não foram inventados logos;
- [ ] não foram substituídos PNGs oficiais sem justificativa;
- [ ] não foram introduzidas bibliotecas desnecessárias;
- [ ] não existem dados reais de pacientes;
- [ ] testes relevantes foram executados.

---

# 32. Regra fundamental

> **O CANAMED deve parecer um produto único e consistente, não uma coleção de telas desenvolvidas isoladamente.**

Toda nova tela deve parecer parte do mesmo sistema.

Toda nova funcionalidade deve respeitar:

```text
CANAMED Identity
       ↓
Design System
       ↓
UX Principles
       ↓
Component Library
       ↓
Feature SPEC
       ↓
Implementation
```

Quando houver conflito entre uma preferência estética local e a identidade oficial do CANAMED, a identidade oficial prevalece.

Quando houver dúvida sobre um elemento visual existente, o agente deve analisar os assets e documentação disponíveis antes de criar uma alternativa.

---

# 33. Resultado esperado

O resultado deve ser uma aplicação clínica moderna, profissional e operacionalmente eficiente.

A interface deve transmitir:

- confiança;
- organização;
- eficiência;
- clareza;
- profissionalismo;
- simplicidade.

O usuário deve conseguir operar o sistema sem precisar compreender a arquitetura ou a tecnologia utilizada.

**A complexidade deve permanecer no sistema; a experiência do usuário deve permanecer simples.**
