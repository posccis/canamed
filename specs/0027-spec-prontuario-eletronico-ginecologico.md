# SPEC-0027: Prontuário Eletrônico do Paciente Especializado em Ginecologia (PEP Ginecológico)

## 1. Contexto e Justificativa

O CANAMED é uma plataforma especializada na gestão e operação de **clínicas ginecológicas**. O Prontuário Eletrônico do Paciente (PEP) é o coração assistencial do sistema. O modelo genérico anterior (baseado apenas nos 4 campos SOAP de texto livre da SPEC-0010) é insuficiente para capturar a profundidade, a continuidade e a precisão necessárias ao cuidado da saúde da mulher.

A ginecologia ambulatorial lida com ciclos de vida dinâmicos (menarca, anos reprodutivos, climatério, menopausa), rastreamento preventivo oncológico periódico (citopatológico/colo de útero, mamografia, USG transvaginal), histórico obstétrico consolidado (GPA) e métodos contraceptivos que demandam acompanhamento longitudinal.

Esta especificação define o **PEP Especializado em Ginecologia**, estruturado para oferecer alta eficiência no consultório, ergonomia clínica sem sobrecarga cognitiva, integridade inviolável dos dados de saúde e estrita conformidade legal (LGPD, CFM e Lei nº 13.787/2018).

---

## 2. Princípios de Design Clínico e Diretrizes Gerais

1. **Separação entre Registro Longitudinal e Registro Pontual da Consulta:**
   - **Histórico Longitudinal da Paciente (Ficha Gineco-Obstétrica):** Dados cumulativos e duradouros da mulher que persistem e evoluem entre consultas (menarca, histórico menstrual padrão, antecedentes obstétricos GPA, histórico de cirurgias pélvicas, alergias, histórico contraceptivo e histórico de exames preventivos).
   - **Consulta Atual (Encontro Clínico):** Motivo do atendimento/anamnese atual, queixas ginecológicas ativas, data da última menstruação (DUM), exame físico geral e ginecológico dirigido da consulta, hipóteses diagnósticas/diagnósticos confirmados, plano terapêutico/conduta e documentos emitidos.
2. **Ergonomia e Prevenção de Sobrecarga (Não Monolítico):**
   - O consultório divide o atendimento em blocos visuais e lógicos claros:
     - Bloco 1: Contexto e Histórico Longitudinal (visualizável com 1 clique ou painel lateral retrátil).
     - Bloco 2: Anamnese e Queixa Atual (DUM, queixa principal, sintomas associados).
     - Bloco 3: Exame Físico Ginecológico (Mamas, Abdome, Genitália Externa, Exame Especular, Toque Bimanual).
     - Bloco 4: Rastreamento Preventivo e Procedimentos (Preventivo/Papanicolau, Mamografia, USG, Procedimento Ambulatorial como DIU/Cauterização).
     - Bloco 5: Avaliação, Diagnósticos (Hipóteses vs. Confirmados) e Conduta/SOAP integrado com emissão de documentos.
3. **Diferenciação Estrita de Estados de Dados:**
   - Interface e banco distinguem: (a) Não avaliado / Não informado, (b) Negativo / Sem alterações (achado negativo documentado), (c) Alterado / Positivo com descrição específica.
4. **Imutabilidade e Adendos:**
   - Prontuário finalizado é imutável. Correções ou complementações ocorrem exclusivamente por `MedicalRecordAddendum` com justificativa, autoria, CRM e timestamp invioláveis.
5. **Privacidade Reforçada (LGPD Art. 11):**
   - Dados de saúde ginecológica são dados sensíveis com controle de acesso RBAC estrito (somente profissionais médicos e autorizados têm acesso; recepcionistas e administradores gerais não acessam prontuário). Visualizações e edições geram eventos de auditoria invioláveis.

---

## 3. Escopo Funcional

