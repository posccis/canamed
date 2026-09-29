# ADR-0007 — Banco de dados e persistência

- **Status:** Aceito
- **Aprovado em:** 2026-09-28, pelo responsável pelo projeto
- **Data:** 2026-09-28
- **Decisores:** Responsável pelo projeto CANAMED
- **Relacionados:** ADR-0003, ADR-0006, ADR-0008, `docs/seguranca-e-conformidade.md`

## Contexto

O domínio é fortemente relacional e transacional: clínicas, profissionais, pacientes, agenda, fila,
turmas de atendimento e registros de auditoria. Requisitos que pressionam a escolha:

- integridade referencial e transações confiáveis;
- trilha de auditoria resistente a alteração indevida;
- retenção potencial de 20 anos quando houver prontuário (Lei nº 13.787/2018);
- criptografia em repouso e backups com recuperação validada;
- segregação de ambientes (ADR-0003).

O Docker Desktop não está instalado no ambiente, o que afeta a estratégia de banco local para desenvolvimento.

## Problema

Qual tecnologia de persistência adotar e como provisioná-la em desenvolvimento e produção?

## Alternativas consideradas

| Alternativa | Prós | Contras |
| :--- | :--- | :--- |
| A. PostgreSQL gerenciado (nuvem, região Brasil) | Relacional maduro, JSONB quando necessário, particionamento, PITR, forte suporte a auditoria | Custo de serviço gerenciado; dependência de provedor |
| B. MySQL/MariaDB | Amplamente conhecido | Menos recursos avançados de integridade/auditoria que o PostgreSQL |
| C. SQLite em desenvolvimento e PostgreSQL em produção | Zero infraestrutura local | Divergência de comportamento entre ambientes |
| D. Banco de documentos (ex.: MongoDB) | Flexível | Enfraquece integridade relacional e auditoria em domínio transacional |

## Decisão

Adotar a alternativa **A**: **PostgreSQL** como banco único, com instância gerenciada em produção em
região brasileira e uma instância local de desenvolvimento isolada por ambiente.

Diretrizes propostas:

1. Migrations versionadas no repositório; nenhuma alteração manual de schema fora delas.
2. Trilha de auditoria em estrutura *append-only*, sem atualização ou exclusão de registros de auditoria.
3. Backups automatizados com retenção definida e **teste de restauração** periódico.
4. Criptografia em trânsito e em repouso habilitada.
5. DEV e TEST com dados sintéticos, recriáveis a qualquer momento (ADR-0003).
6. *Soft delete* apenas onde a regra de negócio exigir; exclusão de dados pessoais tratada conforme LGPD.

> Decisão aprovada em 2026-09-28, junto com o ADR-0006. A stack escolhida (ASP.NET Core + React em
> monorepo) não altera esta decisão; o PostgreSQL é acessado pelo backend.

## Consequências

### Positivas

- Integridade e auditoria compatíveis com requisitos legais.
- Caminho claro para retenção de longo prazo e recuperação.

### Negativas / trade-offs

- Sem Docker local, a instalação do PostgreSQL em desenvolvimento precisa ser decidida
  (instalação nativa em `D:\Tools\` ou Docker Desktop).

### Mitigações

- Definir a estratégia de banco local junto com a aprovação do ADR-0006.

## Impacto

- **Documentação:** estratégia de backup e retenção a documentar em `docs/`.
- **SPECs:** toda SPEC com persistência deve declarar schema e política de retenção.
- **Código:** ORM/query builder definido na SPEC de fundação.
- **Segurança / LGPD:** criptografia, retenção, minimização e eliminação segura de dados.

## Referências

- [`GEMINI.md`](../GEMINI.md) — seções "Proteção de Dados" e "Banco de Dados".
- [`docs/seguranca-e-conformidade.md`](../docs/seguranca-e-conformidade.md)
