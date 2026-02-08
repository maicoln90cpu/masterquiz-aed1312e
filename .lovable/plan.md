
# Plano: Correcao GTM - Separacao Total entre Global e Criador

## Regra de Negocio (Confirmada)

**GTM Global (Master Admin):** roda em TODAS as paginas DO SITE, EXCETO paginas de quiz publico e preview.

**GTM do Criador:** roda APENAS nas paginas de quiz publico e preview.

---

## Mapeamento Completo de Todas as Paginas

### Paginas com GTM GLOBAL (Master Admin)

| Pagina | Rota | Autenticacao | Exemplo |
|---|---|---|---|
| Landing Page | `/` | Nao | `masterquiz.app/` |
| Login | `/login` | Nao | `masterquiz.app/login` |
| FAQ | `/faq` | Nao | `masterquiz.app/faq` |
| Precos | `/precos` | Nao | `masterquiz.app/precos` |
| Politica de Privacidade | `/privacy-policy` | Nao | `masterquiz.app/privacy-policy` |
| Kiwify Success | `/kiwify/success` | Nao | `masterquiz.app/kiwify/success` |
| Kiwify Cancel | `/kiwify/cancel` | Nao | `masterquiz.app/kiwify/cancel` |
| Dashboard | `/dashboard` | Sim | `masterquiz.app/dashboard` |
| Meus Quizzes | `/meus-quizzes` | Sim | `masterquiz.app/meus-quizzes` |
| Configuracoes | `/settings` | Sim | `masterquiz.app/settings` |
| Criar Quiz | `/create-quiz` | Sim | `masterquiz.app/create-quiz` |
| CRM | `/crm` | Sim | `masterquiz.app/crm` |
| Respostas | `/responses` | Sim | `masterquiz.app/responses` |
| Analytics | `/analytics` | Sim | `masterquiz.app/analytics` |
| Webhook Logs | `/webhook-logs` | Sim | `masterquiz.app/webhook-logs` |
| Webhook Settings | `/webhook-settings` | Sim | `masterquiz.app/webhook-settings` |
| Maisfy Generator | `/maisfy-generator` | Sim | `masterquiz.app/maisfy-generator` |
| Media Library | `/media-library` | Sim | `masterquiz.app/media-library` |
| Integracoes | `/integrations` | Sim | `masterquiz.app/integrations` |
| Checkout | `/checkout` | Sim | `masterquiz.app/checkout` |
| Master Admin | `/masteradm` | Sim (master) | `masterquiz.app/masteradm` |
| Template Editor | `/masteradm/template-editor/:id` | Sim (master) | `masterquiz.app/masteradm/template-editor/abc123` |
| Not Found (404) | `/*` | Nao | `masterquiz.app/pagina-inexistente` |

### Paginas com GTM DO CRIADOR APENAS (SEM Global)

| Pagina | Rota | Autenticacao | Exemplo |
|---|---|---|---|
| Quiz Publico (company+slug) | `/:company/:slug` | Nao | `masterquiz.app/minha-empresa/seus-leads-esto-escapando` |
| Quiz Publico (slug only) | `/quiz/:slug` | Nao | `masterquiz.app/quiz/seus-leads-esto-escapando` |
| Preview do Quiz | `/preview/:quizId` | Sim | `masterquiz.app/preview/636ca341-d305-4237-be9c-502ffcd6af81` |

---

## Implementacao Tecnica

### Alteracao 1: `src/App.tsx`
Remover o `GlobalTrackingWrapper` que envolve TODAS as rotas. Criar dois wrappers separados:

- `GlobalTrackingWrapper`: usado nas rotas do site (landing, login, dashboard, etc.)
- As rotas de quiz publico e preview ficam FORA do wrapper global

Estrutura das rotas:

```text
<Routes>
  <!-- ROTAS COM GTM GLOBAL -->
  <Route element={<GlobalTrackingWrapper />}>
    <Route path="/" ... />
    <Route path="/login" ... />
    <Route path="/faq" ... />
    <Route path="/precos" ... />
    <Route path="/privacy-policy" ... />
    <Route path="/kiwify/success" ... />
    <Route path="/kiwify/cancel" ... />
    <Route path="/dashboard" ... />
    <Route path="/meus-quizzes" ... />
    <Route path="/settings" ... />
    <Route path="/create-quiz" ... />
    <Route path="/crm" ... />
    <Route path="/responses" ... />
    <Route path="/analytics" ... />
    <Route path="/webhook-logs" ... />
    <Route path="/webhook-settings" ... />
    <Route path="/maisfy-generator" ... />
    <Route path="/media-library" ... />
    <Route path="/integrations" ... />
    <Route path="/checkout" ... />
    <Route path="/masteradm" ... />
    <Route path="/masteradm/template-editor/:templateId" ... />
    <Route path="*" ... />
  </Route>

  <!-- ROTAS SEM GTM GLOBAL (apenas GTM do criador via useQuizTracking) -->
  <Route path="/preview/:quizId" ... />
  <Route path="/:company/:slug" ... />
  <Route path="/quiz/:slug" ... />
</Routes>
```

O `GlobalTrackingWrapper` sera convertido para usar `<Outlet>` do React Router (layout route).

### Alteracao 2: `src/hooks/useGlobalTracking.ts`
Manter as correcoes de reatividade de consentimento propostas anteriormente:
- Adicionar `consentVersion` state com listener de `storage` event + polling
- Incluir nas dependencias dos useEffects

### Alteracao 3: `src/hooks/useQuizTracking.ts`
Manter as correcoes propostas anteriormente:
- Separar Facebook Pixel e GTM em blocos independentes (sem early return cruzado)
- Adicionar de-duplicacao de Pixel (checar `global-fb-pixel-script`)
- Remover verificacao contra GTM global (ja que nas paginas de quiz o global NAO roda mais)

Nota importante: como o GTM global nao roda nas paginas de quiz/preview, a logica de de-duplicacao de GTM no `useQuizTracking` se torna desnecessaria. Porem, manteremos como seguranca (caso alguem mude o routing no futuro).

### Alteracao 4: `src/hooks/__tests__/useQuizTracking.test.ts`
- Adicionar teste: "GTM should load even if pixel ID is invalid"
- Adicionar teste: "Pixel should not duplicate if global pixel has same ID"

---

## Resultado Final

- Visitante em `masterquiz.app/` -> GTM Global carrega (GTM-MDK55T4H)
- Visitante em `masterquiz.app/login` -> GTM Global carrega
- Visitante em `masterquiz.app/dashboard` -> GTM Global carrega
- Visitante em `masterquiz.app/minha-empresa/meu-quiz` -> APENAS GTM do criador carrega (do perfil do dono do quiz)
- Visitante em `masterquiz.app/quiz/meu-quiz` -> APENAS GTM do criador carrega
- Visitante em `masterquiz.app/preview/636ca341-...` -> APENAS GTM do criador carrega
- Se criador nao tem GTM configurado -> nenhum GTM carrega nessa pagina de quiz
