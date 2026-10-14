# Cana Med — Escopo do MVP

## 1. Objetivo

Entregar uma plataforma web responsiva para clínicas pequenas, cobrindo o fluxo essencial de atendimento entre **Administração**, **Recepção** e **Médico**, com uma experiência simples para o paciente agendar e gerenciar suas consultas por meio de um link público.

O MVP deve validar a operação de ponta a ponta sem tentar substituir, desde o início, um ERP médico completo.

## 2. Perfis de acesso

### 2.1 Administração
Responsável por configurar a clínica e controlar a operação.

- Configurar dados básicos da clínica.
- Cadastrar e gerenciar profissionais, especialidades e serviços.
- Configurar horários de atendimento e disponibilidade.
- Configurar as regras de agendamento público.
- Gerenciar usuários, perfis e permissões.
- Consultar indicadores operacionais e financeiros básicos.
- Consultar registros de auditoria conforme suas permissões.

### 2.2 Recepção
Responsável pela rotina operacional.

- Cadastrar, consultar e atualizar pacientes.
- Agendar, reagendar e cancelar consultas em nome do paciente.
- Consultar a agenda diária e semanal.
- Realizar check-in.
- Organizar e acompanhar a fila de atendimento.
- Atualizar o status da consulta.
- Registrar o pagamento e consultar pendências.

### 2.3 Médico
Responsável pela realização e documentação do atendimento clínico.

- Consultar a própria agenda.
- Visualizar os pacientes e as informações clínicas a que tem autorização de acesso.
- Consultar o histórico de atendimentos.
- Registrar anamnese, queixa principal, sinais vitais pertinentes, avaliação, diagnóstico e conduta.
- Registrar orientações e plano de acompanhamento.
- Salvar e finalizar o prontuário.
- Preservar a rastreabilidade e a integridade dos registros finalizados.

### 2.4 Paciente — acesso por link público
No MVP, o paciente não precisa criar uma conta nem instalar um aplicativo. A clínica poderá compartilhar um link público de agendamento.

Por esse link, o paciente poderá:

- Consultar os profissionais, serviços e horários disponibilizados pela clínica.
- Escolher um horário disponível e solicitar/agendar uma consulta conforme as regras configuradas.
- Informar os dados mínimos necessários para identificação e contato.
- Receber uma confirmação com os dados da consulta.
- Consultar sua consulta por meio de um fluxo seguro de identificação.
- Solicitar ou realizar o cancelamento dentro das regras da clínica.
- Solicitar ou realizar a alteração do horário dentro das regras da clínica.
- Visualizar o resultado da operação e as orientações seguintes.

O link público não deve expor a agenda completa, dados pessoais de outros pacientes, informações clínicas ou detalhes internos da clínica.

## 3. Módulos do MVP

### Módulo 1 — Agenda e pacientes
**Prioridade: P0 — obrigatório**

- Cadastro e edição de pacientes.
- Cadastro básico de profissionais, especialidades e serviços.
- Agenda diária e semanal para a equipe.
- Agendamento, reagendamento e cancelamento pela recepção.
- Disponibilidade por profissional, serviço, data e horário.
- Busca de pacientes por nome, CPF ou telefone, respeitando os controles de acesso.
- Prevenção de conflitos e dupla reserva.
- Integração entre agendamentos feitos pela recepção e pelo link público.

### Módulo 2 — Agendamento público do paciente
**Prioridade: P0 — incluído no MVP**

- Link público compartilhável, associado à clínica.
- Seleção de serviço ou especialidade, profissional (quando aplicável) e horário disponível.
- Formulário com coleta mínima de dados necessários.
- Confirmação do agendamento.
- Fluxo seguro para localizar a consulta e validar a identidade do solicitante.
- Cancelamento e alteração de horário conforme as regras configuradas.
- Atualização consistente da agenda após cada operação.
- Mensagens claras quando um horário já não estiver disponível.
- Proteção contra acesso indevido, enumeração de consultas e exposição de dados pessoais.
- Registro de data/hora e resultado das operações relevantes.

**Fora do escopo inicial deste módulo:** aplicativo nativo, conta completa do paciente, telemedicina, pagamentos online e campanhas automatizadas de comunicação.

### Módulo 3 — Configuração das regras de agendamento
**Prioridade: P0 — incluído no MVP**

Criar uma tela administrativa específica para configurar e manter as regras aplicadas ao link público e aos agendamentos operacionais.

A tela deve permitir configurar, no mínimo:

- **Antecedência mínima:** intervalo mínimo entre a solicitação e o horário da consulta.
- **Horizonte de agendamento:** quantos dias ou meses à frente o paciente pode consultar horários.
- **Prazo para cancelamento:** limite de tempo antes da consulta para permitir cancelamento pelo paciente.
- **Prazo para alteração:** limite de tempo antes da consulta para permitir troca de horário pelo paciente.
- **Duração e intervalos:** duração dos serviços e intervalos entre consultas, quando aplicável.
- **Disponibilidade pública:** quais serviços, profissionais, dias e horários podem ser exibidos no link.
- **Limites de agendamento:** restrições básicas para evitar múltiplas reservas indevidas, conforme identificador e política da clínica.
- **Dados obrigatórios:** campos mínimos exigidos no formulário público.
- **Fuso horário:** usar o fuso configurado para a clínica, exibindo horários de forma consistente.
- **Ativação do link:** permitir habilitar ou suspender temporariamente o agendamento público.

