# 🪝 HOOKS — Catálogo de Hooks Customizados

> MasterQuiz — 60+ hooks documentados
> Versão 2.42.0 | 17 de Abril de 2026

---

## 🎯 Como gerar a referência completa

```bash
npx typedoc
# Gera docs/api/ com markdown navegável
```

Configuração em `typedoc.json` (entry points: `src/hooks`, `src/lib`, `src/services`, `src/types`).

---

## 🔑 Hooks essenciais (uso obrigatório)

| Hook | Substitui | Uso |
|------|-----------|-----|
| `useCurrentUser()` | `supabase.auth.getUser()` | Acesso ao user logado em componentes |
| `useEffectiveUser()` | `useCurrentUser()` em telas com suporte | Retorna ID do alvo em modo suporte |
| `useUserRole()` | Lookup direto em `user_roles` | Verifica admin / master_admin |
| `useRateLimit()` | Chamada manual à EF `rate-limiter` | Antes de signup, AI gen, etc. |
| `pushGTMEvent()` (de `lib/gtmLogger`) | `dataLayer.push()` | TODOS os eventos GTM |
| `logger` (de `lib/logger`) | `console.log` | Logging em qualquer lugar |

---

## 📚 Categorias

### Autenticação & Permissões
- `useCurrentUser` — user da sessão atual
- `useEffectiveUser` — user efetivo (suporte aware)
- `useUserRole` — roles + helpers `isAdmin`, `isMasterAdmin`
- `useProfile` — perfil completo do usuário
- `useUserStage` — estágio PQL (8 níveis)

### Editor de quiz
- `useQuizState` — estado central do editor
- `useQuizQuestions` — CRUD de perguntas
- `useQuizPersistence` — persistência (save/draft)
- `useQuizPreviewState` — preview em tempo real
- `useQuizTracking` — eventos do editor
- `useEditorLayout` — layout ativo (classic/modern, thin router)
- `useEditorInteractionTracker` — tracking comportamental
- `useHistory` — undo/redo com gestão de memória
- `useUndoRedoShortcuts` — atalhos de teclado
- `useAutoSave` — autosave com debounce
- `useKeyboardShortcuts` — atalhos genéricos

### Quiz público (visitante)
- `useQuizViewState` — estado do quiz publicado
- `useQuizViewRPC` — fetch via RPC
- `useQuizGTMTracking` — eventos lifecycle (view/start/complete/lead)
- `useABTest` — variantes de quiz

### Dados / TanStack Query
- `useDashboardData` — dashboard do usuário
- `useFunnelData` — funil de conversão
- `usePagination` — paginação genérica
- `useTableSort` — ordenação de tabelas
- `useTagsData` — gestão de tags

### Planos & Limites
- `usePlanFeatures` — features do plano
- `useResourceLimits` — limites de uso
- `useSubscriptionLimits` — limites da assinatura
- `useAIGenerationLimits` — limites de IA
- `usePricingPlans` — catálogo de planos
- `usePlanUpgradeEvent` — disparo de evento de upgrade

### Site / Configurações
- `useSiteMode` — modo A/B do site
- `useLandingABTest` — A/B test da landing
- `useLandingContent` — conteúdo dinâmico da landing
- `useLandingPlans` — planos exibidos na landing
- `useDocumentMeta` — meta tags por página

### Tracking / Analytics
- `useGlobalTracking` — eventos globais
- `useCtaTracking` — cliques em CTAs
- `useVideoAnalytics` — analytics de vídeo
- `useAccountCreatedEvent` — disparo single-shot
- `useWebVitals` — coleta de Web Vitals

### Mídia
- `useBunnyUpload` — upload para Bunny CDN
- `useVideoProvider` — provider de vídeo (Bunny/YouTube/Vimeo)
- `useVideoStorage` — gestão de storage de vídeo

### Suporte / Admin
- `useAuditLog` — log de ações sensíveis
- `useSystemHealth` — health check
- `useQueryPerformance` — métricas P95/P99
- `useCSPMonitor` — monitor de violações CSP

### Utilidades
- `useDebounce` — debounce de valor
- `useDeferredValue` — diferimento React 18
- `useStableCallback` — callback memoizado estável
- `useIntersectionObserver` — visibilidade no viewport
- `use-mobile` — breakpoint mobile
- `use-toast` — toast de notificação
- `useInvalidateOnLogout` — limpa cache ao deslogar
- `useTestLead` — lead de teste para PQL

### Onboarding
- `useOnboarding` — estado do onboarding
- `useQuizTemplates` — templates disponíveis
- `useQuizTemplateSelection` — seleção de template

---

## 📖 Padrão de JSDoc obrigatório

```typescript
/**
 * Descrição curta de 1 linha do que o hook faz.
 *
 * Detalhes adicionais (quando usar, restrições, side effects).
 *
 * @returns Estrutura retornada
 *
 * @example
 * ```tsx
 * const { foo } = useExample();
 * ```
 *
 * @see Hook ou doc relacionado
 */
export const useExample = () => { ... };
```

---

## 🔗 Documentação relacionada

| Doc | Descrição |
|-----|-----------|
| [CODE_STANDARDS.md](./CODE_STANDARDS.md) | Padrões de código |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Arquitetura |
| [SERVICES.md](./SERVICES.md) | Service layer |
| [api/](./api/) | Referência gerada por TypeDoc |