### 3.1. Histórico Ginecológico Longitudinal (Ficha Ginecológica)
- **Histórico Menstrual & Reprodutivo Base:**
  - Idade da menarca (anos).
  - Idade da sexarca (anos) — [MED-01].
  - Ciclo habitual: intervalo (dias, ex: 28), duração do fluxo (dias, ex: 4-5), padrão (Regular / Irregular).
  - Intensidade habitual do fluxo (Leve, Moderado, Intenso, Hemorrágico).
  - Dismenorreia (Ausente, Leve, Moderada, Grave; responsiva a analgésicos).
  - Tensão pré-menstrual (TPM) e sintomas associados.
  - Menopausa: status (Menacme, Pré-menopausa/Perimenopausa, Menopausa confirmada), idade da menopausa, uso de terapia de reposição hormonal (TRH).
- **Histórico Obstétrico (GPA Estruturado):**
  - Gestações (G), Partos Vaginais (PN), Cesáreas (PC), Abortos (A) [espontâneos/provocados], Filhos Vivos (F), Ectópicas (se houver).
  - Resumo de intercorrências prévias (diabetes gestacional, pré-eclâmpsia, prematuridade, etc.).
- **Histórico Contraceptivo e Reprodutivo:**
  - Método contraceptivo em uso atual (Nenhum, ACO combinado, Minipílula, Injetável mensal/trimestral, DIU de Cobre, DIU Hormonal/Mirena/Kyleena, Implante/Implanon, Preservativo, Laqueadura, etc.).
  - Tempo de uso atual e adaptação / efeitos adversos.
  - Métodos prévios relevantes e motivos de troca/suspensão.
  - Planejamento reprodutivo (Desejo reprodutivo futuro, tentativa atual de engravidar, sem desejo reprodutivo).
- **Histórico Ginecológico Pregresso & Cirúrgico:**
  - Cirurgias ginecológicas prévias (laqueadura, histerectomia, miomectomia, ooforectomia, perineoplastia, etc.).
  - Histórico de DSTs/ISTs prévias tratadas.

### 3.2. Registro da Consulta Ginecológica (Atendimento Ativo)
- **Anamnese Ginecológica Dirigida:**
  - Motivo principal da consulta (Rotina/Preventivo, Dor pélvica, Queixa menstrual, Corrimento/Prurido vulvar, Climatério, Contracepção, etc.).
  - Histórico da moléstia atual (HMA) contextualizado.
  - Data da Última Menstruação (DUM) com opção "Incerta" ou "Menopausada".
  - Vida sexual ativa (Sim, Não, Não informada); Dispareunia (Ausente, Superficial, Profunda).
  - Queixas urinárias e intestinais correlacionadas.
- **Exame Físico Ginecológico Estruturado:**
  - Exame das Mamas: Inspeção estática/dinâmica e palpação (Sem alterações / Alterado com quadrante e descrição de nódulo, retração, descarga papilar).
  - Abdome: Inspeção e palpação (Normotenso, indolor, sem visceromegalias / Dor à palpação profunda em fossas ilíacas ou hipogástrio).
  - Genitália Externa / Vulva: Inspeção de grandes/pequenos lábios, introito e região perineal (Sem lesões / Lesão trófica, úlcera, hiperemia, condiloma, escoriação).
  - Exame Especular:
    - Colo do útero: Ectopia, colo trófico, orifício puntiforme ou em fenda, sangramento ao contato, pólipo, teste de Schiller se aplicável.
    - Conteúdo vaginal / Secreção: Fisiológico / Leucorreia (branca grumosa, acinzentada bolhosa, amarelada, com odor fétido).
  - Toque Bimanual:
    - Útero: Volume habitual / Aumentado, mobilidade preservada / doloroso à mobilização, contornos regulares / irregulares (miomatoso).
    - Anexos: Livres e indolores / Espessados ou palpável massa anexial dolorosa.
- **Rastreamento Preventivo & Linha do Tempo [MED-02]:**
  - Citopatológico de Colo do Útero (Papanicolau): Data do último exame, resultado (Negativo para malignidade / ASC-US / LSIL / HSIL / AGC / Inadequado), necessidade de nova coleta na consulta atual.
  - Pesquisa de DNA-HPV (Co-teste): Data do último exame, resultado (Não detectado / HPV 16/18 / Outros tipos oncogênicos).
  - Mamografia: Data do último exame, categoria BI-RADS (0 a 6), recomendação de controle.
  - Ultrassonografia Transvaginal (USG): Data do último exame, espessura endometrial (mm), achados miometriais e ovarianos.
