# SPEC-0028: Evolução do Módulo Médico — Dashboard, Anexo de Exames Anteriores, Início de Atendimento e Sidebar

> **Status:** Implementada e Validada (Aprovada pelos Especialistas: Medical Systems Domain Expert & UI/UX Reviewer)  
> **Versão:** 1.2.0  
> **Data:** 2026-10-09  
> **Autores:** Agente Orquestrador & Engenharia Cana Med  
> **Revisores:** Medical Systems Domain Expert (Ginecologia & HIS) e UI/UX Reviewer  

---

## 1. Objetivo e Visão Geral

O objetivo desta especificação é evoluir de forma estruturada, robusta e aderente aos padrões do **Cana Med Mulher** o módulo do profissional de saúde (`/medico`), entregando as 7 melhorias prioritárias solicitadas:

1. **Anexo de Exames Anteriores ao Prontuário:** Permitir anexar arquivos (PDFs, imagens) de exames prévios trazidos pela paciente, com metadados clínicos completos (categoria do exame, data de realização, laboratório emissor, resumo/achados), armazenamento seguro com controle de acesso multi-tenant, cálculo de Hash criptográfico (SHA-256) para integridade probatória de longo prazo (Lei nº 13.787/2018) e trilha de auditoria (LGPD Art. 11).
2. **Correção e Habilitação de Iniciar Atendimento:** Corrigir as permissões e o desacoplamento de identidade (`actor.ProfessionalId` vs `actor.UserId`) que impediam o início de atendimento, garantindo idempotência estrita (1:1 com agendamento) e ação direta de "Iniciar Atendimento" na Minha Agenda e na Fila do Consultório.
3. **Correção e Modernização da Emissão de Documentos (`DocumentModal`):** Resolver causas-raiz de falhas na emissão (permissões RBAC de rascunho/assinatura, identificação do profissional emissor, validação de campos, sigilo ético do CID com consentimento expresso - Art. 73 do CEM, download de PDF formatado e impressão limpa).
4. **Padronização e Modernização Visual de Formulários e Páginas:** Padronizar campos, botões, cards, tabelas e feedbacks em todas as telas médicas, utilizando o design system oficial do Cana Med (`theme.css`).
5. **Incorporação de Bibliotecas Gratuitas Compatíveis:** Avaliação e integração de `lucide-react` (licença MIT, suporte total a React 19, zero-dependências externas) para iconografia consistente e padronizada.
6. **Dashboard Médico com Indicadores Clínicos:** Criar painel executivo e ambulatorial do médico com métricas em tempo real (consultas de hoje, em atendimento, aguardando na fila, prontuários em rascunho pendentes de finalização, próximos pacientes com distinção de tipo de consulta: Primeira Vez vs Retorno).
7. **Sidebar Médica Moderna e Responsiva:** Substituir o header estático da área médica por uma sidebar colapsável, moderna e responsiva com tooltips e navegação ergonômica.

---

## 2. Contexto e Diagnóstico das Causas-Raiz

### 2.1. Permissões RBAC e Contexto de Papel Gestor / Médico
No ambiente de desenvolvimento e em clínicas de pequeno e médio porte, o usuário gestor cadastrado (`gestor@canamed.local`) possui vínculo de profissional (`ClinicMembership.ProfessionalId`) com a Dra. Ana Ribeiro. Contudo, em `Canamed.Application/Identity/Roles.cs`, o papel `Manager` (`gestor`) continha permissões de leitura (`RecordsRead`), mas não continha:
- `RecordsCreate`, `RecordsUpdate`, `RecordsFinalize`, `RecordsAddendum`
- `DocumentsCreate`, `DocumentsSign`, `DocumentsCancel`

Isso causava erro `403 Forbidden` ("Acesso negado") ao tentar salvar a Ficha Gineco (`updateGynecologicalProfile`), iniciar atendimentos ou assinar documentos pelo modal.

### 2.2. Resolução de Identificador do Médico (`DoctorId` vs `UserId`)
Em `MedicalDocumentService.cs` e `DoctorWorkspaceService.cs`, a identidade do médico era resolvida apenas por `Guid.TryParse(actor.UserId, out var doctorId)`.
Quando o `actor.ProfessionalId` está presente (que referencia a entidade `Professional` e não `User`), as consultas à fila (`QueueRepository.ListAsync`) e a emissão de documentos falhavam na validação de entidade ou buscavam registros incorretos.

### 2.3. Fluxo de Iniciar Atendimento
Na tela de `DoctorAgendaPage.tsx`, os horários exibiam apenas botões "✓ Atendido" e "Falta", sem atalho operacional para iniciar a consulta ambulatorial. Na fila do `DoctorWorkspace.tsx`, pacientes aguardando só podiam ser chamados (`Chamar`), sem opção de início imediato quando a paciente já se encontra no consultório.

### 2.4. Ausência de Gestão Documental de Exames Prévia
Não havia entidade, repositório ou endpoints para anexar arquivos externos trazidos pela paciente (USG prévia, mamografia, citologia, exames de sangue). O armazenamento de saúde exige:
- Armazenamento fora da raiz pública da web (evitando exposição direta por URL).
- Streaming autenticado e verificação de clínica ativa (`ClinicId`).
- Cálculo e persistência de Hash criptográfico (SHA-256) para garantir valor probatório de até 20 anos (Lei 13.787/2018).
- Trilha de auditoria no acesso/download (`LGPD` e CFM).

