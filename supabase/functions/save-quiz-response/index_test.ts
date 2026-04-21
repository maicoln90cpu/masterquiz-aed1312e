import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/save-quiz-response`;

async function callFunction(body: Record<string, unknown>) {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

// ─── Validation tests ───────────────────────────────────

// 🔒 P11 envelope: { ok:false, error:{code,message}, traceId }

Deno.test("returns 400 + VALIDATION_FAILED when quiz_id is missing", async () => {
  const { status, data } = await callFunction({ session_id: "test-session" });
  assertEquals(status, 400);
  assertEquals(data.ok, false);
  assertEquals(data.error.code, "VALIDATION_FAILED");
  assertExists(data.traceId);
});

Deno.test("returns 400 + VALIDATION_FAILED when session_id is missing", async () => {
  const { status, data } = await callFunction({ quiz_id: "fake-quiz-id" });
  assertEquals(status, 400);
  assertEquals(data.ok, false);
  assertEquals(data.error.code, "VALIDATION_FAILED");
  assertExists(data.traceId);
});

Deno.test("returns 404 + NOT_FOUND for non-existent quiz", async () => {
  const { status, data } = await callFunction({
    quiz_id: "00000000-0000-0000-0000-000000000000",
    session_id: "test-session-404",
  });
  assertEquals(status, 404);
  assertEquals(data.ok, false);
  assertEquals(data.error.code, "NOT_FOUND");
  assertExists(data.traceId);
});

// ─── Milestone logic tests (integration) ────────────────

Deno.test("test lead (_is_test_lead) should NOT trigger first_lead_received", async () => {
  const { status, data } = await callFunction({
    quiz_id: "00000000-0000-0000-0000-000000000000",
    session_id: `test-lead-filter-${Date.now()}`,
    respondent_email: "test@test.com",
    answers: { _is_test_lead: true },
  });
  assertEquals(status, 404);
  assertEquals(data.error.code, "NOT_FOUND");
});

Deno.test("response without contact info should NOT count as lead", async () => {
  const { status, data } = await callFunction({
    quiz_id: "00000000-0000-0000-0000-000000000000",
    session_id: `no-contact-${Date.now()}`,
    answers: { q1: "answer1" },
  });
  assertEquals(status, 404);
  assertEquals(data.error.code, "NOT_FOUND");
});

Deno.test("CORS headers are present in response", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: {
      apikey: SUPABASE_ANON_KEY,
    },
  });
  await res.text(); // consume body
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});
