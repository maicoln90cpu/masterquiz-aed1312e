

## Plano: 5 Novos Eventos GTM + Dashboard de Eventos no Admin

### Parte 1: Implementar 5 novos eventos GTM

**1. `SignupStarted` — `src/pages/Login.tsx`**
- Adicionar `onValueChange` no `<Tabs>` (linha 297)
- Quando valor muda para `register`, disparar `{ event: 'SignupStarted' }` (1x por sessão via `sessionStorage`)

**2. `PlanUpgraded` — novo hook `src/hooks/usePlanUpgradeEvent.ts`**
- No mount, consultar `user_subscriptions.plan_type`
- Comparar com `localStorage.mq_last_plan`
- Se mudou de `free` → pago, push `{ event: 'PlanUpgraded', plan_type, previous_plan }`
- Integrar no `RequireAuth` em `App.tsx` (junto ao `useAccountCreatedEvent`)

**3. `QuizShared` — 2 locais**
- `src/pages/CreateQuiz.tsx` linha 1042: após `navigator.clipboard.writeText`, push `{ event: 'QuizShared', method: 'link' }`
- `src/components/quiz/EmbedDialog.tsx` linha 37: no `handleCopy`, push `{ event: 'QuizShared', method: 'embed' }`

**4. `EditorAbandoned` — `src/pages/CreateQuiz.tsx`**
- Adicionar `useEffect` com listener `visibilitychange`
- Condição: quiz tem título ou questões editadas MAS não foi publicado
- Disparar `{ event: 'EditorAbandoned', quiz_id, questions_count }` quando `document.hidden === true`

**5. `LeadExported` — 2 locais**
- `src/pages/CRM.tsx` linha 252: após `XLSX.writeFile`, push `{ event: 'LeadExported', source: 'crm', count }`
- `src/pages/Responses.tsx` linha 214: após download CSV, push `{ event: 'LeadExported', source: 'responses', count }`

---

### Parte 2: Dashboard de Eventos GTM no Admin

**Abordagem:** Criar tabela `gtm_event_logs` no banco para persistir disparos do dataLayer, e um componente admin para visualização.

**2.1 Nova tabela `gtm_event_logs`**
```sql
CREATE TABLE gtm_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gtm_events_name_created ON gtm_event_logs(event_name, created_at DESC);
```
RLS: insert para authenticated, select para admins.

**2.2 Helper centralizado `src/lib/gtmLogger.ts`**
- Função `pushGTMEvent(event, metadata?)` que:
  1. Faz `dataLayer.push({ event, ...metadata })`
  2. Insere na tabela `gtm_event_logs` (fire-and-forget)
- Todos os 5 novos eventos + os existentes que forem migrados usarão este helper

**2.3 Componente `src/components/admin/GTMEventsDashboard.tsx`**
- Cards com contagem de cada evento (24h / 7d)
- Tabela com últimos 100 disparos (evento, usuário, data, metadata)
- Filtro por evento e período
- Query via `useQuery` na tabela `gtm_event_logs`

**2.4 Integração no AdminDashboard**
- Adicionar sub-tab "Eventos GTM" na aba "Observabilidade" com ícone `BarChart3`
- Lazy load do componente

---

### Arquivos modificados/criados

| Arquivo | Ação |
|---|---|
| `src/lib/gtmLogger.ts` | **NOVO** — helper centralizado |
| `src/hooks/usePlanUpgradeEvent.ts` | **NOVO** — detecta upgrade |
| `src/components/admin/GTMEventsDashboard.tsx` | **NOVO** — dashboard |
| `src/pages/Login.tsx` | `SignupStarted` no onValueChange |
| `src/pages/CreateQuiz.tsx` | `QuizShared` + `EditorAbandoned` |
| `src/components/quiz/EmbedDialog.tsx` | `QuizShared` (embed) |
| `src/pages/CRM.tsx` | `LeadExported` |
| `src/pages/Responses.tsx` | `LeadExported` |
| `src/App.tsx` | Integrar `usePlanUpgradeEvent` |
| `src/pages/AdminDashboard.tsx` | Sub-tab GTM Events |
| Migration SQL | Tabela `gtm_event_logs` |

