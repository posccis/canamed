# Guia de Uso e Execução — CANAMED

> Documento operacional do projeto: como preparar o ambiente, executar o sistema, usar a agenda de
> consultas e manter a base de código em dia com as regras do repositório.
>
> Em caso de divergência, a ordem de precedência é: [`GEMINI.md`](../GEMINI.md) →
> [`PROJECT_BRIEF.md`](../PROJECT_BRIEF.md) → [`specs/`](../specs) → [`adr/`](../adr).

- **Versão:** 1.0
- **Data:** 2026-09-30
- **Público:** responsável pelo projeto, desenvolvedores e agentes de IA que trabalhem no repositório
- **Estado do produto:** fundação concluída (SPEC-0001) e gestão de agenda concluída (SPEC-0002)

---

## 1. O que está pronto

| Entrega | Situação | Referência |
| :--- | :--- | :--- |
| Monorepo .NET 10 + React/TypeScript, comandos unificados | Concluído | [SPEC-0001](../specs/0001-spec-de-fundacao.md) |
| PostgreSQL local com migrations versionadas (EF Core) | Concluído | Migration `InitialAgendaSchema` |
| Endpoints de saúde (`/live`, `/ready`) e OpenAPI em `/api/v1/openapi.json` | Concluído | [SPEC-0001](../specs/0001-spec-de-fundacao.md) |
| Agenda de consultas: criar, listar, remarcar, cancelar e bloquear horário | Concluído | [SPEC-0002](../specs/0002-spec-agenda-de-consultas.md) |
| Trilha de auditoria *append-only* | Concluído | Tabela `audit_events` + gatilho no banco |
| Tela de agenda do dia com estados de carregamento, vazio, erro e sucesso | Concluído | `frontend/src/features/agenda` |
| Tipos do frontend gerados a partir do OpenAPI (RN-004) | Concluído | `npm run generate:api` |
| Login, sessão segura, papéis por clínica, segundo fator e administração de usuários | Concluído | [SPEC-0003](../specs/0003-spec-autenticacao-autorizacao-e-auditoria.md) |
| Testes de comportamento (Playwright) com sessão real | Concluído | `frontend/e2e` — `npm run test:e2e` |
| Fila de espera, triagem, pagamentos, dashboards e gestão operacional | Pendente | [`docs/backlog-proximas-funcionalidades.md`](backlog-proximas-funcionalidades.md) |

O que **ainda não existe** e não deve ser presumido por quem opera o sistema hoje: recuperação de senha
pelo próprio usuário (o gestor redefine), notificações ao paciente, prontuário, relatórios e os pilares
de fila de espera, triagem, pagamento e dashboards.

---

## 2. Arquitetura em uma página

| Componente | Tecnologia | Onde | Porta |
| :--- | :--- | :--- | :--- |
| API | ASP.NET Core (`net10.0`) | `backend/src/Canamed.Api` | `http://localhost:5080` |
| Aplicação | Casos de uso e contratos | `backend/src/Canamed.Application` | — |
| Domínio | Entidades e regras de negócio | `backend/src/Canamed.Domain` | — |
| Infraestrutura | EF Core, repositórios, auditoria, dados de desenvolvimento | `backend/src/Canamed.Infrastructure` | — |
| SPA | React + TypeScript + Vite | `frontend/` | `http://localhost:5173` |
| Banco | PostgreSQL 18.6 portátil | `D:\Tools\PostgreSQL` (fora do repositório) | `127.0.0.1:5432` |

Fluxo de uma requisição: SPA → API (`/api/v1`) → validação de configuração → identidade e permissão →
caso de uso → domínio → EF Core/PostgreSQL → evento de auditoria → resposta JSON ou Problem Details
(RFC 7807).

Regras de arquitetura que não podem ser quebradas ao evoluir (SPEC-0001, seção 5):

- `Domain` não referencia nenhuma outra camada;
- o frontend é apenas cliente da API, sem regra de negócio;
- todo consumo de API passa por `frontend/src/api/client.ts`;
- alterações de schema só acontecem por migration do EF Core;
- rotas sempre sob `/api/v1`.

---

## 3. Pré-requisitos e verificação de ambiente

