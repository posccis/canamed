# Plano de Implementação — Evolução Clínica, Segurança e Obstetrícia Especializada (Cana Med Mulher)

> **SPEC de Referência:** [SPEC-0034 — Evolução Clínica, Segurança e Obstetrícia Especializada (Cana Med Mulher)](../../specs/0034-spec-evolucao-clinica-seguranca-obstetricia-ginecologia.md)  
> **Para executores:** Executar este plano passo a passo com rigor estrito em TDD (Red-Green-Refactor). Cada tarefa é atômica, independente, possui arquivos-alvo explícitos, regras cobertas e passos verificáveis com comandos de teste reais (`dotnet test`, `npm test`).

**Objetivo Geral:** Sanar 100% das vulnerabilidades regulatórias, de integridade e de ergonomia clínica levantadas no Relatório de Auditoria Integral do Cana Med Mulher, transformando a plataforma na referência mais segura e completa em Ginecologia e Obstetrícia ambulatorial do mercado brasileiro.

**Arquitetura:** 
- Backend .NET 10 / C# com Clean Architecture, EF Core 10, PostgreSQL com interceptor de imutabilidade, criptografia transparente via `ValueConverter` e ASP.NET Core Data Protection, serviços de domínio obstétricos e auditoria enriquecida com IP e CRM/UF.
- Frontend React 19 / TypeScript / Vite com Design Tokens CSS (`theme.css`), salvamento assíncrono com debounce e espelhamento em `localStorage`, componentes SVG interativos vetoriais para colposcopia (Cervical Clock 12h) e curvas de crescimento/peso materno, e barramento semântico de alertas clínicos.

**Tech Stack:** .NET 10, C#, ASP.NET Core, EF Core, PostgreSQL, React 19, TypeScript, Vitest, xUnit, FluentAssertions, Tailwind / CSS Tokens.

---

## Restrições Globais Inegociáveis

1. **CFM 1.821/2007 e CEM:** Gestores administrativos (`Manager`) nunca possuem permissões de escrita, finalização de prontuários ou assinatura de documentos médicos.
2. **Lei nº 13.787/2018 (Imutabilidade):** Nenhuma entidade clínica (`MedicalRecord`, `MedicalRecordAddendum`, `MedicalDocument`, `AuditEvent`, etc.) pode ser excluída do banco de dados (bloqueio via `SaveChangesInterceptor`).
3. **LGPD Art. 11 (Dados Sensíveis):** Dados de saúde reprodutiva e anamnese íntima são cifrados em repouso no PostgreSQL via `ISecretProtector`.
4. **Segurança de APIs (OWASP API Top 10):** Toda autorização é validada no backend por recurso; validação estrita de DTOs; nenhuma injeção ou dados fictícios em produção.
5. **Ergonomia Médica:** Consultório virtual deve responder à pergunta de ouro: *"Isso reduz atrito na rotina da clínica?"*. Salvamento transparente e barramento de alertas claros.
6. **Suíte de Testes Contínua:** Todas as tarefas devem manter 100% dos testes existentes verdes (309 testes de backend e 137 testes de frontend).

---

## Foco de Revisão e Edge Cases Críticos

1. **Revogação de RBAC sem quebra de operações do gestor:** Assegurar que o gestor continua operando finanças, fluxo de caixa, usuários e agenda sem lançar exceções não tratadas na interface administrativa.
2. **Deleção em Cascata no EF Core:** Garantir que tentativas de deletar um paciente ou consulta com prontuário vinculado falhem com erro claro de violação de regra de retenção de prontuário, impedindo exclusão acidental.
3. **Compatibilidade de Criptografia com Registros Anteriores:** Registros existentes em texto claro no banco de dados devem ser lidos transparentemente pelo conversor sem quebrar (fallback gracioso antes da reencriptação).
4. **DUM incerta vs DUM conhecida:** Garantir que quando a DUM for marcada como desconhecida ou incerta, a calculadora obstétrica não lance `NullReferenceException` e adote imediatamente o 1º USG precoce.
5. **Debounce em Queda de Conexão:** Assegurar que falhas de rede no auto-save não limpem o formulário nem bloqueiem a digitação do médico, mantendo o rascunho seguro no `localStorage`.

---

# ÉPICO 1 (P0): Bloqueantes de Segurança, Legalidade e Compliance

### Visão Geral do Épico 1
- **Objetivo:** Garantir conformidade imediata com o Código de Ética Médica, Resolução CFM nº 1.821/2007, Lei nº 13.787/2018 e LGPD Art. 11.
- **Regras da SPEC cobertas:** RN-001, RN-002, RN-003, RN-004.
- **Impacto Arquitetural:** `Roles.cs`, novo `ImmutableRecordsInterceptor.cs`, migração de `audit_events` com colunas `client_ip` e `professional_registration`, novo `EncryptedStringConverter.cs` com integração ao `ISecretProtector`.

