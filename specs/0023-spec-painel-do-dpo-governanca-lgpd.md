# SPEC-0023 — Painel do DPO e Governança LGPD

| Campo | Valor |
| :--- | :--- |
| **ID** | SPEC-0023 |
| **Título** | Painel de Gestão do Encarregado de Dados (DPO), Atendimento de Requisições e Governança LGPD |
| **Status** | Implementada |
| **Versão** | 1.0 |
| **Data** | 2026-10-03 |
| **Autor** | Antigravity AI / Equipe CANAMED |
| **Revisores** | Responsável pelo Projeto CANAMED |
| **Módulos afetados** | backend (Domain, Application, Infrastructure, Api), frontend (Administração / Governança LGPD), banco de dados (schema `privacy`) |
| **ADRs relacionados** | ADR-0003, ADR-0006, ADR-0007, ADR-0008 |

---

## 1. Objetivo

Fornecer ao Encarregado de Proteção de Dados (DPO) e à administração da clínica um painel centralizado de governança e conformidade com a Lei Geral de Proteção de Dados (Lei Federal nº 13.709/2018), permitindo a triagem, tramitação e resposta formal das requisições de titulares de dados recebidas via Portal do Paciente ([SPEC-0018](0018-spec-portal-de-autonomia-e-direitos-do-titular-lgpd.md)) dentro do prazo regulatório de 15 dias, bem como o inventário e Registro das Operações de Tratamento de Dados Pessoais (ROPA - Art. 37 da LGPD).

Pergunta de controle do `GEMINI.md`: **isso reduz atrito na rotina da clínica?**  
Sim. Transforma o cumprimento de obrigações legais complexas e arriscadas da LGPD em um fluxo operacional guiado, prevenindo multas e sanções administrativas da ANPD por perda de prazos legais ou falta de fundamentação jurídica.

---

## 2. Contexto

A [SPEC-0018](0018-spec-portal-de-autonomia-e-direitos-do-titular-lgpd.md) entregou ao paciente a possibilidade de abrir requisições de acesso, correção, revogação e exclusão de dados. No entanto, no lado da clínica, é indispensável que o Encarregado (DPO) disponha de uma mesa de trabalho para analisar cada pedido, verificar eventuais impedimentos legais (como a obrigatoriedade de guarda de prontuários por 20 anos da Lei nº 13.787/2018 e CFM) e registrar a resposta oficial antes do vencimento do prazo.

---

## 3. Escopo

### 3.1 Dentro do escopo
- Painel de Gestão de Requisições de Titulares:
  - Fila unificada de pedidos pendentes com contagem regressiva do prazo legal de 15 dias (Art. 19, II, da LGPD);
  - Alerta de urgência em cores: `Normal` (> 5 dias), `Atenção` (≤ 5 dias), `Crítico / Vencendo Hoje` (≤ 1 dia), `Vencido` (> 15 dias);
  - Tramitação do pedido com alteração de status: `em_analise`, `atendido`, `indeferido`;
  - Despacho com fundamentação jurídica (ex: citação do Art. 16, I da LGPD em pedidos de exclusão de prontuário);
- Registro de Operações de Tratamento de Dados (ROPA - Art. 37):
  - Mapeamento das atividades de tratamento da clínica (Agendamento, Atendimento Clínico/Prontuário, Faturamento, Telemedicina, Notificações);
  - Definição de Finalidade, Base Legal (Tutela da Saúde - Art. 7º, VIII e Art. 11, II, "f"; Cumprimento de Obrigação Legal - Art. 7º, II; Execução de Contrato - Art. 7º, V) e Prazo de Retenção;
- Relatório de Auditoria de Acessos a Prontuários (quem visualizou prontuário de qual paciente, data/hora e IP).

### 3.2 Fora do escopo
- Canal externo de comunicação direta por protocolo automatizado com o sistema da ANPD (a ANPD não possui API pública de protocolo para pequenos agentes).

---

## 4. Atores e Permissões

| Ator | Permissão necessária | Observações |
| :--- | :--- | :--- |
| `gestor`, `admin`, `dpo` | `privacy:admin`, `dpo:manage` | Acesso exclusivo ao painel de atendimento DPO, inventário ROPA e trilha de auditoria. |

---

## 5. Regras de Negócio

| ID | Regra | Justificativa / origem |
| :--- | :--- | :--- |
| **RN-001** | **Controle Rígido do SLA de 15 Dias:** O sistema calcula a data limite (`DueDate = CreatedAt + 15 dias corridos`) conforme expressamente determinado pelo Art. 19, inciso II da LGPD. | Conformidade com a Lei Federal nº 13.709/2018. |
| **RN-002** | **Obrigatoriedade de Parecer Fundamentado em Indeferimentos:** Nenhum pedido pode ser indeferido sem texto explicativo com justificativa legal (mínimo de 20 caracteres) e menção à hipótese legal autorizadora de retenção (ex: Lei nº 13.787/2018). | Art. 18, § 6º da LGPD. |
| **RN-003** | **Notificação Imediata ao Titular:** A resposta cadastrada pelo DPO fica instantaneamente disponível para consulta pública e transparente do paciente mediante protocolo no Portal da Privacidade ([SPEC-0018](0018-spec-portal-de-autonomia-e-direitos-do-titular-lgpd.md)). | Transparência e livre acesso (Art. 6º, IV e VI da LGPD). |
| **RN-004** | **Inviolabilidade da Trilha de Auditoria:** Registros de acessos aos prontuários e exportações de dados não podem ser editados ou expurgados por nenhum usuário do sistema. | S-RES / SBIS e Resolução CFM nº 1.821/2007. |

---

## 6. Fluxos

### 6.1 Análise e Resposta de Requisição pelo DPO
1. O DPO acessa o menu `Governança LGPD > Requisições de Titulares`.
2. O sistema lista as requisições ordenadas pelas mais próximas do vencimento do prazo de 15 dias.
3. O DPO seleciona uma solicitação (ex: protocolo `REQ-202610-8912` de "Exclusão de Dados").
4. O DPO confere o pedido e seleciona a ação:
   - Se for exclusão de prontuário: seleciona `indeferido` e preenche o parecer fundamentado: *"Os dados de prontuário médico devem ser mantidos por 20 anos em cumprimento à Lei Federal nº 13.787/2018 e Resolução CFM nº 1.821/2007, configurando hipótese autorizadora do Art. 16, I da LGPD."*
   - Se for correção de telefone/e-mail: atende a solicitação e marca `atendido`.
5. O sistema atualiza o status, grava a data/hora e o nome do DPO responsável e disponibiliza o resultado no protocolo do paciente.

---

## 7. Critérios de Aceitação

- [x] Listagem de solicitações com indicador de SLA regressivo de 15 dias e alertas visuais de prazo.
- [x] Registro de parecer do DPO com validação de fundamentação em indeferimentos.
- [x] O paciente consegue visualizar a resposta imediatamente pelo protocolo.
- [x] Mapeamento ROPA estruturado com finalidades, bases legais e prazos de guarda.
- [x] Trilha de auditoria de visualizações de prontuário acessível apenas por perfis autorizados.

---

## 8. Requisitos de Segurança e Legais

- **Segregação Estrita:** Apenas o DPO ou Administrador Geral possuem permissão para deliberar sobre solicitações de privacidade.
- **Rastreabilidade:** Registro completo de todas as decisões tomadas pelo encarregado.