| Ferramenta | Versão esperada | Observação |
| :--- | :--- | :--- |
| .NET SDK | 10.0.201 | Fixado em [`global.json`](../global.json) |
| Node.js | >= 20 | Fixado em `engines` do [`package.json`](../package.json) |
| PostgreSQL | 16+ (ambiente atual: 18.6 portátil) | Ver seção 4 |
| dotnet-ef | 10.x | Necessário apenas para migrations |

Verificação rápida (Environment & Safety Check):

```powershell
dotnet --version
node --version
& 'D:\Tools\PostgreSQL\18.6\pgsql\bin\pg_isready.exe' -h 127.0.0.1 -p 5432
```

Se o PostgreSQL responder `accepting connections`, o ambiente está pronto para o passo seguinte.

---

## 4. Provisionamento local

### 4.1 Variáveis de ambiente

```powershell
Copy-Item .env.example .env   # apenas na primeira vez
```

O backend lê o `.env` automaticamente **somente em Development**, e variáveis de ambiente reais sempre
prevalecem sobre o arquivo. O `.env` nunca é versionado (ADR-0004).

| Variável | Uso |
| :--- | :--- |
| `ASPNETCORE_ENVIRONMENT` | `Development` no ambiente local |
| `ASPNETCORE_URLS` | Porta da API (`http://localhost:5080`) |
| `ConnectionStrings__Canamed` | Conexão do backend com o PostgreSQL |
| `VITE_API_BASE_URL` | URL da API usada pela SPA |
| `Canamed__Development__SeedUserEmail` | E-mail do primeiro gestor criado em Development |
| `Canamed__Development__SeedUserPassword` | Senha do primeiro gestor — **existe apenas no `.env` local** |
| `Canamed__Development__TrustActorHeaders` | Opcional: habilita identidade por cabeçalho em DEV/TEST (ADR-0010) |

> A senha do primeiro gestor é definida por você no `.env`. Se preferir, gere uma com
> `-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_})`.
> Ela nunca é registrada em código, log ou documentação.

### 4.2 PostgreSQL portátil

O servidor local foi instalado em modo portátil (sem serviço do Windows) e **não sobe automaticamente
com a máquina**.

```powershell
$pg = 'D:\Tools\PostgreSQL\18.6\pgsql\bin'
& "$pg\pg_ctl.exe" -D 'D:\Tools\PostgreSQL\data' start
& "$pg\pg_ctl.exe" -D 'D:\Tools\PostgreSQL\data' status
& "$pg\pg_ctl.exe" -D 'D:\Tools\PostgreSQL\data' stop -m fast
```

- Bancos: `canamed_dev` (desenvolvimento) e `canamed_test` (testes automatizados).
- Usuário da aplicação: `canamed_app`; a senha existe apenas no `.env` local.
- Senha do superusuário: `D:\Tools\PostgreSQL\postgres-superuser.txt`, **fora do repositório**.
- Log do servidor: `D:\Tools\PostgreSQL\data\log\postgresql-<data>.log`.

### 4.3 Migrations do banco

```powershell
# aplicar as migrations pendentes no banco de desenvolvimento
dotnet ef database update --project backend/src/Canamed.Infrastructure --startup-project backend/src/Canamed.Api

# criar uma nova migration (depois de alterar o modelo)
dotnet ef migrations add NomeDaAlteracao --project backend/src/Canamed.Infrastructure --startup-project backend/src/Canamed.Api --output-dir Persistence/Migrations
```

O que a migration inicial cria: `clinics`, `professionals`, `patients`, `appointment_types`,
`appointments`, `professional_blocks` e `audit_events`. Também cria a restrição de exclusão
`ex_appointments_professional_no_overlap` (impede sobreposição de horários no banco, mesmo sob
requisições simultâneas) e o gatilho `trg_audit_events_append_only` (a trilha de auditoria não aceita
`UPDATE` nem `DELETE`).

> Nunca altere o schema manualmente: qualquer mudança entra por migration versionada (RN-007 da SPEC-0001).

---

## 5. Executando o sistema

### 5.1 Tudo de uma vez

