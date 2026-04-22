/**
 * 🔒 PROTEÇÃO P12 — Smoke test rate-limiter.
 * Valida CORS, validação de payload e a lógica de bloqueio (P25).
 * Cada teste de bloqueio usa um identifier único (`${prefix}-${Date.now()}`)
 * para garantir isolamento da janela em rate_limit_tracker.
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

function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  // Envelope P11 → { ok:false, error:{code,message}, traceId }
  assertEquals(data.ok, false);
  assertExists(data.error);
  assertEquals(data.error.code, "VALIDATION_FAILED");
});

Deno.test("rate-limiter: 200 com allowed=true para action válida e identifier único", async () => {
  const id = uniqueId("smoke");
  const { status, data } = await call({
    identifier: id,
    action: "api:general",
  });
  assertEquals(status, 200);
  assertEquals(data.ok, true);
  assertEquals(data.data.allowed, true);
  assertExists(data.data.remainingAttempts);
});

// ────────────────────────────────────────────────────────────────────────────
// 🔒 P25 — Testes da LÓGICA DE BLOQUEIO
// ────────────────────────────────────────────────────────────────────────────

Deno.test("rate-limiter: decrementa remainingAttempts a cada chamada do mesmo identifier", async () => {
  const id = uniqueId("decrement");
  const r1 = await call({ identifier: id, action: "api:general" });
  const r2 = await call({ identifier: id, action: "api:general" });
  const r3 = await call({ identifier: id, action: "api:general" });
  assertEquals(r1.data.data.allowed, true);
  assertEquals(r2.data.data.allowed, true);
  assertEquals(r3.data.data.allowed, true);
  // remainingAttempts deve diminuir monotonicamente
  const a = r1.data.data.remainingAttempts as number;
  const b = r2.data.data.remainingAttempts as number;
  const c = r3.data.data.remainingAttempts as number;
  if (!(a > b && b > c)) {
    throw new Error(`remainingAttempts não decresce: ${a} > ${b} > ${c}`);
  }
});

Deno.test("rate-limiter: bloqueia após exceder o limite (auth:register, max=3)", async () => {
  const id = uniqueId("block");
  // auth:register tem maxAttempts=3 → 3 OK, 4ª = RATE_LIMITED
  const ok1 = await call({ identifier: id, action: "auth:register" });
  const ok2 = await call({ identifier: id, action: "auth:register" });
  const ok3 = await call({ identifier: id, action: "auth:register" });
  const blocked = await call({ identifier: id, action: "auth:register" });
  assertEquals(ok1.data.data.allowed, true);
  assertEquals(ok2.data.data.allowed, true);
  assertEquals(ok3.data.data.allowed, true);
  // 4ª tentativa → 429 RATE_LIMITED
  assertEquals(blocked.status, 429);
  assertEquals(blocked.data.ok, false);
  assertEquals(blocked.data.error.code, "RATE_LIMITED");
});

Deno.test("rate-limiter: identifiers diferentes têm contadores independentes", async () => {
  const idA = uniqueId("isolate-a");
  const idB = uniqueId("isolate-b");
  const a1 = await call({ identifier: idA, action: "auth:register" });
  const a2 = await call({ identifier: idA, action: "auth:register" });
  const b1 = await call({ identifier: idB, action: "auth:register" });
  // Após 2 chamadas em A, B deve estar com contador "fresco" (remaining = max-1)
  assertEquals(a1.data.data.allowed, true);
  assertEquals(a2.data.data.allowed, true);
  assertEquals(b1.data.data.allowed, true);
  // remainingAttempts(B) > remainingAttempts(A) — prova isolamento
  if (b1.data.data.remainingAttempts <= a2.data.data.remainingAttempts) {
    throw new Error(
      `Contadores não estão isolados: A=${a2.data.data.remainingAttempts}, B=${b1.data.data.remainingAttempts}`,
    );
  }
});

Deno.test("rate-limiter: actions diferentes têm contadores independentes", async () => {
  const id = uniqueId("multi-action");
  // Mesmo identifier, mas duas actions distintas → não compartilham janela
  const auth = await call({ identifier: id, action: "auth:register" });
  const general = await call({ identifier: id, action: "api:general" });
  assertEquals(auth.data.data.allowed, true);
  assertEquals(general.data.data.allowed, true);
  // api:general tem maxAttempts=100, auth:register=3 → general remaining ≫ auth
  if (general.data.data.remainingAttempts <= auth.data.data.remainingAttempts) {
    throw new Error(
      `Contadores cruzaram entre actions: auth=${auth.data.data.remainingAttempts}, general=${general.data.data.remainingAttempts}`,
    );
  }
});

Deno.test("rate-limiter: action desconhecida cai no fallback api:general", async () => {
  const id = uniqueId("fallback");
  const { status, data } = await call({
    identifier: id,
    action: "totally-unknown-action-xyz",
  });
  assertEquals(status, 200);
  assertEquals(data.ok, true);
  assertEquals(data.data.allowed, true);
  // Fallback usa api:general (max=100), então remaining inicial = 99
  assertEquals(data.data.remainingAttempts, 99);
});
