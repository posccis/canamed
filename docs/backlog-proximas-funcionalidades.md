# Backlog de Próximas Funcionalidades — CANAMED

> Lista consolidada e priorizada do que ainda **não** existe no produto. Reúne as diretrizes estratégicas de [`PROJECT_BRIEF.md`](../PROJECT_BRIEF.md) e [`GEMINI.md`](../GEMINI.md), as pendências regulatórias (CFM, LGPD, ANVISA, Lei nº 13.787/2018) e as necessidades operacionais de clínicas de saúde.
>
> **Regra fundamental:** nenhum item entra em implementação sem SPEC aprovada ([`specs/README.md`](../specs/README.md)). A priorização abaixo segue a ordem estratégica definida para o produto: **1º Visão do Médico**, **2º Visão do Paciente**, **3º Visão da Administração** e **4º Infraestrutura**.

- **Versão:** 2.1
- **Data:** 2026-10-03
- **Estado atual do produto:** SPECs 0001 a 0025 **implementadas e testadas**; a SPEC-0026 (superfícies dedicadas e links compartilháveis) foi **aprovada** e recebeu sua **primeira entrega em *path***, mantendo cadastro completo e lista de espera para as próximas fases.

---

## Progresso Atual (Funcionalidades Concluídas)

| Item | Descrição | Situação |
| :--- | :--- | :--- |
| **SPEC-0001** | Fundação do monorepo .NET 10 + React, PostgreSQL, migrations e health checks | **Implementado** |
| **SPEC-0002** | Gestão de agenda (criar, listar, remarcar, cancelar com motivo e bloqueio) | **Implementado** |
| **SPEC-0003** | Autenticação por cookies seguros, RBAC multi-clínica, MFA TOTP e auditoria append-only | **Implementado** |
| **SPEC-0004** | Catálogo assistencial (natureza, custeio, especialidade) e gestão de pacientes (D-01 a D-03) | **Implementado** |
| **SPEC-0005** | Fila de espera, prioridades (normal/preferencial), chamada e ciclo de atendimento | **Implementado** |
| **SPEC-0006** | Gestão de convênios, salas físicas, horários semanais e calendário de feriados | **Implementado** |
| **SPEC-0007** | Painel gerencial / Dashboard com métricas de ocupação, espera, salas e produção médica | **Implementado** |
| **SPEC-0008** | Fluxo de pagamento no balcão (dinheiro, PIX, débito, crédito, convênio), estorno e recibo | **Implementado** |
| **SPEC-0009** | Apoio à triagem com sinais vitais completos, IMC e Protocolo de Manchester na fila | **Implementado** |
| **SPEC-0010 a 0013** | Prontuário eletrônico (SOAP), documentos clínicos, consultório virtual e gestão de retornos | **Implementado** |
| **SPEC-0014** | Notificações e lembretes ativos (WhatsApp/SMS simulados e opt-out) | **Implementado** |
| **SPEC-0015 a 0018** | Portal do paciente, carteira digital, check-in autônomo e privacidade LGPD | **Implementado** |
| **SPEC-0019 a 0025** | Caixa, painel de TV, repasses, estoque, DPO, multi-clínica e políticas de encaixe | **Implementado** |
| **SPEC-0026** | Superfícies dedicadas por URL, Central de Links, tokens de capacidade, confirmação, cancelamento, reagendamento, check-in digital e fila por etapa | **Primeira entrega (em *path*)** |
| **SPEC-UI-001** | Design System oficial CANAMED, sidebar retrátil, busca global (`Ctrl+K`) e exportação CSV | **Implementado** |

### Pendências da SPEC-0026 (próximas entregas)

| Item | Descrição | Esforço |
| :--- | :--- | :--- |
| Cadastro completo com validação da recepção | `patient_registration_drafts`, link `registration` e fila de revisão da recepção | M |
| Reposição de vaga por lista de espera | `waitlist_entries`, oferta por link de validade curta e aceite | M |
| Sessão do paciente isolada por superfície | Deixar de usar `localStorage` compartilhado com o operador (D-05) | P |
| Links nos lembretes | Notificações apontando para os links L-07 a L-12 em vez do token de sessão | P |
| E2E mobile das jornadas do paciente | Playwright em viewport mobile para agendar, confirmar, cancelar, check-in e fila (D-08) | M |

