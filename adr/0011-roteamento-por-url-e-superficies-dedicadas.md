# ADR-0011 — Roteamento por URL e superfícies dedicadas (sistema, paciente, médico e saguão)

- **Status:** Aceito
- **Data:** 2026-10-03
- **Relacionados:** ADR-0006, ADR-0007, ADR-0008, ADR-0010, [SPEC-UI-001](../specs/UI/SPEC-UI-001.md), [SPEC-0026](../specs/0026-spec-jornada-digital-do-paciente-e-portais-dedicados.md)
- **Amenda parcialmente:** [SPEC-0015](../specs/0015-spec-agendamento-online-e-portal-do-paciente.md) (descoberta e acesso), [SPEC-0017](../specs/0017-spec-checkin-autonomo-totem-e-qrcode.md) (substituição do totem físico)

## Contexto

O frontend atual é uma SPA com navegação baseada em estado (`useState<AppView>` em
`frontend/src/App.tsx`). Não existe roteador nem URLs reais: todas as telas — sistema interno,
portal do paciente, totem de check-in e privacidade — são renderizadas dentro do mesmo *shell*
administrativo (sidebar + topbar), acessíveis apenas por quem já está autenticado como operador.

Esse desenho produz três problemas estruturais:

1. **Nada é compartilhável.** Não é possível enviar a um paciente um link de agendamento, de
   cancelamento, de reagendamento ou de acompanhamento de fila, porque cada "tela" depende de cliques
   no menu interno e não tem endereço próprio.
2. **A superfície do paciente está dentro da superfície do operador.** O paciente nunca verá a sidebar
   do sistema, o seletor de clínica, o botão "Sair" do operador ou os menus de DPO, caixa e estoque. Ao
   mesmo tempo, o operador não deveria ter "Portal Paciente" e "Totem Check-in" como itens de menu.
3. **O totem físico não se sustenta.** Ele depende de um terminal, de login do operador para abrir a
   tela e de um fluxo presencial que o próprio sistema pode resolver no celular do paciente por QR Code.

O `GEMINI.md` exige que a experiência pareça um produto único, mas com superfícies adequadas a cada
papel. A [SPEC-UI-001](../specs/UI/SPEC-UI-001.md) define sidebar, hierarquia visual e responsividade
para o **sistema interno**; ela não deve ser aplicada ao paciente.

## Problema

Como permitir que cada funcionalidade tenha um endereço próprio e compartilhável, separar as
superfícies de operador, paciente, médico e saguão, e remover o totem físico sem reescrever as
funcionalidades já implementadas (agenda, fila, PEP, documentos, privacidade, caixa)?

## Alternativas consideradas

| Alternativa | Prós | Contras |
| :--- | :--- | :--- |
| A. Manter navegação por estado e "simular" links com parâmetros de query no menu interno | Nenhuma refatoração | Não resolve deep link, `Back` do navegador, compartilhamento, SEO/Robots ou isolamento de sessão; dívida cresce a cada tela nova |
| B. Um único SPA com **roteador por URL**, três *namespaces* de rota (`/app`, `/p` e `/medico`), *layouts* distintos por superfície e *code splitting* por superfície | Entrega links reais, mantém o monorepo e o design system, permite evoluir para subdomínios depois sem reescrever telas | Exige introduzir uma dependência de roteamento e reorganizar `App.tsx` em um *router*; exige decidir a política de sessão do paciente |
| C. Separar em três aplicações/repositórios independentes (staff, paciente, médico) | Isolamento máximo de sessão e *deploy* | Custo alto de infraestrutura, duplicação de design system e de contratos; desproporcional para o porte atual |
| D. Manter tudo no SPA, mas expor o portal do paciente em outro domínio/subdomínio desde já | Bom isolamento | Implica DNS, certificados e CORS antes de a arquitetura de rotas existir; pode ser feito depois da alternativa B |

## Decisão

Adotar a alternativa **B**, com evolução possível para **D** quando houver domínio próprio:

1. **Roteamento por URL** passa a ser a fonte de navegação do frontend. O estado `AppView` é
   substituído por rotas; o *Back/Forward* do navegador, o *refresh* e o compartilhamento de link
   funcionam em todas as telas.
2. **Três superfícies de aplicação**, com *layouts* e ciclos de vida de sessão independentes:
   - **Sistema (`/app/...`)** — operador autenticado (recepção, gestão, financeiro, caixa, DPO). Mantém
     a sidebar da SPEC-UI-001.
   - **Paciente (`/p/...`)** — público, *mobile-first*, **sem sidebar e sem topbar do sistema**. É a
     superfície dos links compartilháveis.
   - **Médico (`/medico/...`)** — profissional autenticado, com *shell* reduzido (Minha agenda, Minha
     fila, Atendimento, Documentos, Retornos), separado do menu administrativo.
3. **Superfícies de exibição** sem login: TV do saguão (`/sala/tv`) e QR Code de check-in
   (`/p/check-in`). O tablet de recepção para check-in assistido é uma tela do **Sistema**
   (`/app/recepcao/check-in`), não do paciente.
