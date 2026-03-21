

## Plan: Fix All Remaining Test Failures

The remaining failures fall into clear categories. Here's the fix strategy for each.

---

### Category 1: `useUserRole.test.tsx` — Global mock conflict

**Problem**: The test file uses `vi.unmock` pattern with `AuthProvider` but the global `setup.ts` mocks `@/contexts/AuthContext`. The test already defines its own supabase mock but needs to explicitly unmock `useUserRole` (since `setup.ts` mocks it globally) and `AuthContext`.

**Fix**: Add `vi.unmock('@/hooks/useUserRole')` and `vi.unmock('@/contexts/AuthContext')` at the top of `useUserRole.test.tsx`, similar to how `AuthContext.test.tsx` does it. Also need to add `supabase.functions` and `supabase.rpc` to the local supabase mock so `AuthProvider` doesn't crash.

---

### Category 2: `Analytics.test.tsx` — Missing `DashboardLayout` and hook mocks

**Problem**: `Analytics` imports `DashboardLayout`, `useTrackPageView`, `useOnboarding`, and other components that use `useAuth` internally. The global mock provides `useAuth` with `user: null`, so authenticated-only UI doesn't render.

**Fix**: 
- Add `vi.mock('@/contexts/AuthContext')` override with authenticated user (like CRM/Dashboard already do)
- Add `vi.mock('@/components/DashboardLayout')` to render children directly
- Add `vi.mock('@/hooks/useUserStage')` to stub `useTrackPageView`

---

### Category 3: `CRM.test.tsx` — Missing `DashboardLayout` and `useTrackPageView` mocks

**Problem**: Same as Analytics. `CRM` uses `DashboardLayout` which has `DashboardSidebar` → complex component tree needing auth.

**Fix**: Add `vi.mock('@/components/DashboardLayout')` and `vi.mock('@/hooks/useUserStage')` mocks.

---

### Category 4: `Dashboard.test.tsx` — Missing `DashboardLayout` mock

**Problem**: Same pattern. The Dashboard component renders `DashboardLayout` which crashes without proper sidebar/auth context.

**Fix**: Add `vi.mock('@/components/DashboardLayout')` and `vi.mock('@/hooks/useUserStage')`.

---

### Category 5: `UnifiedQuizPreview.test.tsx` — Assertion mismatches

**Problem**: Tests assert `getByLabelText('Sim')` but the component may render options differently (as buttons/divs, not as `<label>` + `<input>`). Also progress text format may differ.

**Fix**: Read `UnifiedQuizPreview.tsx` to verify how options are rendered, then adjust assertions to match (e.g., `getByText` instead of `getByLabelText`, correct progress format).

---

### Category 6: `DashboardTour.test.tsx` and `Onboarding.test.tsx` — `test-utils` wrapper

**Problem**: These use `@/__tests__/test-utils` which wraps in `MockAuthProvider` (not the real one), so `useAuth` calls still use the global mock returning `null`. Should work but may have import conflicts with the global mock.

**Fix**: Verify these pass or add minimal fixes if they fail on specific assertions.

---

### Category 7: `QuizView.test.tsx` — `test-utils` wrapper + assertion format

**Problem**: Uses `@/__tests__/test-utils` and renders `QuizView` in preview mode. The `rpc` mock from the local supabase mock is missing, causing `get_quiz_for_display` call to fail.

**Fix**: Already has local supabase mock with `functions.invoke`. Verify assertions match current rendering.

---

### Files to modify

| File | Change |
|------|--------|
| `src/hooks/__tests__/useUserRole.test.tsx` | Add `vi.unmock` for AuthContext and useUserRole, expand supabase mock |
| `src/pages/__tests__/Analytics.test.tsx` | Add DashboardLayout mock, AuthContext override, useUserStage mock |
| `src/pages/__tests__/CRM.test.tsx` | Add DashboardLayout mock, useUserStage mock |
| `src/pages/__tests__/Dashboard.test.tsx` | Add DashboardLayout mock, useUserStage mock |
| `src/components/quiz/__tests__/UnifiedQuizPreview.test.tsx` | Adjust assertions to match actual rendering |
| Other test files | Minor mock additions as needed |

### Approach
Fix all files in parallel, targeting the specific mock gaps identified above. No production code changes needed.

