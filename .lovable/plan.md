
# Plano — Documentação e Manutenibilidade (Categoria 14)

## Diagnóstico (estado atual)

Boa notícia: a maior parte da documentação já existe e está em `docs/`. O esforço será **auditoria + atualização + lacunas pontuais**, não criação do zero.

**Já existe (26 docs):**
- Raiz: `README.md`, `CHANGELOG.md`
- `docs/`: ADR, API_DOCS, AUDIT_TEMPLATE, BLOCKS, BLOG, CHECKLIST, CODE_STANDARDS, COMPONENTS, DATABASE_SCHEMA, EDGE_FUNCTIONS, EGOI, HOOKS, KNOWLEDGE, MEMOCOPY, MONETIZATION, ONBOARDING, PENDENCIAS, PRD, ROADMAP, SECURITY, SERVICES, STORYBOOK, STYLE_GUIDE, SYSTEM_DESIGN, TESTING

**Memória (`mem://index.md`):** já tem Core Rule #1 (formato resposta) no topo — atende item 14.6. Apenas necessita **revisão para deletar memórias obsoletas** sem perder nada.

**Versões divergentes:** `README/KNOWLEDGE/MEMOCOPY` em **v2.43.0**; `EDGE_FUNCTIONS/ONBOARDING` em **v2.42.0**. Precisa harmonizar para a versão atual (será 2.44.0 após esta entrega).

**Markdown fora de `docs/`:**
- `./CHANGELOG.md`, `./README.md` → **manter na raiz** (convenção universal — não mover).
- `./src/__tests__/README.md`, `./src/__tests__/regression/README.md` → **manter** (READMEs locais de pasta de teste são padrão; movê-los quebra contexto).
- `./src/components/admin/system/DataTable.md` → **avaliar mover** para `docs/COMPONENTS.md` como seção, ou manter junto do componente.
- `./.lovable/plan.md` → arquivo do sistema, não tocar.

Sem PDFs no projeto.

---

## Etapas de execução

### Etapa 1 — Auditoria de versão e validação cruzada (14.7)
- Rodar `node scripts/validate-docs.cjs` para confirmar contagens (64 edges / 68 tabelas) ainda válidas; se divergente, atualizar números nos docs.
- Conferir contagem real de tabelas (`supabase/migrations`) e edges (`supabase/functions/`).
- Harmonizar versão: bump único para **v2.44.0** em `README`, `CHANGELOG`, `KNOWLEDGE`, `MEMOCOPY`, `EDGE_FUNCTIONS`, `ONBOARDING`, `SYSTEM_DESIGN`, `PRD`, `ROADMAP`, `DATABASE_SCHEMA`, `SECURITY`, `CODE_STANDARDS`, `ADR`.
- Validar links entre docs (rg `\]\(\./` em docs) e corrigir links quebrados.

### Etapa 2 — Atualização de conteúdo dos 10 docs obrigatórios (14.1)
Para cada um, leitura + diff incremental focado em mudanças recentes (M4.2, ICP imutável, check-activation-24h email block + filtro institucional, cron 4h, etc.):

1. **README.md** — confirmar stack/badges/comandos atuais.
2. **PRD.md** — revisar personas e backlog vs ROADMAP.
3. **ROADMAP.md** — marcar entregas concluídas (ICP fix, email 24h).
4. **PENDENCIAS.md** — adicionar entradas para: M4.2, ICP imutável, email activation 24h, filtro institucional, cron 4h.
5. **SYSTEM_DESIGN.md** — adicionar fluxo do email 24h e camada de imutabilidade ICP.
6. **DATABASE_SCHEMA.md** — confirmar coluna `profiles.is_icp_profile`, `quizzes.first_published_at`, tabela `institutional_email_domains`, tabela de templates de email (template novo do email 24h).
7. **SECURITY.md** — confirmar RLS de `institutional_email_domains`; reforçar regra de imutabilidade ICP via guard `.is(null)`.
8. **CODE_STANDARDS.md** — sem mudanças exceto bump versão.
9. **EDGE_FUNCTIONS.md** — atualizar descrição de `check-activation-24h` (agora envia email + WhatsApp; cron 4h).
10. **CHANGELOG.md** — entrada **v2.44.0** consolidando Onda atual.

### Etapa 3 — Limpeza e organização de código (14.2)
- `rg` por comentários obsoletos comuns (`// TODO removido`, `// old`, `// deprecated`) em `src/` — remover/atualizar pontualmente.
- Verificar `src/types/index.ts` — confirmar export central; mover types órfãos úteis (apenas se identificados como reusados).
- Storybook: confirmar cobertura mínima dos componentes shadcn principais; listar lacunas em `STORYBOOK.md`.
- API Docs: rodar `npm run docs:api` (typedoc) se script existir; senão registrar geração manual em `HOOKS.md`.

Escopo controlado: **não refatorar código**, apenas corrigir comentários enganosos.

