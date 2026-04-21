/**
 * 🔒 PROTEÇÃO P12 — Smoke test rate-limiter.
 * Valida CORS + validação de payload. Não testa lógica de bloqueio
 * (depende do estado da tabela rate_limit_tracker).
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/rate-limiter`;

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

Deno.test("rate-limiter: CORS preflight responde com Allow-Origin", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  await res.text();
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("rate-limiter: 400 quando payload faltando identifier+action", async () => {
  const { status, data } = await call({});
  assertEquals(status, 400);
  assertExists(data.error);
});

Deno.test("rate-limiter: 200 com allowed=true para action válida e identifier único", async () => {
  const uniqueId = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { status, data } = await call({
    identifier: uniqueId,
    action: "api:general",
  });
  assertEquals(status, 200);
  assertEquals(data.allowed, true);
  assertExists(data.remainingAttempts);
});
