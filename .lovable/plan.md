

# Plano: Migrar 31 Edge Functions + Fix GTM Global + Triggers auth.users

## Status Atual

Voce ja me enviou **tudo que eu preciso**. Os 2 arquivos que voce subiu contem:
- **36 funcoes completas** (codigo fonte inteiro)
- **4 arquivos _shared** (auth.ts, cors.ts, logger.ts, validation.ts)
- **config.toml** do sistema antigo
- **SQL dos triggers faltantes** (auth.users)

**NAO precisa exportar mais nada do sistema antigo.** Tenho todo o codigo.

---

## O que sera feito

### Parte 1: Triggers faltantes no auth.users (SQL Migration)

Criar 2 triggers que estao faltando:
- `on_auth_user_created_role` -> `handle_new_user_role()` (atribui role automatica)
- `on_auth_user_created_subscription` -> `handle_new_user_subscription()` (cria subscription free)

Sem eles, novos usuarios ficam sem role e sem subscription.

### Parte 2: Fix GTM Global

**Problema**: `useGlobalTracking()` esta dentro do `RequireAuth` (linha 125 do App.tsx), que so executa em rotas autenticadas. Paginas publicas (/, /login, /faq, /precos, quiz publico) nao carregam GTM.

**Solucao**: Criar um componente `GlobalTrackingProvider` que envolva TODAS as rotas (dentro do BrowserRouter, fora do RequireAuth). Remover o `useGlobalTracking()` do `RequireAuth`.

### Parte 3: Criar 31 Edge Functions faltantes

Todas as funcoes serao criadas com o codigo do sistema antigo, com a seguinte correcao aplicada automaticamente:
- **Substituir `getClaims()` por `getUser()`** onde necessario (auth.ts shared e funcoes que usam getClaims diretamente como export-table-data)
- **Manter toda a logica de negocio identica**

**IMPORTANTE sobre _shared**: Supabase externo NAO suporta pasta `_shared`. Cada funcao tera o codigo inline (sem imports de `../_shared/`). Os helpers de cors, logger e validation serao incluidos diretamente no index.ts de cada funcao que os usa.

#### Lista completa das 31 funcoes a criar:

| # | Funcao | Secrets necessarios |
|---|--------|-------------------|
| 1 | anonymize-ips | - |
| 2 | bunny-chunked-complete | BUNNY_* |
| 3 | bunny-chunked-init | BUNNY_* |
| 4 | bunny-confirm-upload | BUNNY_* |
| 5 | bunny-delete-video | BUNNY_* |
| 6 | bunny-generate-thumbnail | BUNNY_CDN_HOSTNAME |
| 7 | bunny-tus-confirm | - |
| 8 | bunny-tus-create | BUNNY_* |
| 9 | bunny-upload-video | BUNNY_* |
| 10 | bunny-upload-video-multipart | BUNNY_* |
| 11 | check-inactive-users | - |
| 12 | create-checkout | STRIPE_SECRET_KEY |
| 13 | delete-user | - |
| 14 | delete-user-complete | - |
| 15 | evolution-connect | EVOLUTION_* |
| 16 | evolution-webhook | - |
| 17 | export-schema-sql | - |
| 18 | export-table-data | - |
| 19 | export-user-data | - |
| 20 | generate-pdf-report | - |
| 21 | generate-quiz-ai | OPENAI_API_KEY |
| 22 | kiwify-webhook | - |
| 23 | process-recovery-queue | EVOLUTION_* |
| 24 | rate-limiter | - |
| 25 | save-quiz-draft | - |
| 26 | send-test-message | EVOLUTION_* |
| 27 | send-welcome-message | EVOLUTION_* |
| 28 | send-whatsapp-recovery | EVOLUTION_* |
| 29 | sync-integration | - |
| 30 | track-quiz-analytics | - |
| 31 | track-quiz-step | - |
| -- | track-video-analytics | - |

### Parte 4: Atualizar config.toml

Registrar todas as 31+ funcoes com `verify_jwt = false` (conforme config original).

---

## Secrets faltantes (voce precisa fornecer)

Essas funcoes so vao funcionar DEPOIS que voce adicionar os secrets. Irei pedir cada um na hora:

1. **EVOLUTION_API_URL** - URL da Evolution API
2. **EVOLUTION_API_KEY** - Chave da Evolution API
3. **BUNNY_API_KEY** - API key do Bunny.net
4. **BUNNY_STORAGE_ZONE_NAME** - Nome da storage zone
5. **BUNNY_STORAGE_ZONE_PASSWORD** - Senha da storage zone
6. **BUNNY_CDN_HOSTNAME** - Hostname do CDN (ex: masterquiz.b-cdn.net)
7. **OPENAI_API_KEY** - Chave da OpenAI para geracao de quiz
8. **STRIPE_SECRET_KEY** - Chave secreta do Stripe

---

## Ordem de execucao

Devido ao limite de alteracoes por mensagem, sera feito em lotes:

**Lote 1** (esta mensagem apos aprovacao):
- SQL Migration: triggers auth.users
- Fix GTM: mover useGlobalTracking para wrapper global
- Criar funcoes 1-10 (anonymize-ips ate bunny-upload-video)
- Atualizar config.toml

**Lote 2** (proxima mensagem):
- Criar funcoes 11-20 (bunny-upload-video-multipart ate kiwify-webhook)

**Lote 3** (terceira mensagem):
- Criar funcoes 21-32 (process-recovery-queue ate trigger-user-webhook + track-video-analytics)
- Pedir secrets faltantes
- Deploy final

---

## Detalhes tecnicos

### Correcao getClaims -> getUser

O codigo antigo usa `getClaims()` que nao existe no Supabase JS v2. Toda ocorrencia sera substituida por:

```typescript
// ANTES (nao funciona):
const { data, error } = await supabase.auth.getClaims(token);
const userId = data.claims.sub;

// DEPOIS (correto):
const { data: { user }, error } = await supabase.auth.getUser(token);
const userId = user.id;
```

### Inline dos _shared

Como Supabase externo nao suporta `_shared/`, cada funcao tera os helpers necessarios colados diretamente no topo do arquivo. Por exemplo, funcoes que usam `corsHeaders` terao a definicao inline.

### GTM Fix

```typescript
// Novo componente no App.tsx
const GlobalTrackingWrapper = ({ children }: { children: ReactNode }) => {
  useGlobalTracking();
  return <>{children}</>;
};

// Usado dentro do BrowserRouter, envolvendo Routes
<BrowserRouter>
  <GlobalTrackingWrapper>
    <Routes>...</Routes>
  </GlobalTrackingWrapper>
  <CookieConsentBanner />
</BrowserRouter>
```