```powershell
npm install                     # dependências da raiz (scripts)
npm --prefix frontend install   # dependências da SPA
npm run build                   # compila backend e frontend
npm run test                    # executa toda a suíte de testes
```

### 5.2 Backend

```powershell
dotnet run --project backend/src/Canamed.Api
```

A API sobe em `http://localhost:5080`. Em Development ela:

1. carrega o `.env` local;
2. falha rápido se a configuração obrigatória estiver ausente (sem valor padrão inseguro);
3. publica o contrato OpenAPI em `http://localhost:5080/api/v1/openapi.json`;
4. cria **dados sintéticos de demonstração** se o banco estiver vazio (ver seção 5.4).

### 5.3 Frontend

```powershell
npm --prefix frontend run dev
```

A SPA sobe em `http://localhost:5173` e conversa com a API conforme `VITE_API_BASE_URL`. Para verificar o
build de produção: `npm --prefix frontend run build` (saída em `frontend/dist`).

### 5.4 Dados sintéticos de desenvolvimento

Em Development, se não houver nenhuma clínica cadastrada, o sistema cria (ADR-0003 — nunca dados reais):

| Registro | Identificador fixo |
| :--- | :--- |
| Clínica "Clínica Demonstração (dados sintéticos)" | `11111111-1111-4111-8111-111111111111` |
| Profissional "Dra. Ana Ribeiro (sintética)" | `22222222-2222-4222-8222-222222222222` |
| Paciente "Paciente Sintético Um" | `33333333-3333-4333-8333-333333333333` |
| Tipos de atendimento: Consulta (30), Retorno (15), Avaliação (60) | `44444444-…`, `55555555-…`, `66666666-…` |

Para desativar a semeadura, use `Canamed:SeedDevelopmentData=false` (é o que os testes de integração fazem).

Se ainda não houver nenhum usuário, o sistema cria o **primeiro gestor** com o e-mail e a senha das
variáveis `Canamed__Development__SeedUser*`. A senha é armazenada como hash Argon2id; para trocá-la
depois, use a tela de usuários ou redefina o valor no `.env` e remova o usuário pelo banco (procedimento
de ambiente de desenvolvimento).

---

## 6. Usando o sistema

A entrada é sempre pelo login. Depois de autenticado, a barra superior mostra quem está usando, a clínica
ativa e as ações de navegação.

### 6.1 Entrar, segundo fator e sessão

1. Abra `http://localhost:5173` e informe **e-mail** e **senha**.
2. Se o seu perfil exigir verificação em duas etapas e ela ainda não estiver cadastrada, o sistema abre a
   tela **Verificação em duas etapas**: clique em *Começar cadastro*, leia o código no aplicativo
   autenticador (Google Authenticator, Authy, 1Password etc.) — ou digite o código manual exibido — e
   informe o código de 6 dígitos para ativar.
3. Nas próximas vezes, o login pedirá o código de 6 dígitos depois da senha.

Comportamentos previstos:

| Situação | O que acontece |
| :--- | :--- |
| Credencial inválida | "E-mail ou senha inválidos." — a mensagem é a mesma para e-mail inexistente (não revela contas) |
| 5 tentativas inválidas | A conta fica bloqueada por 15 minutos |
| Muitas tentativas em um minuto | "Muitas tentativas. Aguarde um instante e tente novamente." (limite por origem) |
| Sessão inativa por 30 minutos | A sessão expira e o sistema volta ao login |
| Sessão com mais de 8 horas | Expira mesmo com uso (limite absoluto) |
| Perfil de gestor sem segundo fator | Existe sessão, mas as funcionalidades ficam bloqueadas até concluir o cadastro |
| *Sair* | A sessão é revogada imediatamente |

#### Testar sem o segundo fator (suspensão temporária)

Para testes locais, o gestor pode entrar só com e-mail e senha. Isso é controlado por configuração e
**não tem efeito fora de Development/Testing**:

1. No `.env`, defina `Canamed__Security__RequireMfaForManagers=false`.
2. Se a conta do gestor já tiver um autenticador cadastrado, remova o segredo (senão o código continua
   sendo exigido, e com razão):

   ```sql
   UPDATE users SET mfa_secret = NULL, mfa_enabled_at = NULL WHERE email = 'gestor@canamed.local';
   DELETE FROM user_sessions;
   ```

