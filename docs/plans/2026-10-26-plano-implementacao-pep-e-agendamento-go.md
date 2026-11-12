</Agente Planejador (Cana Med)>
<Consolidação do PEP Ginecológico & Obstétrico e Experiência de Agendamento do Paciente - Plano de Implementação>
> **SPEC de Referência:** [SPEC-0035 — Consolidação do PEP Ginecológico & Obstétrico e Experiência de Agendamento do Paciente](../../specs/0035-spec-consolidacao-pep-ginecologico-e-agendamento-paciente.md)
> **Para Agentes Executores:** Executar este plano via `subagent-driven-development` ou `executing-plans`. Cada tarefa utiliza sintaxe de checklist (`- [ ]`).

---

## Visão Geral do Plano

Este plano decompõe a implementação integral da **SPEC-0035**, resolvendo todos os apontamentos de segurança (P0), risco clínico (P0), conformidade médico-legal (Lei 13.787, CFM 1.821, Portaria 344/98 e CFM 1.958), identidade visual oficial (#852A91 teal, #6F217B petróleo e #B77AD8 menta) e completude funcional do PEP e Agendamento em 5 Fases estruturadas e 17 Tarefas atômicas orientadas a TDD (Red-Green-Refactor).

---

## Estrutura de Fases

- **Fase 1: Bloco 1 — Segurança, Conformidade Legal e Risco Clínico (P0)** (Tasks 1 a 6)
- **Fase 2: Bloco 2 — Identidade Visual Canônica e Ergonomia UI/UX** (Tasks 7 a 9)
- **Fase 3: Bloco 3 — Completude Clínica de Ginecologia e Obstetrícia no PEP (P1)** (Tasks 10 a 13)
- **Fase 4: Bloco 4 — Experiência de Agendamento GO e Diferenciais P2** (Tasks 14 a 16)
- **Fase 5: Validação Integrada, Build e Auditoria Geral** (Task 17)

---

## Fase 1: Bloco 1 — Segurança, Conformidade Legal e Risco Clínico (P0)

### Task 1: Blindagem contra Enumeração de Pacientes no Totem/Kiosk (Backend)
- **Objetivo:** Impedir enumeração anônima de pacientes e horários no endpoint do Totem, exigindo CPF exato (11 dígitos) OU documento (6 dígitos) + Data de Nascimento, com rate-limiting e mascaramento estrito de dados.
- **Arquivos afetados:**
  - `backend/src/Canamed.Api/Endpoints/KioskEndpoints.cs`
  - `backend/src/Canamed.Application/Kiosk/KioskCheckInService.cs`
  - `backend/tests/Canamed.UnitTests/Kiosk/KioskCheckInServiceTests.cs`
- **Regras da SPEC cobertas:** RN-001, CA-001, ER-001, ER-002.
- **Passos TDD:**
  - [ ] 1. **RED:** Criar testes unitários em `KioskCheckInServiceTests.cs` cobrindo:
    - Rejeição de busca vazia ou com termo genérico (ex: "Maria" ou "123") retornando lista vazia ou erro 400.
    - Busca válida por CPF exato de 11 dígitos retornando apenas nome mascarado (ex: "M**** S****") e horários sem dados sensíveis.
    - Busca válida por 6 primeiros dígitos do CPF + Data de Nascimento retornando o agendamento correto.
  - [ ] 2. **RED:** Executar `dotnet test backend/tests/Canamed.UnitTests/Canamed.UnitTests.csproj --filter "FullyQualifiedName~KioskCheckInServiceTests"` e confirmar a falha esperada.
  - [ ] 3. **GREEN:** Alterar `KioskCheckInService.cs` e `KioskEndpoints.cs`:
    - Atualizar a assinatura de busca para aceitar `cpf` e/ou `cpfPartial` + `birthDate`.
    - Substituir a consulta aberta por correspondência estrita de 11 dígitos ou 6 dígitos + Data de Nascimento.
    - Mascarar o nome do paciente no resultado (`MaskPatientName(string name)`).
    - Adicionar verificação de rate-limiting simples no endpoint (ou filtro de requisições por IP).
  - [ ] 4. **GREEN:** Reexecutar os testes unitários e confirmar que todos passaram.
  - [ ] 5. **REFACTOR:** Limpar código, documentar métodos XML e garantir auditoria de tentativas de busca inválidas.
- **Comando de verificação:**
  `dotnet test backend/tests/Canamed.UnitTests/Canamed.UnitTests.csproj --filter "FullyQualifiedName~KioskCheckInServiceTests"`
- **Critério de conclusão:** 100% dos testes de busca no Kiosk aprovados, busca genérica bloqueada e nenhum dado sensível exposto sem autenticação/confirmação.

---

### Task 2: Correção do Alerta de Gestante Rh Negativo (Backend & Frontend)
- **Objetivo:** Expor `patientBloodType` e `patientRhFactor` no contrato da consulta ativa do workspace médico e conectar diretamente ao `ClinicalAlertsBar`, eliminando a falha silenciosa de alerta de aloimunização Rh materno-fetal.
- **Arquivos afetados:**
  - `backend/src/Canamed.Application/DoctorWorkspace/DoctorWorkspaceContracts.cs`
  - `backend/src/Canamed.Application/DoctorWorkspace/DoctorWorkspaceService.cs`
  - `backend/tests/Canamed.UnitTests/MedicalRecords/DoctorWorkspaceTests.cs`
  - `frontend/src/features/medical/doctorWorkspaceApi.ts`
  - `frontend/src/features/medical/DoctorWorkspace.tsx`
  - `frontend/src/features/medical/ClinicalAlertsBar.test.tsx`
- **Regras da SPEC cobertas:** RN-002, CA-002.
- **Passos TDD:**
  - [ ] 1. **RED:** Adicionar teste no backend em `DoctorWorkspaceTests.cs` validando que `ActiveConsultationDto` inclui `PatientBloodType` e `PatientRhFactor` provenientes da entidade `Patient`.
  - [ ] 2. **RED:** Adicionar teste no frontend em `ClinicalAlertsBar.test.tsx` validando renderização de alerta com props passadas a partir de `activeConsultation`.
  - [ ] 3. **GREEN:** No backend, adicionar as propriedades `string? PatientBloodType` e `string? PatientRhFactor` ao `ActiveConsultationDto` em `DoctorWorkspaceContracts.cs` e mapear em `DoctorWorkspaceService.cs`.
  - [ ] 4. **GREEN:** No frontend, atualizar os tipos em `doctorWorkspaceApi.ts` e modificar a chamada do `ClinicalAlertsBar` em `DoctorWorkspace.tsx` para:
    ```tsx
    rhFactor={active.patientRhFactor}
    bloodType={active.patientBloodType}
    ```
  - [ ] 5. **REFACTOR:** Remover o cast inseguro legado `(gynProfile as unknown as { rhFactor?: string })`. Rodar testes de backend e frontend.
- **Comandos de verificação:**
  - Backend: `dotnet test backend/tests/Canamed.UnitTests/Canamed.UnitTests.csproj --filter "FullyQualifiedName~DoctorWorkspaceTests"`
  - Frontend: `npm --prefix frontend test -- features/medical/ClinicalAlertsBar.test.tsx --run`
- **Critério de conclusão:** Alerta de Gestante Rh Negativo é disparado imediatamente quando a paciente ativa tem Rh Negativo cadastrado, com zero alertas falsos-negativos.

---

### Task 3: Exame Físico Ginecológico Tri-State (Backend & Frontend)
- **Objetivo:** Substituir o modelo booleano binário com default `true` ("Normal") por Tri-State (`NotEvaluated` [default], `Normal`, `Abnormal`) nos 5 segmentos anatômicos (Mamas, Abdome, Genitália Externa, Especular, Toque Bimanual), tornando obrigatório o detalhamento se marcado "Alterado".
- **Arquivos afetados:**
  - `backend/src/Canamed.Domain/MedicalRecords/GynecologicalConsultationData.cs`
  - `backend/src/Canamed.Application/MedicalRecords/GynecologicalContracts.cs`
  - `backend/src/Canamed.Infrastructure/Persistence/Configurations/GynecologicalConsultationDataConfiguration.cs`
  - `backend/tests/Canamed.UnitTests/MedicalRecords/GynecologicalConsultationDataTests.cs`
  - `frontend/src/features/medical/GynecologicalExamSection.tsx`
  - `frontend/src/features/medical/GynecologicalExamSection.test.tsx`
- **Regras da SPEC cobertas:** RN-003, CA-003, ER-003.
- **Passos TDD:**
  - [ ] 1. **RED:** Criar teste em `GynecologicalConsultationDataTests.cs` verificando que a criação de nova instância inicia com segmentos nulos/`NotEvaluated`, e que atualizar para `Abnormal` sem achados lança exceção ou erro de validação.
  - [ ] 2. **RED:** Criar teste em `GynecologicalExamSection.test.tsx` verificando renderização dos 3 botões por segmento (`Não Avaliado`, `Normal`, `Alterado`) e abertura da textarea quando "Alterado".
  - [ ] 3. **GREEN:** Em `GynecologicalConsultationData.cs`, atualizar as propriedades para `string? BreastsStatus` (ou nullable tri-state), ajustar o método `Create` para não definir `true`, e atualizar `Update(...)`.
  - [ ] 4. **GREEN:** Em `GynecologicalContracts.cs`, expor os novos campos nos DTOs de Request e Response.
  - [ ] 5. **GREEN:** Em `GynecologicalExamSection.tsx`, implementar o componente com visual segment control oficial (#6F217B / #852A91) e textarea de preenchimento obrigatório para achados alterados.
  - [ ] 6. **REFACTOR:** Assegurar que consultas legadas sem valor explícito sejam exibidas com segurança e que a experiência seja fluida.
- **Comandos de verificação:**
  - Backend: `dotnet test backend/tests/Canamed.UnitTests/Canamed.UnitTests.csproj --filter "FullyQualifiedName~GynecologicalConsultationDataTests"`
  - Frontend: `npm --prefix frontend test -- features/medical/GynecologicalExamSection.test.tsx --run`
- **Critério de conclusão:** Criação de consulta sem falso-positivo de normalidade; segmentos exibem status Tri-State claro; testes aprovados.

---

### Task 4: Extensão da Imutabilidade Clínica no EF Core Interceptor (Backend)
- **Objetivo:** Proteger entidades gineco-obstétricas essenciais contra `DELETE` físico (`PrenatalVisitRecord`, `PreventiveScreeningRecord`, `LarcPlacementRecord` e `PatientExamAttachment`) no `ImmutableRecordsInterceptor.cs`.
- **Arquivos afetados:**
  - `backend/src/Canamed.Infrastructure/Persistence/Interceptors/ImmutableRecordsInterceptor.cs`
  - `backend/tests/Canamed.UnitTests/Persistence/ImmutableRecordsInterceptorTests.cs`
- **Regras da SPEC cobertas:** RN-004, CA-004, ER-004.
- **Passos TDD:**
  - [ ] 1. **RED:** Criar testes em `ImmutableRecordsInterceptorTests.cs` que tentam deletar instâncias das 4 entidades protegidas, esperando `InvalidOperationException` com a mensagem canônica da Lei 13.787/2018.
  - [ ] 2. **GREEN:** Atualizar o método `IsImmutableEntity(object entity)` em `ImmutableRecordsInterceptor.cs` para adicionar:
    ```csharp
    or PrenatalVisitRecord
    or PreventiveScreeningRecord
    or LarcPlacementRecord
    or PatientExamAttachment
    ```
  - [ ] 3. **GREEN:** Rodar a suíte de testes de persistência e confirmar que todas as tentativas de exclusão física são interceptadas com sucesso.
  - [ ] 4. **REFACTOR:** Garantir comentários XML e conformidade estrita com o padrão de interceptação.
- **Comando de verificação:**
  `dotnet test backend/tests/Canamed.UnitTests/Canamed.UnitTests.csproj --filter "FullyQualifiedName~ImmutableRecordsInterceptorTests"`
- **Critério de conclusão:** Nenhuma entidade de pré-natal, rastreamento preventivo, DIU ou anexo pode ser excluída fisicamente do banco de dados.

---

### Task 5: Segregação de Pré-Anamnese Confidencial e Privilégio Mínimo no Papel Admin (Backend & Frontend)
- **Objetivo:** Proteger a queixa clínica prévia da paciente com criptografia em repouso e acesso exclusivo a profissionais assistenciais (`RecordsRead`), ocultando da recepção (`AgendaRead`), e restringir o papel `Admin` puro ao escopo técnico/operacional.
- **Arquivos afetados:**
  - `backend/src/Canamed.Domain/Agenda/Appointment.cs`
  - `backend/src/Canamed.Application/Agenda/AgendaContracts.cs`
  - `backend/src/Canamed.Application/Identity/Roles.cs`
  - `backend/tests/Canamed.UnitTests/Identity/RolesTests.cs`
  - `backend/tests/Canamed.UnitTests/Agenda/AppointmentTests.cs`
  - `frontend/src/features/agenda/AppointmentForm.tsx`
  - `frontend/src/features/agenda/AgendaRecepcaoPanel.tsx`
- **Regras da SPEC cobertas:** RN-005, RN-006, CA-006.
- **Passos TDD:**
  - [ ] 1. **RED:** Criar teste em `RolesTests.cs` confirmando que `Roles.PermissionsFor("admin")` não contém `Permissions.RecordsRead` ou `Permissions.DocumentsSign`.
  - [ ] 2. **RED:** Criar teste em `AppointmentTests.cs` verificando a persistência do campo `ClinicalPreAnamnesis` e seu mascaramento para perfis sem permissão médica.
  - [ ] 3. **GREEN:** Atualizar `Roles.cs` para segregar permissões clínicas exclusivas do papel `Professional`.
  - [ ] 4. **GREEN:** Atualizar `Appointment.cs` e DTOs de agendamento no backend para isolar `ClinicalPreAnamnesis`.
  - [ ] 5. **GREEN:** Em `AppointmentForm.tsx` e `AgendaRecepcaoPanel.tsx`, exibir apenas observações operacionais para a recepção.
  - [ ] 6. **REFACTOR:** Validar que o fluxo de agendamento na recepção continua funcionando sem interrupção.
- **Comandos de verificação:**
  - Backend: `dotnet test backend/tests/Canamed.UnitTests/Canamed.UnitTests.csproj --filter "FullyQualifiedName~RolesTests"`
  - Frontend: `npm --prefix frontend test -- features/agenda/AgendaRecepcaoPanel.test.tsx --run`
- **Critério de conclusão:** Dados íntimos segregados da recepção; privilégio mínimo do Admin consolidado; testes aprovados.

---

### Task 6: Receita de Controle Especial em Duas Vias e Pré-Carregamento no Consultório (Frontend)
- **Objetivo:** Adequar a emissão de `receita_controle_especial` às exigências da Portaria SVS/MS 344/98 e RDC 44/2009 (2 vias: Farmácia + Paciente com quadros de emitente, comprador e fornecedor) e pré-carregar automaticamente os medicamentos prescritos na consulta.
- **Arquivos afetados:**
  - `frontend/src/features/medical/DocumentModal.tsx`
  - `frontend/src/features/medical/DoctorWorkspace.tsx`
  - `frontend/src/features/medical/DocumentModal.test.tsx`
- **Regras da SPEC cobertas:** RN-007, CA-005.
- **Passos TDD:**
  - [ ] 1. **RED:** Criar teste em `DocumentModal.test.tsx` verificando que ao selecionar `receita_controle_especial` a visualização/impressão renderiza `1ª VIA — RETENÇÃO DA FARMÁCIA` e `2ª VIA — ORIENTAÇÃO DA PACIENTE`, com os blocos regulatórios de comprador e fornecedor.
  - [ ] 2. **RED:** Criar teste validando que `initialMedications` passados via prop são pré-preenchidos nos inputs.
  - [ ] 3. **GREEN:** Atualizar `DocumentModal.tsx` com o layout de 2 vias regulamentar, quebra de página `@media print { .page-break { page-break-after: always; } }` e campos de identificação do comprador/fornecedor.
  - [ ] 4. **GREEN:** Atualizar `DoctorWorkspace.tsx` para passar os medicamentos prescritos na seção de prescrições diretamente para o `DocumentModal` ao clicar em emitir receita.
  - [ ] 5. **REFACTOR:** Validar layout visual limpo e tipografia oficial.
- **Comando de verificação:**
  `npm --prefix frontend test -- features/medical/DocumentModal.test.tsx --run`
- **Critério de conclusão:** Receita de controle especial 100% aderente à Portaria 344/98 em 2 vias completas e sem redigitação de prescrições pelo médico.

---

## Fase 2: Bloco 2 — Identidade Visual Canônica e Ergonomia UI/UX

### Task 7: Saneamento Integral dos Tokens Visuais e Erradicação do Roxo/Magenta (Frontend)
- **Objetivo:** Remover permanentemente qualquer resquício de roxo, magenta ou lilás em `theme.css`, `AgendaRecepcaoPanel.tsx` e componentes auxiliares, padronizando rigorosamente na paleta oficial (#852A91 Teal, #6F217B Petróleo e #B77AD8 Menta).
- **Arquivos afetados:**
  - `frontend/src/styles/theme.css`
  - `frontend/src/features/agenda/AgendaRecepcaoPanel.tsx`
  - `frontend/src/features/layout/Sidebar.tsx`
- **Regras da SPEC cobertas:** RN-008.
- **Passos TDD / Verificação Estética:**
  - [x] 1. **RED / Auditoria:** Executar busca regex em `frontend/src/` procurando por `#852A91`, `#6F217B`, `#D83C91`, `#B77AD8`, `#F7ECF8` e registrar todos os arquivos com ocorrências.
  - [x] 2. **GREEN:** Substituir tokens e classes em `theme.css`:
    - `--brand-primary`: de `#852A91` para `#852A91` (Teal)
    - `--brand-hover`: de `#6F217B` para `#6F217B`
    - `--brand-magenta` / `--brand-dark`: de `#D83C91` para `#6F217B` (Azul Petróleo)
    - `--brand-lilac` / `--brand-accent`: para `#B77AD8` (Verde Menta)
    - `--brand-soft`: de `#f7ecf8` para `#F7ECF8`
  - [x] 3. **GREEN:** Atualizar estilos inline e classes em `AgendaRecepcaoPanel.tsx` e `Sidebar.tsx`.
  - [x] 4. **REFACTOR:** Reexecutar busca regex e confirmar zero ocorrências de cores legadas roxas/magentas.
- **Comandos de verificação:**
  - Regex check: `npm --prefix frontend test -- features/agenda/AgendaRecepcaoPanel.test.tsx --run`
  - Build check: `npm --prefix frontend run build`
- **Critério de conclusão:** Zero referências a cores roxas/magentas no frontend; interface 100% alinhada à identidade institucional oficial do Cana Med Mulher.

---

### Task 8: Cockpit do Consultório: Dock Sticky, Persistência na URL e Sincronização Não Destrutiva (Frontend)
- **Objetivo:** Adicionar dock sticky superior com atalhos de navegação rápida e badges de preenchimento (`✓` / `○`), sincronização na URL query (`?appointmentId=...`) com restauração em F5, sincronização não destrutiva entre Queixa/HMA e SOAP `[S]`, e sticky footer com status do autosave.
- **Arquivos afetados:**
  - `frontend/src/features/medical/DoctorWorkspace.tsx`
  - `frontend/src/features/medical/DoctorWorkspace.test.tsx`
- **Regras da SPEC cobertas:** RN-009, RN-010.
- **Passos TDD:**
  - [x] 1. **RED:** Criar testes em `DoctorWorkspace.test.tsx` para:
    - Renderização do dock de navegação rápida com 5 âncoras/seções.
    - Preservação e leitura de `appointmentId` via URL search params.
    - Inserção de atalhos de queixa sem sobrescrever anotações prévias digitadas no campo SOAP `[S]`.
  - [x] 2. **GREEN:** Implementar o Dock de Navegação com sticky positioning no topo do workspace, exibindo ícones e badges dinâmicos de status de preenchimento.
  - [x] 3. **GREEN:** Conectar `useSearchParams` do React Router para manter `?appointmentId=` na barra de endereços e recarregar a consulta correspondente se a página for atualizada.
  - [x] 4. **GREEN:** Refatorar a função de sincronização QP/HMA ➔ SOAP `[S]` para usar concatenação contextual ou reconciliação com separador delimitado, impedindo perda de anotações livres.
  - [x] 5. **GREEN:** Implementar sticky footer inferior consolidando status de autosave ("Gravado às 14:32", "Salvando...") e botões de ação clínica.
  - [x] 6. **REFACTOR:** Otimizar transições visuais e responsividade em telas de alta densidade (1080p e tablets).
- **Comando de verificação:**
  `npm --prefix frontend test -- features/medical/DoctorWorkspace.test.tsx --run`
- **Critério de conclusão:** Navegação rápida fluida entre seções; zero perda de dados em refresh do navegador; mesclagem inteligente de anamnese com SOAP.

---

### Task 9: Propagação do Modo Privacidade (`🕶️`) para Consultório e Ficha Longitudinal (Frontend)
- **Objetivo:** Fornecer botão de Modo Privacidade com efeito de blur imediato sobre campos íntimos tanto no `DoctorWorkspace.tsx` quanto na `DoctorMedicalRecordsPage.tsx`, permitindo orientação visual da paciente sem violação de sigilo.
- **Arquivos afetados:**
  - `frontend/src/features/medical/DoctorWorkspace.tsx`
  - `frontend/src/features/medical/DoctorMedicalRecordsPage.tsx`
  - `frontend/src/features/medical/DoctorMedicalRecordsPage.test.tsx`
- **Regras da SPEC cobertas:** RN-005, RN-008.
- **Passos TDD:**
  - [x] 1. **RED:** Criar teste em `DoctorMedicalRecordsPage.test.tsx` verificando existência do botão "Modo Privacidade" e adição da classe `.privacy-blur` aos blocos de histórico sensível.
  - [x] 2. **GREEN:** Integrar estado `isPrivacyMode` e botão toggle com ícone de óculos escuros / olho barrado nos cabeçalhos de ambas as telas.
  - [x] 3. **GREEN:** Adicionar classes utilitárias no CSS (`filter: blur(8px); transition: filter 0.2s ease;`) aplicadas aos campos de queixa íntima, exame físico, histórico sexual e diagnósticos prévios.
  - [x] 4. **REFACTOR:** Permitir revelação pontual ao focar ou clicar no elemento com confirmação visual.
- **Comando de verificação:**
  `npm --prefix frontend test -- features/medical/DoctorMedicalRecordsPage.test.tsx --run`
- **Critério de conclusão:** Modo privacidade ativo e alternável em 1 clique em todas as superfícies de prontuário do médico.

---

## Fase 3: Bloco 3 — Completude Clínica de Ginecologia e Obstetrícia no PEP (P1)

### Task 10: Segregação Diagnóstica SOAP [A] (Hipóteses vs. Confirmados) e Exposição de 1º Ultrassom (Backend & Frontend)
- **Objetivo:** Segregar no SOAP `[A]` hipóteses diagnósticas preliminares de diagnósticos médicos confirmados com código CID-10, persistindo em `DiagnosesJson`, e expor os campos do 1º Ultrassom Precoce nos DTOs de `GynecologicalContracts.cs`.
- **Arquivos afetados:**
  - `backend/src/Canamed.Domain/MedicalRecords/GynecologicalConsultationData.cs`
  - `backend/src/Canamed.Application/MedicalRecords/GynecologicalContracts.cs`
  - `backend/src/Canamed.Application/MedicalRecords/Services/GynecologicalConsultationService.cs`
  - `frontend/src/features/medical/SoapEvolutionSection.tsx`
  - `frontend/src/features/medical/SoapEvolutionSection.test.tsx`
- **Regras da SPEC cobertas:** RN-011, RN-012.
- **Passos TDD:**
  - [ ] 1. **RED:** Teste backend garantindo persistência e recuperação dos campos de 1º USG (`FirstUltrasoundDate`, `FirstUltrasoundWeeks`, `FirstUltrasoundDays`, `FirstUltrasoundCcnMm`, `PreferredGestationalReference`) e diagnósticos categorizados.
  - [ ] 2. **RED:** Teste frontend em `SoapEvolutionSection.test.tsx` validando distinção visual entre tags de "Hipótese Preliminar" (badge âmbar) e "Diagnóstico Confirmado" (badge verde).
  - [ ] 3. **GREEN:** Atualizar DTOs `UpdateGynecologicalConsultationDataRequest` e `GynecologicalConsultationDataResponse` com os campos de 1º USG.
  - [ ] 4. **GREEN:** Em `SoapEvolutionSection.tsx`, criar seletor de tipo de diagnóstico (Hipótese vs. Confirmado) com busca de código CID-10 e persistência estruturada no JSON.
  - [ ] 5. **REFACTOR:** Validar que documentos públicos (atestados/declarações) filtrem automaticamente hipóteses diagnósticas não confirmadas.
- **Comandos de verificação:**
  - Backend: `dotnet test backend/tests/Canamed.UnitTests/Canamed.UnitTests.csproj --filter "FullyQualifiedName~GynecologicalConsultationDataTests"`
  - Frontend: `npm --prefix frontend test -- features/medical/SoapEvolutionSection.test.tsx --run`
- **Critério de conclusão:** Diagnósticos perfeitamente tipados e categorizados; dados de ultrassom precoce expostos de ponta a ponta.

---

### Task 11: Persistência Estruturada do Mapa Cervical 12h e Autoexpansão Especular (Backend & Frontend)
- **Objetivo:** Adicionar suporte estruturado para persistência de achados do relógio cervical 12h e Zona de Transformação (ZT 1/2/3) em `GynecologicalConsultationData.cs`, com autoexpansão do `CervicalClockMap.tsx` ao marcar o exame especular como `Alterado`.
- **Arquivos afetados:**
  - `backend/src/Canamed.Domain/MedicalRecords/GynecologicalConsultationData.cs`
  - `backend/src/Canamed.Application/MedicalRecords/GynecologicalContracts.cs`
  - `frontend/src/features/medical/CervicalClockMap.tsx`
  - `frontend/src/features/medical/GynecologicalExamSection.tsx`
  - `frontend/src/features/medical/CervicalClockMap.test.tsx`
- **Regras da SPEC cobertas:** RN-003, RN-011.
- **Passos TDD:**
  - [ ] 1. **RED:** Teste backend para gravação e leitura do campo `CervicalClockFindingsJson`.
  - [ ] 2. **RED:** Teste frontend em `CervicalClockMap.test.tsx` verificando seleção de horas do relógio cervical (1h a 12h), tipo de achado (acetobranco, mosaico, Schiller) e emissão de evento de alteração.
  - [ ] 3. **GREEN:** Adicionar `CervicalClockFindingsJson` em `GynecologicalConsultationData.cs` e mapear nos DTOs de `GynecologicalContracts.cs`.
  - [ ] 4. **GREEN:** Em `GynecologicalExamSection.tsx`, conectar o evento de mudança de `speculumExamStatus`: ao transicionar para `Abnormal`, auto-expandir a seção do Mapa Cervical com animação suave e foco acessível.
  - [ ] 5. **REFACTOR:** Garantir responsividade do mostrador circular e suporte a seleção por toque em dispositivos touch.
- **Comando de verificação:**
  `npm --prefix frontend test -- features/medical/CervicalClockMap.test.tsx --run`
- **Critério de conclusão:** Mapa cervical interativo persistindo dados estruturados de colposcopia no prontuário.

---

### Task 12: Ativação End-to-End do Módulo de Dispositivos LARC/DIU (Backend & Frontend)
- **Objetivo:** Conectar a entidade `LarcPlacementRecord` e o `LarcDeviceCalculator` a endpoints REST dedicados (`GET/POST /api/v1/patients/{patientId}/larc-records`, `PUT /api/v1/patients/{patientId}/larc-records/{id}/remove`) e integrar em `GynecologicalProceduresSection.tsx` com histerometria, cálculo de validade e controle pós-inserção.
- **Arquivos afetados:**
  - `backend/src/Canamed.Api/Endpoints/LarcEndpoints.cs`
  - `backend/src/Canamed.Application/MedicalRecords/LarcContracts.cs`
  - `backend/src/Canamed.Application/MedicalRecords/Services/LarcService.cs`
  - `backend/tests/Canamed.UnitTests/MedicalRecords/LarcPlacementRecordTests.cs`
  - `frontend/src/features/medical/GynecologicalProceduresSection.tsx`
  - `frontend/src/features/medical/GynecologicalProceduresSection.test.tsx`
- **Regras da SPEC cobertas:** RN-013.
- **Passos TDD:**
  - [ ] 1. **RED:** Criar testes de serviço/API em `LarcPlacementRecordTests.cs` validando criação com cálculo de expiração correto por tipo de dispositivo (Cobre: 10a, Cobre+Prata: 5a, Mirena: 8a, Kyleena: 5a, Implanon: 3a) e data de USG de controle em 30 a 45 dias.
  - [ ] 2. **RED:** Criar teste em `GynecologicalProceduresSection.test.tsx` validando formulário de inserção com campos de tipo, lote, histerometria e intercorrências.
  - [ ] 3. **GREEN:** Implementar `LarcEndpoints.cs` e `LarcService.cs` no backend, registrando na pipeline da API.
  - [ ] 4. **GREEN:** Integrar em `GynecologicalProceduresSection.tsx` a chamada à API de LARC com feedback visual de sucesso e indicação da data limite de uso.
  - [ ] 5. **REFACTOR:** Adicionar aviso preventivo na ficha longitudinal se o LARC da paciente estiver a menos de 6 meses do vencimento.
- **Comandos de verificação:**
  - Backend: `dotnet test backend/tests/Canamed.UnitTests/Canamed.UnitTests.csproj --filter "FullyQualifiedName~LarcPlacementRecordTests"`
  - Frontend: `npm --prefix frontend test -- features/medical/GynecologicalProceduresSection.test.tsx --run`
- **Critério de conclusão:** Registro completo de LARC com rastreabilidade de lote, histerometria e cálculo automático de validade e retorno.

---

### Task 13: Integração Nativa de Pré-Natal e Rastreamento Preventivo no Workspace + Atualização do PDF (Backend & Frontend)
- **Objetivo:** Embarcar as seções `PrenatalCardSection` e `PreventiveScreeningList` nativamente dentro do fluxo do `DoctorWorkspace.tsx`, com preenchimento automático da IG atual calculada, e atualizar o `PrenatalCardPdfGenerator.cs` com suporte a múltiplas folhas e coluna `FetalPresentation`.
- **Arquivos afetados:**
  - `backend/src/Canamed.Application/MedicalRecords/Services/PrenatalCardPdfGenerator.cs`
  - `backend/tests/Canamed.UnitTests/MedicalRecords/PrenatalCardPdfGeneratorTests.cs`
  - `frontend/src/features/medical/DoctorWorkspace.tsx`
  - `frontend/src/features/medical/PrenatalCardSection.tsx`
  - `frontend/src/features/medical/PreventiveScreeningList.tsx`
- **Regras da SPEC cobertas:** RN-002, RN-012.
- **Passos TDD:**
  - [ ] 1. **RED:** Criar teste em `PrenatalCardPdfGeneratorTests.cs` validando geração de PDF para cartão de pré-natal com mais de 10 consultas, confirmando paginação correta e presença do cabeçalho de Apresentação Fetal (`FetalPresentation`).
  - [ ] 2. **GREEN:** Atualizar `PrenatalCardPdfGenerator.cs` com a coluna `Apres. Fetal` e quebra de tabela limpa entre páginas.
  - [ ] 3. **GREEN:** No frontend, adicionar no `DoctorWorkspace.tsx` o card integrado de Acompanhamento Obstétrico / Pré-Natal e Histórico de Rastreamento Preventivo (Bethesda e BI-RADS), preenchendo a IG corrente com base na reconciliação DUM/USG.
  - [ ] 4. **REFACTOR:** Validar layout uniforme e ausência de scrolls aninhados concorrentes.
- **Comandos de verificação:**
  - Backend: `dotnet test backend/tests/Canamed.UnitTests/Canamed.UnitTests.csproj --filter "FullyQualifiedName~PrenatalCardPdfGeneratorTests"`
  - Frontend: `npm --prefix frontend test -- features/medical/PrenatalCardSection.test.tsx --run`
- **Critério de conclusão:** Cartão de pré-natal e rastreamento preventivo plenamente acessíveis no consultório com emissão de PDF multifolha perfeito.

---

## Fase 4: Bloco 4 — Experiência de Agendamento GO (Portal da Paciente + Recepção) e Diferenciais P2

### Task 14: Portal da Paciente: Stepper, Cards de Atendimento GO e Checklist de Preparo Pré-Exame (Frontend)
- **Objetivo:** Transformar o agendamento no Portal da Paciente com Stepper em 4 etapas, Cards Visuais de Atendimento GO (1ª Consulta, Retorno, Pré-Natal, Preventivo/Papanicolaou, Inserção/Revisão de DIU) e Modal/Checklist Obrigatório de Instruções de Preparo Pré-Exame.
- **Arquivos afetados:**
  - `frontend/src/features/patient/PatientPortal.tsx`
  - `frontend/src/features/patient/components/PreExamInstructionsModal.tsx`
  - `frontend/src/features/patient/PatientPortal.test.tsx`
- **Regras da SPEC cobertas:** RN-014.
- **Passos TDD:**
  - [ ] 1. **RED:** Criar testes em `PatientPortal.test.tsx` validando:
    - Renderização dos cards de atendimento GO com título, ícone e duração estimada.
    - Abertura obrigatória do modal de preparo pré-exame ao selecionar Preventivo ou Inserção de DIU.
    - Bloqueio do avanço para a etapa de seleção de horário enquanto o checklist de preparo não for confirmado.
  - [ ] 2. **GREEN:** Criar o componente `PreExamInstructionsModal.tsx` com as orientações clínicas canônicas (48h abstinência, fora do período menstrual, preparo de bexiga, etc.).
  - [ ] 3. **GREEN:** Refatorar `PatientPortal.tsx` implementando o Stepper de 4 etapas e a grade responsiva de cards de serviço GO com a paleta institucional (#6F217B / #852A91).
  - [ ] 4. **REFACTOR:** Adicionar mensagens explicativas e microinterações com transições de 150ms.
- **Comando de verificação:**
  `npm --prefix frontend test -- features/patient/PatientPortal.test.tsx --run`
- **Critério de conclusão:** Portal da paciente acolhedor e intuitivo; paciente conscientizada das exigências de preparo com aceite explícito antes de agendar.

---

### Task 15: Recepção Inteligente: Autocomplete Preditivo e Detecção de Conflitos (Frontend)
- **Objetivo:** Otimizar o cadastro e agendamento na recepção com busca preditiva em tempo real por nome/CPF/telefone, detecção antecipada de conflitos de horário na grade do profissional e Segmented Control padronizado.
- **Arquivos afetados:**
  - `frontend/src/features/agenda/AppointmentForm.tsx`
  - `frontend/src/features/agenda/AgendaRecepcaoPanel.tsx`
  - `frontend/src/features/agenda/AgendaRecepcaoPanel.test.tsx`
- **Regras da SPEC cobertas:** RN-005, RN-008.
- **Passos TDD:**
  - [ ] 1. **RED:** Criar teste em `AgendaRecepcaoPanel.test.tsx` verificando comportamento do autocomplete ao digitar 3 caracteres do nome ou dígitos do CPF.
  - [ ] 2. **RED:** Criar teste verificando exibição de banner de aviso quando o horário selecionado coincide com outro agendamento ativo.
  - [ ] 3. **GREEN:** Implementar componente de busca preditiva com debounce de 300ms conectado à API de catálogo de pacientes.
  - [ ] 4. **GREEN:** Adicionar checagem visual imediata de sobreposição de horário no `AppointmentForm.tsx` antes do submit.
  - [ ] 5. **REFACTOR:** Padronizar botões de alternância da recepção com tokens de marca oficiais.
- **Comando de verificação:**
  `npm --prefix frontend test -- features/agenda/AgendaRecepcaoPanel.test.tsx --run`
- **Critério de conclusão:** Cadastro e agendamento ágil sem duplicidade e sem conflito de horário silencioso.

---

### Task 16: Bridge PEP ➔ Retorno Programado CFM 1.958/2010 e Esteira Trimestral Obstétrica (Backend & Frontend)
- **Objetivo:** Ao finalizar a consulta no workspace, se houver indicação de retorno (15 dias exames, 30-45 dias DIU, 4 semanas pré-natal, 1 ano rotina), provisionar retorno programado com link de agendamento sem cobrança de novos honorários (CFM 1.958/2010) e apresentar a esteira trimestral de exames/vacinas obstétricas.
- **Arquivos afetados:**
  - `backend/src/Canamed.Application/DoctorWorkspace/DoctorWorkspaceService.cs`
  - `backend/src/Canamed.Application/MedicalRecords/Services/ObstetricProtocolsService.cs`
  - `frontend/src/features/medical/DoctorWorkspace.tsx`
  - `frontend/src/features/medical/components/ConsultationFinishSummaryModal.tsx`
- **Regras da SPEC cobertas:** RN-012, RN-015.
- **Passos TDD:**
  - [ ] 1. **RED:** Teste backend no `DoctorWorkspaceTests.cs` validando que ao finalizar a consulta com prazo de retorno, uma provisão de agendamento na fila de retornos é persistida.
  - [ ] 2. **RED:** Teste frontend verificando a exibição do modal de resumo de alta / fechamento (`ConsultationFinishSummaryModal.tsx`) contendo checklist de condutas, receitas geradas e prazo de retorno sugerido.
  - [ ] 3. **GREEN:** Implementar em `DoctorWorkspaceService.cs` a gravação de provisão de retorno na tabela/entidade correspondente.
  - [ ] 4. **GREEN:** Criar `ConsultationFinishSummaryModal.tsx` com design acolhedor, exibindo orientações finais, resumo impresso de consulta e confirmação de retorno.
  - [ ] 5. **GREEN:** Adicionar a esteira trimestral com matriz de exames (TOTG 24-28s, Swab Strep B 35-37s) e vacinas (dTpa >= 20s) na visualização pré-natal.
  - [ ] 6. **REFACTOR:** Validar que o fluxo não adiciona atrito cognitivo nem etapas desnecessárias ao médico.
- **Comandos de verificação:**
  - Backend: `dotnet test backend/tests/Canamed.UnitTests/Canamed.UnitTests.csproj --filter "FullyQualifiedName~DoctorWorkspaceTests"`
  - Frontend: `npm --prefix frontend test -- features/medical/DoctorWorkspace.test.tsx --run`
- **Critério de conclusão:** Fechamento de consulta com retenção e fidelização garantidas, respeito às normas do CFM e acompanhamento trimestral obstétrico rigoroso.

---

## Fase 5: Validação Integrada, Build e Auditoria Geral

### Task 17: Verificação Integrada End-to-End da Suíte Completa
- **Objetivo:** Executar todas as suítes de testes unitários, testes de integração, compilação de produção e auditoria estrita de conformidade visual e técnica.
- **Arquivos afetados:** Todos os arquivos do projeto.
- **Regras da SPEC cobertas:** Todas (RN-001 a RN-015, CA-001 a CA-006).
- **Passos de Execução:**
  - [ ] 1. Executar suíte completa de testes de backend:
    `dotnet test backend/tests/Canamed.UnitTests/Canamed.UnitTests.csproj`
  - [ ] 2. Executar suíte completa de testes de integração do backend:
    `dotnet test backend/tests/Canamed.IntegrationTests/Canamed.IntegrationTests.csproj`
  - [ ] 3. Executar suíte completa de testes de frontend:
    `npm --prefix frontend test -- --run`
  - [ ] 4. Executar build de produção do frontend garantindo 0 erros de tipagem TypeScript e empacotamento:
    `npm --prefix frontend run build`
  - [ ] 5. Executar varredura de segurança contra cores legadas e segredos no código:
    Garantir 0 ocorrências de `#852A91` / `#D83C91` e 0 credenciais no repositório.
- **Critério de conclusão:** 100% dos testes verdes no backend e frontend; build de produção concluído com sucesso; aprovação técnica irrevogável.

---

## Histórico de Atualizações do Plano

| Versão | Data | Autor | Descrição |
| :--- | :--- | :--- | :--- |
| **1.0** | 2026-10-26 | Planejador e Arquiteto de Produto | Decomposição formal atômica da SPEC-0035 em 17 tarefas TDD. |


