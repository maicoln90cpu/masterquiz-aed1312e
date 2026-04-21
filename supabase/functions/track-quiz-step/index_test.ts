/**
 * 🔒 PROTEÇÃO P12 — Smoke test track-quiz-step.
 * Valida CORS + validação de parâmetros + 404 para quiz inexistente.
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/track-quiz-step`;

async function call(body: Record<string, unknown>) {
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

Deno.test("track-quiz-step: CORS preflight ok", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  await res.text();
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("track-quiz-step: 400 sem quizId/sessionId", async () => {
  const { status, data } = await call({ stepNumber: 0 });
  assertEquals(status, 400);
  assertExists(data.error);
});

Deno.test("track-quiz-step: 400 com stepNumber negativo", async () => {
  const { status, data } = await call({
    quizId: "00000000-0000-0000-0000-000000000000",
    sessionId: "smoke-step",
    stepNumber: -1,
  });
  assertEquals(status, 400);
  assertExists(data.error);
});

Deno.test("track-quiz-step: 404 para quiz inexistente", async () => {
  const { status, data } = await call({
    quizId: "00000000-0000-0000-0000-000000000000",
    sessionId: `smoke-step-${Date.now()}`,
    stepNumber: 0,
  });
  assertEquals(status, 404);
  assertExists(data.error);
});