---

### Tarefa 1.1: Revogação de Permissões Médicas do Papel `Manager` em Roles.cs
- **Arquivos afetados:**
  - Modificar: `backend/src/Canamed.Application/Identity/Roles.cs`
  - Modificar: `backend/tests/Canamed.UnitTests/Identity/RolesTests.cs`
- **Regras da SPEC:** RN-001
- **Passos TDD:**
  - [ ] 1. Em `RolesTests.cs`, escrever teste unitário `Manager_ShouldNotHaveAnyClinicalOrDocumentPermissions()` verificando que o papel `Manager` não contém:
    - `Permissions.RecordsRead`
    - `Permissions.RecordsCreate`
    - `Permissions.RecordsUpdate`
    - `Permissions.RecordsFinalize`
    - `Permissions.RecordsAddendum`
    - `Permissions.DocumentsRead`
    - `Permissions.DocumentsCreate`
    - `Permissions.DocumentsSign`
    - `Permissions.DocumentsCancel`
    - `Permissions.DocumentsPrint`
    - `Permissions.WorkspaceAccess`
  - [ ] 2. Executar o teste (`dotnet test Canamed.sln --filter "FullyQualifiedName~RolesTests"`) e confirmar falha (Red).
  - [ ] 3. Em `Roles.cs`, remover essas permissões da definição do papel `Manager`. Preservar permissões de gestão (`Agenda*`, `Clinic*`, `UsersManage`, `DashboardRead`, `Payments*`, `Cashier*`, `FinancialAdmin`, `Inventory*`, `PrivacyManage`, `DpoManage`, `PolicyManage`, etc.).
  - [ ] 4. Reexecutar os testes unitários de identidade e validar aprovação (Green).
  - [ ] 5. Rodar toda a suíte de testes de integração (`dotnet test Canamed.sln --filter "Category=Integration"`) para verificar que nenhum teste administrativo dependia incorretamente de permissões clínicas.
  - [ ] 6. Commit atômico: `fix(security): revoke clinical and document signing permissions from manager role (RN-001)`.

---

### Tarefa 1.2: Interceptor de Imutabilidade no EF Core (Bloqueio contra Exclusão Destrutiva)
- **Arquivos afetados:**
  - Criar: `backend/src/Canamed.Infrastructure/Persistence/Interceptors/ImmutableRecordsInterceptor.cs`
  - Modificar: `backend/src/Canamed.Infrastructure/Persistence/CanamedDbContext.cs`
  - Modificar: `backend/src/Canamed.Infrastructure/DependencyInjection.cs`
  - Criar: `backend/tests/Canamed.UnitTests/Persistence/ImmutableRecordsInterceptorTests.cs`
  - Criar: `backend/tests/Canamed.IntegrationTests/Persistence/ImmutabilityPersistenceTests.cs`
- **Regras da SPEC:** RN-002
- **Passos TDD:**
  - [ ] 1. Criar o arquivo de teste `ImmutableRecordsInterceptorTests.cs` testando cenários onde entidades de prontuário (`MedicalRecord`, `MedicalRecordAddendum`, `GynecologicalConsultationData`, `MedicalDocument`, `AuditEvent`) com `EntityState.Deleted` disparam `InvalidOperationException` com mensagem referenciando a Lei nº 13.787/2018.
  - [ ] 2. Executar o teste e checar a falha por ausência da classe (Red).
  - [ ] 3. Implementar `ImmutableRecordsInterceptor : SaveChangesInterceptor`:
    - Sobrescrever `SavingChanges` e `SavingChangesAsync`.
    - Iterar em `eventData.Context.ChangeTracker.Entries()` procurando entradas com `State == EntityState.Deleted`.
    - Se o tipo da entidade for `MedicalRecord`, `MedicalRecordAddendum`, `GynecologicalConsultationData`, `MedicalDocument` ou `AuditEvent`, lançar `InvalidOperationException("Operação bloqueada: registros médicos, documentos clínicos e trilhas de auditoria são imutáveis e protegidos contra exclusão (Lei nº 13.787/2018 e CFM 1.821/2007).")`.
  - [ ] 4. Registrar o interceptor no DI em `DependencyInjection.cs` e configurar no `DbContextOptionsBuilder.AddInterceptors()`.
  - [ ] 5. Executar os testes unitários e de integração de persistência e validar aprovação (Green).
  - [ ] 6. Commit atômico: `feat(persistence): implement ImmutableRecordsInterceptor for medical records and audit trails (RN-002)`.

---

