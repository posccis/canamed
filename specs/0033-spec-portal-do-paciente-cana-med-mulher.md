# SPEC-0033 — Portal do Paciente CANA MED Mulher: Acesso Segmentado, Agendamento Inteligente em 5 Etapas e Autoatendimento Acolhedor

| Campo | Valor |
| :--- | :--- |
| **ID** | SPEC-0033 |
| **Título** | Portal do Paciente CANA MED Mulher: Acesso Segmentado, Agendamento Inteligente em 5 Etapas e Autoatendimento Acolhedor |
| **Status** | Aprovado para Implementação |
| **Versão** | 1.0.0 |
| **Data** | 2026-10-14 |
| **Autor** | Time Multidisciplinar Cana Med (Product Architect, Planejador, Medical Systems Domain Expert, UI/UX Reviewer) |
| **Módulos afetados** | `frontend/src/features/auth/`, `frontend/src/features/home/`, `frontend/src/features/patient/`, `frontend/src/app/` |
| **ADRs relacionados** | ADR-0004, ADR-0006, ADR-0008, ADR-0010, ADR-0011 |

---

## 1. Objetivo

Implementar a experiência integral do **Portal do Paciente** para o **CANA MED Mulher**, estruturando:
1. **Entrada Segmentada na Tela de Login e Portal de Entrada (`/` e `/app/login`):** Três opções explícitas de acesso alinhadas à identidade visual do protótipo:
   - *Sou paciente:* Acesso direto ao autoatendimento e agendamentos (`/p/cana-med`).
   - *Sou médica(o):* Acesso ao consultório digital e prontuário (`/medico`).
   - *Sou da equipe da clínica (Administração):* Acesso à recepção e gestão (`/app`).
2. **Página Inicial do Paciente (`PatientHub.tsx`):**
   - Saudação personalizada com o primeiro nome quando autenticado.
   - Card de destaque com a **Próxima Consulta** agendada (data, horário, médico, status e atalhos rápidos).
   - Estado vazio acolhedor (*"Você ainda não possui consultas agendadas"*) com chamada clara para o primeiro agendamento.
   - Botão de ação principal em destaque: **Agendar Consulta**.
   - Acesso imediato a: *Minhas Consultas*, *Check-in Autônomo*, *Carteira de Documentos*, *Meus Dados Cadastrais* e *Privacidade LGPD*.
   - Canal de contato direto com a clínica via WhatsApp e telefone de suporte.
3. **Fluxo de Agendamento Guiado em 5 Etapas (`PatientPortal.tsx` / `PatientBookingWizard`):**
   - *Etapa 1 — Serviço / Especialidade Ginecológica:* Seleção clara de especialidade/tipo de consulta.
   - *Etapa 2 — Data e Horário em Tempo Real:* Escolha do dia e slot livre verificado no backend.
   - *Etapa 3 — Identificação do Paciente:* Autenticação fluida e passwordless via Celular/WhatsApp + CPF (OTP de 6 dígitos seguro).
   - *Etapa 4 — Revisão e Confirmação:* Exibição de resumo do agendamento, profissional, endereço da clínica e política de cancelamento/antecedência (2h).
   - *Etapa 5 — Conclusão e Próximos Passos:* Protocolo emitido, instruções de preparo, opção de adicionar ao calendário ou solicitar lembrete via WhatsApp.
4. **Gestão de Agendamentos ("Minhas Consultas"):**
   - Agrupamento visual em 3 categorias: *Próximas*, *Anteriores (Histórico)* e *Canceladas*.
   - Ações de Reagendamento e Cancelamento conforme políticas configuradas.
5. **Seção "Meus Dados" (`PatientProfileSection.tsx`):**
   - Exibição e atualização de dados cadastrais autorizados (Nome completo, Data de Nascimento, CPF, Celular, E-mail) com total conformidade com a LGPD.

