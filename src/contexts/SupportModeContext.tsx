import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { logAudit } from '@/lib/auditLogger';

interface SupportModeTarget {
  userId: string;
  email: string;
  fullName: string;
  planType: string;
}

interface SupportModeContextType {
  isSupportMode: boolean;
  target: SupportModeTarget | null;
  enterSupportMode: (target: SupportModeTarget) => void;
  exitSupportMode: () => void;
  startTime: Date | null;
}

const SupportModeContext = createContext<SupportModeContextType>({
  isSupportMode: false,
  target: null,
  enterSupportMode: () => {},
  exitSupportMode: () => {},
  startTime: null,
});

export const useSupportMode = () => useContext(SupportModeContext);

export const SupportModeProvider = ({ children }: { children: ReactNode }) => {
  const [target, setTarget] = useState<SupportModeTarget | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const enterSupportMode = useCallback((t: SupportModeTarget) => {
    setTarget(t);
    setStartTime(new Date());
    logAudit('support:enter', 'support_mode', t.userId, {
      target_email: t.email,
      target_name: t.fullName,
    });
  }, []);

  const exitSupportMode = useCallback(() => {
    if (target) {
      logAudit('admin:settings_updated', 'support_mode', target.userId, {
        action: 'exit_support_mode',
        target_email: target.email,
        duration_seconds: startTime ? Math.round((Date.now() - startTime.getTime()) / 1000) : 0,
      });
    }
    setTarget(null);
    setStartTime(null);
  }, [target, startTime]);

  return (
    <SupportModeContext.Provider
      value={{
        isSupportMode: !!target,
        target,
        enterSupportMode,
        exitSupportMode,
        startTime,
      }}
    >
      {children}
    </SupportModeContext.Provider>
  );
};
