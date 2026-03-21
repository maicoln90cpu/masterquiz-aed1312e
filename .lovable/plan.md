

## Plan: Documentation Overhaul v2.37 + Knowledge Prompt

### Summary

Update all 10 markdown files to reflect current state (v2.37, 34 block types, thin router pattern, image options in published quiz, re-enabled templates, test suite fixes). Move `README.md` reference to `docs/`, rename `blocks.md` to `BLOCKS.md`, create a new `TESTING.md`, and generate a knowledge prompt.

---

### Answer: "0 criados, 1 publicado" Paradox

This is **by design** in the code, not a bug. The two events have **different conditions**:

- `quiz_first_published` fires **always** when publishing for the first time (line 370: `if (earlyStages.includes(currentStage))`)
- `first_quiz_created` fires **only if** `hasUserInteracted === true` (line 382: `if (earlyStages.includes(currentStage) && hasUserInteracted)`)

So if someone used AI generation or Express mode (auto-generated quiz published without manual editing), the `hasUserInteracted` flag stays `false`, and `first_quiz_created` never fires. The published event fires regardless. This means a user can publish without "creating" in the tracking sense. The naming is misleading — `first_quiz_created` actually means "first quiz manually edited", not "first quiz record created in DB".

**Recommendation**: Rename the event label in `PQLAnalytics.tsx` from "Primeiro Quiz Criado" to "Primeiro Quiz Editado Manualmente" to avoid confusion, or change the A/B table to clarify this distinction.

---

### File Changes

#### 1. Rename `docs/blocks.md` → `docs/BLOCKS.md`
- Delete `docs/blocks.md`, create `docs/BLOCKS.md` with same content updated to 34 block types (add `calculator` if missing from catalog)

#### 2. Update `README.md`
- Version bump to 2.37.0, date to 21/03/2026
- Update "22 tipos de blocos" → "34 tipos de blocos" throughout
- Update "57 funções" Edge Functions count if changed
- Add `docs/BLOCKS.md` to documentation table
- Update features list: add "Image options in published quiz", "34 block types", "Classic/Modern editor modes"
- Add `CreateQuizClassic` and `CreateQuizModern` to architecture tree
- Update test count references

#### 3. Update `docs/PENDENCIAS.md`
- Add v2.37.0 entry with all recent changes:
  - Image options support in published quiz (optionImages, optionImageLayout, optionImageSize)
  - Re-enabled 14 templates (removed disabledTemplateIds)
  - CreateQuiz thin router pattern (Classic/Modern split)
  - Test suite stabilization (~22 fixes across 10 suites)
  - New block types: calculator, recommendation, conditionalText, comparisonResult, personalizedCTA, answerSummary, progressMessage, avatarGroup, callout, iconList, quote, badgeRow, banner
- Update pending items list

#### 4. Update `docs/ROADMAP.md`
- Version bump to 2.37
- Add H1 2026 completed items: 34 block types, Classic/Modern editor, image options in quiz view, test stabilization
- Update KPIs if needed

#### 5. Update `docs/PRD.md`
- Version bump to 2.37
- Add RF02.13: Image options per answer (optionImages, optionImageLayout)
- Add RF02.14: Classic/Modern editor modes
- Update block count from 22 to 34
- Update test suite table with current counts

#### 6. Update `docs/SYSTEM_DESIGN.md`
- Version bump to 2.37
- Update "Sistema de Blocos (22 tipos)" → "Sistema de Blocos (34 tipos)"
- Update BlockType union to include all 34 types
- Add CreateQuiz thin router architecture diagram
- Add image options data flow in published quiz

#### 7. Update `docs/COMPONENTS.md`
- Version bump to 2.37
- Add `CreateQuizClassic` and `CreateQuizModern` entries
- Update BlockEditor from "22 tipos" to "34 tipos"
- Add new block preview components (VisualBlockPreviews, DynamicBlockPreviews, RecommendationBlockPreview)

#### 8. Update `docs/API_DOCS.md`
- Version bump to 2.37 (content likely unchanged unless new edge functions added)

#### 9. Update `docs/STYLE_GUIDE.md`
- Version bump to 2.37
- Add pattern: thin router for heavy pages (CreateQuiz example)

#### 10. Update `docs/CHECKLIST.md`
- Add checklist items for image options in quiz answers
- Add checklist for Classic vs Modern editor mode selection
- Add checklist for new block types

#### 11. Update `docs/BLOCKS.md` (renamed from blocks.md)
- Ensure all 34 block types documented
- Update version to 2.37

#### 12. Create `docs/TESTING.md` (NEW)
- Document test infrastructure: setup.ts global mocks, test-utils.tsx wrappers
- Patterns: vi.unmock for real provider tests, DashboardLayout mock pattern
- Known mock requirements per component type
- How to run tests, coverage thresholds

#### 13. Update `docs/AUDIT_TEMPLATE.md`
- Minor: add "Block type coverage" audit item

#### 14. Fix cross-references
- `PENDENCIAS.md` line 407 has broken link `./docs/SYSTEM_DESIGN.md` (should be `./SYSTEM_DESIGN.md` since it's already in docs/)
- `README.md` links to `./docs/` paths (correct since it's in root)
- All docs/* files should reference siblings with `./` not `../docs/`

#### 15. Fix A/B label in `PQLAnalytics.tsx`
- Change "Primeiro Quiz Criado" → "Primeiro Quiz Editado" to clarify the `hasUserInteracted` condition

---

### Knowledge Prompt (delivered in chat after implementation)

Will provide a comprehensive prompt covering:
- Project identity and paradigm
- Architecture (thin router, 34 blocks, dual editor)
- All document locations and purposes
- Post-implementation checklist template
- Advantages/disadvantages analysis pattern

---

### Technical Details

- No production logic changes except the PQLAnalytics label fix
- All changes are documentation + one string rename
- Cross-reference validation across all 12 docs
- Estimated: ~12 files modified/created