Pergunta de controle do `GEMINI.md`: **isso reduz atrito na rotina da clínica?**
**Sim.** Desafoga expressivamente a recepção telefônica e o WhatsApp manual da clínica, capacitando a paciente a agendar, remarcar, consultar seus exames/documentos e realizar check-in com total autonomia e carinho, 24 horas por dia.

---

## 2. Contexto e Decisões de Produto

* **Decisão 1 — Arquitetura de Superfície Preservada:** A URL base do paciente é `/p/:slug` (com fallback `/p/cana-med`), mantendo a segregação estrita sem sidebar interna do sistema corporativo (ADR-0011).
* **Decisão 2 — Autenticação Passwordless Segura:** Conforme a SPEC-0015 e LGPD, a paciente não precisa memorizar senhas complexas. A autenticação baseia-se em verificação de posse por OTP de 6 dígitos no número celular / WhatsApp associado ao seu CPF. Em desenvolvimento, códigos mockados continuam aceitos para agilidade nos testes.
* **Decisão 3 — Design Tokens Oficiais Cana Med Mulher:** Uso integral da paleta oficial (#852A91, #6F217B, #F7ECF8, #F7F8FA, #E2E6EC, #202631, #626B79) e tipografia Inter com cantos arredondados (12px/14px) para transmitir conforto, modernidade e acolhimento ginecológico.

---

## 3. Escopo

### 3.1 Dentro do escopo
1. Reformulação da `HomePage.tsx` e `LoginPage.tsx` para apresentar a seleção de 3 perfis e transição suave para os fluxos correspondentes.
2. Evolução de `PatientHub.tsx` para uma home acolhedora e informativa com card de próxima consulta e atalhos rápidos.
3. Fluxo de agendamento em 5 etapas interativas com progresso visual.
4. Categorização de consultas em *Próximas*, *Anteriores* e *Canceladas*.
5. Componente de "Meus Dados" com visualização e edição de perfil da paciente.
6. Acesso direto a canal de suporte via WhatsApp da clínica ginecológica.

### 3.2 Fora do escopo
1. Pagamento de consulta online via cartão de crédito ou gateway externo (mantido no balcão/recepção física do MVP).
2. Prontuário clínico detalhado aberto ao paciente (apenas documentos emitidos e assinados via Carteira Digital).

---

## 4. Regras de Negócio

| ID | Regra | Justificativa |
| :--- | :--- | :--- |
| **RN-001** | Segregação estrita de superfícies: paciente nunca visualiza rotas administrativas (`/app/*`) ou médicas (`/medico/*`). | Segurança clínica e LGPD. |
| **RN-002** | Autenticação por OTP vinculada ao CPF + Celular. | Previne invasão por mera adivinhação de CPF. |
| **RN-003** | Máximo de 2 agendamentos futuros não realizados por paciente. | Previne bloqueio abusivo de horários (SPEC-0015). |
| **RN-004** | Cancelamento autônomo permitido com no mínimo 2 horas de antecedência. | Respeito à rotina operacional do consultório. |
| **RN-005** | Responsividade mobile-first completa com targets de toque de no mínimo 44px. | Acessibilidade em smartphones. |

---

## 5. Critérios de Aceitação

- [x] Tela de Login/Entrada exibe 3 opções de acesso: "Sou paciente", "Sou médica(o)" e "Sou da equipe da clínica (Administração)".
- [x] O portal do paciente possui Home com saudação, próxima consulta em destaque (ou estado vazio acolhedor), botão de agendamento e botão de WhatsApp.
- [x] O fluxo de agendamento conduz a paciente em 5 etapas claras até a emissão de confirmação.
- [x] Minhas Consultas separa visualmente consultas futuras de consultas passadas e canceladas.
- [x] Seção "Meus Dados" exibe os dados cadastrais da paciente autenticada.
- [x] Todos os testes existentes do frontend e backend continuam passando sem regressões.
