# CANAMED — Briefing do Projeto

> Documento de referência para todo o desenvolvimento do CANAMED.
>
> Este documento define os princípios, objetivos e características fundamentais do projeto. Ele deve ser tratado como uma fonte de verdade de alto nível. Nenhuma decisão de design, produto, conteúdo ou implementação deve contradizer estes princípios sem uma atualização explícita deste documento.

---

# Visão do Projeto

O **CANAMED** é uma plataforma especializada na operação e gestão de **clínicas ginecológicas**, criada com o objetivo de reduzir burocracias, aumentar a eficiência operacional e melhorar a experiência tanto dos profissionais de saúde quanto das pacientes.

O projeto parte da premissa de que clínicas ginecológicas necessitam de fluxos clínicos e administrativos fluidos, acolhedores e precisos, transformando processos manuais, demorados e fragmentados em rotinas simples, intuitivas e seguras.

Nesta fase do produto, o foco principal de desenvolvimento é o **Prontuário Eletrônico do Paciente (PEP) especializado em ginecologia**, concebido para atender à profundidade do atendimento da saúde da mulher sem impor burocracia ou rigidez desnecessária ao profissional assistencial.

**Tagline do projeto:**

> **Eficiência Para Quem Mais Precisa.**

---

# Missão

Construir uma plataforma que permita que clínicas ginecológicas dediquem menos tempo à operação burocrática e mais tempo ao acolhimento e atendimento qualificado de suas pacientes.

Cada funcionalidade deve responder à pergunta:

> "Isso reduz atrito na rotina da clínica?"

Se a resposta não for claramente positiva, a funcionalidade deve ser reavaliada.

---

# Objetivos Principais

O CANAMED deve buscar constantemente:

- simplificar a operação diária e o fluxo ambulatorial da clínica ginecológica;
- estruturar o registro clínico especializado sem burocracia excessiva;
- reduzir retrabalho e dupla digitação entre recepção, agendamento e consultório;
- diminuir o tempo gasto com tarefas administrativas;
- oferecer uma experiência intuitiva e acolhedora para pacientes e profissionais;
- fornecer informações clínicas longitudinais organizadas para apoiar decisões assistenciais;
- criar uma base sólida, segura e interoperável para o crescimento do produto.

---

# Público-Alvo

O produto é direcionado principalmente para:

- clínicas ginecológicas e obstétricas ambulatoriais;
- médicos ginecologistas e profissionais de saúde da mulher;
- gestores de clínicas ginecológicas;
- recepcionistas e equipe de atendimento;
- pacientes de clínicas ginecológicas (através de superfícies dedicadas e seguras).

O primeiro foco comercial é o mercado brasileiro, especialmente clínicas de pequeno e médio porte.

Regiões prioritárias do projeto:

- Recife
- Gravatá
- Caruaru
- Garanhuns
- Petrolina
- Agreste Pernambucano

Essa prioridade representa uma estratégia inicial de atuação e não limita a evolução futura do produto.

---

# Proposta de Valor

O CANAMED une a gestão operacional da clínica com a profundidade necessária ao atendimento clínico ginecológico em uma experiência única, acolhedora e integrada.

A plataforma deve priorizar:

- simplicidade e ausência de sobrecarga cognitiva;
- rapidez e fluidez no consultório;
- organização e visão longitudinal do histórico da paciente;
- confiança, integridade e sigilo absoluto dos dados de saúde;
- clareza nas informações e na interface.

O sistema deve transmitir sensação de controle e previsibilidade, nunca de complexidade.

---

# Escopo do Produto e Especialização em Ginecologia

O CANAMED especializa-se no atendimento a clínicas ginecológicas, preservando a infraestrutura e os módulos de suporte já consolidados (agenda interna, recepção/fila, cobrança básica e superfícies segregadas).

O módulo central prioritário de desenvolvimento é o **Prontuário Eletrônico do Paciente (PEP) especializado em ginecologia**, estruturado para cobrir:

- Cadastro e identificação rigorosa da paciente.
- Histórico clínico longitudinal e linha do tempo assistencial.
- Anamnese ginecológica contextualizada.
- Histórico menstrual (menarca, ciclo, duração, regularidade, fluxo, data da última menstruação - DUM, menopausa).
- Histórico obstétrico (gestações, partos vaginais, cesáreas, abortos, filhos vivos, complicações prévias - GPA).
- Histórico contraceptivo e reprodutivo (método em uso, métodos prévios, tempo de uso, planejamento reprodutivo).
- Exame físico geral e ginecológico (exame das mamas, abdome, genitália externa, exame especular, toque bimanual).
- Diagnósticos, hipóteses diagnósticas e evolução clínica fundamentada.
- Prescrições eletrônicas, solicitações de exames laboratoriais/imagem e atestados/documentos clínicos.
- Resultados e acompanhamento de exames preventivos (rastreamento de câncer do colo do útero / citopatológico / papanicolau, mamografia, ultrassonografia transvaginal).
- Registro de procedimentos ginecológicos ambulatoriais (inserção/remoção de DIU, implantes, biópsias, cauterizações), quando aplicável.
- Segurança, privacidade (LGPD), auditoria inviolável e integridade cronológica dos registros.