As regras devem ter valores padrão seguros, validação no backend e mensagens compreensíveis para a equipe. Alterações de configuração devem registrar quem alterou e quando.

**Regras de negócio recomendadas:**

1. Um horário só pode ser confirmado se continuar disponível no momento da gravação.
2. A alteração de horário deve reservar o novo horário de forma segura antes de liberar o anterior, evitando perda da consulta se a operação falhar.
3. Se o prazo para cancelamento ou alteração tiver expirado, o sistema deve explicar que o paciente precisa entrar em contato com a clínica.
4. O cancelamento ou a alteração deve atualizar a agenda da recepção e do médico.
5. Os horários públicos devem respeitar a disponibilidade real do profissional, bloqueios, feriados configurados e duração do serviço.
6. A clínica deve poder fazer cancelamentos e alterações administrativas independentemente das restrições aplicadas ao paciente, mantendo trilha de auditoria.
7. As regras devem ser avaliadas no servidor; não basta ocultar ações na interface.
8. O sistema deve evitar duplicidade quando uma pessoa envia o mesmo pedido mais de uma vez.

### Módulo 4 — Atendimento e recepção
**Prioridade: P0 — obrigatório**

- Check-in do paciente.
- Fila por profissional ou serviço.
- Status: agendado, aguardando, em atendimento, concluído, cancelado e faltou.
- Registro dos horários de chegada e atendimento.
- Visualização da situação da sala de espera.
- Registro do pagamento e estado financeiro da consulta.
- Integração com agendamentos realizados pelo paciente.

### Módulo 5 — Prontuário eletrônico
**Prioridade: P0 — obrigatório**

- Histórico de atendimentos.
- Registro de anamnese e queixa principal.
- Sinais vitais e informações clínicas pertinentes.
- Avaliação, diagnóstico e conduta.
- Orientações e plano de acompanhamento.
- Salvamento e finalização do atendimento.
- Identificação do profissional, data e hora dos registros.
- Rastreabilidade das alterações e proteção dos registros finalizados.

A emissão de receitas, atestados e documentos com assinatura eletrônica deve ter requisitos próprios e ser validada antes de entrar em produção.

### Módulo 6 — Administração, usuários e permissões
**Prioridade: P0 — obrigatório**

- Cadastro e gerenciamento de usuários.
- Perfis de administrador, recepção e médico.
- Permissões validadas no backend.
- Configuração da clínica, profissionais, serviços e horários.
- Desativação de contas.
- Auditoria de operações sensíveis.
- Isolamento dos dados entre clínicas.

### Módulo 7 — Financeiro básico
**Prioridade: P1 — escopo reduzido**

- Valor da consulta por profissional ou serviço.
- Registro de pagamentos e pendências.
- Forma de pagamento.
- Histórico financeiro da consulta.
- Resumo diário de valores recebidos e pendentes.
- Relatório simples por período.

Pagamentos online pelo link público ficam fora do MVP inicial, salvo se forem considerados essenciais para validar o modelo comercial.

### Módulo 8 — Dashboard operacional
**Prioridade: P1 — versão inicial**

- Consultas do dia.
- Pacientes aguardando.
- Atendimentos concluídos.
- Faltas e cancelamentos.
- Valores recebidos e pendentes, de acordo com as permissões.

## 4. Fluxos principais

### 4.1 Agendamento público

1. A clínica compartilha o link público.
2. O paciente escolhe serviço/especialidade e profissional, quando aplicável.
3. O sistema apresenta somente horários elegíveis segundo a disponibilidade e as regras configuradas.
4. O paciente escolhe o horário e informa os dados solicitados.
5. O backend valida novamente disponibilidade, regras e duplicidade.
6. O sistema confirma o agendamento e apresenta os dados da consulta.
7. A consulta aparece na agenda da recepção e do profissional correspondente.

### 4.2 Alteração de horário pelo paciente

1. O paciente acessa o fluxo de gerenciamento da consulta pelo link.
2. O sistema valida a identidade do solicitante sem revelar dados de terceiros.
3. O sistema verifica se a alteração ainda é permitida.
4. O paciente escolhe um novo horário disponível.
5. O backend valida as regras e conclui a troca de forma consistente.
6. A agenda é atualizada e o paciente recebe uma confirmação.

### 4.3 Cancelamento pelo paciente

1. O paciente acessa o fluxo seguro de gerenciamento da consulta.
2. O sistema valida a identidade e o prazo de cancelamento.
3. O paciente confirma a intenção de cancelar.
4. O sistema cancela a consulta, libera o horário e atualiza a agenda.
5. O sistema apresenta a confirmação e, se o prazo tiver expirado, orienta o paciente a contatar a clínica.

### 4.4 Atendimento presencial

