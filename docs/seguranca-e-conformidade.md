# Segurança e Conformidade — CANAMED

> Consolidado a partir do [`GEMINI.md`](../GEMINI.md). Em caso de divergência, o `GEMINI.md` prevalece.
> Requisitos legais aqui registrados são **obrigatórios** e devem constar na SPEC de cada funcionalidade
> que trate dados pessoais ou de saúde.

- **Versão:** 1.0
- **Data:** 2026-09-28
- **Status:** Vigente

---

## 1. Princípios

Segurança não é etapa posterior: toda implementação nasce segura.

- Security by Design
- Privacy by Design
- Least Privilege
- Defense in Depth
- Fail Secure
- Zero Trust como referência arquitetural

## 2. Controles Obrigatórios

### 2.1 Autenticação

Arquitetura compatível com autenticação forte, múltiplos fatores quando necessário, sessões seguras e
revogação de sessões.

### 2.2 Controle de acesso

Todo acesso é baseado em permissões. **Nunca confiar apenas na interface**: toda autorização deve ocorrer
também no backend, por recurso.

### 2.3 Auditoria

Toda ação relevante gera rastreabilidade — por exemplo: login, logout, alteração de cadastro, visualização
de prontuário, criação, edição, exclusão e exportações.

Os logs devem preservar usuário, data, horário, ação e recurso afetado.

A trilha de auditoria deve ser protegida contra alterações indevidas, conforme requisitos de prontuário
eletrônico e S-RES.

### 2.4 Proteção de dados

- criptografia em trânsito;
- criptografia em repouso;
- criptografia em backups quando aplicável.

### 2.5 Senhas e segredos

- nunca armazenar senhas em texto puro;
- usar algoritmos modernos de hash apropriados para credenciais;
- nunca armazenar tokens, chaves, certificados ou credenciais no código-fonte;
- utilizar gerenciamento seguro de segredos.

### 2.6 Backups e continuidade

- backups automatizados;
- recuperação validada;
- retenção definida;
- testes periódicos de restauração;
- toda recuperação deve preservar a integridade dos dados.

### 2.7 Segurança de APIs

Obrigatório considerar: validação de entrada, validação de saída, proteção contra injeções, limitação de
requisições, autenticação adequada, autorização por recurso e versionamento. Referência: OWASP API
Security Top 10.

### 2.8 Segurança de aplicações web

Referência mínima: OWASP Top 10. Atenção especial a XSS, CSRF, SQL Injection, Broken Access Control,
Security Misconfiguration e Vulnerable Components.

## 3. Conformidade Legal Brasileira

### 3.1 LGPD — Lei nº 13.709/2018 (obrigatória)

Princípios obrigatórios: finalidade, adequação, necessidade, livre acesso, qualidade dos dados,
transparência, segurança, prevenção e responsabilização.

Informações de saúde são **dados sensíveis** e exigem proteção reforçada, respeitando as hipóteses legais
específicas da LGPD.

O sistema deve permitir evolução para atender direitos do titular: confirmação de tratamento, acesso,
correção, anonimização quando aplicável, portabilidade quando cabível e informação sobre compartilhamentos.

Governança (Art. 50): o projeto deve permitir inventário de dados, políticas internas, gestão de riscos e
registro de tratamento.

### 3.2 Lei nº 13.787/2018 — digitalização e guarda do prontuário

Obrigatória caso o sistema trabalhe com prontuário eletrônico.

Requisitos: integridade, autenticidade, confidencialidade, proteção contra alterações indevidas e
armazenamento seguro.

Guarda mínima: retenção de **20 anos** após o último registro. Processos de digitalização, quando
aplicáveis, devem preservar valor probatório e utilizar certificação prevista na legislação
(ICP-Brasil quando exigida).

### 3.3 CFM e NGS2

Manter compatibilidade com os princípios do prontuário eletrônico do CFM: controle de acesso, trilha de
auditoria, integridade dos registros, identificação do profissional responsável e armazenamento seguro.

Ao evoluir para prontuário eletrônico certificado, considerar os requisitos do Nível de Garantia de
Segurança 2 (NGS2) da certificação SBIS/CFM.

### 3.4 ICP-Brasil

Sempre que houver assinatura digital com valor jurídico para documentos clínicos, utilizar padrões
compatíveis com a ICP-Brasil.

### 3.5 Código de Ética Médica

O sistema deve permitir que profissionais cumpram suas obrigações éticas, com atenção a elaboração do
prontuário, preservação do sigilo, rastreabilidade e identificação do responsável pelo registro.

### 3.6 COFEN — Resolução nº 754/2024

