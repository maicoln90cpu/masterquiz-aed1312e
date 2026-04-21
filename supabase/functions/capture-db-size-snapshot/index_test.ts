/**
 * 🔒 PROTEÇÃO P12 — Smoke test capture-db-size-snapshot.
 * Valida CORS apenas. A função usa SERVICE_ROLE_KEY internamente
 * e não tem validação de payload (é chamada por pg_cron).
 * Execução real pertence ao admin/cron.
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/capture-db-size-snapshot`;

Deno.test("capture-db-size-snapshot: CORS preflight ok", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  await res.text();
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("capture-db-size-snapshot: GET retorna envelope padronizado", async () => {
  // Função aceita qualquer método não-OPTIONS. Como roda com SERVICE_ROLE,
  // pode retornar ok=true (se cron tem permissão) ou ok=false (se faltar env).
  // O importante é validar o SHAPE do envelope.
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
  // Envelope P11: deve ter `ok` boolean e `traceId` string
  if (typeof data.ok !== "boolean") {
    throw new Error(`Esperava envelope { ok, ... }, recebi: ${JSON.stringify(data).slice(0, 200)}`);
  }
  if (typeof data.traceId !== "string" || data.traceId.length === 0) {
    throw new Error(`traceId ausente ou vazio no envelope: ${JSON.stringify(data).slice(0, 200)}`);
  }
});
