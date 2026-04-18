

# Plano — Atualização de Documentação v2.43.0 (manutenibilidade pós-fases 1-3)

## Visão leiga
A documentação do projeto **já existe quase toda** (24 docs em `docs/` + README + CHANGELOG na raiz, todos na versão 2.42.0). O que falta é:
1. **Refletir o que foi feito recentemente** (Fases A-I do editor + 10 proteções de regressão P1-P10 das fases 1-3) nos docs principais.
2. **Pequenos arquivos faltantes** mencionados no pedido.
3. **Reorganizar a memória** colocando as regras mais críticas no topo.
4. **Gravar a memo obrigatória** de formato de resposta no topo absoluto.

Não vou recriar docs que já existem nem mover arquivos que já estão no lugar certo. O pedido pede uma "limpeza geral" — minha resposta é cirúrgica em cima do que realmente está desatualizado ou faltando.

## Diagnóstico — o que já existe vs o que falta

| Item pedido | Status atual | Ação |
|---|---|---|
| README.md | ✅ existe (681 linhas, v2.42.0) | Atualizar versão + seção "Proteções de regressão" |
| PRD.md | ✅ existe (704 linhas) | Bump versão |
| ROADMAP.md | ✅ existe (235 linhas, v2.42.0) | Adicionar entrada v2.43.0 |
| PENDENCIAS.md | ✅ existe (829 linhas) | Adicionar bloco v2.43.0 |
| SYSTEM_DESIGN.md | ✅ existe (726 linhas) | Bump versão + seção "Camada de proteções automáticas" |
| DATABASE_SCHEMA.md | ✅ existe (372 linhas) | Bump versão (sem mudanças de schema) |
| SECURITY.md | ✅ existe (273 linhas) | Adicionar seção "Testes de contrato de segurança" (P1) |
| CODE_STANDARDS.md | ✅ existe (250 linhas) | Adicionar bloco "Lint rules ativas" (P2/P3/P5/P7) |
| EDGE_FUNCTIONS.md | ✅ existe (150 linhas, 64 funções) | Bump versão |
| CHANGELOG.md | ✅ existe (raiz, 111 linhas) | Adicionar `[2.43.0]` |
| ONBOARDING.md | ✅ existe (153 linhas) | Bump versão + nota sobre `npm run test` cobrir contratos |
| ADR.md | ✅ existe (194 linhas) | Adicionar **ADR-013 — Proteções de regressão como código** |
| MEMOCOPY.md | ✅ existe (174 linhas) | Regenerar com snapshot v2.43.0 |
| Memo "linguagem leiga" | ✅ já está em `.lovable/user-preferences` e core memory | **Reordenar para ser item #1 absoluto** |
| Knowledge ≤9500 chars | ❌ não existe arquivo dedicado | Criar `docs/KNOWLEDGE.md` (resumo executivo) |
| Mover .md soltos para `docs/` | ⚠️ README.md e CHANGELOG.md ficam na raiz por convenção (npm/GitHub esperam ali); `src/__tests__/README.md` é local de testes | **Não mover** — explicar por quê |
| Storybook | ✅ `docs/STORYBOOK.md` existe | Sem mudanças |

## O que vou fazer (5 grupos)

### Grupo 1 — Atualizar 5 docs principais para v2.43.0
- **CHANGELOG.md** (raiz): adicionar bloco `[2.43.0] — 2026-04-18` listando Fases A-I + P1-P10.
- **docs/PENDENCIAS.md**: adicionar entrada v2.43.0 no topo com mesmo conteúdo detalhado.
- **docs/ROADMAP.md**: marcar "Proteções de regressão" como entregue, bump versão.
- **docs/SYSTEM_DESIGN.md**: nova seção "🛡️ Camada de proteções automáticas (Lint + Contract Tests)" descrevendo P1-P10 e onde cada uma vive.
- **README.md**: bump versão + linha-resumo "10 proteções automáticas ativas (ver SECURITY.md e CODE_STANDARDS.md)".

### Grupo 2 — Reforçar SECURITY e CODE_STANDARDS com as proteções
- **docs/SECURITY.md**: nova seção "🧪 Testes de contrato de segurança" referenciando `src/__tests__/contracts/user-roles-security.test.ts` (P1).
- **docs/CODE_STANDARDS.md**: nova seção "🚨 Lint rules ativas (regressão zero)" listando as 4 regras do `eslint.config.js`: bloqueio `dataLayer.push` direto, bloqueio UPDATE direto em `profiles` ICP, bloqueio `sendBeacon`, warning `no-console`, warning `useCurrentUser`, warning cores hardcoded.

### Grupo 3 — Novo ADR-013 e novo KNOWLEDGE.md
- **docs/ADR.md**: adicionar `ADR-013 — Proteções de regressão como código (Lint + Contract Tests + Comentários-trava)` com contexto, alternativas consideradas (revisão manual, treinamento, code-review), decisão e consequências.
- **docs/KNOWLEDGE.md** (NOVO, ≤9500 chars): resumo compacto que pode ser colado no campo "Knowledge" do projeto Lovable. Inclui: visão produto, stack, 6 abas admin, regras obrigatórias (`pushGTMEvent`, `useCurrentUser`, `fetch keepalive`, logger, tokens HSL), 10 proteções ativas, formato de resposta obrigatório, links para docs detalhados.