Caso existam registros de enfermagem, suportar requisitos compatíveis com o prontuário eletrônico de
enfermagem: identificação individual, rastreabilidade, compartilhamento seguro e assinatura compatível.

### 3.7 ANVISA — RDC nº 657/2022

Enquanto permanecer exclusivamente como software administrativo e de gestão, a categoria pode não se
enquadrar como Software como Dispositivo Médico (SaMD). O impacto regulatório deve ser **reavaliado** se
forem adicionadas funcionalidades de diagnóstico automatizado, suporte clínico com recomendações
terapêuticas ou algoritmos de decisão clínica.

## 4. Normas Técnicas de Referência

Mesmo quando não obrigatórias inicialmente, orientam decisões arquiteturais:

- ISO/IEC 27001 — Gestão da Segurança da Informação
- ISO/IEC 27002 — Controles de Segurança
- ISO/IEC 27017 — Segurança em Nuvem
- ISO/IEC 27018 — Proteção de Dados Pessoais na Nuvem
- ISO/IEC 27701 — Gestão de Privacidade
- ISO/IEC 29134 — Avaliação de Impacto à Privacidade
- ISO/IEC 29151 — Proteção de Informações Pessoais

## 5. Requisitos Futuros de Saúde Digital

Preparar a arquitetura para futuras integrações com: certificados digitais, prescrições eletrônicas,
prontuário certificado, serviços oficiais de saúde e interoperabilidade quando definida.

Não implementar integrações fictícias: toda integração segue documentação oficial correspondente.

## 6. Regras de Dados e Segredos (desenvolvimento)

- **Nunca** usar dados reais de pacientes em desenvolvimento ou testes: usar dados fictícios, sintéticos,
  fixtures, mocks e seeds não reais.
- **Nunca** copiar dados pessoais reais para arquivos de teste, logs, screenshots, repositórios, ambientes
  de desenvolvimento, prompts ou serviços externos.
- **Nunca** imprimir segredos no terminal sem necessidade, adicionar segredos ao Git ou colocar tokens,
  senhas e chaves privadas em código, SPECs ou documentação.
- Verificar se `.env`, `.env.*`, `*.pem`, `*.key`, `credentials.*` e `secrets.*` permanecem cobertos pelo
  [`.gitignore`](../.gitignore).

## 7. Checklist Mínimo por Entrega

Antes de considerar uma funcionalidade concluída, confirmar:

- [ ] SPEC aprovada com requisitos de segurança e legais preenchidos.
- [ ] Autorização verificada no backend, não apenas na interface.
- [ ] Ações relevantes gerando trilha de auditoria.
- [ ] Dados sensíveis criptografados em trânsito e em repouso.
- [ ] Entradas e saídas validadas (OWASP Top 10 / OWASP API Top 10).
- [ ] Nenhum segredo no código ou no versionamento.
- [ ] Nenhum dado real utilizado em testes.
- [ ] Impacto em retenção/guarda avaliado quando houver prontuário.
- [ ] Documentação e ADRs atualizados.

## 8. Vulnerabilidades Conhecidas e Aceitas

### Dependência de desenvolvimento

| Pacote | Severidade | Situação | Justificativa |
| :--- | :--- | :--- | :--- |
| `@vitest/mocker` (via `vitest`) | Moderada — *Path Traversal / Arbitrary File Read* (GHSA-82fw-gwwq-j7x9) | **Aceita temporariamente** | Afeta apenas a ferramenta de testes. `npm audit --omit=dev` reporta **0 vulnerabilidades** nas dependências de produção. A correção exige `vitest@5`, mudança incompatível com o Node.js 20.10.0 do ambiente atual. Reavaliar após atualizar o Node.js |

### Regras

- Vulnerabilidade em dependência **de produção** não é aceita: deve ser corrigida antes de qualquer release.
- Toda vulnerabilidade aceita exige justificativa registrada aqui e prazo de reavaliação.
- Verificações obrigatórias: `npm audit --omit=dev` no frontend e **NuGet Audit** no backend.
- O NuGet Audit permanece habilitado e bloqueando o build. Ele já detectou e impediu o uso de
  `Microsoft.OpenApi` 2.0.0 (advisory GHSA-v5pm-xwqc-g5wc), resolvido ao subir
  `Microsoft.AspNetCore.OpenApi` para 10.0.12.

## Referências

- [`GEMINI.md`](../GEMINI.md) — requisitos completos de segurança e conformidade.
- [`PROJECT_BRIEF.md`](../PROJECT_BRIEF.md) — brief consolidado.
- [`docs/visao-produto.md`](visao-produto.md) — visão funcional.