3. Suba a API e entre normalmente: a agenda abre sem pedir código.

**Para restaurar** o comportamento de produto (recomendado antes de qualquer uso real, commit ou
demonstração a cliente): remova a linha `Canamed__Security__RequireMfaForManagers` do `.env` (ou defina
`true`) e faça login novamente — o sistema volta a exigir o cadastro do autenticador para o gestor.
Fora de Development/Testing o valor dessa chave é ignorado, de modo que produção sempre exige MFA.

Para trocar a própria senha: entre, abra a agenda e use `POST /api/v1/auth/password` (a interface
dedicada está no backlog, item I-05). Ao trocar a senha, as **outras** sessões são revogadas.

### 6.2 Administrar usuários (gestor)

O gestor vê a aba **Usuários** na barra superior. Nela é possível:

- listar quem está vinculado à clínica ativa, com papel, situação, MFA e sessões abertas;
- criar usuário com nome, e-mail, senha inicial e papel (`Gestor`, `Recepção`, `Profissional`);
- redefinir a senha de alguém (as sessões dessa pessoa são revogadas);
- revogar todas as sessões de alguém (perda de dispositivo, por exemplo);
- desativar um usuário — ele deixa de autenticar e perde as sessões ativas.

O papel define o que a pessoa pode fazer: **Gestor** administra usuários e configura a agenda (exige
segundo fator); **Recepção** opera a agenda; **Profissional** vê apenas a própria agenda e bloqueia
horários.

### 6.2.1 Catálogo assistencial (gestor)

A aba **Catálogo** reúne a classificação usada pela agenda (SPEC-0004):

- **Especialidades**: criar, renomear, desativar e reativar (ortopedia, ginecologia, pediatria…). Não é
  possível desativar uma especialidade em uso por profissional ou tipo de consulta ativo.
- **Tipos de consulta**: cada tipo tem **natureza** (`Avulsa` ou `Acompanhamento`), **custeio**
  (`Particular` ou `Plano de saúde`), **especialidade** opcional e **duração**. Tipos inativos saem das
  opções de agendamento, mas os agendamentos antigos mantêm a classificação original.
- **Profissionais**: editar nome e especialidade, desativar e reativar. Profissional inativo não recebe
  novos agendamentos nem bloqueios.
- **Pacientes**: editar nome, telefone, e-mail e data de nascimento, desativar e reativar. Paciente
  inativo não recebe novos agendamentos.

Na agenda, cada agendamento mostra a classificação vigente (por exemplo
`Avaliação ortopédica • 60 min • Avulsa · Plano de saúde · Ortopedia`), e os intervalos bloqueados têm a
ação **Desbloquear**.

### 6.4 Tela principal — agenda do dia

Objetivo da funcionalidade: a recepção agenda, remarca e cancela consultas sem sobreposição de horários,
com trilha de auditoria de tudo que muda.

1. Abra `http://localhost:5173`.
2. Escolha a **data** (padrão: hoje, no fuso `America/Fortaleza`) e o **profissional**.
3. A lista mostra, em ordem de horário: intervalo, paciente, tipo de atendimento, duração e status
   (`Agendado`, `Confirmado`, `Atendido`, `Cancelado`, `Faltou`).
4. Ações por agendamento: **Remarcar** e **Cancelar**.
5. "Hoje" volta para a data atual; "Atualizar" recarrega agenda e cadastros.

Estados previstos na tela: esqueleto de carregamento, "Nenhum agendamento para esta data." e erro com
ação de tentar novamente.

### 6.5 Agendar (fluxo F-001)

1. Clique em **Novo agendamento**.
2. Informe profissional, paciente, tipo de atendimento e data/hora (horário de Brasília/Fortaleza).
3. Clique em **Agendar**. A duração aplicada é sempre a duração vigente do tipo de atendimento (RN-002).

Erros previstos:

