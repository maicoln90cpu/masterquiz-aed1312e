

## Plano: Atualização Completa da Documentação (v2.28)

Todos os 6 documentos estão desatualizados — parados na v2.27 (25/02/2026). Faltam as implementações recentes: 5 novos eventos GTM, `gtmLogger.ts`, `usePlanUpgradeEvent`, tabela `gtm_event_logs`, Dashboard GTM no admin, e o reset de `AccountCreated`.

---

### 1. PENDENCIAS.md — Adicionar v2.28

Adicionar nova seção no topo:

```
## ✅ v2.28.0 - Eventos GTM Completos + Dashboard de Observabilidade (09/03/2026)

### 5 Novos Eventos GTM
- **SignupStarted**: Disparado ao acessar aba "Criar Conta" (Login.tsx, 1x/sessão)
- **PlanUpgraded**: Hook detecta transição free→pago via localStorage (usePlanUpgradeEvent.ts)
- **QuizShared**: Disparado ao copiar link (CreateQuiz.tsx) ou embed (EmbedDialog.tsx)
- **EditorAbandoned**: Disparado via visibilitychange quando editor tem alterações não publicadas
- **LeadExported**: Disparado ao exportar Excel/CSV no CRM e Responses

### Infraestrutura de Tracking
- **gtmLogger.ts**: Helper centralizado — push dataLayer + persist em gtm_event_logs
- **Tabela gtm_event_logs**: Persistência de eventos com cleanup automático 30 dias
- **RLS**: INSERT para authenticated, SELECT para admins

### Dashboard GTM no Admin
- Sub-tab "Eventos GTM" na aba Observabilidade
- Cards: total 24h, total 7d, tipos únicos
- Tabela de contagem por evento com categoria
- Log dos últimos 100 disparos com filtro
- Auto-refresh (15s logs, 30s contagens)

### Re-disparo AccountCreated
- Reset de account_created_event_sent para perfis dos últimos 5 dias
- Correção de captura GTM que estava com evento divergente

### Arquivos Criados/Editados
| Arquivo | Ação |
|---------|------|
| src/lib/gtmLogger.ts | NOVO — helper centralizado |
| src/hooks/usePlanUpgradeEvent.ts | NOVO — detecta upgrade |
| src/components/admin/GTMEventsDashboard.tsx | NOVO — dashboard |
| src/pages/Login.tsx | SignupStarted |
| src/pages/CreateQuiz.tsx | QuizShared + EditorAbandoned |
| src/components/quiz/EmbedDialog.tsx | QuizShared (embed) |
| src/pages/CRM.tsx | LeadExported |
| src/pages/Responses.tsx | LeadExported (Excel + CSV) |
| src/App.tsx | Integrar usePlanUpgradeEvent |
| src/pages/AdminDashboard.tsx | Sub-tab GTM Events |
| Migration SQL | gtm_event_logs + cleanup |
```

Atualizar seção "Pendências Abertas" — adicionar:
- `[ ] Migrar eventos GTM legados para pushGTMEvent (landing, tracking, vitals)`

---

### 2. README.md — Atualizar para v2.28

- **Linha 3**: Versão `2.28.0` | `09 de Março de 2026`
- **Seção Hooks (linha 121)**: Atualizar contagem para `37+`
- **Seção Edge Functions (linha 290)**: Manter `39 funções`
- **Seção Schema (linha 359)**: Adicionar `gtm_event_logs` na lista de tabelas sob "Analytics"
- **Seção Database Functions (linha 409)**: Adicionar `cleanup_old_gtm_events()` — "Limpeza de eventos GTM > 30 dias"
- **Seção Funcionalidades Admin (linha 488)**: Adicionar `✅ Dashboard de Eventos GTM (observabilidade)`
- **Seção Troubleshooting (linha 499)**: Adicionar entrada: `Eventos GTM não aparecem | Verificar se pushGTMEvent está sendo chamado e tabela gtm_event_logs tem RLS INSERT`
- **Seção Integrações (linha 75)**: Confirmar GTM tem nota sobre `pushGTMEvent` centralizado

