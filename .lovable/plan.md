

## Plan: Mobile UX for Modern Editor + Unified Costs Dashboard

### Problem 1: Properties panel inaccessible on mobile (Step 3)

COL 1 (QuestionsList), COL 2 (ModernBlockPalette), and COL 4 (BlockPropertiesPanel) all use `hidden lg:flex` — completely invisible below `lg` (1024px). On mobile, the user sees only COL 3 (BlockEditor) with no way to access properties or questions.

**Fix**: Add a mobile toolbar at the top of Step 3 (visible only below `lg`) with:
- A **Sheet** (slide-from-left) for QuestionsList
- A **Sheet** (slide-from-right) for BlockPropertiesPanel
- A bottom **Sheet** or **Popover** for the block palette (add block)

Implementation in `CreateQuizModern.tsx`:
- Import `Sheet, SheetContent, SheetTrigger` from `@/components/ui/sheet`
- Add 3 state variables: `mobileQuestionsOpen`, `mobilePropertiesOpen`, `mobilePaletteOpen`
- Render a sticky toolbar bar (`flex lg:hidden`) above the BlockEditor with 3 icon buttons:
  - `List` icon → opens QuestionsList sheet (left side)
  - `Plus` icon → opens ModernBlockPalette sheet (bottom)
  - `Settings2` icon → opens BlockPropertiesPanel sheet (right side)
- Each sheet contains the same component already rendered in the desktop columns

### Problem 2: Question navigation on mobile

Same root cause as Problem 1 — QuestionsList is `hidden lg:flex`. The mobile toolbar sheet (Problem 1 fix) solves this: users can open the questions sheet to navigate, delete, reorder, and add questions.

Additionally, the step bar numbers (1-5) hide labels on mobile (`hidden md:inline`). The step numbers remain visible so navigation between steps works. No additional fix needed beyond Problem 1.

### Problem 3: Unified Costs Dashboard in Admin

Currently costs are split across two places:
- `AISettings.tsx` → "Custos IA" tab (quiz AI generation costs from `ai_quiz_generations`)
- `BlogCostTracking.tsx` → Blog costs (from `blog_generation_logs`)

No unified view exists. Email costs aren't tracked.

**Fix**: Create a new `UnifiedCostsDashboard.tsx` component and add it as a new subtab "Custos" under the **Conteúdo** tab in `AdminDashboard.tsx`.

Structure:
- **Top row**: 4 summary cards showing totals across ALL categories (Total Gasto, Blog, Quiz IA, Email)
- **Category sections** below, each with their own breakdown:
  - **Blog**: Text cost (OpenAI), Image cost (Gemini), avg per article — from `blog_generation_logs`
  - **Quiz IA**: Total tokens, cost per generation, monthly trend — from `ai_quiz_generations`
  - **Email**: Placeholder cards (no cost tracking table yet — show "Sem dados" with note)
- **Monthly chart**: Stacked bar chart showing all categories per month

Files changed:
- `src/components/admin/UnifiedCostsDashboard.tsx` — New component
- `src/pages/AdminDashboard.tsx` — Add "Custos" subtab under Conteúdo (with `DollarSign` icon)
- `src/pages/CreateQuizModern.tsx` — Add mobile toolbar with Sheet drawers for questions/properties/palette

### Technical Details

**Mobile toolbar** (CreateQuizModern.tsx, ~40 lines added):
```text
┌─────────────────────────────────┐
│ [☰ Perguntas] [+ Bloco] [⚙ Props] │  ← visible only < lg
├─────────────────────────────────┤
│         BlockEditor             │
└─────────────────────────────────┘
```

**Unified Costs** queries:
- `blog_generation_logs` → `text_cost_usd`, `image_cost_usd`, `total_cost_usd`
- `ai_quiz_generations` → `estimated_cost_usd`, `total_tokens`
- Email → no table yet, show placeholder

