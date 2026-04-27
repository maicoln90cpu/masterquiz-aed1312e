# Correção: WhatsApp QR Code + Diagnóstico Webhook quebrados

## Antes vs Depois

**Antes (bug):**
- A Edge Function `evolution-connect` foi padronizada com o envelope P11: retorna `{ ok: true, data: {...}, traceId }`.
- Os dois componentes do painel admin ainda leem o **shape antigo**, acessando `data.qrCode`, `data.state`, `data.url_matches` diretamente.
- Como esses campos agora estão dentro de `data.data`, tudo vira `undefined`:
  - `WhatsAppConnection.tsx` cai no `else` → toast **"QR Code não recebido. Verifique a configuração da API."** (mesmo a Evolution tendo retornado o base64 — confirmado nos logs: `Connect response keys: [pairingCode, code, base64, count]`).
  - `EvolutionWebhookDiagnostics.tsx` faz `setResult(data)` com o envelope inteiro; ao tentar renderizar `result.url_matches`, `result.health.webhook_health` etc. dispara erro de runtime → **ErrorBoundary "Algo deu errado"** (print 1).

**Depois (fix):**
- Os dois componentes desempacotam o envelope: `const payload = data?.ok ? data.data : null;` e propagam erro amigável quando `data?.ok === false` usando `data.error.message`.
- QR Code volta a aparecer; diagnóstico renderiza o card de saúde corretamente.

## Causa raiz

Edge function migrou para o envelope padronizado (proteção P11) mas estes 2 consumidores não foram atualizados na mesma leva. Bug é **só de frontend** — a Evolution API e a função estão funcionando (logs confirmam).

## Arquivos a alterar

1. **`src/components/admin/recovery/WhatsAppConnection.tsx`**
   - `handleConnect` (linha ~295): após `invoke`, validar `data?.ok` e usar `data.data.qrCode` / `data.data.state`. Se `data.ok === false`, mostrar `data.error.message` no toast.
   - `checkStatus` (linha ~190) e `handleDisconnect` (linha ~360): mesmo tratamento (estavam consumindo `data?.state`, `data?.connected`).
   - Atualizar a interface `EvolutionResponse` (ou criar um helper `unwrapEnvelope<T>(data)`) para refletir `{ ok, data: {...}, traceId }`.

2. **`src/components/admin/recovery/EvolutionWebhookDiagnostics.tsx`**
   - `runDiagnostics` (linha 45): trocar `setResult(data)` por `setResult(data.ok ? data.data : null)` + tratar `data.ok === false` com `toast.error(data.error.message)`.
   - `fixWebhook` (linha ~62): mesmo tratamento — checar `data.ok` antes de ler `data.success`.

## Detalhes técnicos

Helper sugerido (inline nos dois arquivos, sem criar lib nova para limitar blast radius):

```ts
function unwrap<T>(resp: any): T | null {
  if (!resp) return null;
  if (resp.ok === true) return resp.data as T;
  return null;
}
```

Padrão de consumo:
```ts
const { data, error } = await supabase.functions.invoke('evolution-connect', { body: {...} });
if (error) throw error;
if (data?.ok === false) {
  toast.error(data.error?.message ?? 'Erro desconhecido');
  return;
}
const payload = unwrap<ConnectPayload>(data);
// usa payload.qrCode, payload.state, etc.
```

## Vantagens / Desvantagens

**Vantagens**
- Conserta os 2 erros visíveis sem tocar em backend (zero risco de regressão na Evolution API).
- Alinha frontend com proteção P11 já adotada por outras telas.
- Mensagens de erro do backend (`data.error.message`) passam a aparecer no toast — facilita debug futuro.

**Desvantagens / risco**
- Risco baixo: muda só 2 arquivos da área admin de WhatsApp.
- Precisa testar manualmente os 3 fluxos (status, connect, disconnect) + diagnóstico + fix_webhook.

## Checklist manual (pós-deploy)

1. Acessar `/masteradm` → aba WhatsApp Recovery.
2. Clicar **"Gerar QR Code"** → deve aparecer o QR (não mais "QR Code não recebido").
3. Clicar **"Executar diagnóstico"** → card de saúde renderiza, sem ErrorBoundary.
4. Se diagnóstico apontar URL errada, clicar **"Corrigir webhook automaticamente"** → toast de sucesso e recarrega diagnóstico.
5. Após escanear QR, status muda para "Conectado".
6. Botão **"Desconectar"** funciona e limpa QR.

## Pendências (fora deste escopo)

- Auditar outros consumidores de Edge Functions que ainda não desempacotam envelope P11 (rodar grep por `supabase.functions.invoke` + uso direto de campos de domínio). Sugerido como tarefa separada.

## Prevenção de regressão

- Adicionar comentário-trava `// 🔒 P11: edge function retorna envelope { ok, data, traceId }` nos 2 arquivos.
- (Opcional, futuro) Criar helper compartilhado `src/lib/invokeEdgeFunction.ts` (já existe!) e migrar estes 2 chamadores para usá-lo — ele já faz unwrap. Posso fazer no mesmo PR se quiser, é trivial.

## Sugestão de melhoria futura (apenas do que está sendo implementado)

Migrar os 2 componentes para o helper `invokeEdgeFunction` já existente em `src/lib/invokeEdgeFunction.ts` em vez de chamar `supabase.functions.invoke` direto — assim o unwrap fica centralizado e qualquer mudança no envelope não exige tocar nos consumidores.