### Tarefa 1.3: Enriquecimento da Trilha de Auditoria com Client IP e CRM/UF
- **Arquivos afetados:**
  - Modificar: `backend/src/Canamed.Domain/Auditing/AuditEvent.cs`
  - Modificar: `backend/src/Canamed.Infrastructure/Persistence/AuditTrail.cs`
  - Modificar: `backend/src/Canamed.Infrastructure/Persistence/Configurations/AuditEventConfiguration.cs`
  - Criar: Migration EF Core `AddAuditClientIpAndRegistration`
  - Modificar: `backend/tests/Canamed.UnitTests/Auditing/AuditEventTests.cs`
  - Modificar: `backend/tests/Canamed.IntegrationTests/Auditing/AuditTrailIntegrationTests.cs`
- **Regras da SPEC:** RN-003
- **Passos TDD:**
  - [ ] 1. Em `AuditEventTests.cs`, criar teste verificando que a fábrica `AuditEvent.Record()` aceita e armazena os parâmetros opcionais `clientIp` (string) e `professionalRegistration` (string).
  - [ ] 2. Executar o teste e constatar o erro de compilação/assinatura (Red).
  - [ ] 3. Em `AuditEvent.cs`:
    - Adicionar propriedades privadas/getters públicos: `public string? ClientIp { get; private set; }` e `public string? ProfessionalRegistration { get; private set; }`.
    - Atualizar método `Record(...) ` para receber `string? clientIp = null` e `string? professionalRegistration = null`.
  - [ ] 4. Em `AuditEventConfiguration.cs`, mapear as colunas `client_ip` (varchar 45) e `professional_registration` (varchar 30).
  - [ ] 5. Em `AuditTrail.cs`, enriquecer a captura utilizando `IHttpContextAccessor` para ler `RemoteIpAddress` / header `X-Forwarded-For` e claim de CRM do usuário corrente quando não fornecidos explicitamente.
  - [ ] 6. Gerar migration do EF Core: `dotnet ef migrations add AddAuditClientIpAndRegistration --project backend/src/Canamed.Infrastructure --startup-project backend/src/Canamed.Api`.
  - [ ] 7. Executar a suíte de testes de auditoria e confirmar sucesso (Green).
  - [ ] 8. Commit atômico: `feat(audit): enrich audit events with client IP and professional registration (RN-003)`.

---

### Tarefa 1.4: Criptografia em Repouso dos Campos Íntimos de Saúde (LGPD Art. 11)
- **Arquivos afetados:**
  - Criar: `backend/src/Canamed.Infrastructure/Persistence/Converters/EncryptedStringConverter.cs`
  - Modificar: `backend/src/Canamed.Infrastructure/Persistence/Configurations/GynecologicalProfileConfiguration.cs`
  - Modificar: `backend/src/Canamed.Infrastructure/Persistence/Configurations/GynecologicalConsultationDataConfiguration.cs`
  - Criar: `backend/tests/Canamed.UnitTests/Persistence/EncryptedStringConverterTests.cs`
  - Criar: `backend/tests/Canamed.IntegrationTests/Persistence/EncryptedHealthDataIntegrationTests.cs`
- **Regras da SPEC:** RN-004
- **Passos TDD:**
  - [ ] 1. Em `EncryptedStringConverterTests.cs`, escrever teste unitário verificando que o conversor cifra texto claro ao gravar no banco e decifra ao ler, preservando `null` e tratando graciosamente textos legados que porventura estejam em texto puro.
  - [ ] 2. Executar e confirmar falha (Red).
  - [ ] 3. Implementar `EncryptedStringConverter : ValueConverter<string?, string?>` utilizando `ISecretProtector`.
  - [ ] 4. Aplicar o conversor nas configurações do EF Core:
    - Em `GynecologicalProfileConfiguration.cs`: para `StiHistory`, `PelvicSurgeries`, `FamilyCancerHistory`, `ObstetricNotes`.
    - Em `GynecologicalConsultationDataConfiguration.cs`: para `Hma`, `Dyspareunia`, `PrescriptionNotes`, `GeneralOrientationNotes`.
  - [ ] 5. Rodar os testes de integração para validar persistência e recuperação ponta a ponta no banco em memória / Testcontainers (Green).
  - [ ] 6. Commit atômico: `feat(security): implement transparent at-rest encryption for sensitive reproductive health fields (RN-004)`.

---

# ÉPICO 2 (P1): Core de Obstetrícia & Pré-Natal Especializado