| Situação | Resposta |
| :--- | :--- |
| Horário já ocupado para o profissional | `409` — "Este horário já está ocupado para o profissional selecionado." + horários livres próximos |
| Profissional com bloqueio no intervalo | `409` — "O profissional está indisponível neste horário." + horários livres próximos |
| Início no passado | `400` — "Não é possível agendar em data passada." |
| Paciente, profissional ou tipo de outra clínica | `404` — "Registro não encontrado." (sem revelar a existência) |

### 6.6 Remarcar (F-002) e cancelar (F-003)

- **Remarcar** exige novo horário livre; o horário anterior volta a ficar disponível imediatamente e a
  alteração é registrada na auditoria com horário anterior e novo.
- **Cancelar** exige motivo; o registro é preservado com status `cancelado`, o horário é liberado e o
  motivo fica na auditoria.
- Agendamentos `atendido`, `faltou` ou já `cancelado` não aceitam remarcação nem cancelamento (`409`).

### 6.7 Bloquear horário (RN-011)

1. Selecione o profissional e clique em **Bloquear horário**.
2. Informe início e fim (e, opcionalmente, o motivo).
3. Enquanto o bloqueio existir, novos agendamentos no intervalo são recusados com `409`. Não é possível
   bloquear um intervalo que já tenha agendamento ativo.

### 6.8 Cadastros rápidos

O botão **Cadastros rápidos** abre o cadastro mínimo necessário para operar a agenda: paciente (nome e
telefone), profissional (nome) e tipo de atendimento (nome e duração). É um recurso de apoio — o cadastro
completo de pacientes e profissionais depende de funcionalidade própria.

### 6.9 Fuso horário

Todo horário é armazenado em UTC e exibido em `America/Fortaleza` (RN-010). A tela converte os valores
nos dois sentidos, de modo que o usuário sempre trabalhe com o horário local da clínica.

---

## 7. Contrato da API

Base: `http://localhost:5080/api/v1`. Documento OpenAPI: `/api/v1/openapi.json` (Development).

| Método | Rota | Permissão | Descrição |
| :--- | :--- | :--- | :--- |
| GET | `/health/live` | pública | Processo vivo |
| GET | `/health/ready` | pública | Prontidão (verifica o banco) |
| POST | `/auth/login` | pública (limitada) | Autentica por e-mail e senha; pode exigir segundo fator |
| POST | `/auth/login/mfa` | pública (limitada) | Conclui o login com o código TOTP |
| POST | `/auth/logout` | sessão | Revoga a sessão atual |
| GET | `/auth/session` | sessão | Usuário, clínica ativa, papel e permissões |
| POST | `/auth/password` | sessão | Troca a própria senha (revoga as outras sessões) |
| POST | `/auth/mfa/enroll`, `/auth/mfa/activate`, `/auth/mfa/disable` | sessão | Cadastro e gestão do segundo fator |
| POST | `/auth/clinic` | sessão | Troca a clínica ativa (usuário com mais de um vínculo) |
| GET / POST | `/users` | `users:manage` | Lista e cria usuários da clínica ativa |
| POST | `/users/{id}/password`, `/users/{id}/deactivate`, `/users/{id}/sessions/revoke` | `users:manage` | Redefine senha, desativa usuário e revoga sessões |
| POST | `/appointments` | `agenda:write` | Cria agendamento |
| GET | `/appointments?date=&professionalId=` | leitura de agenda ou `agenda:write` | Agenda do dia |
| GET | `/appointments/{id}` | leitura de agenda ou `agenda:write` | Detalha agendamento |
| POST | `/appointments/{id}/reschedule` | `agenda:write` | Remarca |
| POST | `/appointments/{id}/cancel` | `agenda:write` | Cancela com motivo |
| POST | `/professionals/{id}/blocks` | `agenda:block` ou `agenda:write` | Bloqueia intervalo |
| GET | `/professionals/{id}/blocks?date=` | leitura de agenda ou `agenda:block` | Bloqueios do dia |
| GET / POST | `/professionals` | leitura de agenda / `agenda:write` | Cadastro mínimo de profissional |
| GET / POST | `/patients` | leitura de agenda / `agenda:write` | Cadastro mínimo de paciente |
| GET / POST | `/appointment-types` | leitura de agenda / `agenda:configure` | Tipos de atendimento e duração |