### Grupo 4 — Regenerar MEMOCOPY.md (snapshot v2.43.0)
- Atualizar `docs/MEMOCOPY.md` cabeçalho para 2.43.0
- Adicionar bloco "Proteções automáticas (Fases 1-3 — abr/2026)" com P1-P10
- Mantém estrutura atual de Core Rules + Memories por categoria
- Adicionar entrada na tabela "Histórico de regeneração"

### Grupo 5 — Reorganizar memória (sem deletar nada)
- Não há `.lovable/memory/index.md` no filesystem (memória vive no sistema interno do Lovable). O índice mostrado nos prompts já tem como **regra #1** o formato de resposta obrigatório.
- **Ação**: criar/atualizar memória `mem://preferences/output-format` reforçando que é Core Rule #1, e garantir que `mem://index.md` lista ela em primeiro lugar.
- Adicionar nova memória `mem://quality/regression-shields` documentando as 10 proteções P1-P10 (substitui necessidade de relembrar manualmente).

## Arquivos a criar/editar

**Criar (2)**:
- `docs/KNOWLEDGE.md` — resumo ≤9500 chars
- `mem://quality/regression-shields.md` — descrição das 10 proteções

**Editar (10)**:
- `README.md` — versão + linha de proteções
- `CHANGELOG.md` — bloco v2.43.0
- `docs/PENDENCIAS.md` — bloco v2.43.0
- `docs/ROADMAP.md` — versão + entrega
- `docs/SYSTEM_DESIGN.md` — seção proteções
- `docs/SECURITY.md` — seção testes contrato
- `docs/CODE_STANDARDS.md` — seção lint rules ativas
- `docs/ADR.md` — ADR-013
- `docs/MEMOCOPY.md` — snapshot v2.43.0
- `mem://index.md` (via update da memória) — output-format como item #1

## O que NÃO vou fazer (e por quê)

| Item | Por que não |
|---|---|
| Mover README.md / CHANGELOG.md para docs/ | Convenção npm/GitHub. Mover quebra badges, links externos e descoberta automática. |
| Mover `src/__tests__/README.md` | É README local da pasta de testes — boa prática manter junto. |
| Recriar PRD/ROADMAP/SYSTEM_DESIGN | Já existem com 200-700 linhas cada na v2.42.0. Apenas atualizar. |
| Storybook docs novos | `docs/STORYBOOK.md` já existe (76 linhas). |
| Hooks/Components/Services docs novos | `docs/HOOKS.md`, `COMPONENTS.md`, `SERVICES.md` já existem. |
| Tipos não exportados (refactor) | Análise extensa de TS — fora do escopo "documentação". Sugestão futura. |

## Comparativo antes vs depois

**Antes (v2.42.0)**:
- 24 docs em `docs/` + README + CHANGELOG (atualizados até Fases A-I do editor)
- 10 proteções P1-P10 implementadas mas não documentadas
- Sem ADR para a decisão de "proteções como código"
- Sem arquivo `KNOWLEDGE.md` compacto para colar no campo Knowledge do Lovable
- Memo de formato de resposta presente, mas não fixada como #1

**Depois (v2.43.0)**:
- Mesmos 24 docs + 1 novo (KNOWLEDGE.md) — total 25
- P1-P10 documentadas em SECURITY, CODE_STANDARDS, SYSTEM_DESIGN, MEMOCOPY
- ADR-013 explica o porquê e alternativas
- Knowledge ≤9500 chars pronto para colar
- Memo formato de resposta confirmada como Core Rule #1

## Vantagens
- Documentação volta a ser **fonte de verdade** sincronizada com código
- Novo dev encontra as 10 proteções no SECURITY/CODE_STANDARDS, não precisa garimpar
- ADR-013 evita questionamento futuro ("por que esses lints existem?")
- KNOWLEDGE.md acelera onboarding do próprio Lovable em sessões futuras

## Desvantagens / Riscos
- Nenhum risco de regressão (mudanças só em `.md` + memória)
- ~10 arquivos editados — diff grande para revisar visualmente

## Checklist manual após implementação
1. Abrir `CHANGELOG.md` na raiz e confirmar bloco `[2.43.0]` no topo
2. Abrir `docs/MEMOCOPY.md` e confirmar Core Rule #1 = formato de resposta
3. Abrir `docs/KNOWLEDGE.md` e confirmar ≤9500 caracteres
4. Procurar "v2.43.0" em todos os docs editados — deve aparecer
5. Rodar `npm run test` — todos os 17+ testes (incluindo P1, P6, P8, P10) ainda passam
6. Confirmar que README.md e CHANGELOG.md ainda estão na raiz (intencional)

## Pendências / sugestões futuras (apenas do que será implementado)
- **Limpeza incremental** dos 105 arquivos com `console.log` (warning ativo, não bloqueia)
- **Limpeza incremental** das 120 violações de cores hardcoded (warning ativo)
- **Reduzir baselines** P4 (auth.getUser=30) e P7 (cores=120) à medida que código for migrado
- **Adicionar Storybook stories** para os componentes documentados em `docs/COMPONENTS.md` (fora deste escopo)

## Prevenção de regressão da própria documentação
- Já existe `scripts/validate-docs.cjs` (v2.41.0) que valida contagens de edge functions e tabelas vs documentação. Vou rodar esse script após editar para confirmar consistência.
- O bloco "Como atualizar" já presente no fim do CHANGELOG.md serve de checklist permanente para próximos bumps.