---

## Escala de Esforço e Complexidade

| Escala | Esforço | Complexidade |
| :--- | :--- | :--- |
| **P / Baixa** | até 1 dia | regra simples, sem integração externa, sem dado sensível novo |
| **M / Média** | 2 a 5 dias | múltiplos fluxos/telas, testes de integração/E2E, decisão de produto |
| **G / Alta** | 1 a 3 semanas | integração externa, dado sensível de saúde (LGPD), requisito legal (CFM/ICP-Brasil), concorrência ou segurança |

---

## 1. Visão do Médico (Prioridade 1)

Foco em capacitar o profissional de saúde a realizar o atendimento clínico com agilidade, segurança jurídica e conformidade ética e regulatória, minimizando tempo em burocracia e maximizando o cuidado ao paciente.

| # | Funcionalidade | Descrição curta | Esforço | Complexidade | Dependências / Requisitos | SPEC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M-01** | Prontuário Eletrônico do Paciente (PEP) | Registro clínico estruturado (modelo SOAP: Subjetivo, Objetivo, Avaliação, Plano), histórico cronológico contínuo de atendimentos, imutabilidade após finalização com adendos justificados e retenção mínima de 20 anos. | G | Alta | Lei nº 13.787/2018, CFM NGS2, LGPD Art. 11 (dados sensíveis). | [SPEC-0010](../specs/0010-spec-prontuario-eletronico-do-paciente.md) |
| **M-02** | Prescrição Eletrônica, Atestados e Exames | Emissão estruturada de receitas médicas, atestados com consentimento para CID-10, laudos e pedidos de exames com assinatura digital padrão ICP-Brasil (PAdES/A1/A3) e QR Code de validação pública. | G | Alta | MP 2.200-2/2001, Lei 14.063/2020, CFM, farmácias digitais. | [SPEC-0011](../specs/0011-spec-prescricao-eletronica-atestados-e-documentos-clinicos.md) |
| **M-03** | Consultório Virtual / Workspace Médico | Tela de trabalho unificada para o médico: visualização em tempo real da fila de espera do profissional, chamada integrada do próximo paciente, acesso instantâneo aos sinais vitais da triagem e alertas persistentes de alergias/comorbidades. | M | Média | SPEC-0005, SPEC-0009, M-01. | [SPEC-0012](../specs/0012-spec-consultorio-virtual-e-workspace-medico.md) |
| **M-04** | Gestão de Retornos e Prazos Assistenciais | Regras de carência configuráveis por clínica e especialidade (ex: 15, 21 ou 30 dias corridos), identificação automática no agendamento e atendimento, e validação de continuidade do tratamento conforme Resolução CFM nº 1.958/2010. | P | Média | SPEC-0002, SPEC-0004, SPEC-0008. | [SPEC-0013](../specs/0013-spec-gestao-de-retornos-e-prazos-assistenciais.md) |

---

## 2. Visão do Paciente (Prioridade 2)

Foco em autonomia, redução do tempo de espera, engajamento e redução de faltas (*no-show*), além do acesso transparente aos seus registros assistenciais e respeito à sua privacidade.