- **Procedimentos Ambulatoriais Ginecológicos (Quando Realizados):**
  - Registro de procedimento realizado durante a consulta:
    - Tipo: Inserção de DIU (Cobre, Hormonal), Retirada de DIU, Biópsia de colo/endométrio/vulva, Cauterização de colo, Retirada de pólipo, Implante contraceptivo.
    - Lote do dispositivo/insumo (quando aplicável).
    - Técnica, tolerância da paciente e orientações pós-procedimento.
- **Avaliação e Diagnósticos:**
  - Lista de diagnósticos/hipóteses com código CID-10, descrição clínica e status:
    - `Hipotese` (Hipótese diagnóstica preliminar em investigação).
    - `Confirmado` (Diagnóstico definitivo estabelecido).
- **Conduta, Prescrição e Documentos Integrados [MED-04]:**
  - Segregação clara entre:
    - `PrescricaoMedicamentosa` (Medicamento, concentração, posologia, via, duração — formatada para documento impresso).
    - `OrientacoesGerais` (Orientações de estilo de vida, sinais de alarme e retorno).
  - Solicitação de exames complementares específicos.
  - Encaminhamentos, orientações de retorno e atestados vinculados ao atendimento.

---

## 4. Modelo de Domínio (.NET 10)

### 4.1. Entidades e Value Objects
1. `GynecologicalProfile` (Perfil / Histórico Gineco-Obstétrico Longitudinal da Paciente):
   - `Id` (Guid), `ClinicId` (Guid), `PatientId` (Guid).
   - Menarca (idade), Sexarca (idade) — [MED-01], Padrão do Ciclo (intervalo, duração, regularidade, fluxo, dismenorreia, tpm).
   - Status Menopausa (Menacme, Climatério, Pós-menopausa, idade menopausa, uso de TRH).
   - Obstetrícia GPA: `Gravida` (G), `Para` (P), `Cesareas` (PC), `Abortos` (A), `FilhosVivos` (F), `Ectopicas` (E), `NotasObstetricas`.
   - Contracepção: `MetodoAtual`, `TempoUsoMeses`, `MetodosPrevios`, `PretensaoReprodutiva`.
   - Antecedentes Ginecológicos e Cirúrgicos: cirurgias pélvicas, ISTs prévias, histórico familiar de câncer de mama/ovário.
   - `CreatedAt`, `UpdatedAt`.
2. `GynecologicalConsultationRecord` (Extensão Especializada do Atendimento / `MedicalRecord`):
   - Integrado à entidade `MedicalRecord` existente (ou associado 1:1 a ela), com:
     - `Dum` (DateOnly?), `DumIncerta` (bool), `Menopausada` (bool).
     - `QueixaGinecologicaPrincipal` (string), `HmaGinecologica` (string).
     - `VidaSexualAtiva` (bool?), `Dispareunia` (string: Ausente, Superficial, Profunda, NaoInformada).
     - **Segmentos do Exame Físico Estruturado [MED-03]:**
       - Cada segmento (Mamas, Abdome, Genitália Externa, Especular, Toque Bimanual) estruturado com: `IsNormal` (bool), `Achados` (string?), `Descricao` (string?).
     - `ProcedimentoRealizado` (string?, lote, observações).
     - `DiagnosticosJson` (lista de itens com CID, descrição, tipo Hipótese vs Confirmado).
     - `PrescricaoMedicamentosa` (string?), `OrientacoesGerais` (string?) — [MED-04].
3. `PreventiveScreeningRecord` (Histórico de Rastreamento Preventivo Longitudinal):
   - `Id`, `ClinicId`, `PatientId`, `MedicalRecordId?`.
   - `ExamType` (Citopatologico, PesquisaHPV, Mamografia, UltrassomTransvaginal, Colposcopia) — [MED-02].
   - `PerformedAt` (DateOnly), `ResultSummary` (string), `Classification` (ex: BI-RADS 2, Negativo/Bethesda, HPV Negativo, etc.), `NextDueDate` (DateOnly?).

