/**
 * 🔒 PROTEÇÃO P12 — Smoke test system-health-check.
 * Valida CORS + bloqueio de chamadas sem JWT.
 * Não testa execução completa (exige usuário admin autenticado).
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/system-health-check`;

Deno.test("system-health-check: CORS preflight ok", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  await res.text();
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("system-health-check: 401 sem header Authorization Bearer", async () => {
  // Envia apenas apikey (sem JWT do usuário) — função rejeita.
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  assertEquals(res.status, 401);
  assertExists(data.error);
});

Deno.test("system-health-check: 401 com JWT inválido (anon não-admin)", async () => {
  // Anon key como Bearer → getUser retorna null → 401.
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  assertEquals(res.status, 401);
  assertExists(data.error);
});