### Regras Mandatórias de Escopo:
1. **Não aglutinar tudo em uma tela única:** Os fluxos devem ser organizados de acordo com o contexto clínico, a especialidade e a real necessidade da consulta. O escopo efetivo de cada tela e componente deve ser definido durante o planejamento orientado por SPEC.
2. **Preservação Arquitetural:** A especialização em ginecologia não autoriza a reescrita indiscriminada do sistema. Devem ser preservadas a stack (.NET 10, PostgreSQL, React 19/TypeScript/Vite), padrões de código, testes e configurações existentes.
3. **Limites Explícitos:** Não implementar pré-natal completo de alto risco, reprodução assistida de alta complexidade ou módulos de outras especialidades sem que sejam formalmente aprovados no escopo.

---

# Princípios de Produto

Toda decisão deve respeitar estes princípios.

## 1. Simplicidade acima da complexidade

A solução mais simples que resolve corretamente o problema deve ser priorizada.

## 2. Fluxos intuitivos

O usuário deve conseguir entender a próxima ação naturalmente.

Evitar:

- excesso de etapas;
- telas poluídas;
- decisões desnecessárias.

## 3. Eficiência operacional

Cada funcionalidade deve economizar tempo ou reduzir erros.

## 4. Consistência

A experiência deve parecer construída como um único produto.

Elementos visuais, linguagem, comportamento e organização devem permanecer consistentes.

## 5. Escalabilidade de produto

Mesmo que uma funcionalidade seja simples inicialmente, ela não deve impedir futuras evolões do produto.

---

# Experiência Esperada

O CANAMED deve transmitir:

- profissionalismo;
- confiança;
- organização;
- modernidade;
- agilidade.

A experiência deve evitar aparência de sistema antigo ou excessivamente burocrático.

---

# Linguagem da Interface

A comunicação deve ser:

- clara;
- objetiva;
- amigável;
- profissional.

Evitar:

- jargões desnecessários;
- mensagens confusas;
- textos excessivamente longos.

Sempre que possível, o sistema deve orientar o usuário sobre o próximo passo.

---

# Identidade Visual (Obrigatório)

Existe uma pasta contendo os ativos oficiais da marca.

Essa pasta deve ser considerada a única fonte de verdade da identidade visual.

## Regras obrigatórias

- utilizar exclusivamente as logomarcas oficiais presentes na pasta;
- utilizar as cores definidas nos arquivos da identidade visual;
- utilizar os elementos gráficos oficiais quando apropriado;
- respeitar proporções e variações das logomarcas existentes;
- não criar novas versões da marca;
- não inventar paleta de cores;
- não substituir os ativos oficiais por versões recriadas.

Caso alguma informação visual seja necessária e não esteja explícita neste documento, ela deve ser obtida diretamente dos arquivos existentes na pasta da identidade visual.

---

Ambiente de Desenvolvimento (Obrigatório)
Responsabilidade do Agente

Antes de iniciar qualquer implementação, o Gemini deve validar se o ambiente de desenvolvimento está preparado.

Caso alguma ferramenta obrigatória esteja ausente, ele deve:

detectar automaticamente a ausência;

solicitar apenas as permissões necessárias;

instalar a ferramenta no disco D: sempre que tecnicamente possível;

evitar instalar ferramentas pesadas no disco C:, exceto quando a própria ferramenta exigir.

Local padrão de instalação

Sempre priorizar caminhos como:

D:\Dev\
D:\Tools\
D:\SDKs\
D:\Projects\

Nunca criar estruturas desorganizadas espalhadas pelo sistema.

Ferramentas esperadas

O agente deve verificar e instalar quando necessário:

Desenvolvimento

Git

Git LFS (caso necessário)

Node.js (LTS)

npm

pnpm

Bun (opcional)

Docker Desktop

Docker Compose

Visual Studio Code (caso solicitado)

Gemini CLI

OpenJDK (quando necessário)

Python

PowerShell moderno

Windows Terminal

Banco de Dados

Instalar apenas quando fizer parte da necessidade real do projeto.

Ferramentas auxiliares

Postman ou alternativa equivalente

Insomnia (opcional)

GitHub CLI

7-Zip

Regras de instalação

O agente deve:

evitar reinstalar softwares já existentes;

reutilizar instalações existentes;

configurar variáveis de ambiente quando necessário;

validar funcionamento após instalação;

registrar todas as alterações realizadas.

Estrutura de Documentação (Obrigatória)

O projeto deve possuir documentação viva.

Hierarquia mínima
/docs
/specs
/adr
/assets
/docs

Documentação funcional.

Exemplos:

visão do produto

fluxos

regras de negócio

guias do usuário

/specs

Fonte de verdade da implementação.

Toda funcionalidade deve nascer de uma especificação.

/adr

Architecture Decision Records.

Toda decisão importante deve ser registrada.

Cada ADR deve responder:

problema

alternativas

decisão

consequências

/assets

Ativos oficiais.

Incluindo:

logos

identidade visual

ícones

arquivos institucionais

Desenvolvimento Orientado por Especificação
Regra fundamental