---

## 5. Contratos de API (Endpoints Minimal API)

### 5.1. Endpoints do Histórico Longitudinal
- `GET /api/v1/medical-records/patients/{patientId:guid}/gynecological-profile`
  - Retorna o perfil ginecológico e obstétrico cumulativo da paciente.
- `PUT /api/v1/medical-records/patients/{patientId:guid}/gynecological-profile`
  - Cria ou atualiza o perfil gineco-obstétrico longitudinal.
- `GET /api/v1/medical-records/patients/{patientId:guid}/screenings`
  - Retorna a lista cronológica de rastreamentos preventivos (Papanicolau, HPV, Mamografia, USG).
- `POST /api/v1/medical-records/patients/{patientId:guid}/screenings`
  - Adiciona registro de rastreamento preventivo.

### 5.2. Endpoints da Consulta Ginecológica Ativa
- `GET /api/v1/medical-records/{id:guid}/gynecological`
  - Retorna os dados ginecológicos da consulta correspondente ao `MedicalRecord`.
- `PUT /api/v1/medical-records/{id:guid}/gynecological`
  - Atualiza em rascunho os dados clínicos e o exame físico ginecológico da consulta.
- Endpoints existentes preservados e integrados:
  - `POST /api/v1/medical-records/start`
  - `PUT /api/v1/medical-records/{id:guid}/draft`
  - `POST /api/v1/medical-records/{id:guid}/finalize`
  - `POST /api/v1/medical-records/{id:guid}/addenda`
  - `GET /api/v1/medical-records/history/{patientId:guid}`

---

## 6. Arquitetura Frontend & Ergonomia (UI/UX)

1. **Aba de Atendimento no DoctorWorkspace:**
   - **Barra de Status de Atendimento:**
     - Resumo fixo da paciente: Idade, G_P_A_F, DUM atual, Método Contraceptivo, Alergias (badge de alerta).
     - **Indicador de Auto-Save [UI-02]:** *"✅ Rascunho salvo às 10:45"* ou *"💾 Salvando alterações..."*.
   - **Navegação Contínua com Menu Lateral / Âncoras (Scroll Spy) [UI-01]:**
     - Em vez de abas rígidas que escondem dados vitais, blocos sequenciais claros com menu de acesso rápido:
       1. **Anamnese & Queixa Atual:** DUM com seletor rápido ("Regular", "DUM Incerta", "Menopausada"), queixa principal e HMA.
       2. **Exame Físico Ginecológico Dirigido [UI-04]:**
          - Controles segmentados (*Segmented Control*) para cada área:
            `[ Sem alterações (Normal) ]` vs `[ Detalhar achado alterado ]`.
          - Ao alternar para "Detalhar", transição suave expande campos específicos (ex: quadrante da mama, tipo de leucorreia, mobilidade uterina).
       3. **Rastreamento Preventivo & Procedimentos:**
          - Resumo das datas de exames preventivos anteriores com badges coloridos (ex: ⚠️ Preventivo pendente > 1 ano [UI-05]).
          - Campo para registrar nova coleta de Papanicolau/HPV na consulta atual ou procedimento ambulatorial (inserção/retirada de DIU com lote).
       4. **Avaliação, Diagnósticos e Prescrição [MED-04]:**
          - Diagnósticos com seletor de status visual (`[ Hipótese ]` em amarelo, `[ Confirmado ]` em verde).
          - Campos segregados para Prescrição Medicamentosa e Orientações Gerais.
   - **Estado Finalizado (Imutável) [UI-03]:**
     - Quando `status === 'finalizado'`, a interface muda para modo leitura estruturado e limpo (sem inputs ativos).
     - Cabeçalho exibe banner de prontuário finalizado com data, hora e CRM do médico assinante.
     - Botão em destaque de alta proeminência: `➕ Registrar Adendo Clínico`.
