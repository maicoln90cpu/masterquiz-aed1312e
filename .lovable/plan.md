

# Plano — Documentação e Manutenibilidade Completa (v2.42.0)

## Diagnóstico Atual

### O Que Já Temos (20 docs em `docs/` + README na raiz)
Todos os docs existentes estão na versão **2.41.0** (15/04/2026), mas faltam registrar as mudanças recentes:
- Reorganização do painel admin (6 abas funcionais)
- Aba Sistema expandida (5 sub-abas: Saúde, Observabilidade, Banco de Dados, Configurações, GTM)
- `ObservabilityTab.tsx`, `DatabaseMonitorTab.tsx`, `GTMDiagnosticTab.tsx` — novos componentes
- `observabilityService.ts`, `gtmDiagnosticService.ts` — novos services
- RPC `get_table_sizes()` — nova função de banco
- 64 Edge Functions (sem mudança) / 68 tabelas (sem mudança)

### Arquivos .md Fora de `docs/`
| Arquivo | Ação |
|---------|------|
| `README.md` (raiz) | **Manter na raiz** — é convenção universal |
| `src/__tests__/README.md` | **Manter** — já é ponteiro para `docs/TESTING.md` |
| `analytics_2026-03-21.xlsx` | **Não é .md/.pdf** — deixar onde está |

### O Que Falta Criar
| Arquivo | Descrição |
|---------|-----------|
| `docs/MEMOCOPY.md` | Cópia completa de todas as memórias do projeto |
| `docs/SERVICES.md` | Catálogo de services (novo, pedido no prompt do Sistema) |

### Docs que NÃO precisam de novo arquivo
- Knowledge prompt: será entregue via chat (não é arquivo do projeto)
- Storybook: projeto não usa Storybook — documentação de componentes já está em `COMPONENTS.md`

---

## Implementação em 3 Etapas Seguras

### Etapa 1 — Bump de Versão + Changelog + MEMOCOPY
**Arquivos alterados:** `docs/PENDENCIAS.md`, `docs/MEMOCOPY.md` (novo)

1. **PENDENCIAS.md** — Adicionar entrada v2.42.0 com changelog completo:
   - Reorganização admin (7→6 abas por domínio funcional)
   - Aba Sistema expandida (5 sub-abas)
   - ObservabilityTab (7 painéis: SLA, AI Costs, Delivery, Erros 24h, P95/P99, Web Vitals, Health Check)
   - DatabaseMonitorTab (catálogo de 68 tabelas com tamanhos reais via RPC `get_table_sizes`)
   - GTMDiagnosticTab (verificação em 3 etapas)
   - Novos services: `observabilityService.ts`, `gtmDiagnosticService.ts`
   - Nova RPC: `get_table_sizes()`

2. **MEMOCOPY.md** — Cópia de TODAS as 30 memórias do `mem://index.md`:
   - Core rules (8 regras)
   - 30 memories com descrição completa de cada um
   - Organizado por categoria (features, integrations, analytics, etc.)

### Etapa 2 — Atualizar Docs Core (README, PRD, ROADMAP, SYSTEM_DESIGN, DATABASE_SCHEMA, ADR)
**Arquivos alterados:** 6 arquivos existentes

1. **README.md** — Bump para v2.42.0, adicionar:
   - Menção à reorganização do admin (6 abas)
   - Aba Sistema com 5 sub-abas
   - RPC `get_table_sizes` na seção Database
   - Badge de status (se aplicável)
   - Link para `docs/SERVICES.md`

2. **PRD.md** — Bump versão, adicionar ao backlog:
   - RF: Painel admin reorganizado por domínio funcional
   - RF: Observabilidade do sistema (SLA, AI Costs, Web Vitals)
   - RF: Catálogo de banco de dados com tamanhos reais
   - RF: Diagnóstico GTM automatizado

