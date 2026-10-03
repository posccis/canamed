# SPEC-0024 — Alternância de Multi-Clínica na Interface

| Campo | Valor |
| :--- | :--- |
| **ID** | SPEC-0024 |
| **Título** | Alternância Dinâmica de Contexto de Clínica Ativa para Redes e Múltiplas Filiais |
| **Status** | Aprovada |
| **Versão** | 1.0 |
| **Data** | 2026-10-03 |
| **Autor** | Antigravity AI / Equipe CANAMED |
| **Revisores** | Responsável pelo Projeto CANAMED |
| **Módulos afetados** | backend (Application, Api, Session/Tenant Middleware), frontend (Topbar, Layout, State Management), banco de dados (schema `auth` e `clinics`) |
| **ADRs relacionados** | ADR-0003, ADR-0006, ADR-0007, ADR-0008 |

---

## 1. Objetivo

Permitir que gestores, administradores e profissionais de saúde com vínculo em múltiplas unidades da rede de clínicas alternem com agilidade a clínica ativa diretamente na barra superior da aplicação (Topbar), sem necessidade de efetuar logout e login novamente, isolando com total segurança e integridade os dados operacionais, agendas, filas, faturamento e prontuários de cada filial.

Pergunta de controle do `GEMINI.md`: **isso reduz atrito na rotina da clínica?**  
Sim. Médicos e gestores que operam em filiais distintas (ex: Recife pela manhã e Caruaru à tarde) não perdem tempo refazendo autenticação e evitam o risco crítico de agendar pacientes ou registrar atendimentos na filial incorreta.

---

## 2. Contexto

O CANAMED foi projetado desde a [SPEC-0001](0001-spec-de-fundacao.md) e [SPEC-0003](0003-spec-autenticacao-autorizacao-e-auditoria.md) com suporte a multi-inquilino (*multi-tenant* por `clinicId`). Porém, a seleção da clínica ativa ficava fixa na primeira clínica vinculada na sessão. Para grupos médicos em expansão nas regiões prioritárias (Recife, Gravatá, Caruaru, Garanhuns e Petrolina), a alternância instantânea entre filiais é essencial.

---

## 3. Escopo

### 3.1 Dentro do escopo
- Componente seletor de unidade na barra superior (`Topbar.tsx`):
  - Exibição da clínica ativa com ícone de filial e indicador visual;
  - Dropdown com a lista das clínicas às quais o usuário autenticado possui vínculo autorizado;
- Endpoint no backend `POST /api/v1/auth/switch-clinic` para atualizar a clínica ativa na sessão JWT/cookie com validação estrita de permissão;
- Recarregamento automático e transparente dos dados da tela atual (agenda, fila, consultório, estoque, faturamento) sob o novo contexto;
- Persistência da última clínica selecionada no navegador do usuário (`localStorage`);
- Validação de autorização no backend: o usuário é impedido de requisitar contexto de uma clínica onde não possua cadastro ativo.

### 3.2 Fora do escopo
- Consolidação corporativa de balanço fiscal único multimatriz (foco na operação clínica de cada filial).

---

## 4. Atores e Permissões

| Ator | Permissão necessária | Observações |
| :--- | :--- | :--- |
| `gestor`, `admin`, `profissional`, `recepcionista` | Vínculo ativo com a clínica de destino | Qualquer usuário com perfil cadastrado em mais de uma clínica pode alternar entre elas. |

---

## 5. Regras de Negócio

| ID | Regra | Justificativa / origem |
| :--- | :--- | :--- |
| **RN-001** | **Validação Estrita de Vínculo:** O backend só efetua a troca de contexto se o usuário autenticado possuir vínculo ativo e não revogado na clínica de destino. Tentativas de troca para clínicas não autorizadas retornam erro `403 Forbidden` e geram alerta de auditoria de segurança. | Prevenção de quebra de controle de acesso (OWASP Broken Access Control). |
| **RN-002** | **Isolamento de Dados por Filial:** Ao alternar a clínica ativa, nenhum cache residual de pacientes, fila ou agenda da filial anterior deve permanecer visível na tela. | Sigilo de dados e integridade operacional. |
| **RN-003** | **Persistência de Preferência:** Ao fazer novo login, o sistema deve priorizar a última clínica utilizada pelo operador naquele dispositivo, reduzindo cliques desnecessários. | Princípio de usabilidade e eficiência operacional do GEMINI.md. |

---

## 6. Fluxos

### 6.1 Alternância de Clínica na Interface
1. O usuário clica no seletor de clínica na Topbar.
2. O sistema exibe o menu com as clínicas autorizadas (ex: "CanaMed Recife (Matriz)" e "CanaMed Caruaru").
3. O usuário seleciona "CanaMed Caruaru".
4. O frontend chama o endpoint de troca de clínica e atualiza o estado global de sessão.
5. Os painéis em exibição atualizam suas consultas para a nova filial de forma fluida.

---

## 7. Critérios de Aceitação

- [x] Usuários com apenas 1 clínica visualizam o nome da unidade de forma estática sem dropdown.
- [x] Usuários com 2 ou mais clínicas visualizam o seletor interativo na Topbar.
- [x] Ao selecionar outra clínica, a sessão é atualizada e a tela recarrega os dados da unidade selecionada.
- [x] O backend bloqueia tentativas de alternância para clínicas onde o usuário não possui permissão.

---

## 8. Requisitos de Segurança e Legais

- **Segurança de Acesso:** Verificação no backend por token criptográfico para evitar manipulação de cabeçalhos no frontend.
- **Auditoria:** Registro do evento de alternância de filial com carimbo de tempo e IP.