4. **Rota por clínica.** Os links públicos usam um *slug* estável de clínica, por exemplo
   `/p/cana-med/agendar`. O *slug* é dado de configuração da clínica (não sensível), definido em
   `clinics.slug`, com unicidade global.
5. **Links com token de capacidade.** Ações sensíveis usam token opaco, de alta entropia, armazenado
   apenas como *hash*, com escopo (uma consulta/ação), validade e revogação. Tokens aparecem no
   *path*, nunca em *query string*, e nunca carregam CPF, nome, diagnóstico ou qualquer dado de saúde.
6. **Sessões isoladas.** A sessão do operador usa *cookie* `httpOnly` (ADR-0010). A sessão do paciente
   usa o token de portal já existente (`patient_portal_sessions`), em armazenamento separado por
   superfície, sem compartilhar cookie/estado com o sistema interno.
7. **Compatibilidade.** As telas existentes são reaproveitadas por baixo do roteador; a migração é
   incremental por superfície. Rotas antigas por estado deixam de ser a via de navegação, mas a
   biblioteca de componentes e os contratos de API permanecem.
8. **O totem físico sai do escopo do produto.** O que resta dele — busca por CPF/telefone, tolerância de
   horário, prioridade legal e emissão de senha — é reutilizado no check-in por link/QR Code e no
   check-in assistido da recepção. A [SPEC-0017](../specs/0017-spec-checkin-autonomo-totem-e-qrcode.md)
   passa a ser **substituída parcialmente** pela [SPEC-0026](../specs/0026-spec-jornada-digital-do-paciente-e-portais-dedicados.md),
   preservando as regras de fila e prioridade.
9. **Primeira entrega em *path*** (`/p/{slug}`). A [Q-001](../specs/0026-spec-jornada-digital-do-paciente-e-portais-dedicados.md)
   fica decidida como "path agora, subdomínio depois": a superfície do paciente começa em `/p/{slug}`
   e a evolução para `{slug}.canamed.app` reaproveita as mesmas telas e o mesmo resolvedor de clínica
   por slug, trocando apenas o *host* do roteador.

## Consequências

### Positivas

- Cada funcionalidade ganha endereço próprio e compartilhável, resolvendo o pedido central do produto.
- O paciente deixa de ver telas de operador; o operador deixa de ver telas de paciente no menu.
- O médico ganha uma superfície enxuta, orientada ao atendimento, coerente com a [SPEC-0012](../specs/0012-spec-consultorio-virtual-e-workspace-medico.md).
- O totem físico deixa de ser pré-requisito de operação: o check-in funciona no celular do paciente e,
  como exceção, no balcão.
- Habilita, sem reescrita, subdomínio próprio por clínica no futuro.

### Negativas / trade-offs

- Introduz dependência de roteamento no frontend e uma etapa de reorganização de `App.tsx`.
- Exige um modelo de token de capacidade (geração, hash, escopo, expiração e revogação) que ainda não
  existe.
- Links públicos ampliam a superfície de ataque; mitigado por token opaco, *rate limiting*, desafio de
  identidade e `noindex`.
- A migração incremental mantém, por um período, dois modos de navegação no código.

### Mitigações

- Testes de contrato para cada rota pública e para a expiração/revogação de token.
- Cada token é de uso único quando a ação muda estado (cancelar/reagendar) e rotativo após uso.
- Rotas públicas respondem com dados mínimos e mascarados por padrão; dado clínico só após desafio.

## Impacto

- **Documentação:** [SPEC-0026](../specs/0026-spec-jornada-digital-do-paciente-e-portais-dedicados.md)
  (nova), SPEC-0015 e SPEC-0017 (amenda/substituição parcial), `docs/visao-produto.md`,
  `docs/backlog-proximas-funcionalidades.md`.
- **Código:** frontend (`App.tsx`, `features/layout`, `features/patient`, `features/medical`), API
  (`PortalEndpoints`, `KioskEndpoints`, novos endpoints de link) e banco (`clinics.slug`,
  `patient_capability_tokens`).
- **Segurança / LGPD:** tokens opacos com *hash* em repouso, desafio de identidade para ações
  sensíveis, `Referrer-Policy: no-referrer` e `X-Robots-Tag: noindex, nofollow` nas rotas públicas.

## Referências

- [`GEMINI.md`](../GEMINI.md) — segurança, LGPD, princípios de experiência e superfícies do produto.
- [`specs/UI/SPEC-UI-001.md`](../specs/UI/SPEC-UI-001.md) — design system do sistema interno.
- [`adr/0010-sessao-de-usuario-e-substituicao-da-identidade-de-desenvolvimento.md`](0010-sessao-de-usuario-e-substituicao-da-identidade-de-desenvolvimento.md)
- [`specs/0015-spec-agendamento-online-e-portal-do-paciente.md`](../specs/0015-spec-agendamento-online-e-portal-do-paciente.md)
- [`specs/0017-spec-checkin-autonomo-totem-e-qrcode.md`](../specs/0017-spec-checkin-autonomo-totem-e-qrcode.md)