Nenhuma funcionalidade deve ser implementada antes de existir uma especificação correspondente.

Fluxo obrigatório:

entender o problema;

criar especificação;

validar impacto;

implementar;

testar;

atualizar documentação.

Conteúdo mínimo de uma especificação

Cada SPEC deve conter:

objetivo

contexto

regras de negócio

fluxos

critérios de aceitação

casos de erro

impacto em outras funcionalidades

requisitos de segurança

requisitos legais aplicáveis

Arquitetura do Produto
Princípios arquiteturais

Independentemente da tecnologia utilizada, a arquitetura deve priorizar:

baixo acoplamento;

alta coesão;

modularidade;

separação clara de responsabilidades;

facilidade de manutenção;

escalabilidade;

observabilidade.

Regras obrigatórias

O agente deve evitar:

código duplicado;

dependências desnecessárias;

regras de negócio espalhadas;

componentes gigantes;

acoplamento entre módulos sem necessidade.

Evolução segura

Toda alteração deve considerar:

compatibilidade com funcionalidades existentes;

impacto em integrações futuras;

facilidade de expansão.

Segurança como Requisito de Produto

Segurança não é uma etapa posterior.

Toda implementação deve nascer segura.

Princípios obrigatórios

Security by Design

Privacy by Design

Least Privilege

Defense in Depth

Fail Secure

Zero Trust como referência arquitetural

Controles Obrigatórios de Segurança
Autenticação

O sistema deve suportar arquitetura compatível com:

autenticação forte;

múltiplos fatores quando necessário;

sessões seguras;

revogação de sessões.

Controle de acesso

Todo acesso deve ser baseado em permissões.

Nunca confiar apenas na interface.

Toda autorização deve ocorrer também no backend.

Auditoria

Toda ação relevante deve gerar rastreabilidade.

Exemplos:

login

logout

alteração de cadastro

visualização de prontuário

criação

edição

exclusão

exportações

Os logs devem preservar:

usuário

data

horário

ação

recurso afetado

A trilha de auditoria deve proteger contra alterações indevidas, conforme os requisitos para prontuário eletrônico e S-RES. 
ByDoctor
+1

Proteção de Dados
Criptografia

Dados sensíveis devem ser protegidos.

Aplicar criptografia:

em trânsito;

em repouso;

em backups quando aplicável.

Senhas

Nunca armazenar senhas em texto puro.

Sempre utilizar algoritmos modernos de hash apropriados para credenciais.

Segredos

Nunca armazenar:

tokens

chaves

certificados

credenciais

dentro do código-fonte.

Utilizar gerenciamento seguro de segredos.

Backups e Continuidade

O projeto deve nascer preparado para recuperação.

Estratégia mínima

backups automatizados;

recuperação validada;

retenção definida;

testes periódicos de restauração.

Toda recuperação deve preservar integridade dos dados.

Segurança de APIs

Toda API deve seguir boas práticas.

Obrigatório considerar:

validação de entrada;

validação de saída;

proteção contra injeções;

limitação de requisições;

autenticação adequada;

autorização por recurso;

versionamento.

As implementações devem seguir como referência o OWASP API Security Top 10.

Segurança de Aplicações Web

Toda interface web deve considerar o OWASP Top 10 como referência mínima de segurança.

Especial atenção para:

XSS

CSRF

SQL Injection

Broken Access Control

Security Misconfiguration

Vulnerable Components

Qualidade do Código

Toda entrega deve priorizar legibilidade.

Regras

nomes claros;

funções pequenas;

responsabilidades únicas;

documentação quando necessária;

remoção de código morto.

Evitar comentários redundantes.

Testabilidade

Toda funcionalidade deve nascer preparada para testes.

Sempre que possível considerar:

testes unitários;

testes de integração;

testes de comportamento;

testes de regressão.

Correções de bugs devem incluir prevenção contra recorrência.

Observabilidade

O sistema deve facilitar diagnóstico.

Deve existir capacidade para

logs estruturados;

rastreamento de erros;

monitoramento;

métricas operacionais;

identificação rápida de falhas.

Performance

A experiência deve permanecer rápida mesmo com crescimento do sistema.

O agente deve evitar:

consultas desnecessárias;

processamento repetitivo;

carregamentos excessivos;

bloqueios evitáveis.

Sempre priorizar soluções escaláveis.

Conformidade Legal e Regulatória (Obrigatória)

O CANAMED lida com dados pessoais sensíveis relacionados à saúde.

Toda implementação deve respeitar integralmente a legislação brasileira.

1. LGPD — Lei nº 13.709/2018

Obrigatória para todo o projeto. 
Presidência da República
+1

Princípios obrigatórios

finalidade;

adequação;

necessidade;

livre acesso;

qualidade dos dados;

transparência;

segurança;

prevenção;

responsabilização.

Dados sensíveis

Informações de saúde possuem proteção reforçada.

O tratamento deve respeitar as hipóteses legais específicas da LGPD.

Direitos do titular

O sistema deve permitir evolução para atendimento de direitos como:

confirmação de tratamento;

acesso aos dados;

correção;

anonimização quando aplicável;

portabilidade quando cabível;