3. **ROADMAP.md** — Bump versão, adicionar em H1 2026:
   - Reorganização admin (6 abas funcionais) ✅
   - Aba Sistema expandida (5 sub-abas de monitoramento) ✅
   - Atualizar histórico de atualizações

4. **SYSTEM_DESIGN.md** — Bump versão, adicionar:
   - Seção "Painel Administrativo" com a hierarquia de 6 abas
   - Fluxo de dados da Observabilidade (service → hook → component)
   - RPC `get_table_sizes()` como padrão SECURITY DEFINER
   - Diagrama da aba Sistema (5 sub-abas)

5. **DATABASE_SCHEMA.md** — Bump versão, adicionar:
   - RPC `get_table_sizes()` na seção DB Functions
   - Nota sobre catálogo hardcoded no DatabaseMonitorTab

6. **ADR.md** — Adicionar 2 novas ADRs:
   - **ADR-013**: Reorganização do Admin por Domínio Funcional (6 abas, max 2 níveis)
   - **ADR-014**: Catálogos Hardcoded no DatabaseMonitorTab (sem `information_schema` via client)

### Etapa 3 — Docs Secundários + SERVICES.md + Knowledge Prompt + Cross-References
**Arquivos alterados/criados:** ~10 arquivos

1. **EDGE_FUNCTIONS.md** — Bump versão (64 funções, sem alteração real)
2. **SECURITY.md** — Bump versão, adicionar nota sobre `get_table_sizes` SECURITY DEFINER
3. **CODE_STANDARDS.md** — Bump versão, adicionar padrão de service layer para admin
4. **ONBOARDING.md** — Bump versão, atualizar estrutura do admin (6 abas)
5. **COMPONENTS.md** — Bump versão, adicionar: ObservabilityTab, DatabaseMonitorTab, GTMDiagnosticTab, AdminSubTabs
6. **API_DOCS.md** — Adicionar RPC `get_table_sizes()` com parâmetros e retorno
7. **TESTING.md** — Bump para v2.42.0
8. **BLOCKS.md** — Bump para v2.42.0
9. **BLOG.md**, **EGOI.md**, **MONETIZATION.md** — Bump versão
10. **STYLE_GUIDE.md**, **CHECKLIST.md**, **AUDIT_TEMPLATE.md** — Bump versão
11. **docs/SERVICES.md** (novo) — Catálogo de services do projeto:
    - `observabilityService.ts` (7 queries)
    - `gtmDiagnosticService.ts` (diagnóstico GTM)
    - `systemMonitorService.ts` (saúde do sistema)
    - Outros services existentes
12. **Cross-references** — Validar todos os links entre docs, adicionar SERVICES.md e MEMOCOPY.md nas tabelas de documentação relacionada
13. **Knowledge prompt** — Entregar via chat: prompt completo e atualizado (~9500 chars) para o knowledge do projeto, incluindo checklist pós-implementação

---

## O Que NÃO Fazer
- **Não mover** `README.md` para `docs/` — convenção universal é manter na raiz
- **Não mover** `src/__tests__/README.md` — já é ponteiro, funciona bem onde está
- **Não mover** `.xlsx` — não é doc de projeto
- **Não criar Storybook** — projeto não usa, `COMPONENTS.md` cobre essa necessidade
- **Não criar** tabelas novas no banco — nenhuma alteração de schema necessária

---

## Resumo de Arquivos

| Ação | Quantidade | Arquivos |
|------|-----------|----------|
| **Criar** | 2 | `docs/MEMOCOPY.md`, `docs/SERVICES.md` |
| **Atualizar** | 20 | Todos os docs existentes (bump v2.42.0 + conteúdo novo) |
| **Não tocar** | — | `README.md` fica na raiz, `src/__tests__/README.md` fica onde está |

## Riscos
- Volume alto de alterações em docs (20+ arquivos) — mitigado por etapas seguras
- Knowledge prompt tem limite de 9500 chars — será compactado ao máximo

