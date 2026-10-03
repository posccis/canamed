# SPEC-0020 — Painel de Chamada para TV na Recepção

| Campo | Valor |
| :--- | :--- |
| **ID** | SPEC-0020 |
| **Título** | Painel de Chamada de Pacientes em Tempo Real para TV/Monitor na Recepção |
| **Status** | Implementada |
| **Versão** | 1.0 |
| **Data** | 2026-10-03 |
| **Autor** | Antigravity AI / Equipe CANAMED |
| **Revisores** | Responsável pelo Projeto CANAMED |
| **Módulos afetados** | backend (Application, Api, Queue Hub), frontend (Display TV / Recepção), banco de dados (schema `queue`) |
| **ADRs relacionados** | ADR-0003, ADR-0006, ADR-0007, ADR-0008 |

---

## 1. Objetivo

Fornecer uma interface dedicada de tela cheia (*kiosk/display mode*), projetada especificamente para televisores e monitores de recepção, que exibe instantaneamente a chamada do próximo paciente acionada pelo médico em seu consultório ([SPEC-0012](0012-spec-consultorio-virtual-e-workspace-medico.md)), acompanhada de alerta sonoro (*chime*) e sintetizador de voz, organizando o fluxo de circulação na clínica e eliminando a necessidade de gritar nomes na sala de espera.

Pergunta de controle do `GEMINI.md`: **isso reduz atrito na rotina da clínica?**  
Sim. Reduz ruídos, desconforto e confusão na recepção, garante privacidade (LGPD), evita que pacientes percam o momento do atendimento e acelera a transição entre consultas nos consultórios médicos.

---

## 2. Contexto

A [SPEC-0005](0005-spec-fila-de-espera-e-ciclo-de-atendimento.md) implementou a fila de espera e a [SPEC-0012](0012-spec-consultorio-virtual-e-workspace-medico.md) equipou o médico com o botão de "Chamar Paciente". Contudo, sem um painel visual na sala de espera, a equipe médica ou a recepção precisa se deslocar fisicamente para localizar o paciente, gerando atrasos em série.

---

## 3. Escopo

### 3.1 Dentro do escopo
- Rota pública e segura de exibição fullscreen `/tv-display?clinicId={id}`;
- Atualização em tempo real (polling rápido de baixa latência e compatibilidade com WebSockets/SSE);
- Card de destaque central com animação para a **chamada ativa**:
  - Senha do paciente (ex: `N-042`, `P-005` emitidas pelo totem da [SPEC-0017](0017-spec-checkin-autonomo-totem-e-qrcode.md));
  - Nome do paciente (com formatação abreviada opcional para privacidade);
  - Sala / Consultório de destino (ex: "Consultório 03 - Térreo");
  - Nome do profissional de saúde (ex: "Dr. Roberto Canamed");
- Histórico visual lateral com as últimas 4 chamadas anteriores;
- Alerta sonoro (*chime* polifônico via Web Audio API) e reprodução por voz sintética brasileira ("*Senha N-042, Maria Silva, Consultório 3*") via Web Speech API;
- Relógio em tempo real e cabeçalho com logotipo oficial e nome da clínica;
- Suporte a re-chamada (*recall*) quando o paciente não se apresenta de imediato.

### 3.2 Fora do escopo
- Transmissão de grade de vídeos ou canais de TV aberta (foco exclusivo na sinalização de atendimento da clínica).

---

## 4. Atores e Permissões

| Ator | Permissão necessária | Observações |
| :--- | :--- | :--- |
| `público` / `tv-display` | Acesso público por `clinicId` | Permite abrir a tela na TV do saguão sem exigir login e senha de operador. |
| `profissional` | `consultation:write` | Dispara a chamada ao clicar em "Chamar Paciente" no consultório. |
| `recepcionista`, `gestor` | `queue:call` | Pode re-chamar ou acionar senha manualmente pela recepção. |

---

## 5. Regras de Negócio

| ID | Regra | Justificativa / origem |
| :--- | :--- | :--- |
| **RN-001** | **Privacidade e Minimização de Dados (LGPD Art. 6º, III):** O painel nunca exibe CPF, queixa clínica, especialidade íntima ou diagnóstico. O nome do paciente pode ser configurado para abreviação (ex: "Maria S."). | Princípio da necessidade e sigilo da LGPD. |
| **RN-002** | **Prioridade Legal de Atendimento (Lei nº 10.048/2000):** Senhas preferenciais (iniciadas por `P-`) recebem destaque cromático diferenciado e badge "Atendimento Prioritário" no painel. | Cumprimento da legislação brasileira de prioridades. |
| **RN-003** | **Retenção de Últimas Chamadas:** O painel retém as 5 chamadas mais recentes do dia para orientação de pacientes que estavam momentaneamente ausentes. | Usabilidade e prevenção de perda de vez. |
| **RN-004** | **Re-chamada Auditada:** Cada re-chamada atualiza o carimbo de data/hora do evento e dispara novamente a sonorização no painel. | Agilidade e comprovação de tolerância de espera. |

---

## 6. Fluxos

### 6.1 Fluxo de Chamada pelo Consultório
1. Médico no `DoctorWorkspace` clica em "Chamar Próximo Paciente".
2. O backend atualiza a entrada da fila para o status `chamando`, preenche a sala do médico e registra o evento na tabela `queue_call_events`.
3. A tela da TV capta o novo evento imediatamente.
4. O painel da TV reproduz o som de aviso, pisca o card principal com o nome e sala, e fala a chamada via sintetizador de áudio.
5. Após o tempo de exibição, a chamada passa para a barra lateral de histórico.

---

## 7. Critérios de Aceitação

- [x] Rota `/tv-display` renderiza em alta definição e ajusta-se a TVs 1080p e 4K em modo fullscreen.
- [x] Disparo de chamada no consultório médico reflete no painel em menos de 1 segundo.
- [x] Notificação sonora emite tom audível suave e sintetiza o texto em português brasileiro.
- [x] Painel suporta exibição de senha, nome do paciente e sala de atendimento.
- [x] Histórico das últimas chamadas permanece visível para consulta rápida.

---

## 8. Requisitos de Segurança e Legais

- **Segurança da Rota:** A rota de TV não expõe dados sensíveis, prontuários ou rotas de mutação de dados; apenas leitura do estado de chamada da clínica correspondente.
- **LGPD:** Nenhuma informação clínica, CID ou documento do paciente é transmitido ou exibido.