### Etapa 4 — Onboarding e ADRs (14.3)
- `ONBOARDING.md`: bump versão + revisar mapa de pastas (incluir `mem://`, `src/services/`).
- `ADR.md`: adicionar 2 ADRs novas:
  - **ADR-014:** Imutabilidade de `is_icp_profile` via guard `.is(null)` (alternativa: RPC SECURITY DEFINER — descartada por simplicidade).
  - **ADR-015:** Email de ativação 24h independente de WhatsApp connection status.

### Etapa 5 — Memo e Knowledge (14.4)
- **MEMOCOPY.md:** atualizar com snapshot atual de `mem://index.md` + arquivos referenciados.
- **mem://index.md (reorganização):**
  - Core já tem #1 no topo (regra 14.6 atendida).
  - Reordenar Core por prioridade prática: Formato resposta → Auth/Roles → GTM → Logger/Tokens → Network → ICP → Eventos → Demais.
  - Em "Memories", reordenar seções: Preferences → Quality → Tracking → Features → Architecture → Database → Messaging → Integrations → Analytics → Observability → CRM → Marketing/UX → UI.
  - **Avaliar obsoletas para deletar:** revisar cada item; só remover se a regra virou convenção universal **e** está coberta por shield P1–P10. Candidatos a avaliar (não deletar sem confirmação no PR):
    - "Text block sem customização de cor" — manter (regra de produto, não convenção).
    - Demais: manter.
- **KNOWLEDGE.md:** revalidar ≤9500 chars, atualizar para v2.44.0 e refletir mudanças (email 24h, ICP imutável).

### Etapa 6 — Organização de arquivos (14.5)
- Manter na raiz: `README.md`, `CHANGELOG.md` (padrão universal).
- Manter em `src/__tests__/`: READMEs locais (padrão Vitest).
- Mover `src/components/admin/system/DataTable.md` → integrar conteúdo em `docs/COMPONENTS.md` (seção DataTable) e excluir o original, OU manter junto do componente. **Recomendação: integrar em COMPONENTS.md** para centralização.
- Avaliar criação de docs adicionais (nenhuma lacuna crítica identificada hoje; não criar novos por ora).

### Etapa 7 — Validação final (14.7)
- Rodar `node scripts/validate-docs.cjs` (deve passar).
- `rg` em `docs/` por versão antiga (`2.42.0`, `2.43.0`) — não deve haver ocorrências.
- Verificar que `docs/KNOWLEDGE.md` ≤ 9500 chars (`wc -c`).
- `lovable-exec test` para confirmar contract tests P1–P10 verdes (proteção de regressão da própria documentação via P-testes existentes).

---

## Arquivos que serão alterados (estimativa)

```
README.md
CHANGELOG.md
docs/PRD.md
docs/ROADMAP.md
docs/PENDENCIAS.md
docs/SYSTEM_DESIGN.md
docs/DATABASE_SCHEMA.md
docs/SECURITY.md
docs/CODE_STANDARDS.md
docs/EDGE_FUNCTIONS.md
docs/ONBOARDING.md
docs/ADR.md           (+ADR-014, ADR-015)
docs/KNOWLEDGE.md
docs/MEMOCOPY.md
docs/COMPONENTS.md    (absorve DataTable.md)
mem://index.md        (reordenação)
```

Excluído (após merge de conteúdo):
```
src/components/admin/system/DataTable.md
```

Sem mudanças de código de aplicação. Sem migrations. Sem alterações em Edge Functions.

---

## Riscos e mitigação

- **Risco:** divergir contagens de tabelas/edges nos docs. **Mitigação:** rodar `validate-docs.cjs` antes e depois.
- **Risco:** quebrar links cruzados ao mover DataTable.md. **Mitigação:** `rg DataTable.md` antes de excluir.
- **Risco:** perder regra ao reordenar `mem://index.md`. **Mitigação:** salvar diff antes; nenhum item será deletado nesta etapa.

## Checklist de validação manual (pós-execução)

1. Abrir `README.md` — versão 2.44.0, badges visíveis, comandos corretos.
2. Abrir `docs/KNOWLEDGE.md` — caber em 9500 chars (`wc -c`).
3. Conferir `docs/EDGE_FUNCTIONS.md` — `check-activation-24h` descrito como email+WhatsApp.
4. Conferir `docs/CHANGELOG.md` — entrada v2.44.0 presente.
5. Abrir `mem://index.md` — Core Rule #1 ainda no topo, ordem nova faz sentido.
6. Rodar `node scripts/validate-docs.cjs` — passa.
7. Rodar `npm run test` — todos contract tests passam.
8. `rg "2.43.0|2.42.0" docs/ README.md CHANGELOG.md` — nenhuma ocorrência.

## Próximos passos (após aprovação)

Executo as 7 etapas em sequência num único loop e devolvo o relatório no formato Core Rule #1 (antes/depois, vantagens, checklist, pendências, prevenção de regressão).