---

## 3. Regras de Negócio Consolidadas (RN)

### RN-001: Gestão de Permissões para Supervisores e Médicos
O papel `Manager` (`gestor`) passa a ter incluídas as permissões clínicas (`RecordsCreate`, `RecordsUpdate`, `RecordsFinalize`, `RecordsAddendum`, `DocumentsCreate`, `DocumentsSign`, `DocumentsCancel`) quando opera no contexto assistencial de demonstração ou gestão técnica da clínica. O papel `Professional` (`profissional`) mantém a concessão integral dessas permissões.

### RN-002: Resolução Segura de Identidade Médica
Sempre que uma operação clínica exigir `doctorId`, ela deve priorizar:
1. `actor.ProfessionalId` (quando o usuário tem vínculo formal com cadastro de profissional na clínica).
2. Se nulo, verificar se `actor.UserId` é um `Guid` válido correspondente ao profissional.
3. Se nulo ou não encontrado, lançar erro de validação claro solicitando associação de profissional ativo.

### RN-003: Anexo de Exames Anteriores (Metadados Clínicos e Integridade Probatória)
1. **Entidade:** `PatientExamAttachment` vinculada a `ClinicId` e `PatientId` (e opcionalmente a `MedicalRecordId`).
2. **Formatos aceitos:** `application/pdf`, `image/png`, `image/jpeg`, `image/webp`.
3. **Tamanho máximo por arquivo:** 15 MB.
4. **Metadados obrigatórios:**
   - `Title`: Título/Nome do exame (mínimo 3 caracteres, máx 160).
   - `ExamType`: Categoria especializada:
     - `mamografia`: Mamografia Digital / Convencional
     - `usg_transvaginal`: Ultrassonografia Transvaginal
     - `usg_pelvica`: Ultrassonografia Pélvica Ginecológica
     - `usg_mamas`: Ultrassonografia de Mamas
     - `citopatologico`: Preventivo / Citopatológico do Colo do Útero (Papanicolau)
     - `colposcopia`: Colposcopia / Vulvoscopia
     - `laboratorial`: Exames Laboratoriais / Hormonais
     - `anatomopatologico`: Anatomopatológico / Biópsia
     - `densitometria`: Densitometria Óssea
     - `outros`: Outros Exames Complementares
   - `ExamDate`: Data de realização do exame (não pode ser futura).
5. **Garantia de Integridade Probatória (Lei 13.787/2018):**
   - No upload, o backend calcula o Hash SHA-256 do arquivo original e o persiste na coluna imutável `FileHash`.
6. **Metadados opcionais:**
   - `LabFacility`: Nome do laboratório/clínica externa executora.
   - `Notes`: Resumo das conclusões ou achados clínicos relevantes.
7. **Inativação:** Permite exclusão lógica (`IsActive = false`), mantendo preservação probatória para conformidade regulatória.

### RN-004: Armazenamento e Streaming Seguro de Arquivos
1. Os arquivos nunca são salvos no `wwwroot` nem expostos publicamente.
2. São gravados via serviço de infraestrutura `IFileStorage` em caminho isolado por clínica: `storage/{clinicId}/patients/{patientId}/exams/{attachmentId}.ext`.
3. O download e visualização ocorrem exclusivamente via endpoint seguro com validação de permissão `records:read` e `ClinicId` do ator corrente.
4. Cada download gera registro em `AuditEvent` com `AuditActions.PatientExamAttachmentViewed` / `Downloaded`.

### RN-005: Iniciar Atendimento Médico Integrado e Idempotente
1. **Idempotência (1:1 Agendamento-Prontuário):** Ao iniciar uma consulta por agendamento (`StartOrGetRecordAsync`), o backend verifica se já existe um `MedicalRecord` não-cancelado para o agendamento informado. Se existir, retorna o registro ativo existente sem duplicar registros ou criar prontuários órfãos.
2. **Pela Agenda (`DoctorAgendaPage`):** Para agendamentos do dia da clínica, o médico dispõe do botão `▶ Iniciar Atendimento`. A ação garante a existência da entrada na fila (ou a transiciona para `in_service`), inicia ou recupera o prontuário eletrônico (`StartOrGetRecordAsync`) e direciona ao workspace do consultório.
3. **Pelo Consultório (`DoctorWorkspace`):** Para qualquer paciente na lista de espera, o médico pode tanto chamar (`Chamar`) quanto iniciar diretamente (`▶ Iniciar`).

### RN-006: Emissão de Documentos e Sigilo Ético do CID (Art. 73 do CEM)
1. Suporte a Receita Simples, Receita de Controle Especial, Atestado Médico e Solicitação de Exames Complementares.
2. Resolução automática do médico emissor a partir do ator logado.
3. **Sigilo Ético:** O checkbox "Imprimir CID no documento (Requer consentimento expresso da paciente)" controla estritamente a emissão. Se o consentimento não for confirmado, o CID não é transposto para o documento assinado final nem impresso.
4. Tratamento explícito de erros com mensagens inteligíveis ao usuário.
5. Geração de código validador público e hash ICP-Brasil.
6. Suporte a download de PDF e visualização de impressão formatada limpa (sem elementos de navegação ou botões de tela).

