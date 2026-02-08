
# Plano: Fix Tour Persistente + Observabilidade + GTM

## Problema 1: Tour do Dashboard continua aparecendo

### Causa raiz
O `useOnboarding` hook cria uma **nova instancia** cada vez que eh usado. O `DashboardTour` chama `useOnboarding()` internamente, e o `Dashboard.tsx` tambem chama `useOnboarding()`. Sao **duas instancias separadas** com estados independentes.

Quando o tour chama `updateOnboardingStep('dashboard_tour_completed', true)`:
- O state local do hook **dentro do DashboardTour** eh atualizado
- MAS o state do hook no **Dashboard.tsx** (que controla `shouldShowDashboardTour`) NAO eh atualizado
- Na proxima navegacao, o Dashboard recarrega, faz query ao banco, e `dashboard_tour_completed` pode ainda estar `false` se o update falhou (race condition no destroy)

Confirmado no banco: `dashboard_tour_completed: false` para o usuario.

Alem disso, o `updateOnboardingStep` usa `status` no closure - se `status.id` nao estiver setado quando o tour tenta atualizar, ele tenta INSERT ao inves de UPDATE, e pode falhar por conflito.

### Solucao
1. **Remover `useOnboarding()` de dentro do `DashboardTour`** -- receber `updateOnboardingStep` como prop do Dashboard (mesma instancia)
2. **Adicionar fallback com localStorage** -- ao marcar tour como completo, salvar tambem no `localStorage` para evitar re-exibicao mesmo se o banco falhar
3. **Verificar localStorage no `shouldShowDashboardTour`** -- checar localStorage como segunda barreira
4. Aplicar mesma logica aos outros tours que usam instancias separadas do hook

---

## Problema 2: Observabilidade com erro

### Causa raiz
Ambas as Edge Functions (`system-health-check` e `list-all-users`) usam `anonClient.auth.getClaims()` que **NAO EXISTE** na API do Supabase JS v2. Este metodo nao faz parte da biblioteca, causando erro silencioso que retorna 401.

Confirmado: chamada retornou `401 Unauthorized` mesmo com token valido.

### Solucao
Substituir `getClaims()` por `anonClient.auth.getUser()` em ambas as Edge Functions:

```typescript
// ANTES (nao funciona):
const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
const userId = claimsData.claims.sub;

// DEPOIS (correto):
const { data: { user }, error: userError } = await anonClient.auth.getUser();
const userId = user.id;
```

Tambem remover a chamada RPC `get_user_quiz_stats` no `list-all-users` que provavelmente nao existe, substituindo por queries diretas.

---

## Problema 3: GTM nao funciona

### Causa raiz
O GTM ID `GTM-MDK55T4H` esta no banco e passa na validacao regex. O `useGlobalTracking` eh chamado no `App.tsx` (global). O problema eh o **cookie consent**:

- `checkConsent('analytics')` verifica `localStorage` para `mq_cookie_consent`
- Se o usuario nunca aceitou cookies, `checkConsent` retorna `false` e o GTM nao eh injetado
- O banner de cookies pode nao estar aparecendo ou o usuario pode ter rejeitado

O segundo problema: `useGlobalTracking` tambem eh chamado **redundantemente** em 7+ paginas individuais (Index, Login, FAQ, etc), criando multiplas instancias e potenciais conflitos.

### Solucao
1. **Adicionar log de debug** quando consent bloqueia GTM
2. **Remover chamadas duplicadas** de `useGlobalTracking` nas paginas individuais (ja eh chamado no App.tsx)
3. **Verificar se o `CookieConsentBanner` esta montado** e aparecendo corretamente
4. Se `require_cookie_consent` estiver `true` no banco, garantir que o banner apareca e ao aceitar, o GTM seja carregado

---

## Arquivos a modificar

1. `supabase/functions/system-health-check/index.ts` -- substituir `getClaims` por `getUser`
2. `supabase/functions/list-all-users/index.ts` -- substituir `getClaims` por `getUser`, remover RPC inexistente
3. `src/components/onboarding/DashboardTour.tsx` -- receber `updateOnboardingStep` como prop, adicionar fallback localStorage
4. `src/hooks/useOnboarding.ts` -- verificar localStorage como barreira extra para `shouldShowDashboardTour`
5. `src/pages/Dashboard.tsx` -- passar `updateOnboardingStep` como prop para DashboardTour
6. Remover `useGlobalTracking()` duplicado de: `Index.tsx`, `Login.tsx`, `FAQ.tsx`, `Pricing.tsx`, `KiwifySuccess.tsx`, `KiwifyCancel.tsx`, `PrivacyPolicy.tsx` (ja esta no App.tsx)

## Ordem de execucao
1. Fix Edge Functions (resolve Observabilidade)
2. Fix Tour (resolve loop do onboarding)
3. Fix GTM (remove duplicatas, verifica consent)
4. Deploy Edge Functions
5. Testar todos os fluxos
