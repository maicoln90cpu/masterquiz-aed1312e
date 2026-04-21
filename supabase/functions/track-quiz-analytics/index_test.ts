/**
 * 🔒 PROTEÇÃO P12 — Smoke test track-quiz-analytics.
 * Valida CORS + validação de payload + 404 para quiz inexistente.
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/track-quiz-analytics`;

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

Deno.test("track-quiz-analytics: CORS preflight ok", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  await res.text();
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("track-quiz-analytics: 400 sem quizId", async () => {
  const { status, data } = await call({ event: "view" });
  assertEquals(status, 400);
  assertExists(data.error);
});

Deno.test("track-quiz-analytics: 400 com event inválido", async () => {
  const { status, data } = await call({
    quizId: "00000000-0000-0000-0000-000000000000",
    event: "click_anywhere", // não é 'view'/'start'/'complete'
  });
  assertEquals(status, 400);
  assertExists(data.error);
});

Deno.test("track-quiz-analytics: 404 para quiz inexistente", async () => {
  const { status, data } = await call({
    quizId: "00000000-0000-0000-0000-000000000000",
    event: "view",
  });
  assertEquals(status, 404);
  assertExists(data.error);
});
