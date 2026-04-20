import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';

interface CSPViolation {
  blockedURI: string;
  violatedDirective: string;
  effectiveDirective: string;
  sourceFile: string;
  lineNumber: number;
  timestamp: Date;
}

export const useCSPMonitor = () => {
  const [violations, setViolations] = useState<CSPViolation[]>([]);

  useEffect(() => {
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      const violation: CSPViolation = {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        effectiveDirective: event.effectiveDirective,
        sourceFile: event.sourceFile || '',
        lineNumber: event.lineNumber || 0,
        timestamp: new Date(),
      };

      logger.error('🚨 CSP VIOLATION DETECTED:', {
        blockedURI: violation.blockedURI,
        directive: violation.violatedDirective,
        effective: violation.effectiveDirective,
        source: violation.sourceFile,
      });

      setViolations((prev) => [...prev, violation]);
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation as EventListener);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation as EventListener);
    };
  }, []);

  return { violations };
};
