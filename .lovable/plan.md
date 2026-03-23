

## Plan: Fix Funnel Mode Analytics, Heatmap & Response Tracking

### ✅ IMPLEMENTED

#### 1. Database: `session_id` column on `quiz_responses`
- Added nullable `session_id TEXT` column
- Created unique partial index `idx_quiz_responses_session(quiz_id, session_id) WHERE session_id IS NOT NULL`
- Added RLS policy for anon UPDATE on rows with session_id

#### 2. Progressive save in `useQuizViewState.ts`
- `nextStep()` now upserts partial answers for funnel mode (`show_results=false`)
- Uses `session_id` for deduplication via `onConflict: 'quiz_id,session_id'`
- Tracks `complete` event when user reaches last question in funnel mode

#### 3. `submitQuiz` adjusted for funnel mode
- Uses `upsert` instead of `insert` for funnel quizzes (updates progressive-saved row)
- Skips duplicate `complete` tracking for funnel mode (already tracked in `nextStep`)

#### 4. Heatmap moved from Analytics → Responses
- Removed "Heatmaps" tab from `Analytics.tsx`
- Added "Heatmap" tab to `Responses.tsx`
- `ResponseHeatmap` component unchanged

### Files Modified

| File | Action |
|------|--------|
| Migration | Add `session_id` + unique index + anon UPDATE RLS |
| `src/hooks/useQuizViewState.ts` | Progressive save + upsert + funnel completion tracking |
| `src/pages/Analytics.tsx` | Remove Heatmap tab (3→3 tabs: Geral, Por Quiz, Vídeos) |
| `src/pages/Responses.tsx` | Add Heatmap tab (2→3 tabs: Respostas, Planilha, Heatmap) |
