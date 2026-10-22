# SPEC-0034 — Segurança, Imutabilidade e Governança de Prontuário (P0)

| Campo | Valor |
| :--- | :--- |
| **ID** | SPEC-0034 |
| **Título** | Segurança, Imutabilidade e Governança de Prontuário (P0) |
| **Status** | Em implementação |
| **Versão** | 1.1 |
| **Data** | 2026-10-21 |
| **Autor** | Planejador e Arquiteto de Produto (`@planejador`) |
| **Revisores** | Auditor Mestre GO (`@canamed-go-auditor`), Medical Systems Domain Expert (`@medical-systems-domain-expert`), UI/UX Reviewer (`@ui-ux-reviewer`) |
| **Módulos afetados** | `backend/src/Canamed.Application` (Identity/Roles), `backend/src/Canamed.Domain` (Auditing), `backend/src/Canamed.Infrastructure` (Persistence/Interceptors/Converters/Audit) |
| **ADRs relacionados** | ADR-0003, ADR-0004, ADR-0007, ADR-0008, ADR-0010 |

---

## 1. Objetivo

Esta especificação estabelece os requisitos técnicos e de compliance legal para sanar as vulnerabilidades críticas de segurança e conformidade regulatória identificadas na Auditoria Integral do Cana Med Mulher (Épico P0):
1. **Segregação Estrita de RBAC Clínico (`RN-001`):** Revogação completa de permissões exclusivas de ato médico (`Records*`, `Documents*`, `WorkspaceAccess`) do papel administrativo `Manager` (`gestor`), cumprindo o Código de Ética Médica e o princípio do privilégio mínimo da LGPD.
2. **Imutabilidade Absoluta de Prontuário e Auditoria (`RN-002`):** Bloqueio incondicional no Entity Framework Core (`ImmutableRecordsInterceptor`) contra qualquer tentativa de exclusão (`EntityState.Deleted`) de prontuários, adendos, dados clínicos ginecológicos, documentos médicos e eventos de auditoria, além de restrição nas foreign keys (`DeleteBehavior.Restrict`), atendendo à Lei nº 13.787/2018 (guarda mínima de 20 anos) e à Resolução CFM nº 1.821/2007.
3. **Rastreabilidade e Enriquecimento de Auditoria NGS2/CFM (`RN-003`):** Registro automático do IP de origem (`ClientIp`) e do número de registro de classe do profissional (`ProfessionalRegistration`, CRM/UF) em cada evento de auditoria.
4. **Criptografia em Repouso de Dados Íntimos e Reprodutivos (`RN-004`):** Cifragem transparente (`EncryptedStringConverter`) com prefixo identificador de versão (`ENC:v1:`) acoplada a `ISecretProtector` / ASP.NET Data Protection sobre os atributos mais sensíveis de saúde da mulher, garantindo leitura retrocompatível para dados legados em texto claro.

---

## 2. Contexto e Justificativa Regulatória

O Relatório de Auditoria do Cana Med Mulher identificou 4 inconformidades críticas no baseline de produção:
- **Violação do Código de Ética Médica (CFM 2.217/2018, Arts. 73, 85 e 87):** Administradores e gestores (`Manager`) detinham autorização para criar, alterar e finalizar prontuários médicos e assinar documentos clínicos eletrônicos. No modelo brasileiro, o prontuário pertence à paciente sob guarda da instituição, sendo seu preenchimento e adulteração privativos do profissional médico habilitado.
- **Risco de Destruição Indevida de Prontuários (Lei nº 13.787/2018):** Ausência de barreira de persistência contra comandos `Remove` no DbContext em registros clínicos. Prontuários eletrônicos exigem retenção mínima de 20 anos e imutabilidade de registros finalizados.
- **Auditoria Incompleta perante SBIS/CFM NGS2:** Eventos de auditoria registravam apenas `userId`, faltando `client_ip` (Marco Civil da Internet Art. 15) e `professional_registration` (CRM).
- **Tratamento de Dados Pessoais Sensíveis (LGPD Art. 11 e Art. 46):** Dados sobre histórico de infecções sexualmente transmissíveis, queixas sexuais íntimas e cirurgias pélvicas requerem salvaguarda reforçada de criptografia em repouso no banco de dados.

---

## 3. Escopo

### 3.1 Dentro do escopo (Épico P0)
- Refatoração do catálogo de permissões por papel em `Canamed.Application.Identity.Roles`, expurgando permissões clínicas de `Manager`.
- Criação do interceptor de EF Core `ImmutableRecordsInterceptor` interceptando `SavingChanges` e `SavingChangesAsync` para entidades clínicas e de auditoria.
- Configuração de `DeleteBehavior.Restrict` nos relacionamentos de `MedicalRecordConfiguration`.
- Inclusão dos campos `ClientIp` e `ProfessionalRegistration` na entidade `AuditEvent` e mapeamento no `AuditEventConfiguration`.
- Enriquecimento automático do IP via `IHttpContextAccessor` em `AuditRepository` e `AuditTrail`.
- Criação do conversor `EncryptedStringConverter` com envelope `ENC:v1:` e suporte a fallback retrocompatível.
- Aplicação do conversor nas colunas sensíveis de `GynecologicalProfileConfiguration` e `GynecologicalConsultationDataConfiguration`.
- Testes automatizados unitários e integrados cobrindo cada regra (TDD).

