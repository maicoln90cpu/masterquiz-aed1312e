import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminSubTabs } from '@/components/admin/AdminSubTabs';
import { Database, Layers, Zap, Clock, Cloud, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// ── Fetch real table sizes via RPC ──────────────────────────────
interface TableSizeRow {
  table_name: string;
  total_bytes: number;
  total_size: string;
  row_estimate: number;
}

async function fetchTableSizes(): Promise<Map<string, TableSizeRow>> {
  const { data, error } = await supabase.rpc('get_table_sizes' as any);
  if (error) throw error;
  const map = new Map<string, TableSizeRow>();
  for (const row of (data as TableSizeRow[]) ?? []) {
    map.set(row.table_name, row);
  }
  return map;
}

// ── Hardcoded Catalogs ──────────────────────────────────────────

interface TableInfo {
  name: string;
  description: string;
  category: string;
  estimatedRows: string;
}

const TABLES_CATALOG: TableInfo[] = [
  // Core
  { name: 'quizzes', description: 'Quizzes criados pelos usuários', category: 'Core', estimatedRows: '~500' },
  { name: 'quiz_questions', description: 'Perguntas de cada quiz', category: 'Core', estimatedRows: '~5.000' },
  { name: 'quiz_results', description: 'Resultados configurados por quiz', category: 'Core', estimatedRows: '~1.500' },
  { name: 'quiz_responses', description: 'Respostas dos respondentes', category: 'Core', estimatedRows: '~50.000' },
  { name: 'quiz_form_config', description: 'Configuração de formulário de captura', category: 'Core', estimatedRows: '~500' },
  { name: 'custom_form_fields', description: 'Campos customizados de formulário', category: 'Core', estimatedRows: '~200' },
  { name: 'quiz_templates', description: 'Templates de quiz pré-configurados', category: 'Core', estimatedRows: '~14' },
  { name: 'quiz_tags', description: 'Tags para organizar quizzes', category: 'Core', estimatedRows: '~100' },
  { name: 'quiz_tag_relations', description: 'Relação quiz ↔ tag', category: 'Core', estimatedRows: '~200' },
  // Usuários
  { name: 'profiles', description: 'Perfis de usuários da plataforma', category: 'Usuários', estimatedRows: '~1.000' },
  { name: 'user_roles', description: 'Papéis (admin, master_admin, user)', category: 'Usuários', estimatedRows: '~10' },
  { name: 'user_subscriptions', description: 'Assinaturas e planos dos usuários', category: 'Usuários', estimatedRows: '~1.000' },
  { name: 'subscription_plans', description: 'Catálogo de planos disponíveis', category: 'Usuários', estimatedRows: '~10' },
  { name: 'user_integrations', description: 'Integrações configuradas por usuário', category: 'Usuários', estimatedRows: '~50' },
  { name: 'user_webhooks', description: 'Webhooks configurados por usuário', category: 'Usuários', estimatedRows: '~30' },
  { name: 'user_onboarding', description: 'Progresso de onboarding', category: 'Usuários', estimatedRows: '~1.000' },
  { name: 'login_events', description: 'Registro de logins realizados', category: 'Usuários', estimatedRows: '~10.000' },
  { name: 'validation_requests', description: 'Solicitações de validação pendentes', category: 'Usuários', estimatedRows: '~50' },
  { name: 'master_admin_emails', description: 'Lista de e-mails com acesso master', category: 'Usuários', estimatedRows: '~5' },
  // Analytics
  { name: 'quiz_analytics', description: 'Métricas diárias por quiz (views, starts, completions)', category: 'Analytics', estimatedRows: '~20.000' },
  { name: 'quiz_step_analytics', description: 'Funil de etapas por sessão', category: 'Analytics', estimatedRows: '~100.000' },
  { name: 'quiz_cta_click_analytics', description: 'Cliques em CTAs dos quizzes', category: 'Analytics', estimatedRows: '~5.000' },
  // GTM / Tracking
  { name: 'gtm_event_logs', description: 'Log de todos os eventos GTM disparados', category: 'Tracking', estimatedRows: '~50.000' },
  { name: 'gtm_event_integrations', description: 'Mapeamento de eventos GTM configurados', category: 'Tracking', estimatedRows: '~30' },
  // Admin / Sistema
  { name: 'audit_logs', description: 'Registro de ações administrativas', category: 'Admin', estimatedRows: '~10.000' },
  { name: 'admin_notifications', description: 'Notificações para administradores', category: 'Admin', estimatedRows: '~500' },
  { name: 'support_tickets', description: 'Tickets de suporte dos usuários', category: 'Admin', estimatedRows: '~100' },
  { name: 'ticket_messages', description: 'Mensagens em tickets de suporte', category: 'Admin', estimatedRows: '~500' },
  { name: 'system_health_metrics', description: 'Scores de saúde do sistema', category: 'Admin', estimatedRows: '~200' },
  { name: 'system_settings', description: 'Configurações globais do sistema', category: 'Admin', estimatedRows: '~20' },
  { name: 'site_settings', description: 'Configurações do site (modo A/B)', category: 'Admin', estimatedRows: '~5' },
  { name: 'rate_limit_tracker', description: 'Controle de rate limiting', category: 'Admin', estimatedRows: '~500' },
  { name: 'ai_quiz_generations', description: 'Log de gerações de quiz por IA', category: 'Admin', estimatedRows: '~2.000' },
  { name: 'client_error_logs', description: 'Erros do frontend capturados', category: 'Monitoramento', estimatedRows: '~5.000' },
  { name: 'performance_logs', description: 'Latência de operações do sistema', category: 'Monitoramento', estimatedRows: '~20.000' },
  // Recovery WhatsApp
  { name: 'recovery_settings', description: 'Configurações de recuperação WhatsApp', category: 'WhatsApp', estimatedRows: '~1' },
  { name: 'recovery_templates', description: 'Templates de mensagens WhatsApp', category: 'WhatsApp', estimatedRows: '~10' },
  { name: 'recovery_campaigns', description: 'Campanhas de recuperação WhatsApp', category: 'WhatsApp', estimatedRows: '~20' },
  { name: 'recovery_contacts', description: 'Contatos de recuperação WhatsApp', category: 'WhatsApp', estimatedRows: '~5.000' },
  { name: 'recovery_blacklist', description: 'Lista negra de números WhatsApp', category: 'WhatsApp', estimatedRows: '~50' },
  // Email
  { name: 'email_recovery_settings', description: 'Configurações de recuperação por e-mail', category: 'Email', estimatedRows: '~1' },
  { name: 'email_recovery_templates', description: 'Templates de e-mail de recuperação', category: 'Email', estimatedRows: '~10' },
  { name: 'email_recovery_contacts', description: 'Contatos de recuperação por e-mail', category: 'Email', estimatedRows: '~5.000' },
  { name: 'email_automation_config', description: 'Configuração de automações de e-mail', category: 'Email', estimatedRows: '~10' },
  { name: 'email_automation_logs', description: 'Log de execução de automações', category: 'Email', estimatedRows: '~500' },
  { name: 'email_unsubscribes', description: 'Cancelamentos de inscrição', category: 'Email', estimatedRows: '~100' },
  { name: 'email_tips', description: 'Dicas semanais por e-mail', category: 'Email', estimatedRows: '~20' },
  { name: 'email_generation_logs', description: 'Log de geração de conteúdo de e-mail', category: 'Email', estimatedRows: '~200' },
  // Blog
  { name: 'blog_posts', description: 'Posts do blog da plataforma', category: 'Blog', estimatedRows: '~50' },
  { name: 'blog_settings', description: 'Configurações do blog', category: 'Blog', estimatedRows: '~1' },
  { name: 'blog_image_prompts', description: 'Prompts para geração de imagens', category: 'Blog', estimatedRows: '~5' },
  { name: 'blog_generation_logs', description: 'Log de geração de posts por IA', category: 'Blog', estimatedRows: '~100' },
  // Vídeo
  { name: 'bunny_videos', description: 'Vídeos hospedados no Bunny CDN', category: 'Vídeo', estimatedRows: '~100' },
  // A/B Testing
  { name: 'quiz_variants', description: 'Variantes de teste A/B de quizzes', category: 'A/B Testing', estimatedRows: '~50' },
  { name: 'ab_test_sessions', description: 'Sessões de teste A/B', category: 'A/B Testing', estimatedRows: '~10.000' },
  { name: 'landing_ab_tests', description: 'Testes A/B da landing page', category: 'A/B Testing', estimatedRows: '~5' },
  { name: 'landing_ab_sessions', description: 'Sessões A/B da landing page', category: 'A/B Testing', estimatedRows: '~5.000' },
  // i18n
  { name: 'quiz_translations', description: 'Traduções de quizzes', category: 'i18n', estimatedRows: '~100' },
  { name: 'quiz_question_translations', description: 'Traduções de perguntas', category: 'i18n', estimatedRows: '~500' },
  // Landing
  { name: 'landing_content', description: 'Conteúdo editável da landing page', category: 'Landing', estimatedRows: '~50' },
  // Compliance
  { name: 'cookie_consents', description: 'Consentimentos de cookies (LGPD)', category: 'Compliance', estimatedRows: '~10.000' },
  { name: 'notification_preferences', description: 'Preferências de notificação', category: 'Compliance', estimatedRows: '~500' },
  // WhatsApp AI
  { name: 'whatsapp_ai_settings', description: 'Configurações do agente IA WhatsApp', category: 'WhatsApp AI', estimatedRows: '~10' },
  { name: 'whatsapp_ai_knowledge', description: 'Base de conhecimento do agente IA', category: 'WhatsApp AI', estimatedRows: '~50' },
  { name: 'whatsapp_conversations', description: 'Conversas do WhatsApp AI', category: 'WhatsApp AI', estimatedRows: '~1.000' },
  // Integrations
  { name: 'integration_logs', description: 'Log de sincronização com integrações', category: 'Integrações', estimatedRows: '~2.000' },
  // Trials
  { name: 'trial_logs', description: 'Log de ativações de trial', category: 'Usuários', estimatedRows: '~200' },
];

interface TriggerInfo {
  table: string;
  name: string;
  event: string;
  description: string;
}

const TRIGGERS_CATALOG: TriggerInfo[] = [
  { table: 'profiles', name: 'on_auth_user_created', event: 'AFTER INSERT', description: 'Cria perfil automaticamente ao registrar nova conta' },
  { table: 'profiles', name: 'update_profiles_updated_at', event: 'BEFORE UPDATE', description: 'Atualiza timestamp de modificação do perfil' },
  { table: 'quizzes', name: 'update_quizzes_updated_at', event: 'BEFORE UPDATE', description: 'Atualiza timestamp de modificação do quiz' },
  { table: 'quiz_questions', name: 'update_questions_updated_at', event: 'BEFORE UPDATE', description: 'Atualiza timestamp de modificação da pergunta' },
  { table: 'quiz_results', name: 'update_results_updated_at', event: 'BEFORE UPDATE', description: 'Atualiza timestamp de modificação do resultado' },
  { table: 'quiz_form_config', name: 'update_form_config_updated_at', event: 'BEFORE UPDATE', description: 'Atualiza timestamp do formulário de captura' },
  { table: 'blog_posts', name: 'update_blog_posts_updated_at', event: 'BEFORE UPDATE', description: 'Atualiza timestamp de modificação do post' },
  { table: 'blog_settings', name: 'update_blog_settings_updated_at', event: 'BEFORE UPDATE', description: 'Atualiza timestamp das configurações do blog' },
  { table: 'recovery_contacts', name: 'update_recovery_contacts_updated_at', event: 'BEFORE UPDATE', description: 'Atualiza timestamp do contato de recuperação' },
  { table: 'email_recovery_contacts', name: 'update_email_contacts_updated_at', event: 'BEFORE UPDATE', description: 'Atualiza timestamp do contato de e-mail' },
  { table: 'landing_content', name: 'update_landing_content_updated_at', event: 'BEFORE UPDATE', description: 'Atualiza timestamp do conteúdo da landing' },
  { table: 'cookie_consents', name: 'update_cookie_consents_updated_at', event: 'BEFORE UPDATE', description: 'Atualiza timestamp do consentimento' },
  { table: 'user_subscriptions', name: 'on_subscription_change', event: 'AFTER UPDATE', description: 'Notifica admin quando assinatura muda de status' },
];

interface CronJobInfo {
  name: string;
  frequency: string;
  description: string;
  edgeFunction: string;
}

const CRON_JOBS_CATALOG: CronJobInfo[] = [
  { name: 'check-inactive-users', frequency: 'Diário (09:00 UTC)', description: 'Identifica usuários inativos para recuperação WhatsApp', edgeFunction: 'check-inactive-users' },
  { name: 'check-inactive-users-email', frequency: 'Diário (10:00 UTC)', description: 'Identifica usuários inativos para recuperação por e-mail', edgeFunction: 'check-inactive-users-email' },
  { name: 'process-recovery-queue', frequency: 'A cada 15 min', description: 'Processa fila de mensagens WhatsApp pendentes', edgeFunction: 'process-recovery-queue' },
  { name: 'process-email-recovery-queue', frequency: 'A cada 15 min', description: 'Processa fila de e-mails de recuperação', edgeFunction: 'process-email-recovery-queue' },
  { name: 'check-activation-24h', frequency: 'Diário (14:00 UTC)', description: 'Verifica ativação de novos usuários em 24h', edgeFunction: 'check-activation-24h' },
  { name: 'check-expired-trials', frequency: 'Diário (06:00 UTC)', description: 'Expira trials vencidos automaticamente', edgeFunction: 'check-expired-trials' },
  { name: 'blog-cron-trigger', frequency: 'Semanal (Dom 08:00 UTC)', description: 'Gera novo post de blog automaticamente', edgeFunction: 'blog-cron-trigger' },
  { name: 'send-blog-digest', frequency: 'Quinzenal', description: 'Envia digest de posts do blog por e-mail', edgeFunction: 'send-blog-digest' },
  { name: 'send-weekly-tip', frequency: 'Semanal (Seg 10:00 UTC)', description: 'Envia dica semanal por e-mail', edgeFunction: 'send-weekly-tip' },
  { name: 'send-success-story', frequency: 'Mensal', description: 'Envia caso de sucesso por e-mail', edgeFunction: 'send-success-story' },
  { name: 'send-platform-news', frequency: 'Quinzenal', description: 'Envia novidades da plataforma', edgeFunction: 'send-platform-news' },
  { name: 'send-monthly-summary', frequency: 'Mensal (Dia 1, 09:00 UTC)', description: 'Envia resumo mensal de uso', edgeFunction: 'send-monthly-summary' },
  { name: 'system-health-check', frequency: 'A cada 6h', description: 'Recalcula score de saúde do sistema', edgeFunction: 'system-health-check' },
  { name: 'growth-metrics', frequency: 'Diário (07:00 UTC)', description: 'Calcula métricas de crescimento', edgeFunction: 'growth-metrics' },
  { name: 'anonymize-ips', frequency: 'Diário (03:00 UTC)', description: 'Anonimiza IPs antigos para LGPD', edgeFunction: 'anonymize-ips' },
];

interface EdgeFunctionInfo {
  name: string;
  category: string;
  description: string;
  trigger: string;
}

const EDGE_FUNCTIONS_CATALOG: EdgeFunctionInfo[] = [
  // Core
  { name: 'generate-quiz-ai', category: 'Core', description: 'Gera perguntas de quiz usando IA (Gemini)', trigger: 'POST' },
  { name: 'parse-pdf-document', category: 'Core', description: 'Extrai texto de PDFs para geração de quizzes', trigger: 'POST' },
  { name: 'save-quiz-draft', category: 'Core', description: 'Salva rascunho de quiz', trigger: 'POST' },
  { name: 'generate-pdf-report', category: 'Core', description: 'Gera relatório PDF de resultados', trigger: 'POST' },
  // Pagamento
  { name: 'kiwify-webhook', category: 'Pagamento', description: 'Webhook de pagamentos Kiwify', trigger: 'Webhook' },
  { name: 'list-all-users', category: 'Admin', description: 'Lista todos os usuários (admin)', trigger: 'POST' },
  { name: 'list-all-respondents', category: 'Admin', description: 'Lista todos os respondentes (admin)', trigger: 'POST' },
  { name: 'delete-user', category: 'Admin', description: 'Exclui dados de um usuário', trigger: 'POST' },
  { name: 'delete-user-complete', category: 'Admin', description: 'Exclusão completa (auth + dados)', trigger: 'POST' },
  { name: 'export-user-data', category: 'Admin', description: 'Exporta dados de um usuário (LGPD)', trigger: 'POST' },
  { name: 'update-user-profile', category: 'Admin', description: 'Atualiza perfil de usuário (suporte)', trigger: 'POST' },
  { name: 'merge-user-data', category: 'Admin', description: 'Merge de dados entre contas duplicadas', trigger: 'POST' },
  { name: 'migrate-imported-user', category: 'Admin', description: 'Migra dados de usuário importado', trigger: 'POST' },
  { name: 'check-imported-user', category: 'Admin', description: 'Verifica status de usuário importado', trigger: 'POST' },
  // Analytics
  { name: 'track-quiz-analytics', category: 'Analytics', description: 'Registra views, starts e completions', trigger: 'POST' },
  { name: 'track-quiz-step', category: 'Analytics', description: 'Registra progresso por etapa do quiz', trigger: 'POST' },
  { name: 'track-video-analytics', category: 'Analytics', description: 'Registra métricas de vídeo', trigger: 'POST' },
  { name: 'track-blog-view', category: 'Analytics', description: 'Registra visualizações de posts do blog', trigger: 'POST' },
  { name: 'track-cta-redirect', category: 'Analytics', description: 'Registra cliques em CTAs com redirect', trigger: 'POST' },
  // Integrações
  { name: 'sync-integration', category: 'Integrações', description: 'Sincroniza dados com integrações externas', trigger: 'POST' },
  { name: 'save-quiz-response', category: 'Integrações', description: 'Salva resposta e dispara webhooks', trigger: 'POST' },
  // Bunny CDN
  { name: 'bunny-upload-video', category: 'Bunny CDN', description: 'Upload simples de vídeo', trigger: 'POST' },
  { name: 'bunny-upload-video-multipart', category: 'Bunny CDN', description: 'Upload multipart de vídeo grande', trigger: 'POST' },
  { name: 'bunny-chunked-init', category: 'Bunny CDN', description: 'Inicia upload chunked', trigger: 'POST' },
  { name: 'bunny-chunked-complete', category: 'Bunny CDN', description: 'Finaliza upload chunked', trigger: 'POST' },
  { name: 'bunny-tus-create', category: 'Bunny CDN', description: 'Cria sessão TUS para upload resumível', trigger: 'POST' },
  { name: 'bunny-tus-confirm', category: 'Bunny CDN', description: 'Confirma upload TUS concluído', trigger: 'POST' },
  { name: 'bunny-confirm-upload', category: 'Bunny CDN', description: 'Confirma upload e atualiza status', trigger: 'POST' },
  { name: 'bunny-delete-video', category: 'Bunny CDN', description: 'Remove vídeo do Bunny CDN', trigger: 'DELETE' },
  { name: 'bunny-generate-thumbnail', category: 'Bunny CDN', description: 'Gera thumbnail de vídeo', trigger: 'POST' },
  // WhatsApp
  { name: 'evolution-connect', category: 'WhatsApp', description: 'Conecta instância da Evolution API', trigger: 'POST' },
  { name: 'evolution-webhook', category: 'WhatsApp', description: 'Recebe webhooks da Evolution API', trigger: 'Webhook' },
  { name: 'send-welcome-message', category: 'WhatsApp', description: 'Envia mensagem de boas-vindas', trigger: 'POST' },
  { name: 'send-whatsapp-recovery', category: 'WhatsApp', description: 'Envia mensagem de recuperação', trigger: 'POST' },
  { name: 'send-test-message', category: 'WhatsApp', description: 'Envia mensagem de teste', trigger: 'POST' },
  { name: 'process-recovery-queue', category: 'WhatsApp', description: 'Processa fila de recuperação', trigger: 'Cron' },
  { name: 'check-inactive-users', category: 'WhatsApp', description: 'Identifica inativos para WhatsApp', trigger: 'Cron' },
  { name: 'check-activation-24h', category: 'WhatsApp', description: 'Verifica ativação em 24h', trigger: 'Cron' },
  { name: 'whatsapp-ai-reply', category: 'WhatsApp AI', description: 'Resposta automática do agente IA', trigger: 'Webhook' },
  // Email
  { name: 'generate-email-content', category: 'Email', description: 'Gera conteúdo de e-mail por IA', trigger: 'POST' },
  { name: 'check-inactive-users-email', category: 'Email', description: 'Identifica inativos para e-mail', trigger: 'Cron' },
  { name: 'process-email-recovery-queue', category: 'Email', description: 'Processa fila de e-mails', trigger: 'Cron' },
  { name: 'send-blog-digest', category: 'Email', description: 'Envia digest do blog', trigger: 'Cron' },
  { name: 'send-weekly-tip', category: 'Email', description: 'Envia dica semanal', trigger: 'Cron' },
  { name: 'send-success-story', category: 'Email', description: 'Envia caso de sucesso', trigger: 'Cron' },
  { name: 'send-platform-news', category: 'Email', description: 'Envia novidades da plataforma', trigger: 'Cron' },
  { name: 'send-monthly-summary', category: 'Email', description: 'Envia resumo mensal', trigger: 'Cron' },
  { name: 'send-test-email', category: 'Email', description: 'Envia e-mail de teste', trigger: 'POST' },
  { name: 'egoi-email-webhook', category: 'Email', description: 'Webhook de eventos E-goi', trigger: 'Webhook' },
  { name: 'handle-email-unsubscribe', category: 'Email', description: 'Processa descadastramento', trigger: 'GET' },
  // Blog
  { name: 'generate-blog-post', category: 'Blog', description: 'Gera post de blog por IA', trigger: 'POST' },
  { name: 'regenerate-blog-asset', category: 'Blog', description: 'Regenera imagem ou conteúdo de post', trigger: 'POST' },
  { name: 'blog-cron-trigger', category: 'Blog', description: 'Trigger de geração automática', trigger: 'Cron' },
  { name: 'blog-sitemap', category: 'Blog', description: 'Gera sitemap XML do blog', trigger: 'GET' },
  // Admin
  { name: 'system-health-check', category: 'Sistema', description: 'Recalcula scores de saúde', trigger: 'Cron' },
  { name: 'export-schema-sql', category: 'Sistema', description: 'Exporta schema SQL do banco', trigger: 'POST' },
  { name: 'export-table-data', category: 'Sistema', description: 'Exporta dados de tabela específica', trigger: 'POST' },
  { name: 'anonymize-ips', category: 'Sistema', description: 'Anonimiza IPs para LGPD', trigger: 'Cron' },
  { name: 'admin-view-user-data', category: 'Sistema', description: 'Visualiza dados de usuário (suporte)', trigger: 'POST' },
  { name: 'admin-update-subscription', category: 'Sistema', description: 'Atualiza assinatura manualmente', trigger: 'POST' },
  // Growth
  { name: 'growth-metrics', category: 'Growth', description: 'Calcula métricas de crescimento', trigger: 'Cron' },
  { name: 'check-expired-trials', category: 'Growth', description: 'Verifica e expira trials vencidos', trigger: 'Cron' },
  { name: 'sync-plan-limits', category: 'Growth', description: 'Sincroniza limites dos planos', trigger: 'POST' },
  // Utils
  { name: 'rate-limiter', category: 'Utils', description: 'Controle de rate limiting', trigger: 'POST' },
];

// ── Components ──────────────────────────────────────────────────

function OverviewPanel() {
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    TABLES_CATALOG.forEach(t => map.set(t.category, (map.get(t.category) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-3xl font-bold">{TABLES_CATALOG.length}</p>
          <p className="text-sm text-muted-foreground">Tabelas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-3xl font-bold">{EDGE_FUNCTIONS_CATALOG.length}</p>
          <p className="text-sm text-muted-foreground">Edge Functions</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-3xl font-bold">{TRIGGERS_CATALOG.length}</p>
          <p className="text-sm text-muted-foreground">Triggers</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-3xl font-bold">{CRON_JOBS_CATALOG.length}</p>
          <p className="text-sm text-muted-foreground">Cron Jobs</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Tabelas por Categoria</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map(([cat, count]) => (
              <Badge key={cat} variant="outline" className="text-xs">
                {cat}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TablesPanel() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const { data: sizesMap, isLoading: sizesLoading } = useQuery({
    queryKey: ['table-sizes'],
    queryFn: fetchTableSizes,
    staleTime: 300_000, // 5 min cache
  });

  const categories = useMemo(() => {
    const set = new Set(TABLES_CATALOG.map(t => t.category));
    return ['all', ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() =>
    TABLES_CATALOG.filter(t => {
      const matchSearch = !search || t.name.includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'all' || t.category === categoryFilter;
      return matchSearch && matchCat;
    }),
  [search, categoryFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Buscar tabela..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <div className="flex flex-wrap gap-1">
          {categories.map(c => (
            <Badge
              key={c}
              variant={categoryFilter === c ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setCategoryFilter(c)}
            >
              {c === 'all' ? 'Todas' : c}
            </Badge>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Tabela</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Registros</TableHead>
              <TableHead className="text-right">Tamanho</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t, i) => {
              const sizeInfo = sizesMap?.get(t.name);
              return (
                <TableRow key={t.name}>
                  <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                  <TableCell className="font-mono text-xs font-medium">{t.name}</TableCell>
                  <TableCell className="text-sm">{t.description}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{t.category}</Badge></TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {sizeInfo ? sizeInfo.row_estimate.toLocaleString() : <span className="text-muted-foreground">{t.estimatedRows}</span>}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {sizesLoading ? <Skeleton className="h-4 w-16 ml-auto" /> : sizeInfo ? sizeInfo.total_size : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">Exibindo {filtered.length} de {TABLES_CATALOG.length} tabelas</p>
    </div>
  );
}

function TriggersPanel() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Tabela</TableHead>
            <TableHead>Trigger</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Descrição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {TRIGGERS_CATALOG.map((t, i) => (
            <TableRow key={t.name}>
              <TableCell className="font-mono text-xs">{i + 1}</TableCell>
              <TableCell className="font-mono text-xs">{t.table}</TableCell>
              <TableCell className="font-mono text-xs font-medium">{t.name}</TableCell>
              <TableCell><Badge variant="outline" className="text-xs">{t.event}</Badge></TableCell>
              <TableCell className="text-sm">{t.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CronJobsPanel() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Job</TableHead>
            <TableHead>Frequência</TableHead>
            <TableHead>Edge Function</TableHead>
            <TableHead>Descrição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CRON_JOBS_CATALOG.map((j, i) => (
            <TableRow key={j.name}>
              <TableCell className="font-mono text-xs">{i + 1}</TableCell>
              <TableCell className="font-mono text-xs font-medium">{j.name}</TableCell>
              <TableCell className="text-xs">{j.frequency}</TableCell>
              <TableCell className="font-mono text-xs">{j.edgeFunction}</TableCell>
              <TableCell className="text-sm">{j.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EdgeFunctionsPanel() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    const set = new Set(EDGE_FUNCTIONS_CATALOG.map(f => f.category));
    return ['all', ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() =>
    EDGE_FUNCTIONS_CATALOG.filter(f => {
      const matchSearch = !search || f.name.includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'all' || f.category === categoryFilter;
      return matchSearch && matchCat;
    }),
  [search, categoryFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Buscar function..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <div className="flex flex-wrap gap-1">
          {categories.map(c => (
            <Badge
              key={c}
              variant={categoryFilter === c ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setCategoryFilter(c)}
            >
              {c === 'all' ? 'Todas' : c}
            </Badge>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Function</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Descrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((f, i) => (
              <TableRow key={f.name}>
                <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                <TableCell className="font-mono text-xs font-medium">{f.name}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{f.category}</Badge></TableCell>
                <TableCell><Badge variant="secondary" className="text-xs">{f.trigger}</Badge></TableCell>
                <TableCell className="text-sm">{f.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">Exibindo {filtered.length} de {EDGE_FUNCTIONS_CATALOG.length} functions</p>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export const DatabaseMonitorTab = () => {
  return (
    <AdminSubTabs
      tabs={[
        { id: 'overview', label: 'Visão Geral', icon: <Database className="h-4 w-4" />, color: 'blue' },
        { id: 'tables', label: 'Tabelas', icon: <Layers className="h-4 w-4" />, color: 'green' },
        { id: 'triggers', label: 'Gatilhos', icon: <Zap className="h-4 w-4" />, color: 'yellow' },
        { id: 'cron', label: 'Tarefas Agendadas', icon: <Clock className="h-4 w-4" />, color: 'orange' },
        { id: 'functions', label: 'Funções na Nuvem', icon: <Cloud className="h-4 w-4" />, color: 'purple' },
      ]}
      defaultTab="overview"
    >
      {(activeTab) => (
        <>
          {activeTab === 'overview' && <OverviewPanel />}
          {activeTab === 'tables' && <TablesPanel />}
          {activeTab === 'triggers' && <TriggersPanel />}
          {activeTab === 'cron' && <CronJobsPanel />}
          {activeTab === 'functions' && <EdgeFunctionsPanel />}
        </>
      )}
    </AdminSubTabs>
  );
};

export default DatabaseMonitorTab;