informações sobre compartilhamentos.

Governança

O projeto deve permitir futura implementação de:

inventário de dados;

políticas internas;

gestão de riscos;

registro de tratamento.

Conforme o Art. 50 da LGPD. 
Presidência da República
+1

2. Lei nº 13.787/2018 — Digitalização e Guarda do Prontuário

Obrigatória caso o sistema trabalhe com prontuário eletrônico. 
Presidência da República
+1

Requisitos fundamentais

integridade;

autenticidade;

confidencialidade;

proteção contra alterações indevidas;

armazenamento seguro.

Guarda mínima

Prontuários devem permitir retenção mínima de 20 anos após o último registro, conforme previsto na lei. 
Presidência da República
+1

Digitalização

Quando aplicável, processos de digitalização devem preservar valor probatório e utilizar certificação prevista na legislação, como ICP-Brasil quando exigida. 
Presidência da República
+1

3. Conselho Federal de Medicina (CFM)

O projeto deve permanecer compatível com os princípios do prontuário eletrônico estabelecidos pelo CFM. 
ByDoctor
+1

Requisitos relevantes

controle de acesso;

trilha de auditoria;

integridade dos registros;

identificação do profissional responsável;

armazenamento seguro.

NGS2

Sempre que o produto evoluir para prontuário eletrônico certificado, considerar os requisitos do Nível de Garantia de Segurança 2 (NGS2) da certificação SBIS/CFM. 
ByDoctor
+1

4. ICP-Brasil

Sempre que houver assinatura digital com valor jurídico para documentos clínicos, utilizar padrões compatíveis com a ICP-Brasil. 
Presidência da República
+1

5. Código de Ética Médica

O sistema deve permitir que profissionais cumpram suas obrigações éticas.

Especial atenção para:

elaboração do prontuário;

preservação do sigilo;

rastreabilidade;

identificação do responsável pelo registro. 
Stenci
+1

6. COFEN — Resolução nº 754/2024

Caso existam registros de enfermagem, o sistema deve suportar requisitos compatíveis com o prontuário eletrônico de enfermagem.

Incluindo:

identificação individual;

rastreabilidade;

compartilhamento seguro;

assinatura compatível com as exigências da norma.

7. ANVISA

O CANAMED é concebido como uma plataforma de gestão clínica.

Enquanto permanecer exclusivamente como software administrativo e de gestão, a RDC nº 657/2022 prevê que essa categoria pode não se enquadrar como Software como Dispositivo Médico (SaMD).

Entretanto, caso futuramente sejam adicionadas funcionalidades como:

diagnóstico automatizado;

suporte clínico com recomendações terapêuticas;

algoritmos de decisão clínica;

o impacto regulatório deverá ser reavaliado conforme a RDC nº 657/2022.

Normas Técnicas de Referência

Mesmo quando não obrigatórias inicialmente, estas normas devem orientar decisões arquiteturais.

Segurança

ISO/IEC 27001 — Gestão da Segurança da Informação

ISO/IEC 27002 — Controles de Segurança

ISO/IEC 27017 — Segurança em Nuvem

ISO/IEC 27018 — Proteção de Dados Pessoais na Nuvem

ISO/IEC 27701 — Gestão de Privacidade

ISO/IEC 29134 — Avaliação de Impacto à Privacidade

ISO/IEC 29151 — Proteção de Informações Pessoais

Essas normas são amplamente utilizadas como referência para governança, privacidade e segurança da informação.

Requisitos Futuros de Saúde Digital

O projeto deve ser construído sem bloquear futuras integrações com o ecossistema de saúde.

Preparar arquitetura compatível com futuras integrações como:

certificados digitais;

prescrições eletrônicas;

prontuário certificado;

serviços oficiais de saúde;

interoperabilidade quando definida.

Não implementar integrações fictícias.

Toda integração deverá seguir documentação oficial correspondente.

Regras Permanentes para o Agente

Durante todo o desenvolvimento, o Gemini deve seguir estas regras de forma contínua.

Nunca fazer

inventar identidade visual;

inventar cores;

criar logos alternativas;

ignorar uma SPEC aprovada;

remover rastreabilidade;

reduzir segurança por conveniência;

armazenar segredos no código;

quebrar compatibilidade sem justificativa documentada.

Sempre fazer

ler o PROJECT_BRIEF.md antes de decisões importantes;

consultar os arquivos da identidade visual existentes na pasta;

documentar decisões relevantes em ADR;

criar SPEC antes de implementar funcionalidades;

validar impacto legal em funcionalidades que envolvam dados de saúde;

priorizar simplicidade, segurança e consistência em todas as entregas.

# Restrições Importantes

Durante o desenvolvimento, evitar:

- criar identidade visual própria para o projeto;
- alterar o conceito central do produto;
- transformar o sistema em um ERP genérico sem foco em clínicas ginecológicas;
- priorizar funcionalidades que aumentem complexidade sem gerar ganho operacional claro;
- expandir o escopo para pré-natal completo de alto risco, reprodução assistida ou outras especialidades sem aprovação formal.

---

# Segurança Clínica e Integridade do Prontuário Ginecológico (Obrigatório)