### Visão Geral do Épico 2
- **Objetivo:** Equipar o consultório com calculadora gestacional automática dupla, ficha sequencial de consultas com exportação de Cartão da Gestante (padrão FEBRASGO), barramento semântico de alertas críticos (Rh Negativo, Hipertensão, DMG) e salvamento automático com debounce.
- **Regras da SPEC cobertas:** RN-005, RN-006, RN-007, RN-008, RN-009.
- **Impacto Arquitetural:** Serviço `ObstetricCalculator.cs`, entidade `PrenatalVisitRecord`, endpoints de pré-natal e PDF, componentes React `ClinicalAlertsBar.tsx`, `PrenatalCardSection.tsx`, hook `useAutoSave.ts`.

---

### Tarefa 2.1: Calculadora Obstétrica Dupla (DUM vs 1º USG CCN) e Reconciliação
- **Arquivos afetados:**
  - Criar: `backend/src/Canamed.Domain/MedicalRecords/ObstetricCalculator.cs`
  - Criar: `backend/src/Canamed.Domain/MedicalRecords/ObstetricCalculationResult.cs`
  - Modificar: `backend/src/Canamed.Domain/MedicalRecords/GynecologicalConsultationData.cs`
  - Criar: `backend/tests/Canamed.UnitTests/MedicalRecords/ObstetricCalculatorTests.cs`
- **Regras da SPEC:** RN-005, RN-006
- **Passos TDD:**
  - [ ] 1. Em `ObstetricCalculatorTests.cs`, escrever testes cobrindo:
    - Cálculo de Naegele padrão (ex: DUM `2026-05-01` -> DPP `2027-02-05`).
    - Cálculo de DPP para meses de janeiro a março (DUM `2026-02-10` -> DPP `2026-11-17`).
    - Cálculo de IG em semanas e dias para data-alvo.
    - Reconciliação com 1º USG (CCN): quando discrepância > 5 dias no 1º trimestre (CCN medido até 8s 6d), USG deve ser a referência recomendada.
    - Reconciliação com 1º USG entre 9s e 13s 6d: discrepância > 7 dias prioriza USG.
    - Comportamento seguro quando DUM for nula ou desconhecida (`IsDumUncertain == true`).
  - [ ] 2. Executar os testes e confirmar falha (Red).
  - [ ] 3. Implementar `ObstetricCalculator.cs` com os métodos:
    - `CalculateNaegeleEdd(DateOnly dum)`
    - `CalculateGestationalAge(DateOnly baseDate, DateOnly targetDate)`
    - `CalculateFromUltrasound(DateOnly usgDate, int weeks, int days, DateOnly targetDate)`
    - `Reconcile(...) -> ObstetricCalculationResult`
  - [ ] 4. Atualizar `GynecologicalConsultationData.cs` para conter propriedades de USG inicial e referência oficial: `FirstUltrasoundDate`, `FirstUltrasoundWeeks`, `FirstUltrasoundDays`, `FirstUltrasoundCcnMm`, `PreferredGestationalReference`.
  - [ ] 5. Executar os testes unitários e validar aprovação (Green).
  - [ ] 6. Commit atômico: `feat(obstetrics): implement double gestational calculator and USG reconciliation service (RN-005, RN-006)`.

---

### Tarefa 2.2: Entidade PrenatalVisitRecord e Endpoints REST de Pré-Natal
- **Arquivos afetados:**
  - Criar: `backend/src/Canamed.Domain/MedicalRecords/PrenatalVisitRecord.cs`
  - Criar: `backend/src/Canamed.Infrastructure/Persistence/Configurations/PrenatalVisitRecordConfiguration.cs`
  - Modificar: `backend/src/Canamed.Infrastructure/Persistence/CanamedDbContext.cs`
  - Criar: Migration EF Core `AddPrenatalVisitRecordsTable`
  - Criar: `backend/src/Canamed.Application/MedicalRecords/Dtos/PrenatalVisitDto.cs`
  - Modificar: `backend/src/Canamed.Api/Controllers/MedicalRecordsController.cs`
  - Criar: `backend/tests/Canamed.UnitTests/MedicalRecords/PrenatalVisitRecordTests.cs`
  - Criar: `backend/tests/Canamed.IntegrationTests/MedicalRecords/PrenatalVisitIntegrationTests.cs`
- **Regras da SPEC:** RN-007
- **Passos TDD:**
  - [ ] 1. Em `PrenatalVisitRecordTests.cs`, escrever testes da criação e validações da entidade (campos obrigatórios: `ClinicId`, `PatientId`, `MedicalRecordId`, `VisitDate`, `GestationalAgeWeeks`, `WeightKg`, `BloodPressure`).
  - [ ] 2. Executar e confirmar falha (Red).
  - [ ] 3. Implementar `PrenatalVisitRecord.cs` com as propriedades: `GestationalAgeWeeks`, `GestationalAgeDays`, `WeightKg`, `Bmi`, `BloodPressure`, `UterineHeightCm`, `FetalHeartRateBpm`, `FetalMovementPresent`, `EdemaClassification`, `FetalPresentation`, `ClinicalNotes`.
  - [ ] 4. Mapear configuração em `PrenatalVisitRecordConfiguration.cs` e registrar `DbSet<PrenatalVisitRecord>` em `CanamedDbContext.cs`.
  - [ ] 5. Criar endpoints no `MedicalRecordsController.cs`:
    - `POST /api/v1/medical-records/{recordId}/prenatal-visit`
    - `GET /api/v1/patients/{patientId}/prenatal-visits`
  - [ ] 6. Gerar migration do EF Core e rodar testes de integração da API (Green).
  - [ ] 7. Commit atômico: `feat(obstetrics): add PrenatalVisitRecord domain model and REST endpoints (RN-007)`.