1. A recepção localiza o paciente e realiza o check-in.
2. O paciente entra na fila correspondente.
3. O médico acessa a fila e inicia o atendimento.
4. O médico consulta o histórico autorizado e preenche o prontuário.
5. O médico revisa e finaliza o registro.
6. A recepção atualiza o estado financeiro, quando aplicável.
7. O atendimento aparece como concluído nos indicadores.

## 5. Fora do escopo do MVP

- Aplicativo nativo para Android ou iOS.
- Portal completo do paciente com conta e histórico clínico.
- Telemedicina.
- Integrações com convênios e operadoras.
- Integrações com laboratórios e sistemas externos.
- Emissão automática de notas fiscais.
- Contas a pagar e receber completas.
- Estoque, compras e gestão de medicamentos.
- Inteligência artificial para apoiar consultas.
- BI avançado e relatórios personalizados.
- Campanhas automáticas por WhatsApp ou SMS.
- Pagamento online no link público, salvo decisão explícita de priorização.

## 6. Requisitos transversais

- **Autenticação:** contas individuais, recuperação segura de acesso e encerramento de sessão.
- **Autorização:** permissões aplicadas e verificadas no backend.
- **Isolamento por clínica:** impedir acesso cruzado entre organizações.
- **Proteção de dados:** criptografia em trânsito e medidas adequadas para dados armazenados.
- **LGPD:** tratar dados de saúde como dados pessoais sensíveis; definir responsabilidades, finalidades, retenção e atendimento aos direitos dos titulares.
- **Auditoria:** registrar operações relevantes com autoria, data/hora e contexto.
- **Integridade clínica:** preservar rastreabilidade e impedir alterações silenciosas de prontuários finalizados.
- **Agendamento seguro:** validação de disponibilidade no servidor, prevenção de concorrência e proteção contra abuso do link público.
- **Continuidade:** backups testados, recuperação de dados e monitoramento de falhas.
- **Acessibilidade e responsividade:** uso em desktop, tablet e celular, com formulários e mensagens compreensíveis.

## 7. Plano incremental de implementação

### Fase 1 — Fundação
Autenticação, isolamento por clínica, perfis, permissões, dados básicos da clínica, profissionais, serviços, horários e pacientes.

### Fase 2 — Agenda e regras
Agenda interna, disponibilidade, prevenção de conflitos e tela administrativa de regras de agendamento.

### Fase 3 — Link público
Agendamento, confirmação, consulta segura dos dados necessários para gerenciar a reserva, cancelamento e alteração de horário.

### Fase 4 — Atendimento clínico
Check-in, fila, prontuário, salvamento, finalização e auditoria.

### Fase 5 — Validação operacional
Financeiro básico, dashboard, testes de segurança, testes de concorrência e piloto com uma clínica.

A duração de cada fase deve ser estimada depois de definidos a equipe, a arquitetura e os critérios detalhados de aceite.

## 8. Critérios de aceite do MVP

O MVP estará pronto para um piloto quando:

- [ ] O administrador configurar a clínica, os profissionais, os serviços e as regras.
- [ ] A recepção cadastrar um paciente e agendar uma consulta.
- [ ] O paciente conseguir agendar pelo link público, respeitando disponibilidade e regras.
- [ ] O paciente conseguir cancelar e alterar o horário quando permitido.
- [ ] Tentativas fora das regras forem recusadas com uma mensagem clara.
- [ ] A agenda impedir dupla reserva mesmo com solicitações simultâneas.
- [ ] Agendamentos públicos e internos aparecerem corretamente na agenda.
- [ ] A recepção realizar check-in e organizar a fila.
- [ ] O médico registrar e finalizar o atendimento.
- [ ] Os registros clínicos permanecerem íntegros e rastreáveis.
- [ ] O financeiro básico e os indicadores exibirem dados coerentes, conforme permissões.
- [ ] Testes confirmarem que não há acesso indevido a dados de pacientes ou de outras clínicas.
- [ ] Backups, recuperação e auditoria forem testados.

## 9. Indicadores para avaliar o piloto

- Percentual de agendamentos realizados pelo link público.
- Taxa de conclusão dos fluxos de agendamento.
- Quantidade de cancelamentos e alterações feitos pelo próprio paciente.
- Taxa de faltas e cancelamentos.
- Tempo médio entre check-in e início do atendimento.
- Percentual de consultas com prontuário finalizado.
- Erros de agendamento e tentativas de dupla reserva.
- Feedback da recepção, dos médicos e dos pacientes.

## 10. Decisão de produto

O MVP do Cana Med será uma plataforma web responsiva para operação clínica, composta por:

1. Administração da clínica e regras de funcionamento.
2. Agenda e recepção.
3. Link público para o paciente agendar, cancelar e alterar consultas.
4. Atendimento médico e prontuário.
5. Financeiro e indicadores básicos.

O link público deve ser tratado como parte do fluxo central de agenda, não como um portal completo do paciente. A tela de regras deve permitir que cada clínica controle a disponibilidade e os prazos aplicáveis sem depender de alterações de código.

A prioridade é validar um ciclo de atendimento consistente, seguro e rastreável antes de ampliar o produto com integrações e automações.
