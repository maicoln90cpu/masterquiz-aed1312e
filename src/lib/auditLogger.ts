import { supabase } from "@/integrations/supabase/client";

/**
 * Sistema de auditoria centralizado para registrar ações importantes
 * Todos os logs são armazenados na tabela audit_logs com timestamp e metadados
 */

export type AuditAction =
  // Auth
  | "auth:login_success"
  | "auth:login_failed"
  | "auth:logout"
  | "auth:signup"
  | "auth:password_reset"
  // Quiz
  | "quiz:created"
  | "quiz:updated"
  | "quiz:deleted"
  | "quiz:published"
  | "quiz:duplicated"
  | "quiz:response_submitted"
  // User
  | "user:profile_updated"
  | "user:subscription_changed"
  | "user:plan_upgraded"
  | "user:plan_downgraded"
  // Admin
  | "admin:dashboard_access"
  | "admin:user_deleted"
  | "admin:plan_changed"
  | "admin:settings_updated"
  // Tickets
  | "ticket:created"
  | "ticket:updated"
  | "ticket:closed"
  // Webhooks
  | "webhook:configured"
  | "webhook:deleted"
  | "webhook:tested"
  // Integrations
  | "integration:created"
  | "integration:updated"
  | "integration:deleted"
  | "integration:synced"
  // Export
  | "export:pdf_generated"
  | "export:excel_generated"
  | "export:leads_exported"
  | "export:data_requested";

export interface AuditLogMetadata {
  [key: string]: any;
}

/**
 * Registra uma ação no sistema de auditoria
 * @param action - Tipo de ação executada
 * @param resourceType - Tipo de recurso afetado (opcional)
 * @param resourceId - ID do recurso afetado (opcional)
 * @param metadata - Dados adicionais sobre a ação (opcional)
 */
export const logAudit = async (
  action: AuditAction,
  resourceType?: string,
  resourceId?: string,
  metadata?: AuditLogMetadata
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Coleta informações do navegador
    const userAgent = navigator.userAgent;
    
    // Tenta obter IP (não disponível diretamente no browser, será null)
    const ip_address = null; // Edge function deve capturar isso
    
    await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      user_agent: userAgent,
      ip_address,
      metadata: metadata || {}
    });
    
    // Log apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`[AUDIT] ${action}`, { resourceType, resourceId, metadata });
    }
  } catch (error) {
    // Log de erro apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.error('[AUDIT] Failed to log action:', error);
    }
  }
};

/**
 * Helper para logar ações de autenticação
 */
export const logAuthAction = (
  action: Extract<AuditAction, `auth:${string}`>,
  email?: string,
  metadata?: AuditLogMetadata
) => {
  return logAudit(action, 'auth', undefined, { email, ...metadata });
};

/**
 * Helper para logar ações em quizzes
 */
export const logQuizAction = (
  action: Extract<AuditAction, `quiz:${string}`>,
  quizId: string,
  metadata?: AuditLogMetadata
) => {
  return logAudit(action, 'quiz', quizId, metadata);
};

/**
 * Helper para logar ações administrativas
 */
export const logAdminAction = (
  action: Extract<AuditAction, `admin:${string}`>,
  targetUserId?: string,
  metadata?: AuditLogMetadata
) => {
  return logAudit(action, 'admin', targetUserId, metadata);
};

/**
 * Helper para logar ações de integração
 */
export const logIntegrationAction = (
  action: Extract<AuditAction, `integration:${string}`>,
  integrationId: string,
  metadata?: AuditLogMetadata
) => {
  return logAudit(action, 'integration', integrationId, metadata);
};

/**
 * Helper para logar ações de export
 */
export const logExportAction = (
  action: Extract<AuditAction, `export:${string}`>,
  resourceId?: string,
  metadata?: AuditLogMetadata
) => {
  return logAudit(action, 'export', resourceId, metadata);
};

/**
 * Helper para logar alterações de plano
 */
export const logPlanChange = (
  userId: string,
  oldPlan: string,
  newPlan: string,
  reason?: string
) => {
  const action = newPlan > oldPlan ? 'user:plan_upgraded' : 'user:plan_downgraded';
  return logAudit(action as AuditAction, 'subscription', userId, {
    old_plan: oldPlan,
    new_plan: newPlan,
    reason,
    changed_at: new Date().toISOString()
  });
};

/**
 * Helper para logar exclusão de quiz
 */
export const logQuizDeletion = (
  quizId: string,
  quizTitle: string,
  responseCount?: number
) => {
  return logAudit('quiz:deleted', 'quiz', quizId, {
    title: quizTitle,
    response_count: responseCount,
    deleted_at: new Date().toISOString()
  });
};