As permissões de leitura de agenda são: `agenda:read`, `agenda:read:own`, `agenda:write` e
`agenda:block` (conforme a rota).

Erros seguem RFC 7807 (`application/problem+json`) com `title`, `detail`, `status`, `type` e `traceId`.
Conflitos acrescentam `requestedStartsAt` e `suggestions` (próximos horários livres, em UTC).

Exemplo (PowerShell):

```powershell
$h = @{
  'X-Canamed-Actor-Id'   = 'recepcao-dev'
  'X-Canamed-Actor-Name' = 'Recepção (desenvolvimento)'
  'X-Canamed-Clinic-Id'  = '11111111-1111-4111-8111-111111111111'
}

Invoke-RestMethod 'http://localhost:5080/api/v1/appointments?date=2026-10-05' -Headers $h

Invoke-RestMethod 'http://localhost:5080/api/v1/appointments' -Method Post -Headers $h -ContentType 'application/json' -Body (@{
  professionalId    = '22222222-2222-4222-8222-222222222222'
  patientId         = '33333333-3333-4333-8333-333333333333'
  appointmentTypeId = '44444444-4444-4444-8444-444444444444'
  startsAt          = '2026-10-05T14:00:00-03:00'
} | ConvertTo-Json)
```

Há também um arquivo pronto para ferramentas HTTP em
[`backend/src/Canamed.Api/Canamed.Api.http`](../backend/src/Canamed.Api/Canamed.Api.http).

---

## 8. Identidade de desenvolvimento (ADR-0010)

O caminho normal do produto é a sessão autenticada (SPEC-0003). Para scripts, testes manuais e depuração,
a API aceita — **apenas em `Development` e `Testing`** — cabeçalhos que identificam o usuário sem login.
Fora desses ambientes os cabeçalhos são ignorados e a resposta é `401` (falha segura). A conveniência só
é aplicada quando a requisição realmente envia um dos cabeçalhos, de modo que um navegador sem sessão
continua vendo a tela de login.

| Cabeçalho | Uso |
| :--- | :--- |
| `X-Canamed-Actor-Id` | Usuário registrado na auditoria |
| `X-Canamed-Actor-Name` | Nome exibido na trilha |
| `X-Canamed-Clinic-Id` | Clínica ativa (isolamento multi-clínica) |
| `X-Canamed-Permissions` | Permissões separadas por vírgula |
| `X-Canamed-Professional-Id` | Profissional do usuário (`agenda:read:own`) |

Sem cabeçalhos, o usuário de desenvolvimento recebe todas as permissões de agenda. Para simular perfis,
envie apenas as permissões do papel:

```powershell
# Recepção: agenda completa, sem configurar tipos de atendimento
$h['X-Canamed-Permissions'] = 'agenda:read,agenda:write'

# Profissional: apenas a própria agenda
$h['X-Canamed-Permissions'] = 'agenda:read:own,agenda:block'
$h['X-Canamed-Professional-Id'] = '22222222-2222-4222-8222-222222222222'
```

A SPA **não** usa esses cabeçalhos: ela sempre autentica por login. A conveniência serve para `curl`,
arquivos `.http` e a suíte de testes de integração. Para desativá-la por completo, defina
`Canamed__Development__TrustActorHeaders=false` no `.env`.

---

## 9. Testes

```powershell
npm run test            # backend (unitário + integração) e frontend (Vitest)
npm run test:e2e        # comportamento no navegador (Playwright)
```

Ou por stack:

```powershell
dotnet test Canamed.sln
npm --prefix frontend run test -- --run
$env:PLAYWRIGHT_BROWSERS_PATH='D:\Tools\ms-playwright'; npm --prefix frontend run test:e2e
```

Estado verificado em 2026-10-01: **159 testes aprovados, 0 falhas** — 88 unitários do backend, 41 de
integração do backend, 20 do frontend (Vitest) e 10 de comportamento (Playwright).

### 9.0 Testes de comportamento (Playwright)