Como plataforma especializada em ginecologia, o CANAMED lida com dados de saúde íntimos e altamente sensíveis. Toda implementação deve seguir estritamente os seguintes requisitos:

1. **Dados Sensíveis e Privacidade Reforçada:** Tratar todas as anotações clínicas, exames preventivos, histórico menstrual, obstétrico e contraceptivo como dados pessoais sensíveis (Art. 5º, II e Art. 11 da LGPD).
2. **Controle de Acesso por Necessidade Assistencial:** Aplicar controle de acesso baseado em papéis (RBAC) estrito. Perfis administrativos e de recepção não devem ter acesso aos campos clínicos do prontuário.
3. **Preservação de Autoria e Rastreabilidade:** Registrar autoria, CRM/conselho, data/hora invioláveis em cada evolução ou documento emitido.
4. **Imutabilidade e Adendos:** Não permitir que registros finalizados ou assinados sejam silenciosamente sobrescritos. Correções devem ocorrer exclusivamente via adendos clínicos justificados e cronológicos (Lei nº 13.787/2018 e CFM).
5. **Auditoria Transparente:** Registrar eventos de auditoria para visualização, criação, retificação e exportação de dados clínicos.
6. **Proteção Documental:** Proteger prescrições, atestados e laudos de exames preventivos.
7. **Diferenciação de Estados de Dados:** Diferenciar claramente na interface e na persistência: campos não preenchidos, informações desconhecidas e achados negativos documentados (ex: ausência de queixas ou exame normal).
8. **Hipóteses vs. Diagnósticos Confirmados:** Não apresentar hipóteses diagnósticas preliminares como diagnósticos definitivos.
9. **Zero Dados Fictícios em Produção:** Jamais gerar dados clínicos de teste ou sintéticos em bancos de dados de produção.
10. **Não Automação de Decisões Clínicas:** Não automatizar condutas ou decisões clínicas sem validação e supervisão humana apropriadas (ANVISA RDC nº 657/2022).

---

# Governança de Agentes Especialistas no Ciclo de Desenvolvimento (Obrigatório)

O desenvolvimento de qualquer funcionalidade, especialmente no módulo de PEP ginecológico, deve cumprir obrigatoriamente o ciclo em quatro fases coordenadas:

### Fase A — Planejamento
1. O agente planejador delimita o escopo da funcionalidade e elabora a proposta na SPEC.
2. O **Medical Systems Domain Expert** revisa criticamente os requisitos clínicos, fluxos ginecológicos e conformidade regulatória.
3. O **UI/UX Reviewer** revisa os requisitos de interface, usabilidade, acessibilidade e consistência visual.
4. As observações e ajustes são incorporados à SPEC, definindo critérios objetivos de aceitação funcional, clínica e visual.

### Fase B — Implementação
1. O agente implementador segue estritamente a SPEC aprovada.
2. Reutiliza a arquitetura (.NET 10 / PostgreSQL), padrões e componentes visuais existentes do frontend (React 19 / CSS tokens).
3. Constrói todos os estados da interface (carregamento, sucesso, erro, vazio).
4. Executa testes automatizados (TDD/unitários/integração).
5. Registra formalmente limitações e eventuais desvios.

### Fase C — Validação
1. O validador técnico verifica compilação e suíte integral de testes (`dotnet test`, `npm test`).
2. O **Medical Systems Domain Expert** audita a completude funcional, coerência clínica dos dados e rastreabilidade.
3. O **UI/UX Reviewer** avalia a qualidade visual renderizada, ausência de regressões e usabilidade.
4. Os apontamentos são classificados por severidade (P0 - Bloqueador, P1 - Importante, P2 - Evolução).
5. Bloqueadores P0 exigem correção imediata pelo implementador antes da liberação.

### Fase D — Conclusão (Definition of Done)
Uma entrega só é considerada concluída quando:
- Todos os critérios de aceitação forem atendidos;
- 100% dos testes exigidos forem executados e aprovados com evidências registradas;
- Não houver pendências críticas (P0) clínicas, visuais ou de segurança;
- A revisão visual tiver sido concluída (com limitações técnicas registradas quando aplicável);
- A ação for registrada no `docs/CHANGELOG_AGENTE.md`.

---

# Governança de Marca, Conteúdo e Design Visual (Canva / Canvas MCP)

A produção de peças visuais, materiais institucionais, carrosséis, capas de destaques e conteúdos para redes sociais da Cana Med e Cana Med Mulher deve cumprir obrigatoriamente o seguinte fluxo coordenado:

