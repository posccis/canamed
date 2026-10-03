# SPEC-0019 — Fechamento e Conferência de Caixa por Operador

| Campo | Valor |
| :--- | :--- |
| **ID** | SPEC-0019 |
| **Título** | Fechamento e Conferência de Caixa Diário por Operador e Turno com Sangria e Conciliação |
| **Status** | Aprovada |
| **Versão** | 1.0 |
| **Data** | 2026-10-03 |
| **Autor** | Antigravity AI / Equipe CANAMED |
| **Revisores** | Responsável pelo Projeto CANAMED |
| **Módulos afetados** | backend (Domain, Application, Infrastructure, Api), frontend (Financeiro / Fechamento de Caixa), banco de dados (schema `financial`) |
| **ADRs relacionados** | ADR-0003, ADR-0006, ADR-0007, ADR-0008 |

---

## 1. Objetivo

Permitir o controle rigoroso, simples e auditável do fluxo financeiro do balcão da clínica por meio da abertura de turno de caixa com fundo de troco (suprimento), registro de sangrias periódicas, conferência cega/assistida dos valores apurados (dinheiro, PIX, débito, crédito e convênio) e geração do espelho oficial de fechamento com cálculo automático de divergências (sobras ou quebras de caixa).

Pergunta de controle do `GEMINI.md`: **isso reduz atrito na rotina da clínica?**  
Sim. Elimina o cálculo manual em cadernos ou planilhas ao final do expediente, previne perdas financeiras na troca de turno entre recepcionistas e entrega ao gestor um relatório conciliado e auditável em poucos segundos.

---

## 2. Contexto

A [SPEC-0008](0008-spec-fluxo-de-pagamento-e-cobranca.md) estabeleceu o registro de cobranças e faturamento no balcão da recepção. No entanto, na rotina real de clínicas com múltiplos turnos (manhã/tarde/noite) e múltiplos recepcionistas, é mandatório apurar a custódia dos valores físicos (dinheiro em espécie na gaveta) e a conciliação dos comprovantes digitais (POS e PIX) por operador antes de liberar o fechamento diário.

---

## 3. Escopo

### 3.1 Dentro do escopo
- Abertura de sessão de caixa pelo operador logado com definição de fundo de troco inicial (*suprimento*);
- Registro de movimentações avulsas durante o turno: *sangria* (retirada de dinheiro para cofre/depósito) e *suprimento adicional*;
- Vinculação automática dos pagamentos recebidos no balcão ([SPEC-0008](0008-spec-fluxo-de-pagamento-e-cobranca.md)) à sessão de caixa ativa do operador;
- Fechamento de caixa com contagem física de valores por modalidade de pagamento (Dinheiro, PIX, Cartão de Débito, Cartão de Crédito, Convênio);
- Apuração automática de diferença entre o valor esperado pelo sistema e o informado pelo operador (*quebra de caixa* ou *sobra*);
- Bloqueio de novas transações de balcão após o fechamento da sessão;
- Espelho de conferência impresso/digital com assinatura do operador e do gestor supervisor;
- Relatório histórico de fechamentos com filtros por operador, data e clínica.

### 3.2 Fora do escopo
- Comunicação direta via API com adquirentes bancárias TEF de hardware (as transações de cartão são registradas via conferência de comprovante);
- Gestão bancária com envio de arquivos CNAB 240/400 (escopo futuro).

---

## 4. Atores e Permissões

| Ator | Permissão necessária | Observações |
| :--- | :--- | :--- |
| `recepcionista` | `cashier:manage` | Pode abrir o próprio caixa, realizar sangrias e efetuar o fechamento do seu turno. |
| `gestor`, `admin` | `cashier:view-all`, `cashier:override` | Pode visualizar relatórios de fechamento de todos os operadores, aprovar quebras e reabrir caixas justificadamente. |

---

## 5. Regras de Negócio

