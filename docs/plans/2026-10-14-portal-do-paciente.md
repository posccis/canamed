# Plano de Implementação — SPEC-0033: Portal do Paciente CANA MED Mulher

Data: 2026-10-14  
Status: Aprovado  
Metodologia: Test-Driven Development (TDD)  

---

## 1. Visão Geral das Tarefas

- [ ] **Tarefa 1: Entrada Segmentada nos Portais (`LoginPage.tsx` e `HomePage.tsx`)**
  - Implementar seleção de 3 perfis: "Sou paciente", "Sou médica(o)", "Sou da equipe da clínica (Administração)".
  - Suporte à navegação direta ou seleção com transição de tela.
  - Testes unitários atualizados.

- [ ] **Tarefa 2: Home Acolhedora do Paciente (`PatientHub.tsx`)**
  - Exibir saudação personalizada para o paciente autenticado.
  - Card de destaque "Próxima Consulta" com status, médico, data e atalhos.
  - Estado vazio acolhedor quando não houver agendamentos futuros.
  - Botão principal de ação: "+ Agendar Consulta".
  - Acesso direto a Minhas Consultas, Check-in, Carteira de Documentos, Meus Dados Cadastrais e Privacidade.
  - Botão de contato direto via WhatsApp da clínica ginecológica.

- [ ] **Tarefa 3: Agendamento Inteligente em 5 Etapas (`PatientPortal.tsx` / `PatientBookingWizard.tsx`)**
  - Etapa 1: Especialidade & Tipo de Atendimento Ginecológico.
  - Etapa 2: Data e Horário em tempo real.
  - Etapa 3: Identificação & Autenticação (OTP Celular + CPF).
  - Etapa 4: Revisão & Políticas (2h de cancelamento, preparo).
  - Etapa 5: Confirmação com protocolo e próximos passos.

- [ ] **Tarefa 4: Categorização de Consultas & Autoatendimento ("Minhas Consultas")**
  - Abas/Grupos: *Próximas*, *Anteriores*, *Canceladas*.
  - Ação de desmarcar / remarcar com confirmação e validação de política de 2h.

- [ ] **Tarefa 5: Seção "Meus Dados" (`PatientProfileSection.tsx`)**
  - Visualização de dados cadastrais (Nome, CPF mascarado, Celular, Data de Nascimento, E-mail).
  - Edição autorizada de telefone e e-mail com confirmação.

- [ ] **Tarefa 6: Verificação Integral (Frontend + Backend Tests)**
  - Rodar suíte completa de testes (`npm test -- --run` e `dotnet test`).