2. **Visualização Longitudinal no Histórico do Paciente (`DoctorMedicalRecordsPage`):**
   - Cabeçalho com o Perfil Gineco-Obstétrico da paciente (Menarca, Sexarca, Ciclos, GPA, Contracepção).
   - Linha do tempo assistencial exibindo consultas anteriores, adendos emitidos e evolução de exames preventivos.
   - Empty states amigáveis [UI-02] ("Nenhum exame preventivo registrado ainda.") com botão para adicionar novo exame.
3. **Padrão Visual CANAMED:**
   - Respeito integral aos tokens de cor (`--color-primary: #008080`, `--color-secondary: #005F6A`, `--color-accent: #66CDAA`, `--color-surface: #F7FAFC`, `--color-text: #1A202C`).
   - Badges com ícones e textos claros (`⚠️ Atrasado`, `✅ Em dia` — [UI-05]).

---

## 7. Requisitos de Segurança, Auditoria e Conformidade Legal

- **LGPD (Art. 5º, II e Art. 11):** Dados gineco-obstétricos tratados com confidencialidade absoluta. Perfis sem permissão médica (`medical:record_manage`, `medical:record_view`) não conseguem acessar as rotas nem visualizar dados do prontuário.
- **Lei nº 13.787/2018 e CFM:** Finalização marca o prontuário como imutável. Qualquer alteração posterior exige `MedicalRecordAddendum`.
- **Trilha de Auditoria:** Todos os acessos a dados ginecológicos (`GynecologicalProfileViewed`, `GynecologicalProfileUpdated`, `GynecologicalConsultationUpdated`, `ScreeningRecordCreated`) são registrados no `audit_events`.
- **Prevenção de Dados Fictícios em Produção:** Seeds e fixtures somente no ambiente de desenvolvimento/testes.

---

## 8. Estratégia de Testes

- **Testes Unitários (.NET):**
  - Invariantes de `GynecologicalProfile` (validação de menarca, GPA não negativo, consistência de datas).
  - Regras de atualização de rascunho e bloqueio após finalização.
  - Registro de adendos e imutabilidade.
- **Testes de Integração (.NET):**
  - Ciclo completo de endpoints: consulta e atualização de perfil ginecológico, registro de rastreamento preventivo, salvamento e finalização de consulta ginecológica.
- **Testes de Frontend (Vitest):**
  - Renderização das seções ginecológicas no `DoctorWorkspace` e na ficha da paciente.
  - Alternância de exame físico normal vs detalhado.
  - Exibição de histórico obstétrico GPA e preventivos.

---

## 9. Sequência de Implementação em 5 Incrementos

1. **Incremento 1: Entidades de Domínio, Perfil Longitudinal e Persistência:**
   - Criação de `GynecologicalProfile`, `GynecologicalConsultationData`, `PreventiveScreeningRecord`.
   - Mapeamentos EF Core, migração de banco e repositórios.
2. **Incremento 2: Serviços de Aplicação e Contratos de API:**
   - `GynecologicalRecordService`, DTOs, endpoints Minimal API e auditoria.
   - Testes unitários de domínio e aplicação.
3. **Incremento 3: Módulo de Exame Físico e Consulta Ginecológica no Frontend:**
   - Componentes ergonômicos no `DoctorWorkspace` (Anamnese, Exame Mamas, Especular, Toque Bimanual, Diagnósticos Hipótese/Confirmado).
   - Integração com a API de rascunho e finalização.
4. **Incremento 4: Ficha Longitudinal da Paciente e Rastreamento Preventivo:**
   - Visualização da Ficha Gineco-Obstétrica (GPA, menstrual, contracepção) no `DoctorMedicalRecordsPage`.
   - Linha do tempo e controle de preventivos (Papanicolau/Mamografia).
5. **Incremento 5: Testes Integrados, Refinamento Visual e Validações Finais:**
   - Execução de testes de ponta a ponta (`dotnet test`, `npm test`).
   - Pareceres formais dos agentes especialistas (Medical Domain e UI/UX).
