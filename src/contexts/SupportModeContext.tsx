import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { logAudit } from '@/lib/auditLogger';

interface SupportModeTarget {
  userId: string;
  email: string;
  fullName: string;
  planType: string;
}

export interface SupportAction {
  action: string;
  timestamp: Date;
  resourceId?: string;
  details?: string;
}

interface SupportModeContextType {
  isSupportMode: boolean;
  target: SupportModeTarget | null;
  enterSupportMode: (target: SupportModeTarget) => void;
  exitSupportMode: () => void;
  startTime: Date | null;
  /** Track an action performed during support mode */
  trackAction: (action: string, resourceId?: string, details?: string) => void;
  /** Get all actions performed during this session */
  sessionActions: SupportAction[];
}

const SupportModeContext = createContext<SupportModeContextType>({
  isSupportMode: false,
  target: null,
  enterSupportMode: () => {},
  exitSupportMode: () => {},
  startTime: null,
  trackAction: () => {},
  sessionActions: [],
});

export const useSupportMode = () => useContext(SupportModeContext);

export const SupportModeProvider = ({ children }: { children: ReactNode }) => {
  const [target, setTarget] = useState<SupportModeTarget | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessionActions, setSessionActions] = useState<SupportAction[]>([]);

  const trackAction = useCallback((action: string, resourceId?: string, details?: string) => {
    setSessionActions(prev => [...prev, { action, timestamp: new Date(), resourceId, details }]);
  }, []);

  const enterSupportMode = useCallback((t: SupportModeTarget) => {
    setTarget(t);
    setStartTime(new Date());
    setSessionActions([{ action: 'Sessão iniciada', timestamp: new Date(), details: `Usuário: ${t.email}` }]);
    logAudit('support:enter', 'support_mode', t.userId, {
      target_email: t.email,
      target_name: t.fullName,
    });
  }, []);

  const exitSupportMode = useCallback(() => {
    if (target) {
      const duration = startTime ? Math.round((Date.now() - startTime.getTime()) / 1000) : 0;
      logAudit('support:exit', 'support_mode', target.userId, {
        target_email: target.email,
        duration_seconds: duration,
        actions_count: sessionActions.length,
        actions_summary: sessionActions.map(a => a.action),
      });
    }
    setTarget(null);
    setStartTime(null);
    setSessionActions([]);
  }, [target, startTime, sessionActions]);

  return (
    <SupportModeContext.Provider
      value={{
        isSupportMode: !!target,
        target,
        enterSupportMode,
        exitSupportMode,
        startTime,
        trackAction,
        sessionActions,
      }}
    >
      {children}
    </SupportModeContext.Provider>
  );
};
