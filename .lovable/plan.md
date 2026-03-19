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

### Etapa 4a ✅ — Templates Estáticos + Triggers SQL (Etapa 1 do plano de 12 emails)
- [x] 4 templates Milestone (10/50/100/500 leads) + trigger SQL em quiz_responses
- [x] Template Tutorial (3 dias após 1º quiz) + trigger SQL em quizzes
- [x] Template Pesquisa de Satisfação (30 dias após signup)
- [x] Template Comparativo de Planos (14 dias no free)
- [x] Template Guia de Integração (7 dias sem integrações)
- [x] 3 templates Reengajamento Educativo (série 21/24/27 dias)
- [x] Template Convite para Webinar (manual)
- [x] check-inactive-users-email expandido para novas categorias
- [x] process-email-recovery-queue respeitando scheduled_at futuro

### Etapa 4b ✅ — Templates Dinâmicos com IA
- [x] Edge Function generate-email-content (gerador IA compartilhado via Lovable AI)
- [x] Blog Digest automático (send-blog-digest — a cada 3 artigos)
- [x] Dica da Semana (send-weekly-tip — cron semanal)
- [x] Caso de Sucesso (send-success-story — mensal)
- [x] Resumo Mensal (send-monthly-summary — 1º dia do mês, personalizado por usuário)
- [x] Novidade da Plataforma (send-platform-news — disparo manual admin)
- [x] Tabela email_tips para histórico de dicas
- [x] Coluna included_in_digest em blog_posts

### Etapa 4c ✅ — UI Admin + Polimento
- [x] UI de Automações no painel admin (EmailAutomations.tsx)
- [x] Toggle on/off por automação + botão "Disparar agora"
- [x] Dialog para envio de Novidades (updates, versão, segmento)
- [x] Histórico de execuções com status/emails enviados
- [x] Tabelas email_automation_config + email_automation_logs
- [x] CATEGORY_LABELS expandido com todas as 13 categorias
- [x] Nova sub-aba "Automações" no painel Email

### Etapa 4d ✅ — Unsubscribe + Performance + A/B + Reorganização
- [x] Tabela email_unsubscribes + Edge Function handle-email-unsubscribe
- [x] Link de cancelamento no footer de todos os templates (generate-email-content)
- [x] Header List-Unsubscribe no envio E-goi (process-email-recovery-queue)
- [x] Verificação de unsubscribe antes de envio em todas as functions
- [x] Dashboard de performance por categoria (tabela open/click rate)
- [x] Teste A/B de subject lines (campo subject_b, ab_variant no envio)
- [x] Painel A/B no EmailRecoveryReports (variante A vs B)
- [x] Reorganização de trigger_days (mínimo 3 dias entre templates)
- [x] Botão "Teste" em cada card de automação (envio para email específico)
- [x] Crons automáticos criados via migration (blog_digest, weekly_tip, monthly_summary, success_story)
- [x] Coluna ab_variant em email_recovery_contacts
- [x] Filtro por status "cancelados" no relatório