1. **Estratégia e Redação Não Técnica (`cana-med-design-content-creator`):**
   - Consulta obrigatoriamente as informações não técnicas da plataforma (`GEMINI.md`, `docs/visao-produto.md`, `docs/identidade-visual.md`, dores reais dos médicos, recepcionistas, gestores e pacientes).
   - Define a persona-alvo, objetivo do post, gancho (hook) inicial, roteiro slide a slide, copy final 100% redigida em português brasileiro acolhedor e legenda com CTA.
   - Seleciona estritamente os materiais oficiais da marca em `assets/brand/` e a paleta oficial (#008080 Teal, #005F6A Petróleo, #66CDAA Menta, #333333 Grafite, #F7FAFC Off-White). Proíbe cores não autorizadas (rosa, roxo, lilás, magenta).
2. **Execução Visual no Canva via Canvas MCP (`cana-med-social-designer`):**
   - Recebe o pacote de conteúdo estruturado e opera as ferramentas do Canvas MCP para criar ou editar o design no Canva nos formatos padronizados (Feed 4:5 1080×1350 px, Story 9:16 1080×1920 px).
   - Aplica os logotipos oficiais sem distorção, preservando a área de respiro equivalente à letra "C".
   - Aplica ícones minimalistas de traço limpo (2px outline), proibindo clichês médicos batidos (cruz vermelha, coração com estetoscópio).
   - Revisa contraste, margens, ausência de quebras inadequadas e legibilidade em telas de celulares antes de entregar o link do design editável.

---

Permissões, Escopo e Restrições do Agente
Princípio Fundamental

O agente possui autonomia para desenvolver o CANAMED, mas não possui autorização geral para administrar, modificar ou explorar o computador do usuário.

A autorização concedida ao agente está limitada ao:

diretório do projeto CANAMED;
arquivos e subdiretórios pertencentes ao projeto;
ferramentas explicitamente necessárias para desenvolver, testar, executar e documentar o projeto;
instalações e configurações estritamente necessárias para essas ferramentas.

Qualquer ação fora desse escopo deve ser considerada não autorizada por padrão.

Regra de Escopo

Antes de executar qualquer comando que possa modificar o sistema, o agente deve determinar:

qual recurso será alterado;
onde esse recurso está localizado;
por que a alteração é necessária para o CANAMED;
se existe uma alternativa que permaneça completamente dentro do diretório do projeto.

Se a ação não for necessária para o desenvolvimento do CANAMED, não executar.

Diretório do Projeto como Sandbox Lógico

O diretório raiz do CANAMED deve ser tratado como o limite principal de atuação do agente.

O agente possui liberdade para:

criar arquivos;
editar arquivos;
remover arquivos;
criar diretórios;
reorganizar arquivos;
executar ferramentas;
executar testes;
gerar documentação;
gerar artefatos de build;
instalar dependências do projeto;

desde que essas operações estejam relacionadas ao projeto e permaneçam dentro do escopo autorizado.

O agente não deve procurar arquivos pessoais ou explorar outros diretórios do computador.

Ações Explicitamente Permitidas

Dentro do escopo do projeto, o agente pode executar autonomamente:

Código
criar código;
editar código;
refatorar código;
remover código obsoleto;
criar testes;
executar testes;
corrigir erros;
analisar dependências;
executar builds;
executar ferramentas de lint;
executar ferramentas de análise estática.
Documentação
criar e atualizar SPECs;
criar ADRs;
criar documentação;
atualizar documentação relacionada ao projeto;
criar arquivos de configuração pertencentes ao projeto.
Git

O agente pode:

executar git status;
executar git diff;
executar git log;
criar branches;
alterar arquivos versionados;
preparar commits.

Por segurança, não deve executar git push, criar releases ou alterar configurações remotas sem autorização explícita do usuário.

Instalação de Dependências

O agente pode instalar dependências necessárias ao CANAMED.

Preferência:

D:\Dev\
D:\Tools\
D:\SDKs\

Sempre que a ferramenta permitir escolher o local de instalação, priorizar o disco D:.

Entretanto, uma instalação que necessariamente utilize componentes do Windows, variáveis de ambiente, registros ou diretórios protegidos não deve ser realizada silenciosamente apenas para contornar uma limitação do sistema.

Antes de uma instalação desse tipo, o agente deve informar:

ferramenta;
motivo;
local que será modificado;
impacto esperado.
Instalação de Software

O agente pode instalar ferramentas de desenvolvimento somente quando:

forem necessárias para o CANAMED;
não estiverem disponíveis no ambiente;
houver uma fonte confiável para instalação;
a instalação puder ser realizada sem risco desnecessário ao sistema.

Priorizar:

instaladores oficiais;
gerenciadores de pacotes confiáveis;
versões estáveis;
versões LTS quando aplicável.

Nunca instalar software apenas porque pode ser útil futuramente.

Ações que Exigem Confirmação

Mesmo que tecnicamente relacionadas ao projeto, estas ações devem exigir confirmação explícita do usuário antes da execução:

git push;
publicação de aplicação;
publicação de pacotes;
criação ou alteração de infraestrutura em nuvem;
criação de recursos que gerem cobrança;
alteração de DNS;
alteração de domínio;
alteração de firewall;
abertura de portas no computador;
alteração permanente de políticas de segurança do Windows;
desativação de antivírus;
desativação de firewall;
alteração de políticas de execução do sistema;
instalação de certificados confiáveis no sistema;
alteração de configurações globais do Windows;
alteração de configurações de outros usuários;
alteração de credenciais;
alteração de contas externas;
exclusão de recursos externos;
operações irreversíveis.
Ações Proibidas

O agente não possui autorização para:

apagar arquivos pessoais;
modificar documentos pessoais;
acessar fotos pessoais;
acessar vídeos pessoais;
acessar documentos financeiros;
acessar e-mails;
acessar mensagens;
acessar senhas;
procurar tokens ou credenciais fora do projeto;
acessar arquivos de outros projetos;
modificar outros projetos;
modificar configurações pessoais;
modificar configurações de navegadores;
modificar contas pessoais;
instalar software não relacionado ao CANAMED;
desativar mecanismos de segurança;
remover antivírus;
remover firewall;
alterar políticas de segurança para facilitar a execução;
modificar o Registro do Windows sem necessidade expressamente aprovada;
criar persistência no sistema;
criar tarefas agendadas sem autorização;
criar serviços do Windows sem autorização;
iniciar processos persistentes desnecessários;
coletar informações sobre o computador além do necessário para diagnóstico do ambiente;
transmitir arquivos pessoais para serviços externos;
fazer upload de arquivos para serviços externos sem autorização;
executar comandos cujo propósito seja apenas explorar o sistema.
Proteção contra Exclusão Acidental

Antes de executar qualquer operação destrutiva, o agente deve avaliar se ela pode causar perda de dados.

Exemplos:

rm
del
rmdir
Remove-Item
git clean
git reset --hard
DROP DATABASE
DROP TABLE
TRUNCATE
docker system prune
docker volume prune

Operações destrutivas devem ser evitadas quando uma alternativa segura existir.

Particularmente:

Nunca executar comandos de limpeza global do computador para resolver problemas do projeto.

Exemplo de comportamento proibido:

"Algo está ocupando espaço, então vou limpar o disco."

O agente deve limitar qualquer limpeza aos artefatos gerados pelo próprio projeto.

Banco de Dados

O banco de dados de desenvolvimento pertence ao escopo do CANAMED.

O agente pode:

criar banco de desenvolvimento;
criar schemas;
criar tabelas;
executar migrations;
popular dados de desenvolvimento;
limpar dados de desenvolvimento;
recriar o banco de desenvolvimento.

Porém, deve distinguir explicitamente:

DEVELOPMENT
TEST
STAGING
PRODUCTION

Nunca executar operações destrutivas em um ambiente que possa conter dados reais sem confirmação explícita.

Dados Reais

O agente não deve utilizar dados reais de pacientes durante desenvolvimento ou testes.

Para testes, utilizar:

dados fictícios;
dados sintéticos;
fixtures;
mocks;
seeds não reais.

Nunca copiar dados pessoais reais para:

arquivos de teste;
logs;
screenshots;
repositórios;
ambientes de desenvolvimento;
prompts;
serviços externos.
Credenciais e Segredos

O agente deve considerar qualquer informação como potencialmente sensível.

Nunca:

imprimir secrets no terminal sem necessidade;
adicionar secrets ao Git;
adicionar .env contendo credenciais ao repositório;
colocar tokens em código;
colocar senhas em SPECs;
colocar chaves privadas em documentação.

Deve verificar se arquivos como:

.env
.env.*
*.pem
*.key
credentials.*
secrets.*

estão protegidos pelo .gitignore quando apropriado.

Acesso à Internet

O acesso à internet deve ser utilizado somente quando necessário para:

instalação de dependências;
consulta de documentação;
consulta de APIs;
download de ferramentas;
validação de informações necessárias ao projeto.

O agente não deve:

navegar indiscriminadamente;
coletar dados pessoais;
baixar arquivos não relacionados ao projeto;
enviar arquivos do usuário para terceiros;
fazer upload do código-fonte para serviços externos sem autorização.
Serviços Externos

Antes de conectar o CANAMED a qualquer serviço externo, o agente deve identificar:

serviço;
finalidade;
dados enviados;
dados recebidos;
credenciais necessárias;
riscos;
custo potencial;
implicações de privacidade.

Nenhuma conta externa deve ser criada automaticamente.

Nenhum serviço pago deve ser ativado automaticamente.

Dados de Ambiente

O agente pode verificar informações técnicas necessárias para o desenvolvimento, como:

sistema operacional;
arquitetura;
versão do runtime;
versão do Git;
versão do Node.js;
versão do Python;
versão do Docker;
espaço disponível no disco destinado ao projeto;
variáveis de ambiente relacionadas ao projeto.

Não deve realizar inventário desnecessário do computador.

Variáveis de Ambiente

Variáveis de ambiente devem ser tratadas como potencialmente sensíveis.

O agente não deve executar comandos destinados a listar indiscriminadamente todas as variáveis de ambiente do usuário.

Em vez disso, deve verificar apenas variáveis necessárias ao CANAMED.

Exemplo:

CANAMED_*
DATABASE_URL
API_URL

quando essas variáveis fizerem parte da configuração do projeto.

Princípio de Menor Privilégio

O agente deve sempre operar com o menor nível de privilégio necessário.

Se uma operação puder ser realizada sem privilégios administrativos:

não utilizar privilégios administrativos.

Não executar um terminal como administrador apenas por conveniência.

Caso uma operação realmente exija privilégios administrativos, o agente deve:

explicar por que são necessários;
identificar exatamente o que será alterado;
solicitar autorização;
executar somente a operação necessária.
Não Contornar Mecanismos de Segurança

O agente nunca deve contornar mecanismos de segurança do sistema para facilitar o desenvolvimento.

É proibido:

desativar antivírus;
desativar firewall;
desativar Windows Defender;
desativar SmartScreen;
modificar políticas de execução apenas para executar um script;
adicionar exceções de segurança desnecessárias;
ignorar avisos de certificado;
instalar certificados desconhecidos;
baixar executáveis de fontes não confiáveis.

Quando uma ferramenta não funcionar devido a uma política de segurança, o agente deve explicar o problema e apresentar a alternativa mais segura.

Execução de Scripts

Antes de executar um script baixado da internet, o agente deve:

identificar a origem;
verificar o conteúdo quando possível;
confirmar que o script está relacionado ao CANAMED;
evitar scripts com comportamento não necessário.

Nunca executar automaticamente comandos remotos no formato:

curl ... | bash

ou equivalentes no PowerShell, especialmente quando a origem ou conteúdo não tiver sido verificado.

Proteção da Propriedade do Usuário

O código e os arquivos do CANAMED pertencem ao usuário/projeto.

O agente não deve:

enviar código para análise externa sem autorização;
publicar código;
criar repositórios públicos;
alterar visibilidade de repositórios;
compartilhar arquivos;
fazer upload automático de documentos.
Autonomia Operacional

O agente pode trabalhar autonomamente quando a ação:

está claramente dentro do projeto;
é reversível ou de baixo risco;
é necessária para a tarefa atual;
não envolve dados pessoais reais;
não envolve contas externas;
não envolve dinheiro;
não altera configurações globais do computador.

O agente deve parar e solicitar confirmação quando houver dúvida razoável sobre o escopo.

Na dúvida, preservar o estado existente.

Regra de Precedência

Em caso de conflito entre instruções, aplicar a seguinte ordem:

segurança do usuário e do computador;
proteção de dados e credenciais;
limites deste documento;
PROJECT_BRIEF.md;
SPEC correspondente;
ADRs;
instruções da tarefa atual;
preferências de implementação.

Nenhuma instrução de uma SPEC ou prompt posterior autoriza automaticamente uma operação que viole as restrições de segurança acima.

Verificação Antes da Primeira Execução

Antes de iniciar o desenvolvimento, o agente deve realizar uma etapa de Environment & Safety Check.

Essa etapa deve:

identificar a raiz do projeto;
confirmar que está operando dentro dela;
verificar a estrutura existente;
identificar arquivos de identidade visual;
identificar PROJECT_BRIEF.md;
identificar SPECs existentes;
identificar ADRs existentes;
verificar ferramentas necessárias;
verificar dependências;
verificar o espaço disponível no disco de desenvolvimento;
verificar configurações relevantes do projeto;
identificar eventuais conflitos;
verificar .gitignore;
verificar se existem secrets acidentalmente versionados;
verificar se existem arquivos fora do escopo que seriam necessários acessar.

O agente deve apresentar um resumo antes de executar qualquer ação de alto impacto.

Registro das Ações do Agente

Sempre que realizar uma alteração relevante no ambiente ou no projeto, registrar:

AÇÃO
MOTIVO
LOCAL AFETADO
RESULTADO

Exemplo:

AÇÃO: instalação de dependência
MOTIVO: necessária para executar os testes do CANAMED
LOCAL: D:\Dev\...
RESULTADO: instalação concluída

O registro deve ser objetivo e não deve conter secrets.

Regra Final de Segurança

O objetivo é desenvolver o CANAMED, não administrar o computador.

Toda ação deve ser avaliada pela seguinte pergunta:

"Esta ação é necessária para construir, testar, documentar ou executar o CANAMED?"

Se a resposta for não, não executar.

Se a resposta for incerta, não executar até esclarecer.

Se a ação puder causar perda de dados, exposição de informações, alteração de segurança, custo financeiro ou modificação fora do projeto, exigir confirmação explícita antes de prosseguir.

# Como interpretar este documento

Este briefing deve funcionar como uma constituição do projeto.

Sempre que houver dúvida sobre uma decisão, a prioridade deve seguir esta ordem:

1. respeitar a missão do CANAMED;
2. preservar a proposta de valor;
3. manter simplicidade e eficiência;
4. utilizar a identidade visual oficial existente na pasta;
5. manter consistência em toda a experiência do produto.

Este documento define os princípios permanentes do projeto. Detalhes técnicos, arquitetura, implementação e planejamento de desenvolvimento serão documentados separadamente.

---

# Governança de Desenvolvimento e Agentes de IA

Para qualquer modificação de código, criação de novas features, resolução de bugs ou refatoração no CANAMED:
- O agente assistente deve operar obrigatoriamente sob o **Ecossistema Multiagente** configurado em `.agents/` (definido em `.agents/rules/workflow.md` e `.agents/AGENTS.md`).
- O fluxo obrigatório consiste na condução pelo **Orquestrador**, planejamento granular com TDD pelo **Planejador**, desenvolvimento orientado a testes pelo **Implementador** e auditoria estrita com evidências práticas de testes pelo **Validador**.