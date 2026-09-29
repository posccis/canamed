# ADR-0000 — Modelo de Architecture Decision Record

- **Status:** Modelo
- **Data:** AAAA-MM-DD
- **Decisores:** Responsável pelo projeto CANAMED
- **Relacionados:** `GEMINI.md`, `PROJECT_BRIEF.md`

## Contexto

Descreva o cenário, as restrições e os fatos que tornam esta decisão necessária.
Referencie a SPEC, o requisito legal ou a regra do `GEMINI.md` que motiva o registro.

## Problema

Formule o problema em uma ou duas frases objetivas. Um ADR deve responder a uma única questão.

## Alternativas consideradas

| Alternativa | Prós | Contras |
| :--- | :--- | :--- |
| A | | |
| B | | |
| C | | |

## Decisão

Descreva a alternativa escolhida de forma direta e verificável.

## Consequências

### Positivas

### Negativas / trade-offs

### Mitigações

## Impacto

- **Documentação:** quais documentos precisam ser atualizados.
- **SPECs:** quais especificações passam a depender desta decisão.
- **Código:** módulos, dependências ou migrations afetados.
- **Segurança / LGPD:** efeitos sobre dados pessoais ou controles de segurança.

## Referências

## Como preencher este modelo

- Um ADR registra **uma** decisão arquitetural relevante, não um plano de trabalho.
- ADRs aceitos **não** são editados: para mudar uma decisão, crie um novo ADR que supersede o anterior
  e atualize o status do antigo para `Substituído por ADR-XXXX`.
- Status válidos: `Proposto`, `Aceito`, `Rejeitado`, `Substituído por ADR-XXXX`, `Obsoleto`.
- Nunca inclua segredos, credenciais ou dados reais de pacientes neste documento.
