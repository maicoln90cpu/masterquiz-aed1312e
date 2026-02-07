import { useEffect } from 'react';
import { logAudit, type AuditAction, type AuditLogMetadata } from '@/lib/auditLogger';

/**
 * Hook para facilitar o uso de audit logs em componentes
 */
export const useAuditLog = () => {
  return {
    log: logAudit
  };
};

/**
 * Hook para logar ações automaticamente quando um componente monta
 */
export const useAuditOnMount = (
  action: AuditAction,
  resourceType?: string,
  resourceId?: string,
  metadata?: AuditLogMetadata
) => {
  useEffect(() => {
    logAudit(action, resourceType, resourceId, metadata);
  }, [action, resourceType, resourceId, metadata]);
};