---

### Tarefa 2.3: Barramento de Alertas Críticos na UI Médica (ClinicalAlertsBar)
- **Arquivos afetados:**
  - Modificar: `backend/src/Canamed.Domain/Agenda/Patient.cs` (adicionar `BloodType` e `RhFactor`)
  - Modificar: `backend/src/Canamed.Infrastructure/Persistence/Configurations/PatientConfiguration.cs`
  - Criar: `frontend/src/features/medical/ClinicalAlertsBar.tsx`
  - Criar: `frontend/src/features/medical/ClinicalAlertsBar.test.tsx`
  - Modificar: `frontend/src/features/medical/DoctorWorkspace.tsx`
- **Regras da SPEC:** RN-008
- **Passos TDD:**
  - [ ] 1. Em `ClinicalAlertsBar.test.tsx`, escrever testes unitários em Vitest validando que:
    - Se `rhFactor === 'Negativo'`, renderiza o badge âmbar: *"Gestante Rh Negativo — Checar Coombs Indireto / Profilaxia Anti-D"*.
    - Se PA for "150/100", renderiza o badge vermelho pulsante: *"🚨 Alerta de Hipertensão Gestacional / Risco de Pré-Eclâmpsia"*.
    - Se glicemia na triagem for 95 mg/dL, renderiza alerta de suspeita de DMG.
    - Se nenhum risco for detectado, o barramento não renderiza alertas indevidos.
  - [ ] 2. Executar `npm test src/features/medical/ClinicalAlertsBar.test.tsx` e verificar falha (Red).
  - [ ] 3. Implementar `ClinicalAlertsBar.tsx` utilizando Design Tokens do Cana Med, ícones Lucide (`AlertTriangle`, `HeartPulse`, `Droplets`) e classes semânticas.
  - [ ] 4. Integrar o `ClinicalAlertsBar` no cabeçalho do `DoctorWorkspace.tsx` recebendo os dados do paciente e triagem.
  - [ ] 5. Executar os testes do frontend (`npm test src/features/medical/`) e confirmar aprovação (Green).
  - [ ] 6. Commit atômico: `feat(ui): implement ClinicalAlertsBar for high-risk obstetric and triage indicators (RN-008)`.

---

### Tarefa 2.4: Auto-Save Temporizado com Debounce no Consultório
- **Arquivos afetados:**
  - Criar: `frontend/src/features/medical/useAutoSave.ts`
  - Criar: `frontend/src/features/medical/useAutoSave.test.ts`
  - Modificar: `frontend/src/features/medical/DoctorWorkspace.tsx`
- **Regras da SPEC:** RN-009
- **Passos TDD:**
  - [ ] 1. Em `useAutoSave.test.ts`, escrever testes com timers falsos (`vi.useFakeTimers()`) testando:
    - Disparo da função de salvamento 5 segundos após a última alteração.
    - Cancelamento de chamadas duplicadas enquanto o usuário continua digitando.
    - Gravação espelhada imediata em `localStorage` com a chave `canamed:draft:{id}`.
    - Atualização do estado de salvamento (`'idle' | 'saving' | 'saved' | 'error'`).
  - [ ] 2. Executar `npm test src/features/medical/useAutoSave.test.ts` e verificar falha (Red).
  - [ ] 3. Implementar `useAutoSave.ts` com TypeScript robusto, tratamento de erros e espelhamento em `localStorage`.
  - [ ] 4. Integrar o hook em `DoctorWorkspace.tsx`, exibindo no topo o status de salvamento discreto.
  - [ ] 5. Executar os testes do frontend e validar aprovação (Green).
  - [ ] 6. Commit atômico: `feat(medical): add debounced auto-save hook and local backup for consultations (RN-009)`.

---

### Tarefa 2.5: Cartão da Gestante Digital e Exportação em PDF (Padrão FEBRASGO)
- **Arquivos afetados:**
  - Criar: `backend/src/Canamed.Application/MedicalRecords/Services/PrenatalCardPdfGenerator.cs`
  - Modificar: `backend/src/Canamed.Api/Controllers/MedicalRecordsController.cs`
  - Criar: `frontend/src/features/medical/PrenatalCardSection.tsx`
  - Criar: `frontend/src/features/medical/PrenatalCardSection.test.tsx`
