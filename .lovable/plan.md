## Objetivo
Redirecionar automaticamente para `/start` qualquer usuário autenticado cujo `profiles.user_objectives` esteja `NULL` ou vazio, sem quebrar quem já preencheu e sem entrar em loop.

## Antes (situação atual)
- `RequireAuth` (em `src/App.tsx`) só verifica sessão e, no Modo B, pagamento.
- O check de `user_objectives` existe **apenas** dentro de `Dashboard.tsx` — e ainda assim só abre um modal (`UserObjectiveModal`), não redireciona para `/start`.
- Usuários afetados pelo bug de 24/04 (12 contas com `user_objectives = NULL`) nunca veem `/start` novamente ao logar — caem direto no Dashboard com modal opcional.

## Depois (comportamento desejado)
- Em **qualquer rota autenticada**, logo após o login confirmar a sessão, o sistema busca `user_objectives` do perfil **uma única vez por sessão**.
- Se `NULL` ou array vazio E rota atual ≠ `/start` → `navigate('/start', { replace: true })`.
- Se já preenchido → nada muda, fluxo segue normal.
- Verificação **assíncrona, não bloqueia render** do dashboard (sem novo spinner global).
- Flag `sessionStorage['mq_onboarding_checked'] = '1'` evita re-checagem e loop.

## Onde mexer
**1 único arquivo: `src/App.tsx`** — dentro do componente `RequireAuth`.

Adicionar um `useEffect` novo (independente dos existentes) que:
1. Aguarda `user` autenticado e `loading=false`.
2. Lê `sessionStorage.getItem('mq_onboarding_checked')` — se existir, sai.
3. Faz `supabase.from('profiles').select('user_objectives').eq('id', user.id).maybeSingle()`.
4. Marca a flag `mq_onboarding_checked = '1'` (independente do resultado, para não repetir query).
5. Se `user_objectives` é `null` ou `[]` E `window.location.pathname !== '/start'` → `navigate('/start', { replace: true })`.
6. Erros silenciosos (apenas `logger.warn`) — nunca bloquear o app.

Importante:
- O effect **não** entra na condição de `if (loading || !user ...)` que retorna o spinner — roda em paralelo ao render normal.
- A flag é `sessionStorage` (não `localStorage`) → reseta a cada nova sessão de navegador, conforme pedido.
- Logout deve limpar a flag. Já existe `useInvalidateOnLogout`; vamos adicionar `sessionStorage.removeItem('mq_onboarding_checked')` no listener de SIGNED_OUT do `AuthContext` (verificar — se já limpa storage, basta confiar; senão, limpar dentro do próprio effect quando `user` vira `null`).

## Trecho-chave (resumido)
```tsx
// dentro de RequireAuth, em src/App.tsx
useEffect(() => {
  if (loading || !user) return;
  if (sessionStorage.getItem('mq_onboarding_checked') === '1') return;

  (async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('user_objectives')
        .eq('id', user.id)
        .maybeSingle();

      sessionStorage.setItem('mq_onboarding_checked', '1');

      const obj = data?.user_objectives;
      const empty = !obj || (Array.isArray(obj) && obj.length === 0);
      if (empty && window.location.pathname !== '/start') {
        navigate('/start', { replace: true });
      }
    } catch (e) {
      logger.warn('[RequireAuth] objective check failed', e);
    }
  })();
}, [user, loading, navigate]);
```

E no logout (dentro de `RequireAuth` ou `useInvalidateOnLogout`):
```tsx
useEffect(() => {
  if (!user && !loading) sessionStorage.removeItem('mq_onboarding_checked');
}, [user, loading]);
```

## Vantagens
- Cobertura **global** (todas rotas autenticadas, não só Dashboard).
- 1 query extra por sessão, não por navegação → custo desprezível.
- Não toca em `/start`, `Dashboard.tsx`, modal de objetivo nem na lógica de dedup do Prompt #2.
- Não interfere no fluxo de pagamento Modo B (effect independente).

## Fora do escopo (não vou mexer)
- Lógica de modal `UserObjectiveModal` no Dashboard (continua como segunda barreira).
- Backfill dos 12 usuários afetados (já discutido em prompt anterior).
- Captura de UTM (`appendUTMsToPath`) e dedup de `objective_selected` permanecem intocados.

## Checklist pós-implementação
- [ ] Build OK (sem erros TS).
- [ ] Login com usuário com `user_objectives = NULL` → redireciona para `/start` em qualquer rota acessada.
- [ ] Login com usuário com objetivo preenchido → nenhum redirect, fluxo normal.
- [ ] Em `/start`, não há loop (rota atual === `/start` → não redireciona).
- [ ] Após logout + novo login, flag é limpa e check roda de novo.
- [ ] Dashboard segue carregando normalmente (sem spinner adicional).

## Prevenção de regressão
- Comentário-trava no `useEffect` explicando que é o guardião pós-bug 24/04.
- Sugestão (opcional, não vou implementar agora): criar contract test garantindo que `RequireAuth` consulta `user_objectives` ao montar.