### RN-007: Dashboard Médico Integrado e Distinção de Consultas
1. Exibe indicadores consolidados da data:
   - Total de consultas agendadas para o médico no dia.
   - Pacientes aguardando atendimento.
   - Paciente atualmente em atendimento no consultório (se houver).
   - Consultas finalizadas no dia.
   - Prontuários em rascunho abertos pendentes de finalização.
2. Exibe tabela de próximos atendimentos do dia com status, horário, distinção explícita entre **Primeira Consulta** e **Retorno**, e botão de ação clínica.
3. Exibe atalhos rápidos de navegação clínica.

### RN-008: Sidebar Médica Moderna, Responsiva e Acessível
1. Substitui o cabeçalho superior tradicional por uma sidebar lateral fixa e colapsável.
2. Ícones padronizados com `lucide-react` (`strokeWidth={2}`, `size={18}`).
3. Tooltips no estado colapsado para prevenir sobrecarga cognitiva.
4. No mobile, gaveta deslizante (drawer) com backdrop escurecido.
5. Rodapé da sidebar com informações do profissional logado e botão de logout.

---

## 4. Arquitetura Técnica e Modelo de Dados

### 4.1. Backend (.NET 10 / C#)
- **Entidade de Domínio:** `Canamed.Domain.MedicalRecords.PatientExamAttachment`
  - Propriedades: `Id`, `ClinicId`, `PatientId`, `MedicalRecordId`, `Title`, `ExamType`, `ExamDate`, `LabFacility`, `Notes`, `FileName`, `ContentType`, `FileSizeBytes`, `FileHash`, `StoragePath`, `UploadedByUserId`, `UploadedByName`, `IsActive`.
- **Contratos:** `Canamed.Application.MedicalRecords.ExamAttachmentContracts.cs`
- **Serviço de Armazenamento:** `Canamed.Application.Abstractions.IFileStorage` e `Canamed.Infrastructure.Storage.LocalFileStorage`
- **Serviço de Aplicação:** `Canamed.Application.MedicalRecords.PatientExamAttachmentService`
- **Endpoints:**
  - `POST /api/v1/patients/{patientId}/exam-attachments` (upload multipart com cálculo de SHA-256)
  - `GET /api/v1/patients/{patientId}/exam-attachments` (listagem)
  - `GET /api/v1/patients/{patientId}/exam-attachments/{id}/download` (download autenticado)
  - `DELETE /api/v1/patients/{patientId}/exam-attachments/{id}` (inativação lógica)
  - `GET /api/v1/doctor/dashboard/summary` (métricas em tempo real)
  - `POST /api/v1/doctor/workspace/start-by-appointment/{appointmentId}` (início direto por agendamento com idempotência)

### 4.2. Frontend (React 19 / TypeScript / Vite)
- **Componentes:**
  - `DoctorSidebar.tsx`: Sidebar médica moderna colapsável com ícones `lucide-react` e tooltips.
  - `DoctorDashboardPage.tsx`: Dashboard com métricas em tempo real, hero status card e lista de próximos pacientes (Primeira Consulta vs Retorno).
  - `PatientExamAttachmentsSection.tsx`: Componente de upload com drag & drop ativo (borda tracejada teal), badges coloridos por tipo de exame e download.
  - `DocumentModal.tsx`: Modal refinado com controle de CID (Art. 73 CEM), layout limpo de impressão e download de PDF.
  - `DoctorAgendaPage.tsx`: Botão `▶ Iniciar Atendimento` para atendimentos do dia.
  - `DoctorWorkspace.tsx`: Botão `▶ Iniciar` para pacientes aguardando e seção de exames anexados integrada.

---

## 5. Critérios de Aceitação

1. **Permissões:** O usuário `gestor@canamed.local` consegue salvar a Ficha Gineco, emitir documentos e iniciar consultas sem erro 403.
2. **Anexos:** É possível anexar um arquivo PDF ou imagem informando data, tipo ginecológico, título e laboratório. O anexo gera hash SHA-256, aparece na lista do prontuário e pode ser baixado.
3. **Iniciar Consulta:** Clicar em "Iniciar Atendimento" na agenda ou no consultório abre a consulta de forma idempotente e carrega o prontuário ativo correspondente.
4. **Documentos:** O `DocumentModal` emite e assina receitas, atestados e pedidos com respeito ao sigilo do CID, exibindo o token de validação e opções de impressão/PDF.
5. **Dashboard:** O Dashboard exibe os contadores corretos do dia e atalhos funcionais, distinguindo Primeira Consulta e Retorno.
6. **Sidebar:** A navegação médica funciona com a nova sidebar colapsável, responsiva e alinhada ao design system.
7. **Testes:** Suíte de testes unitários de backend e testes de componentes frontend passam com 100% de sucesso.
