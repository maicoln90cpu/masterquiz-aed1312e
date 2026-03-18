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

### Etapa 3 ✅ — Auth Guards + Payment Flow
- [x] RequireAuth: No modo B, verificar `payment_confirmed` e redirecionar para checkout se false
- [x] Kiwify webhook: Setar `payment_confirmed = true` após pagamento
- [x] KiwifySuccess: Polling para verificar `payment_confirmed` antes de liberar dashboard
- [x] Modo B: Novos cadastros criam subscription com `payment_confirmed = false` (via trigger existente com default true)

---

## Plano: Email Recovery - Melhorias

### Etapa 1 ✅ — UI + Templates + Editor Visual
- [x] Reestruturar tabs WhatsApp/Email em CustomerRecovery
- [x] Criar dashboard EmailRecoveryReports com KPIs e gráficos
- [x] Adicionar editor visual dual (Visual + HTML) nos templates

### Etapa 2 ✅ — Compatibilidade + Estabilidade
- [x] VML/Outlook para botões CTA em todos os 6 templates
- [x] Logo permanente no Supabase Storage
- [x] Lógica de falha permanente (retry ≥ 3) na fila

### Etapa 3 ✅ — Tracking + Dashboard Real
- [x] Webhook E-goi (`egoi-email-webhook`) para opens/clicks/bounces
- [x] Dashboard corrigido com taxas percentuais (open rate, click rate)
- [x] Filtros por status opened/clicked adicionados
- [x] Colunas "Aberto em" e "Clicado em" na tabela
- [x] Logo atualizado no Storage (novo arquivo enviado pelo usuário)
- [x] Pie chart segmentado (enviados vs abertos vs clicados)

### Etapa 4 — Planejada (Automação de Templates com IA)
- [ ] Blog Digest automático (a cada 3 artigos)
- [ ] Dica da Semana (cron semanal)
- [ ] Marcos de Leads (trigger por milestone)
- [ ] Caso de Sucesso (mensal)
- [ ] Tutorial Passo-a-Passo (3 dias após 1º quiz)
- [ ] Novidade da Plataforma (por release)
- [ ] Pesquisa de Satisfação (30 dias)
- [ ] Comparativo de Planos (14 dias no free)
- [ ] Convite para Webinar/Live
- [ ] Guia de Integração (7 dias sem integrações)
- [ ] Resumo Mensal (1º dia do mês)
- [ ] Reengajamento Educativo (21 dias inativo, série de 3)
