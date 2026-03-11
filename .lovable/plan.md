## Plano: Site Mode A/B (Fluxo Completo)

### Etapa 1 ✅ — Infraestrutura Base
- [x] Corrigir cards do AdminDashboard (remover queries redundantes de loadData)
- [x] Criar tabela `site_settings` com `site_mode` (A ou B)
- [x] Adicionar `payment_confirmed` em `user_subscriptions`
- [x] Criar hook `useSiteMode` + `useUpdateSiteMode`
- [x] Adicionar toggle de Modo A/B nas configurações do admin

### Etapa 2 ✅ — Frontend Condicional (Landing + Pricing + Login)
- [x] Landing Page: Condicional com `useSiteMode()` — modo B esconde plano free, CTAs apontam para `/precos`
- [x] HeroSection: CTA "Escolher meu plano" + navega para `/precos` no modo B
- [x] FinalCTA: Navega para `/precos` no modo B
- [x] Pricing: Esconder card Free no modo B
- [x] Login: No modo B, após cadastro redirecionar para `/precos`

### Etapa 3 — Auth Guards + Payment Flow
- [ ] RequireAuth: No modo B, verificar `payment_confirmed` e redirecionar para checkout se false
- [ ] Kiwify webhook: Setar `payment_confirmed = true` após pagamento
- [ ] KiwifySuccess: Polling para verificar `payment_confirmed` antes de liberar dashboard
- [ ] Modo B: Novos cadastros criam subscription com `payment_confirmed = false`
