

## Plan: Heatmap Fix, Master Admin Sorting, Funnel Tracking Improvements

### Root Causes Found

**Heatmap showing 1 respondent / wrong data**: Two issues:
1. The `ResponseHeatmap` reads `question.options` from the DB, which is `[]` for modern quizzes. The actual options live inside `blocks[].options` where `block.type === 'question'`. The `parseOptions` function never checks blocks.
2. Only 1 row exists in `quiz_responses` for "Mãe Consciente" because the progressive save was just deployed. The existing response has `session_id: null` (created before the fix). New responses should now create rows via progressive save.

**Duplicate quiz filter in Heatmap tab**: The `ResponseHeatmap` component has its own internal quiz selector, AND the parent `Responses.tsx` has a global quiz filter. These are independent.

---

### Changes

#### 1. Fix Heatmap — Parse options from blocks (CRITICAL)
**File: `src/components/analytics/ResponseHeatmap.tsx`**
- Update `parseOptions` to also check `question.blocks` for a block with `type === 'question'` and extract `options` from there
- Also fetch `blocks` column in the Supabase query (currently only fetches `id, question_text, order_number, answer_format, options`)
- This fixes the core issue: questions with empty `options` but block-based options will now show correctly

#### 2. Heatmap as first tab + remove internal quiz filter
**File: `src/pages/Responses.tsx`**
- Move "Heatmap" tab to be the first `TabsTrigger` (before "Todas Respostas")
- Set `activeTab` default to `"heatmap"` instead of `"all"`
- Pass `selectedQuiz` to `<ResponseHeatmap quizId={selectedQuiz !== 'all' ? selectedQuiz : undefined} />`

**File: `src/components/analytics/ResponseHeatmap.tsx`**
- When `quizId` prop is provided, use it directly (skip internal quiz selector)
- Remove the internal `<Select>` for quiz when `quizId` is passed from parent
- Keep internal selector only when component is used standalone (no quizId prop) — but since it's now always embedded in Responses with the global filter, effectively the internal filter is hidden
- Sync `selectedQuiz` state with the `quizId` prop via useEffect

#### 3. Master Admin tables — sortable columns
**File: `src/pages/AdminDashboard.tsx`**
- Add sorting state: `sortColumn` and `sortDirection` (asc/desc)
- Make all `TableHead` elements clickable with sort indicator arrows
- Apply `sort()` to `filteredAdministrators` and `paginatedRespondents` based on active sort
- Tables affected: Users table (Nome, Email, Cadastro, Último Login, Logins, Quizzes, Leads, Plano) and Respondents table (Nome, Email, WhatsApp, Quiz, Respostas, Última Resposta)

#### 4. Funnel mode — track button/redirect clicks on last question
**File: `src/hooks/useQuizViewState.ts`**
- In `handleAnswer`, when the user is on the last visible question in funnel mode and selects an option, the answer is already saved via `submitQuizSilent`. This already works.
- For button-type blocks (CTA/redirect blocks) on the last question: currently clicking a button with `action: 'next_question'` or `url` doesn't record the answer. Add tracking in the button click handler to save that the user completed the last step.
- In `nextStep()`, also trigger a progressive save BEFORE advancing (already done), ensuring last-question interactions are captured.

#### 5. Generate analytics/leads report document
**File: `/mnt/documents/ANALYTICS_LEADS_REPORT.md`**
- Create a comprehensive markdown report documenting how analytics and leads are recorded for both quiz modes (funnel vs result)
- Cover: quiz_responses insertion, track-quiz-analytics events (view/start/complete), track-quiz-step, progressive save, heatmap data flow, CRM lead capture

---

### Files Modified/Created

| File | Action |
|------|--------|
| `src/components/analytics/ResponseHeatmap.tsx` | Fix parseOptions to read blocks; remove internal quiz filter when quizId prop present; fetch blocks column |
| `src/pages/Responses.tsx` | Heatmap as first tab; pass selectedQuiz to ResponseHeatmap |
| `src/pages/AdminDashboard.tsx` | Add sortable columns to Users and Respondents tables |
| `src/hooks/useQuizViewState.ts` | Ensure funnel button clicks on last question trigger progressive save |
| `/mnt/documents/ANALYTICS_LEADS_REPORT.md` | New — comprehensive report on analytics/leads by quiz type |

