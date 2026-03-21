

## Plan: Fix Image Options in Published Quiz, Re-enable Templates, Audit Tests

### Problem 1: Images Not Showing in Published Quiz

**Root cause identified**: Two completely separate rendering pipelines exist:

1. **Editor preview** uses `QuestionBlockPreview.tsx` — correctly reads `optionImages`, `optionImageLayout`, `optionImageSize` and renders image cards with dynamic grid layouts.
2. **Published quiz** uses `QuizViewQuestion.tsx` → `QuestionBlockRenderer` → `SingleChoiceOptions` / `MultipleChoiceOptions` — these components **completely ignore** `optionImages`, `optionImageLayout`, and `optionImageSize`. They only render text + emoji.

**Fix**: Refactor `SingleChoiceOptions` and `MultipleChoiceOptions` in `QuizViewQuestion.tsx` (lines 390-505) to:
- Accept `optionImages`, `optionImageLayout`, `optionImageSize` from the block
- Pass these props from `QuestionBlockRenderer` (line 259+)
- Render image cards (same visual pattern as `QuestionBlockPreview`) when images exist
- Apply dynamic grid layout classes based on `optionImageLayout`
- Apply dynamic aspect ratios based on `optionImageSize`

Files changed:
- `src/components/quiz/view/QuizViewQuestion.tsx` — Add image support to `OptionsProps`, `SingleChoiceOptions`, `MultipleChoiceOptions`, and `QuestionBlockRenderer`

### Problem 2: Re-enable Disabled Templates

**Root cause**: The freeze was caused by duplicate hook instances in `CreateQuiz.tsx`. That was fixed (thin router pattern). The 14 templates in `disabledTemplateIds` can now be re-enabled.

**Fix**: Remove the `disabledTemplateIds` Set and all filtering logic in `useQuizTemplates.ts` (lines 58-74, and references on lines 82, 88, 95).

Files changed:
- `src/hooks/useQuizTemplates.ts` — Remove `disabledTemplateIds` and related filters

### Problem 3: Audit & Fix Remaining Test Failures

Will investigate each failing test file to identify the specific mock or assertion issue. Common patterns from the current setup:
- Missing mocks for `useProfile`, `useSubscriptionLimits` 
- Component tests that need `MemoryRouter` wrapper
- Hook tests with incomplete Supabase chain mocks

Files potentially changed:
- `src/__tests__/setup.ts` — Add any missing global mocks
- Individual test files as needed

### Execution Order
1. Fix `QuizViewQuestion.tsx` (published quiz image rendering)
2. Remove `disabledTemplateIds` from `useQuizTemplates.ts`
3. Run tests, diagnose failures, fix remaining ones