- **Regras da SPEC:** RN-007
- **Passos TDD:**
  - [ ] 1. Escrever teste unitário do gerador de PDF de cartão da gestante, garantindo que o documento possui cabeçalho com identificação da gestante, tipagem sanguínea, DUM, DPP e tabela cronológica de visitas.
  - [ ] 2. Executar e confirmar falha (Red).
  - [ ] 3. Implementar `PrenatalCardPdfGenerator.cs` gerando PDF com formatação limpa no padrão da FEBRASGO.
  - [ ] 4. Adicionar endpoint `GET /api/v1/patients/{patientId}/prenatal-card/pdf` retornando `File(bytes, "application/pdf")`.
  - [ ] 5. Implementar componente `PrenatalCardSection.tsx` no frontend com tabela de visitas e botão para download do PDF.
  - [ ] 6. Rodar os testes de backend e frontend e confirmar aprovação (Green).
  - [ ] 7. Commit atômico: `feat(obstetrics): add digital prenatal card and PDF export compliant with FEBRASGO (RN-007)`.

---

# ÉPICO 3 (P1): Core de Ginecologia & Prevenção Oncológica

### Visão Geral do Épico 3
- **Objetivo:** Estruturar a classificação citopatológica segundo a Nomenclatura Bethesda e testes de DNA-HPV, bem como a classificação BI-RADS para exames mamários, com geração automática de recomendações assistenciais baseadas no Ministério da Saúde/INCA.
- **Regras da SPEC cobertas:** RN-010, RN-011, RN-012.
- **Impacto Arquitetural:** `PreventiveScreeningRecord.cs`, serviço de condutas `CervicalScreeningGuidelineService.cs`, enums de Bethesda e BI-RADS, atualização de `PreventiveScreeningList.tsx`.

---

### Tarefa 3.1: Nomenclatura Bethesda Estruturada, DNA-HPV e Condutas do Ministério da Saúde
- **Arquivos afetados:**
  - Criar: `backend/src/Canamed.Domain/MedicalRecords/BethesdaClassification.cs`
  - Criar: `backend/src/Canamed.Domain/MedicalRecords/CervicalScreeningGuidelineEngine.cs`
  - Modificar: `backend/src/Canamed.Domain/MedicalRecords/PreventiveScreeningRecord.cs`
  - Modificar: `backend/src/Canamed.Infrastructure/Persistence/Configurations/PreventiveScreeningRecordConfiguration.cs`
  - Modificar: `frontend/src/features/medical/PreventiveScreeningList.tsx`
  - Criar: `backend/tests/Canamed.UnitTests/MedicalRecords/CervicalScreeningGuidelineTests.cs`
  - Modificar: `frontend/src/features/medical/PreventiveScreeningList.test.tsx`
- **Regras da SPEC:** RN-010, RN-011
- **Passos TDD:**
  - [ ] 1. Em `CervicalScreeningGuidelineTests.cs`, escrever testes para a recomendação de condutas:
    - NILM em paciente de 30 anos -> *"Repetir em 3 anos se tiver dois anuais prévios negativos"*.
    - ASC-US em paciente de 32 anos -> *"Repetir exame citopatológico em 6 meses"*.
    - ASC-US com HPV 16/18 positivo -> *"Encaminhar para Colposcopia imediata"*.
    - HSIL / AGC em qualquer idade -> *"Encaminhamento urgente para Colposcopia com biópsia se indicado"*.
  - [ ] 2. Executar e confirmar falha (Red).
  - [ ] 3. Implementar enums e serviço `CervicalScreeningGuidelineEngine.cs`.
  - [ ] 4. Atualizar a entidade `PreventiveScreeningRecord.cs` e mapear campos `bethesda_classification`, `hpv_dna_result` e `clinical_conduct_notes`.
  - [ ] 5. Atualizar `PreventiveScreeningList.tsx` substituindo o input de texto livre por seletores padronizados de Bethesda e HPV, com preview da conduta recomendada.
  - [ ] 6. Rodar os testes de backend e frontend e confirmar aprovação (Green).
  - [ ] 7. Commit atômico: `feat(gynecology): add structured Bethesda nomenclature, HPV test and automated INCA guidelines (RN-010, RN-011)`.

---