| # | Funcionalidade | Descrição curta | Esforço | Complexidade | Dependências / Requisitos | SPEC Prevista |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C-01** | Notificações e Lembretes Ativos (WhatsApp/SMS) | Disparo automatizado de mensagens de lembrete de consulta (48h e 24h antes) com confirmação ou cancelamento ativo pelo paciente via WhatsApp, refletindo instantaneamente na agenda da clínica. | G | Alta | Provedor de mensageria (WhatsApp Business API), LGPD (consentimento e opt-out). | SPEC-0014 |
| **C-02** | Agendamento Online / Portal do Paciente | Interface pública ou portal autenticado via link mágico/SMS para o próprio paciente selecionar especialidade, médico, horário disponível e realizar pré-agendamento ou pagamento online. | G | Média | SPEC-0002, gateway de pagamento online. | SPEC-0015 |
| **C-03** | Acesso Digital a Documentos e Receitas | Link seguro via SMS/WhatsApp para o paciente visualizar e fazer download dos PDFs assinados digitalmente das suas prescrições, atestados e pedidos de exame. | M | Média | M-02 (assinatura ICP-Brasil), armazenamento seguro. | SPEC-0016 |
| **C-04** | Check-in Autônomo na Recepção (Totem / QR Code) | Totem de autoatendimento ou QR Code na entrada da clínica para o paciente confirmar chegada de forma autônoma e retirar senha de fila sem passar pelo balcão. | M | Média | SPEC-0005 (Fila de espera). | SPEC-0017 |
| **C-05** | Portal de Autonomia e Direitos do Titular (LGPD) | Canal simplificado para o paciente solicitar confirmação de tratamento, relatório de dados cadastrais e exercer direitos de titular previstos no Art. 18 da LGPD. | M | Alta | LGPD, política de privacidade, encarregado de dados. | SPEC-0018 |

---

## 3. Visão da Administração (Prioridade 3)

Foco em eficiência operacional da recepção, saúde financeira da clínica, governança e conformidade administrativa contínua.

| # | Funcionalidade | Descrição curta | Esforço | Complexidade | Dependências / Requisitos | SPEC Prevista |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A-01** | Fechamento e Conferência de Caixa por Operador | Relatório diário de fechamento de caixa por operador/turno, conferência de sangria e conciliação de valores físicos na gaveta vs. transações registradas no sistema. | P | Baixa | SPEC-0008 (Pagamentos no balcão). | SPEC-0019 |
| **A-02** | Painel de Chamada para TV na Recepção (Tempo Real) | Interface dedicada em modo TV/quiosque para a sala de espera com sonorização (campainha/voz sintética) e atualização em tempo real (SSE/SignalR) ao ser acionada pelo médico. | M | Média | SPEC-0005, M-03. | SPEC-0020 |
| **A-03** | Gestão Financeira Avançada e Repasses Médicos | Módulo de cálculo de repasse/comissionamento por profissional (percentual ou valor fixo sobre consultas/procedimentos), contas a pagar/receber e DRE simplificado da clínica. | G | Alta | SPEC-0008, regras contratuais médicas. | SPEC-0021 |
| **A-04** | Gestão de Insumos e Materiais Médicos (Estoque) | Controle básico de estoque da sala de curativos, medicamentos e descartáveis consumidos durante os atendimentos na clínica. | M | Média | Cadastro de itens, movimentações de estoque. | SPEC-0022 |
| **A-05** | Painel do DPO / Governança LGPD | Gestão interna de pedidos de titulares, controle de consentimentos, inventário de dados de saúde e relatório de conformidade regulatória. | M | Média | LGPD Art. 50, trilha de auditoria (SPEC-0003). | SPEC-0023 |
| **A-06** | Alternância de Multi-clínica na Interface | Seletor na barra superior (Topbar) para que gestores e profissionais com vínculo em mais de uma filial alternem dinamicamente o contexto da clínica ativa. | P | Baixa | SPEC-0003 (API de clínicas já existente). | SPEC-0024 |
| **A-07** | Políticas Parametrizáveis de Encaixe e Cancelamento | Configuração por clínica de cotas diárias de overbooking/encaixe por médico e prazos mínimos de cancelamento sem penalidade (D-04 e D-05). | P | Baixa | SPEC-0002, SPEC-0006. | SPEC-0025 |

---

## 4. Infraestrutura (Infra) (Prioridade 4)

Foco em segurança de produção, alta disponibilidade, observabilidade, conformidade legal de custódia e esteira automatizada de entregas.

