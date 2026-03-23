

## Plan: Fix Funnel Mode Analytics, Heatmap & Response Tracking

### Root Cause Analysis

**The core problem**: For funnel quizzes (`show_results = false`), a `quiz_response` row is ONLY created when `submitQuiz()` fires — which only happens via auto-submit on the absolute LAST question. Most users drop off before that, so their answers are **never saved**.

**Evidence** (quiz "Mãe Consciente"):
- 35 views, 18 starts, step analytics show 7 people reached the last question
- But only **1 row** in `quiz_responses` — only 1 person answered the last question
- Heatmap correctly shows 1 respondent (because there's only 1 response)
- CRM has only 1 lead (same reason)
- Analytics shows 1 completion (only `submitQuiz` fires `track-quiz-analytics complete`)

**For "with results" quizzes**: everything works because users must click "Submit" → `submitQuiz` always fires.

**For funnel quizzes**: users navigate through questions and may leave at any point. No data is saved until the very end.

---

### Solution: Progressive Response Saving for Funnel Mode

#### 1. Add `session_id` column to `quiz_responses`
Migration to add a nullable `session_id` text column with a unique constraint on `(quiz_id, session_id)`. This enables upsert-based progressive saving — one row per session, updated as the user progresses.

#### 2. Progressive save in `useQuizViewState.ts`
In `nextStep()`, when `show_results === false` (funnel mode):
- **Upsert** a `quiz_response` row with the current `answers` object, using `session_id` for deduplication
- This means partial responses are saved as users navigate (not just at the end)
- The final `submitQuiz` call will do the last upsert with the complete data
- Use `.upsert()` with `onConflict: 'quiz_id,session_id'` to avoid duplicates

#### 3. Track "completion" for funnel mode
In `nextStep()`, when the user navigates TO the last question (`nextStepNumber === visibleQuestions.length - 1`) in funnel mode:
- Fire `track-quiz-analytics` with event `'complete'`
- This counts anyone who **reached** the last question as "completed" for funnel quizzes

#### 4. Fix heatmap for funnel mode
No changes needed — once progressive saving populates `quiz_responses` with partial answers, the heatmap will automatically show data for all respondents (even those who didn't finish).

#### 5. Move Heatmap from Analytics to Responses page
- Add a "Heatmap" tab to `Responses.tsx` (alongside existing tabs)
- Remove the "Heatmaps" tab from `Analytics.tsx`
- The `ResponseHeatmap` component stays unchanged, just relocated

#### 6. Adjust `submitQuiz` for funnel mode
When `show_results === false` and a `session_id` exists:
- Use `upsert` instead of `insert` so the final submission updates the existing partial row (adding form data, result_id, etc.)
- Skip the 'complete' analytics event here (already tracked in step 3)

---

### Technical Details

**New column:**
```sql
ALTER TABLE public.quiz_responses ADD COLUMN session_id TEXT;
CREATE UNIQUE INDEX idx_quiz_responses_session ON public.quiz_responses(quiz_id, session_id) WHERE session_id IS NOT NULL;
```

**Progressive save logic (in nextStep):**
```typescript
// Only for funnel mode (show_results=false)
if (!quizShowResults && !previewMode && quiz?.id) {
  supabase.from('quiz_responses').upsert({
    quiz_id: quiz.id,
    session_id: sessionId,
    answers: sanitizeAnswers(answers),
    // name/email/whatsapp only if already collected (before-quiz form)
  }, { onConflict: 'quiz_id,session_id' }).then(/* silent */);
}
```

**Completion tracking for funnel:**
```typescript
// In nextStep(), when reaching last question in funnel mode
if (!quizShowResults && nextStepNumber === visibleQuestions.length - 1) {
  supabase.functions.invoke('track-quiz-analytics', {
    body: { quizId: quiz.id, event: 'complete' }
  });
}
```

---

### Answers to Your Questions

1. **When are respondents inserted in CRM?** When `submitQuiz()` fires and inserts into `quiz_responses`. CRM reads from this table. For "with results" mode this works (explicit submit). For funnel mode, it only happens if the user answers the very last question (auto-submit). **Fix**: progressive save ensures partial responses exist in `quiz_responses`.

2. **Heatmap not capturing funnel data**: Correct — only 1 `quiz_response` row exists. Progressive saving fixes this.

3. **How "completed" is counted**: Currently only via `submitQuiz` → `track-quiz-analytics complete`. For funnel mode, we'll track completion when reaching the last question.

4. **When are responses saved?** Only in `submitQuiz`. For funnel, this is the bug. Progressive save fixes it.

5. **Consolidation**: Move heatmap to Responses page since it's about per-response data, not aggregate analytics.

---

### Files Modified/Created

| File | Action |
|------|--------|
| Migration | Add `session_id` column + unique index to `quiz_responses` |
| `src/hooks/useQuizViewState.ts` | Add progressive save in `nextStep()` for funnel mode; adjust `submitQuiz` to upsert; track completion on last question |
| `src/pages/Responses.tsx` | Add "Heatmap" tab with `ResponseHeatmap` component |
| `src/pages/Analytics.tsx` | Remove "Heatmaps" tab |