### Tarefa 3.2: Classificação BI-RADS (0 a 6) para Mamografia/USG e Condutas Automáticas
- **Arquivos afetados:**
  - Criar: `backend/src/Canamed.Domain/MedicalRecords/BiRadsClassification.cs`
  - Modificar: `backend/src/Canamed.Domain/MedicalRecords/PreventiveScreeningRecord.cs`
  - Modificar: `frontend/src/features/medical/PreventiveScreeningList.tsx`
  - Criar: `backend/tests/Canamed.UnitTests/MedicalRecords/BiRadsClassificationTests.cs`
- **Regras da SPEC:** RN-012
- **Passos TDD:**
  - [ ] 1. Em `BiRadsClassificationTests.cs`, testar validação de categorias BI-RADS de 0 a 6 (incluindo 4A, 4B, 4C) e a correlação com as condutas oficiais (ex: BI-RADS 0: Exames complementares; BI-RADS 3: Controle em 6 meses; BI-RADS 4/5: Biópsia percutânea).
  - [ ] 2. Executar e constatar falha (Red).
  - [ ] 3. Implementar classe de domínio de valor e métodos de conduta em `BiRadsClassification.cs`.
  - [ ] 4. Atualizar formulário no frontend (`PreventiveScreeningList.tsx`) para exibir dropdown com as opções oficiais BI-RADS quando o tipo de exame for Mamografia ou Ultrassom Mamário.
  - [ ] 5. Executar a suíte de testes de preventivos e validar aprovação (Green).
  - [ ] 6. Commit atômico: `feat(gynecology): add structured BI-RADS classification and clinical conduct suggestions (RN-012)`.

---

# ÉPICO 4 (P2): Diferenciais Competitivos & Features Matadoras

### Visão Geral do Épico 4
- **Objetivo:** Posicionar o Cana Med Mulher com ferramentas clínicas exclusivas que nenhum software genérico oferece: controle inteligente de validade de LARCs, Mapa Cervical interativo em formato de relógio de 12 horas, curvas interativas Atalah/AU e preparação da assinatura digital ICP-Brasil PAdES.
- **Regras da SPEC cobertas:** RN-013, RN-014.
- **Impacto Arquitetural:** Entidade `LarcPlacementRecord`, componentes React `CervicalClockMap.tsx`, `AtalahWeightGainChart.tsx`, `UterineHeightChart.tsx`, interface `ISignatureProvider`.

---

### Tarefa 4.1: Gestão Automatizada de Dispositivos LARC (DIU & Implantes)
- **Arquivos afetados:**
  - Criar: `backend/src/Canamed.Domain/MedicalRecords/LarcPlacementRecord.cs`
  - Criar: `backend/src/Canamed.Infrastructure/Persistence/Configurations/LarcPlacementRecordConfiguration.cs`
  - Modificar: `backend/src/Canamed.Infrastructure/Persistence/CanamedDbContext.cs`
  - Criar: `frontend/src/features/medical/LarcManagementSection.tsx`
  - Criar: `backend/tests/Canamed.UnitTests/MedicalRecords/LarcPlacementRecordTests.cs`
- **Regras da SPEC:** RN-013
- **Passos TDD:**
  - [ ] 1. Em `LarcPlacementRecordTests.cs`, testar cálculo automático da data de expiração por tipo de dispositivo:
    - Implanon NXT -> 3 anos.
    - DIU Cobre TCu380A -> 10 anos.
    - Kyleena -> 5 anos.
    - Mirena -> 5 a 8 anos.
    - Data sugerida para USG de controle pós-inserção (30 a 45 dias).
  - [ ] 2. Executar e checar falha (Red).
  - [ ] 3. Implementar entidade `LarcPlacementRecord.cs` e mapeamento no EF Core.
  - [ ] 4. Implementar componente `LarcManagementSection.tsx` no frontend com cálculo imediato ao selecionar o dispositivo e registro do lote.
  - [ ] 5. Executar os testes e confirmar aprovação (Green).
  - [ ] 6. Commit atômico: `feat(gynecology): implement LARC placement management with automatic expiry and control ultrasound dates (RN-013)`.

---

### Tarefa 4.2: Mapa Cervical / Odontograma Colposcópico Interativo (SVG Cervical Clock 12h)
- **Arquivos afetados:**
  - Criar: `frontend/src/features/medical/CervicalClockMap.tsx`
  - Criar: `frontend/src/features/medical/CervicalClockMap.test.tsx`
  - Modificar: `frontend/src/features/medical/GynecologicalExamSection.tsx`
