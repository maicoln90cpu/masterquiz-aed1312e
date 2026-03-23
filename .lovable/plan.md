

## Plan: Email AI Cost Tracking + Delete Question Fix + E-goi Webhook

### Bug Fix: Delete Question Not Working (Modern Editor)

**Root cause found**: `CreateQuizModern.tsx` calls `handleDeleteQuestion` which sets `deleteDialogOpen: true` in the UI state, but **there is no `AlertDialog` rendered** in the component. The Classic editor has it (lines 934-949 of `CreateQuizClassic.tsx`), but it was never added to the Modern editor.

**Fix**: Add the same `AlertDialog` component to `CreateQuizModern.tsx`, reading `deleteDialogOpen` and `questionToDelete` from `uiState`, and calling `confirmDeleteQuestion(questionToDelete)` on confirm. This fixes both desktop and mobile (including the Sheet-based question list).

---

### 1. Create `email_generation_logs` Table

Migration:
- Table: `id`, `template_type` (text), `model_used` (text), `prompt_tokens` (int), `completion_tokens` (int), `total_tokens` (int), `estimated_cost_usd` (numeric), `created_at` (timestamptz)
- RLS: admin/master_admin SELECT via `has_role()`

### 2. Update `generate-email-content` Edge Function

After each AI call, parse `usage` from response and insert a row into `email_generation_logs`.

### 3. Update `UnifiedCostsDashboard.tsx`

Replace Email placeholder with real data from `email_generation_logs`:
- Total email AI cost card
- Breakdown by template type
- Include in monthly chart

### 4. Delete Question Dialog in Modern Editor

Add `AlertDialog` to `CreateQuizModern.tsx` (identical to Classic editor's implementation).

---

### Files

| File | Action |
|------|--------|
| Migration | Create `email_generation_logs` table + admin RLS |
| `supabase/functions/generate-email-content/index.ts` | Log AI usage after each call |
| `src/components/admin/UnifiedCostsDashboard.tsx` | Show real email AI costs |
| `src/pages/CreateQuizModern.tsx` | Add missing `AlertDialog` for delete confirmation |
| Deploy | `generate-email-content` |

