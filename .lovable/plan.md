

## Plan: Cost Fixes, Callout Bold Toggle, E-goi Webhook Fix, Documentation

### Findings from Investigation

**1) Blog costs showing $0**: The `blog_generation_logs` table has **0 rows** despite 9 AI-generated blog posts existing. The `generate-blog-post` edge function does include logging code (line 356), but the function likely wasn't deployed with this code when those 9 posts were generated, OR the insert silently failed. The function needs redeployment. Historical posts won't have logs retroactively.

**2) Top 10 users quiz showing nobody**: The `ai_quiz_generations` table has data (10+ rows with costs), BUT its RLS SELECT policy is `user_id = auth.uid()` — meaning each user can only see their own generations. The admin dashboard runs client-side queries with the user's JWT, so the admin can only see their own rows (if any). **Fix**: Add an admin SELECT policy to `ai_quiz_generations`.

**3) Callout title bold toggle**: Add a `titleBold` property toggle in CalloutProperties.

**4) Text field formatting scan**: Review text inputs across the editor for consistency.

**5) E-goi webhook not receiving data**: The `egoi-email-webhook` edge function has **zero logs ever** — E-goi is not sending events to it. The `process-email-recovery-queue` does NOT include a `webhookUrl` field in the E-goi API send request body, so E-goi doesn't know where to send open/click events per-message. The manual webhook registration in the E-goi dashboard may only apply to Marketing API, not Transactional V2 (Slingshot). **Fix**: Add `webhookUrl` to the send payload in `process-email-recovery-queue`.

**6) EGOI.MD and BLOG.MD**: Create comprehensive replication guides.

---

### Changes

#### 1. Fix `ai_quiz_generations` RLS — Add admin SELECT policy
Migration to add:
```sql
CREATE POLICY "Admins view all AI generations"
ON public.ai_quiz_generations FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'master_admin')
);
```

#### 2. Fix E-goi webhook — Add `webhookUrl` to send payload
In `supabase/functions/process-email-recovery-queue/index.ts`, add `webhookUrl` to the E-goi Slingshot API request body:
```typescript
body: JSON.stringify({
  senderId: senderInfo.senderId,
  senderName,
  to: contact.email,
  subject,
  htmlBody: htmlContent,
  openTracking: true,
  clickTracking: true,
  webhookUrl: 'https://kmmdzwoidakmbekqvkmq.supabase.co/functions/v1/egoi-email-webhook',
  // ...existing customHeaders
})
```

#### 3. Redeploy `generate-blog-post`
Ensure the current code (with logging) is deployed so future posts create log entries.

#### 4. Add note in costs dashboard about historical data
Add explanatory text under Blog section noting that posts generated before cost tracking was deployed show $0.

#### 5. Callout title bold toggle
- **BlockPropertiesPanel.tsx** (CalloutProperties): Add `SwitchRow` for "Título em negrito" toggling `block.titleBold` (default true)
- **VisualBlockPreviews.tsx** (CalloutBlockPreview): Use `font-bold` conditionally based on `block.titleBold !== false`

#### 6. Text field formatting improvements
Scan all block property text inputs for consistent styling:
- Ensure all `textarea` elements use proper component styling (border, focus ring, radius)
- Replace raw `<textarea>` in CalloutProperties with the `Textarea` component from `@/components/ui/textarea`

#### 7. Create `docs/EGOI.md`
Comprehensive guide covering:
- E-goi Slingshot (Transactional V2) integration architecture
- Database schema: `email_recovery_contacts`, `email_recovery_settings`, `email_recovery_templates`, `email_unsubscribe_log`
- Edge functions: `process-email-recovery-queue`, `egoi-email-webhook`, `handle-email-unsubscribe`, `check-inactive-users-email`, `send-test-email`, `generate-email-content`
- Trigger-based automation (welcome, first quiz tutorial, lead milestones)
- Template system (static + AI-generated), A/B testing, deduplication
- Webhook tracking (open/click), cooldown, unsubscribe compliance
- All code patterns abstracted for reuse in any Lovable project

#### 8. Create `docs/BLOG.md`
Comprehensive guide covering:
- Blog generation architecture (cron → edge function → OpenAI + Gemini)
- Database schema: `blog_posts`, `blog_settings`, `blog_generation_logs`, `blog_image_prompts`
- Edge functions: `generate-blog-post`, `blog-cron-trigger`, `blog-sitemap`, `track-blog-view`, `regenerate-blog-asset`
- Topic deduplication, image style rotation, SEO (JSON-LD, hreflang, internal links)
- Cost tracking system
- All code patterns abstracted for reuse

---

### Files Modified/Created

| File | Action |
|------|--------|
| `supabase/functions/process-email-recovery-queue/index.ts` | Add `webhookUrl` to send payload |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | Add titleBold toggle to Callout; replace raw textarea with Textarea component |
| `src/components/quiz/preview/VisualBlockPreviews.tsx` | Conditional bold on callout title |
| `src/components/admin/UnifiedCostsDashboard.tsx` | Add historical data note for blog |
| `docs/EGOI.md` | New — full replication guide |
| `docs/BLOG.md` | New — full replication guide |
| Migration | Add admin RLS policy on `ai_quiz_generations` |
| Deploy | `generate-blog-post`, `process-email-recovery-queue` |