- **Regras da SPEC:** RN-014
- **Passos TDD:**
  - [ ] 1. Em `CervicalClockMap.test.tsx`, testar renderização do disco de 12 horas em SVG e interação de seleção de quadrante (ex: clicar na posição 2h e selecionar "Epitélio acetobranco denso" atualiza o estado com as coordenadas horárias).
  - [ ] 2. Executar `npm test src/features/medical/CervicalClockMap.test.tsx` e verificar falha (Red).
  - [ ] 3. Implementar `CervicalClockMap.tsx` com SVG interativo, 12 posições horárias, indicação de orifício externo, ZT (tipos 1, 2 e 3) e marcação de biópsia.
  - [ ] 4. Integrar o mapa na seção de exame especular em `GynecologicalExamSection.tsx`.
  - [ ] 5. Executar testes e validar aprovação (Green).
  - [ ] 6. Commit atômico: `feat(ui): add interactive SVG 12-hour cervical clock map for colposcopy examinations (RN-014)`.

---

### Tarefa 4.3: Curvas e Gráficos Obstétricos Automatizados (Atalah & Altura Uterina)
- **Arquivos afetados:**
  - Criar: `frontend/src/features/medical/AtalahWeightGainChart.tsx`
  - Criar: `frontend/src/features/medical/UterineHeightChart.tsx`
  - Criar: `frontend/src/features/medical/ObstetricCharts.test.tsx`
  - Modificar: `frontend/src/features/medical/PrenatalCardSection.tsx`
- **Passos TDD:**
  - [ ] 1. Em `ObstetricCharts.test.tsx`, testar renderização vetorial SVG dos pontos plotados com base nas visitas de pré-natal e faixas de normalidade de Atalah e AU.
  - [ ] 2. Executar e confirmar falha (Red).
  - [ ] 3. Implementar `AtalahWeightGainChart.tsx` com as 4 faixas (Baixo Peso, Adequado, Sobrepeso, Obesidade) e `UterineHeightChart.tsx` com percentis P10 e P90.
  - [ ] 4. Integrar os gráficos na aba de Pré-Natal.
  - [ ] 5. Executar testes do frontend e confirmar aprovação (Green).
  - [ ] 6. Commit atômico: `feat(obstetrics): add interactive Atalah gestational weight and uterine height SVG charts`.

---

### Tarefa 4.4: Arquitetura e Integração para Assinatura Digital ICP-Brasil Real (PAdES)
- **Arquivos afetados:**
  - Modificar: `backend/src/Canamed.Application/Abstractions/ISignatureProvider.cs`
  - Criar: `backend/src/Canamed.Infrastructure/DigitalSignature/CloudCertificateSignatureProvider.cs`
  - Modificar: `backend/src/Canamed.Infrastructure/DigitalSignature/SimulatedSignatureProvider.cs`
  - Modificar: `backend/src/Canamed.Infrastructure/DependencyInjection.cs`
  - Criar: `backend/tests/Canamed.UnitTests/DigitalSignature/SignatureProviderTests.cs`
- **Passos TDD:**
  - [ ] 1. Em `SignatureProviderTests.cs`, testar a interface de assinatura suportando credenciais de certificado em nuvem (OAuth2 / PSC) e fallback para modo simulado em ambiente local.
  - [ ] 2. Executar e confirmar falha (Red).
  - [ ] 3. Implementar adaptador em `CloudCertificateSignatureProvider.cs` preparando a integração com PSCs (BirdID / Certisign / CFM).
  - [ ] 4. Configurar injeção de dependência condicional ao ambiente (`builder.Environment.IsDevelopment()`).
  - [ ] 5. Executar a suíte de testes de documentos e validar aprovação (Green).
  - [ ] 6. Commit atômico: `feat(security): evolve digital signature architecture for cloud ICP-Brasil PAdES certificates`.

---

## Estratégia de Migração e Compatibilidade

1. **Migrations EF Core Ordenadas:**
   - `AddAuditClientIpAndRegistration` (Épico 1)
   - `AddPrenatalVisitRecordsTable` (Épico 2)
   - `AddLarcPlacementRecordsTable` (Épico 4)
2. **Compatibilidade Retroativa de Dados:**
   - O `EncryptedStringConverter` testa se a string recuperada inicia com o envelope criptográfico; caso contrário, interpreta como texto claro legado, garantindo que prontuários já criados em desenvolvimento ou homologação não sofram erro de decifragem.
3. **Rollback Seguro:**
   - Todas as alterações são puramente incrementais ou de revogação de acessos. A revogação em `Roles.cs` não requer alteração estrutural no banco.

---

## Verificação Final de Conclusão (Definition of Done)

Para considerar este plano integralmente implementado:
1. `dotnet test Canamed.sln` executado com **0 falhas** em todos os projetos de testes unitários e de integração.
2. `npm test` no frontend executado com **0 falhas** em todas as suítes Vitest.
3. Nenhuma exclusão destrutiva permitida em registros de prontuário e auditoria.
4. Nenhuma permissão assistencial presente no papel `Manager`.
5. Logs limpos e livres de PII / CRM conforme diretrizes do `GEMINI.md`.