Os navegadores ficam em `D:\Tools\ms-playwright` (preferência de disco do projeto). Em outra máquina,
instale na primeira execução:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH='D:\Tools\ms-playwright'
npx --prefix frontend playwright install chromium
```

A suíte sobe a API e a SPA automaticamente (`frontend/playwright.config.ts`), entra com o gestor
sintético do `.env` — concluindo o cadastro de segundo fator quando necessário — e cobre login, agenda do
dia, criação, conflito com sugestões, remarcação, cancelamento com motivo e bloqueio de horário. O segredo
de MFA usado pela suíte fica em `frontend/e2e/.state/`, fora do versionamento.

> Se o segundo fator do gestor de desenvolvimento já estiver cadastrado em um autenticador pessoal, a
> suíte não consegue calcular o código: redefina o segundo fator (seção 11) e rode novamente.

### 9.1 Testes de integração e banco de teste

Os testes de integração exercitam a API contra o banco `canamed_test` com dados sintéticos. Eles:

1. aplicam as migrations pendentes no banco de teste;
2. limpam apenas os dados de agenda entre execuções (a trilha de auditoria é preservada — ela é
   *append-only* por definição);
3. recusam-se a rodar contra uma base que não tenha `test` no nome, evitando apagar dados de
   desenvolvimento por engano.

A conexão de teste pode ser informada explicitamente:

```powershell
$env:CANAMED_TEST_CONNECTION_STRING = 'Host=localhost;Port=5432;Database=canamed_test;Username=canamed_app;Password=<local>'
```

Sem essa variável, o valor de `ConnectionStrings__Canamed` do `.env` é reaproveitado com o banco trocado
para `canamed_test`. **O PostgreSQL precisa estar em execução.**

### 9.2 Cobertura por critério de aceitação

Os critérios CA-001 a CA-010 da SPEC-0002 têm teste automatizado equivalente em
`backend/tests/Canamed.IntegrationTests/Agenda/AgendaEndpointsTests.cs`. O frontend cobre estados de tela,
formatação de horário e o tratamento de conflitos.

---

## 10. Mantendo os tipos do frontend em dia (RN-004)

Os tipos usados pela SPA são gerados a partir do contrato OpenAPI do backend — nunca escritos à mão:

```powershell
# 1) API em execução
dotnet run --project backend/src/Canamed.Api

# 2) em outro terminal
npm run generate:api
```

Isso atualiza `frontend/src/api/schema.d.ts`. Sempre que um endpoint ou contrato mudar, gere novamente e
versione o arquivo junto da alteração.

---

## 11. Solução de problemas

| Sintoma | Causa provável | O que fazer |
| :--- | :--- | :--- |
| `Failed to bind to address http://127.0.0.1:5080: address already in use` | Já existe uma API em execução | `Get-NetTCPConnection -LocalPort 5080 -State Listen` e encerre o processo, ou use outra porta |
| `Configuração ausente: ConnectionStrings:Canamed` | `.env` ausente ou incompleto | `Copy-Item .env.example .env` e preencha a conexão |
| `/health/ready` responde `503` | PostgreSQL parado ou banco inacessível | Inicie o servidor (seção 4.2) e confirme com `pg_isready` |
| `401 authentication-required` em rota privada | Sem sessão válida | Entre novamente; a sessão expira após 30 min de inatividade |
| `403 permission-denied` | Papel sem a permissão exigida | Confira o papel do usuário na aba **Usuários** |
| `403 mfa-enrollment-required` | Gestor sem segundo fator cadastrado | Conclua o cadastro na tela **Verificação em duas etapas** |
| `401 invalid-credentials` com a senha correta | Conta bloqueada por tentativas inválidas | Aguarde 15 minutos ou redefina a senha na aba **Usuários** |
| `429 too-many-requests` | Limite de tentativas de login por minuto | Aguarde um instante; ajuste `Canamed:RateLimiting:LoginPermitLimit` se necessário |
| `400 csrf-validation-failed` | Requisição que altera estado sem o cabeçalho anti-CSRF | Envie `X-Canamed-Requested-With: canamed-spa` |
| Esqueci o segundo fator de um usuário de desenvolvimento | Segredo TOTP perdido | No banco de desenvolvimento: `UPDATE users SET mfa_secret = NULL, mfa_enabled_at = NULL WHERE email = '...';` e faça login novamente para recadastrar |
| `409 appointment-overlap` | Sobreposição de horário | Use um horário livre ou os `suggestions` retornados |
| `409 professional-blocked` | Intervalo bloqueado | Remova o bloqueio ou escolha outro horário |
| Agenda vazia em data que tem consultas | Fuso horário | A agenda é exibida em `America/Fortaleza`; confira a data local |
| `relation "appointments" does not exist` | Banco sem migration aplicada | Execute `dotnet ef database update` |
| Migration falha ao subir a API | Modelo alterado sem migration | Gere a migration (seção 4.3) |