---

### 3. PRD.md — Atualizar para v2.28

- **Linha 6**: Versão `2.28` | `09 de Março de 2026`
- **Seção RF08 Tracking (linha 275)**: Adicionar:
  - `RF08.5 | Eventos GTM centralizados (pushGTMEvent) | Alta | ✅`
  - `RF08.6 | Persistência de eventos para analytics admin | Média | ✅`
  - `RF08.7 | Dashboard de eventos GTM no admin | Média | ✅`
- **Seção RF11 Admin (linha 307)**: Adicionar:
  - `RF11.10 | Dashboard de eventos GTM (observabilidade) | Média | ✅`
- **Linha 571**: Próxima revisão: `Junho 2026`

---

### 4. ROADMAP.md — Atualizar para v2.28

- **Seção 2026 H1 (linha 97)**: Adicionar item: `Tracking GTM centralizado + Dashboard de observabilidade ✅`
- **Histórico (linha 127)**: Adicionar nova entrada no topo:
  - `2026-03-09 | **v2.28 — 5 Eventos GTM + Dashboard Observabilidade + gtmLogger centralizado**`

---

### 5. docs/SYSTEM_DESIGN.md — Atualizar para v2.28

- **Linha 4**: Versão `2.28`
- **Seção Hooks (linha 122)**: Adicionar:
  - `usePlanUpgradeEvent | Detecta upgrade free→pago | hooks/usePlanUpgradeEvent.ts`
- **Seção Fluxo de Dados**: Adicionar novo fluxo:

```
### 5. Tracking GTM (centralizado)

UI Action → pushGTMEvent() → dataLayer.push() + gtm_event_logs INSERT
                                    ↓
                          GTM Dashboard (Admin) ← useQuery(gtm_event_logs)
```

- **Seção Algoritmos Críticos**: Adicionar:

```
### 5. GTM Event Logger (lib/gtmLogger.ts)

pushGTMEvent(event, metadata, { persist })
  1. window.dataLayer.push({ event, ...metadata })
  2. Se persist=true: INSERT gtm_event_logs (fire-and-forget)
  3. Console log com prefixo 🎯

Eventos que NÃO usam o helper (legados):
  - Start.tsx (objective_selected)
  - useQuizTracking.ts (quiz_view, quiz_start, quiz_complete, lead_captured)
  - useQuizPersistence.ts (first_quiz_created, quiz_first_published)
  - useWebVitals.ts (web_vitals)
  - Landing components (cta_click, header_nav_click, pricing_cta_click)
```

---

### 6. CHECKLIST.md — Atualizar versão

- **Linha 5**: Versão `2.28.0` | `09/03/2026`

---

### 7. Observações sobre itens pedidos

| Item pedido | Ação |
|---|---|
| Comentários obsoletos | Não há comentários obsoletos nos arquivos alterados; código novo já está documentado |
| Types não exportados | Todos os tipos relevantes já são exportados via `src/types/index.ts`; `GTMEventMetadata` é local e correto assim |
| Storybook/Docs de componentes | Projeto não usa Storybook; componentes documentados via tipos e JSDoc |
| API Docs | Edge Functions documentadas no README; sem mudanças nesta versão |
| Links cruzados | Todos os 6 documentos já referenciam uns aos outros — serão mantidos |

---

### Arquivos a editar

| Arquivo | Escopo da alteração |
|---|---|
| `PENDENCIAS.md` | Nova seção v2.28 + pendência aberta |
| `README.md` | Versão, hooks count, schema, funcionalidades, troubleshooting |
| `PRD.md` | Versão, RF08 tracking, RF11 admin |
| `ROADMAP.md` | H1 2026, histórico |
| `docs/SYSTEM_DESIGN.md` | Versão, hooks, fluxo GTM, algoritmo gtmLogger |
| `CHECKLIST.md` | Versão |