| # | Funcionalidade | Descrição curta | Esforço | Complexidade | Dependências / Requisitos | SPEC Prevista |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T-01** | Hospedagem em Nuvem Nacional e Criptografia em Repouso | Provedor de nuvem em região brasileira (São Paulo / LGPD), criptografia em repouso gerenciada (KMS/TDE) e rede isolada (VPC). | M | Alta | Decisão de infraestrutura e conta em nuvem. | ADR dedicado |
| **T-02** | Rotinas Automatizadas de Backup e Testes de Restauração | Script de backup contínuo do PostgreSQL com retenção legal de 20 anos (WORM/Object Lock para prontuários) e testes periódicos de restauração verificados. | M | Média | T-01, Lei nº 13.787/2018. | SPEC-0026 |
| **T-03** | Pipeline de CI/CD Automatizado (GitHub Actions) | Execução de lint, `dotnet build`, `dotnet test`, `npm run build`, `npm run test` e testes E2E do Playwright a cada Pull Request e deploy automatizado. | M | Média | Repositório remoto, GitHub Actions. | SPEC-0027 |
| **T-04** | Observabilidade de Produção, APM e Logs Estruturados | Instrumentação com OpenTelemetry e Serilog estruturado com correlação por `traceId`, métricas de latência e integração com Sentry/Loki/Grafana. | M | Média | T-01. | SPEC-0028 |
| **T-05** | Containerização de Produção (Docker) | `Dockerfile` multi-stage otimizado para o backend ASP.NET Core (.NET 10) e SPA React (Nginx), com `docker-compose.prod.yml`. | P | Baixa | Docker. | SPEC-0029 |
| **T-06** | Hardening de Segurança e Rate Limiting Global | Ampliação do Rate Limiting para todas as rotas de API sensíveis e cabeçalhos HTTP rígidos (HSTS, CSP, X-Frame-Options, Permissions-Policy). | P | Baixa | OWASP API Security Top 10. | SPEC-0030 |
| **T-07** | Serviço Transacional de E-mail (Esqueci Minha Senha e Convites) | Provedor transacional (Resend, SendGrid ou Amazon SES) com SPF, DKIM e DMARC para autoatendimento de senha e convites seguros de operadores. | P | Média | Provedor de e-mail e domínio institucional. | SPEC-0031 |
| **T-08** | Códigos de Recuperação de MFA (Backup Codes) | Geração de conjunto de códigos hash de uso único para recuperação de conta quando o autenticador TOTP for perdido pelo usuário. | P | Média | SPEC-0003. | SPEC-0032 |

---

## Integrações Externas Previstas e Uso de Adaptadores Simulados

Nenhum serviço externo pago é exigido para desenvolvimento local e testes. Cada integração externa conta com **adaptador simulado (mock)** e documentação dos pré-requisitos para ativação em produção:

| Recurso | Integração Real | Adaptador Simulado (DEV/TEST) | Pré-requisitos para Produção |
| :--- | :--- | :--- | :--- |
| **M-02** | Certificado Digital ICP-Brasil | Emissor simulado com assinatura criptográfica RSA local e carimbo do tempo simulado | Certificado A1/A3 de médico e autoridade certificadora credenciada ITI |
| **C-01** | WhatsApp Business API / SMS | Adaptador em memória que registra as mensagens enviadas em log | Conta na Meta/Twilio/Z-API, número oficial homologado e templates aprovados |
| **T-07** | Envio de e-mails transacionais | Gravador de e-mails em arquivo local / console | Domínio próprio configurado com SPF/DKIM/DMARC e conta de envio |
| **T-04** | APM / Coleta de Logs de Produção | Coletor estruturado Serilog em arquivo e console | Instância do Sentry/Seq/Grafana Cloud |
| **C-02** | Gateway de Pagamento Online | Provedor simulado com aprovação imediata e geração de QR Code PIX fake | Contrato com adquirente/gateway e credenciamento PCI-DSS |

---

## Referências

- [`specs/`](../specs) — especificações aprovadas e em desenvolvimento.
- [`GEMINI.md`](../GEMINI.md) — princípios e requisitos legais inegociáveis do produto.
- [`PROJECT_BRIEF.md`](../PROJECT_BRIEF.md) — escopo de negócio e diretrizes.
- [`docs/seguranca-e-conformidade.md`](seguranca-e-conformidade.md) — governança, LGPD, CFM, ANVISA e segurança.