Para inspecionar rapidamente o banco de desenvolvimento sem expor segredos, use `psql` com a senha vinda
do `.env` (veja como os testes fazem em `backend/tests/Canamed.IntegrationTests/TestDatabase.cs`).

Diagnóstico útil: os logs estruturados em JSON no console da API. Cada erro traz um `traceId`, que também
aparece na resposta HTTP e permite correlacionar frontend e backend.

---

## 12. Governança: como o projeto evolui

Fluxo obrigatório (GEMINI.md e `specs/README.md`): entender o problema → escrever a SPEC → validar impacto →
implementar → testar → atualizar documentação. **Nenhuma funcionalidade nasce sem SPEC aprovada.**

Mapa dos documentos:

| Documento | Papel |
| :--- | :--- |
| [`GEMINI.md`](../GEMINI.md) | Fonte de verdade integral (constituição do projeto) |
| [`PROJECT_BRIEF.md`](../PROJECT_BRIEF.md) | Brief consolidado e pendências da fase |
| [`specs/`](../specs) | Fonte de verdade da implementação |
| [`adr/`](../adr) | Decisões arquiteturais (problema, alternativas, decisão, consequências) |
| [`docs/`](.) | Produto, identidade visual, segurança e este guia |
| [`assets/brand/`](../assets/brand) | Única fonte de verdade da identidade visual |
| [`docs/CHANGELOG_AGENTE.md`](CHANGELOG_AGENTE.md) | Registro de todas as ações relevantes |

Ao concluir uma alteração: rode `npm run build` e `npm run test`, atualize a SPEC correspondente
(inclusive o histórico de revisões), registre decisões em ADR e acrescente a entrada no
`CHANGELOG_AGENTE.md`. `git push`, publicação e criação de infraestrutura exigem autorização explícita.

---

## 13. Próximos passos sugeridos

A lista priorizada, com descrição, esforço e complexidade de cada item, está em
[`docs/backlog-proximas-funcionalidades.md`](backlog-proximas-funcionalidades.md). Resumo da ordem
sugerida:

1. Pequenas lacunas de uso diário da agenda (desbloquear horário, editar tipo de atendimento e dados do paciente).
2. **Fila de espera** e ciclo de atendimento completo — maior ganho operacional sem dependência externa.
3. Cadastro completo e horários de funcionamento da clínica.
4. Hospedagem com região brasileira, backups, CI e observabilidade — pré-requisito para uso real.
5. Pagamento, dashboards, triagem, notificações e prontuário, conforme decisão de negócio e regulação.

---

## Referências

- [`README.md`](../README.md) — entrada rápida do repositório.
- [`specs/0001-spec-de-fundacao.md`](../specs/0001-spec-de-fundacao.md) — convenções de engenharia.
- [`specs/0002-spec-agenda-de-consultas.md`](../specs/0002-spec-agenda-de-consultas.md) — regras da agenda.
- [`adr/0009-identidade-de-desenvolvimento-e-autorizacao-temporaria.md`](../adr/0009-identidade-de-desenvolvimento-e-autorizacao-temporaria.md)
  — identidade de desenvolvimento.
- [`docs/seguranca-e-conformidade.md`](seguranca-e-conformidade.md) — segurança e LGPD.
- [`docs/backlog-proximas-funcionalidades.md`](backlog-proximas-funcionalidades.md) — próximas funcionalidades.
- [`specs/0003-spec-autenticacao-autorizacao-e-auditoria.md`](../specs/0003-spec-autenticacao-autorizacao-e-auditoria.md)
  — login, papéis por clínica e auditoria de identidade.
