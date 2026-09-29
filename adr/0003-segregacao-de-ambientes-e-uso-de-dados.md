# ADR-0003 — Segregação de ambientes e uso de dados

- **Status:** Aceito
- **Data:** 2026-09-28
- **Decisores:** Responsável pelo projeto CANAMED
- **Relacionados:** `GEMINI.md`, `docs/seguranca-e-conformidade.md`

## Contexto

O CANAMED trata dados pessoais sensíveis de saúde, sujeitos à LGPD e à Lei nº 13.787/2018. O `GEMINI.md`
determina distinguir explicitamente os ambientes DEVELOPMENT, TEST, STAGING e PRODUCTION, proíbe o uso de
dados reais de pacientes em desenvolvimento/testes e proíbe operações destrutivas em ambientes que possam
conter dados reais sem confirmação explícita.

## Problema

Como separar ambientes e dados para permitir desenvolvimento e testes rápidos sem risco de exposição ou
perda de dados reais?

## Alternativas consideradas

| Alternativa | Prós | Contras |
| :--- | :--- | :--- |
| A. Quatro ambientes nomeados, com dados sintéticos em DEV/TEST e destruição livre apenas em DEV | Seguro, alinhado ao briefing, permite o ciclo de "recriar banco de desenvolvimento" | Exige disciplina de configuração por ambiente |
| B. Ambiente único com dados de produção mascarados | Menos infraestrutura | Alto risco de exposição e de acidente destrutivo; viola o briefing |
| C. Apenas DEV e PROD | Simples | Sem espaço para validação intermediária antes de produção |

## Decisão

Adotar a alternativa **A**:

1. Ambientes nomeados e inconfundíveis: `DEVELOPMENT`, `TEST`, `STAGING`, `PRODUCTION`.
2. DEV e TEST usam exclusivamente dados fictícios, sintéticos, fixtures, mocks e seeds não reais.
3. Nunca copiar dados pessoais reais para arquivos de teste, logs, screenshots, repositórios, ambientes de
   desenvolvimento, prompts ou serviços externos.
4. Operações destrutivas são permitidas livremente apenas no banco de desenvolvimento.
5. Operações destrutivas em ambientes que possam conter dados reais exigem confirmação explícita do usuário.
6. A configuração de cada ambiente vem de variáveis de ambiente, com a mesma base de código (ver ADR-0004).

## Consequências

### Positivas

- Desenvolvimento pode recriar e limpar o banco de DEV sem risco.
- Requisito legal de não uso de dados reais em testes fica verificável.

### Negativas / trade-offs

- Custo de manter quatro ambientes distintos.

### Mitigações

- Começar com DEV e TEST reais; STAGING e PRODUCTION criados apenas quando houver deploy definido.

## Impacto

- **Documentação:** regra registrada em `docs/seguranca-e-conformidade.md`.
- **SPECs:** toda SPEC que envolva persistência deve declarar o comportamento por ambiente.
- **Código:** configuração via variáveis de ambiente desde o início.
- **Segurança / LGPD:** reduz risco de exposição de dados sensíveis.

## Referências

- [`GEMINI.md`](../GEMINI.md) — seções "Banco de Dados" e "Dados Reais".