| ID | Regra | Justificativa / origem |
| :--- | :--- | :--- |
| **RN-001** | **Unicidade de Sessão Aberta por Operador:** Um operador só pode ter 1 sessão de caixa aberta simultaneamente em uma determinada clínica. | Prevenção de conciliações cruzadas e garantia de custódia individual dos valores. |
| **RN-002** | **Obrigatoriedade de Caixa Aberto para Recebimento em Dinheiro:** Qualquer pagamento recebido no balcão em dinheiro exige que o operador possua uma sessão de caixa aberta. | Rastreabilidade do fluxo financeiro físico da recepção. |
| **RN-003** | **Registro Obrigatório de Sangrias:** Toda retirada de dinheiro da gaveta deve indicar o valor, o motivo e o destino (ex: "Transferência para cofre da tesouraria"). O valor é subtraído imediatamente do saldo esperado de dinheiro. | Controle antifraude e limitação do risco de assalto no balcão. |
| **RN-004** | **Apuração de Divergência (Quebra/Sobra):** No fechamento, o operador declara os valores físicos contados. O sistema calcula `Diferenca = ValorDeclarado - ValorEsperado`. Divergências não nulas são gravadas no registro de auditoria e destacadas no espelho. | Princípio contábil de conferência de caixa. |
| **RN-005** | **Imutabilidade pós-fechamento:** Uma vez fechada a sessão de caixa, seu status passa a `fechada` e nenhum pagamento, estorno ou sangria pode ser associado retroativamente àquela sessão. | Integridade dos relatórios gerenciais e fiscais. |

---

## 6. Fluxos

### 6.1 Fluxo de Abertura de Caixa
1. Operador acessa o menu `Financeiro > Fechamento de Caixa`.
2. O sistema verifica se há sessão em aberto. Se não houver, exibe o modal "Abrir Turno de Caixa".
3. Operador informa o valor do Fundo de Troco (suprimento inicial, ex: R$ 150,00).
4. O sistema cria a sessão com status `aberta`, grava evento de auditoria e libera as operações de cobrança no balcão.

### 6.2 Fluxo de Sangria durante o Expediente
1. Operador clica em "Realizar Sangria".
2. Informa o valor da retirada (não podendo exceder o saldo em dinheiro disponível na gaveta) e o motivo.
3. O sistema registra a saída, atualiza o saldo esperado em dinheiro e emite comprovante de sangria.

### 6.3 Fluxo de Fechamento de Caixa
1. Ao final do turno, o operador clica em "Fechar Caixa".
2. O sistema solicita a contagem dos valores físicos e comprovantes:
   - Dinheiro em espécie (R$)
   - Total em PIX (conferência via extrato/comprovantes)
   - Total em Cartões (somatório das filipetas de maquininha)
3. Operador pode adicionar observações (ex: "Falta de R$ 2,00 por troco arredondado").
4. O sistema calcula a conciliação, registra a data/hora de fechamento, muda o status para `fechada` e gera o Espelho de Caixa para impressão ou arquivamento.

---

## 7. Critérios de Aceitação

- [x] Operador consegue abrir caixa com fundo de troco e o saldo é registrado corretamente.
- [x] Toda cobrança recebida no balcão é vinculada à sessão de caixa ativa do operador.
- [x] Sangrias deduzem do saldo em dinheiro e validam que não há retirada superior ao disponível.
- [x] Fechamento registra os valores declarados, calcula quebra/sobra com precisão de centavos e bloqueia edições posteriores.
- [x] Gestor consegue emitir espelho analítico de fechamento por operador e período.

---

## 8. Requisitos de Segurança e Legais

- **Segurança:** Apenas o próprio operador da sessão ou usuários com perfil `gestor`/`admin` podem fechar a sessão.
- **Auditoria:** Toda abertura, sangria e fechamento grava log de auditoria estruturado com usuário, clínica, data/hora e valores.
- **Conformidade Contábil:** Precisão decimal (`decimal(18,2)`) em todos os saldos e transações.