### 3.2 Fora do escopo (Isolados nas SPECs 0035, 0036 e 0037)
- Calculadora gestacional, pré-natal e Cartão da Gestante (SPEC-0035).
- Nomenclatura Bethesda e classificação BI-RADS com condutas automáticas (SPEC-0036).
- Gestão de DIU/Implantes LARC, mapa cervical 12h e curvas obstétricas (SPEC-0037).

---

## 4. Matriz de Autorização (RBAC Refinada)

| Ator | Papel (`Role`) | Permissões Permitidas | Permissões Terminantemente Revogadas |
| :--- | :--- | :--- | :--- |
| **Médico / Profissional** | `Professional` (`profissional`) | `Records*`, `Documents*`, `WorkspaceAccess`, `AgendaRead`, `AgendaWrite` | Operações financeiras, fechamento de caixa, administração de usuários |
| **Gestor da Clínica** | `Manager` (`gestor`) | `Agenda*`, `Clinic*`, `UsersManage`, `DashboardRead`, `Payments*`, `Cashier*`, `Inventory*`, `PrivacyManage` | `Records*` (`RecordsRead`, `RecordsCreate`, `RecordsUpdate`, `RecordsFinalize`, `RecordsAddendum`), `Documents*` (`DocumentsRead`, `DocumentsCreate`, `DocumentsSign`, `DocumentsCancel`, `DocumentsPrint`), `WorkspaceAccess` |
| **Recepcionista** | `Receptionist` (`recepcionista`) | `AgendaRead`, `AgendaWrite`, `ClinicRead`, `DashboardRead`, `PaymentsRead`, `PaymentsWrite`, `CashierOperate` | Qualquer acesso ao prontuário clínico ou documentos médicos |

---

## 5. Regras de Negócio

### RN-001: Segregação Estrita de Acesso ao Prontuário
O papel administrativo `Manager` não possui qualquer permissão sobre registros clínicos ou documentos médicos. Caso um médico seja também gestor ou proprietário da clínica, ele deve ter o perfil `Professional` vinculado ao seu usuário para realizar atos assistenciais. Requisições de `Manager` a endpoints clínicos devem responder com `403 Forbidden`.

### RN-002: Imutabilidade Inviolável de Prontuário e Trilha de Auditoria
O sistema impede a exclusão física (`DELETE`) no banco de dados das seguintes entidades:
- `MedicalRecord`
- `MedicalRecordAddendum`
- `GynecologicalConsultationData`
- `MedicalDocument`
- `AuditEvent`

Qualquer tentativa de persistência com `EntityState.Deleted` nessas entidades dispara `InvalidOperationException` imediata com a mensagem descritiva:
> *"Registros clínicos e trilhas de auditoria são imutáveis e não podem ser excluídos (Lei nº 13.787/2018 e CFM 1.821/2007)."*

Além disso, relacionamentos de chave estrangeira devem usar `DeleteBehavior.Restrict` para impedir efeitos em cascata destrutivos.

### RN-003: Enriquecimento de Auditoria com Terminal e Conselho de Classe
Todo registro de `AuditEvent` armazena:
- `client_ip`: Endereço IPv4 ou IPv6 de origem da chamada HTTP (capturado de `HttpContext.Connection.RemoteIpAddress` ou cabeçalho de proxy confiável).
- `professional_registration`: Registro de conselho de classe (CRM/UF) do profissional autor da ação, quando o ator for profissional de saúde.

### RN-004: Criptografia em Repouso de Dados Íntimos (LGPD Art. 11)
Os campos abaixo são cifrados de forma transparente antes da persistência e decifrados na leitura:
- Em `GynecologicalProfile`:
  - `ObstetricNotes`
  - `PelvicSurgeries`
  - `StiHistory`
  - `FamilyCancerHistory`
- Em `GynecologicalConsultationData`:
  - `Hma`
  - `Dyspareunia`
  - `PrescriptionNotes`

O formato do valor cifrado no banco é `ENC:v1:<base64-ciphertext>`. Leituras de dados existentes sem o prefixo `ENC:v1:` são retornadas em texto claro sem exceção (retrocompatibilidade transparente).

---

## 6. Critérios de Aceitação

1. **RBAC:**
   - `Roles.PermissionsFor(Roles.Manager)` não contém nenhuma permissão iniciada por `records:`, `documents:` ou `workspace:access`.
   - `Roles.PermissionsFor(Roles.Professional)` mantém acesso integral a essas permissões.
2. **Imutabilidade:**
   - Tentativa de remover `MedicalRecord` ou `AuditEvent` via DbContext lança `InvalidOperationException`.
3. **Auditoria:**
   - `AuditEvent.Record` aceita `clientIp` e `professionalRegistration`.
   - `AuditTrail` e `AuditRepository` enriquecem eventos com o IP remoto quando disponível.
4. **Criptografia:**
   - `EncryptedStringConverter` cifra strings com o prefixo `ENC:v1:`.
   - Ao ler valor sem o prefixo `ENC:v1:`, retorna o valor bruto intacto.
   - Ao ler valor com o prefixo `ENC:v1:`, decifra utilizando o `ISecretProtector`.
5. **Testes:**
   - Suíte de testes unitários executada com sucesso total (`dotnet test`).

---

## 7. Histórico de Revisões

| Data | Versão | Autor | Descrição |
| :--- | :--- | :--- | :--- |
| 2026-10-21 | 1.0 | `@planejador` | Elaboração inicial agregando Épicos P0, P1 e P2. |
| 2026-10-21 | 1.1 | `@orquestrador` | Refinamento com foco exclusivo no Épico P0 (RN-001 a RN-004) e isolamento dos Épicos P1 e P2 para as SPECs 0035, 0036 e 0037. Status: Em implementação. |
