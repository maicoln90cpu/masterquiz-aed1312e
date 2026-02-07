/**
 * Conditional Logger - Only logs in development mode
 * Replaces console.log/warn/error throughout the app
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.log('message');
 *   logger.quiz('Quiz loaded', quizData);
 *   logger.auth('User signed in');
 */

const isDev = import.meta.env.DEV;

// Categorias de log que podem ser habilitadas/desabilitadas
const LOG_CATEGORIES = {
  quiz: true,
  auth: true,
  api: true,
  form: true,
  analytics: true,
  integration: true,
  admin: true,
  general: true,
} as const;

type LogCategory = keyof typeof LOG_CATEGORIES;
type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface Logger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  group: (label: string) => void;
  groupEnd: () => void;
  table: (data: unknown) => void;
  // Loggers categorizados
  quiz: (...args: unknown[]) => void;
  auth: (...args: unknown[]) => void;
  api: (...args: unknown[]) => void;
  form: (...args: unknown[]) => void;
  analytics: (...args: unknown[]) => void;
  integration: (...args: unknown[]) => void;
  admin: (...args: unknown[]) => void;
}

const noop = () => {};

const formatTimestamp = (): string => {
  const now = new Date();
  const time = now.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit'
  });
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${time}.${ms}`;
};

const logWithLevel = (level: LogLevel) => (...args: unknown[]) => {
  if (isDev) {
    const timestamp = formatTimestamp();
    const prefix = `[${timestamp}]`;
    console[level](prefix, ...args);
  }
};

const logWithCategory = (category: LogCategory) => (...args: unknown[]) => {
  if (isDev && LOG_CATEGORIES[category]) {
    const timestamp = formatTimestamp();
    const categoryLabel = category.toUpperCase();
    const prefix = `[${timestamp}] [${categoryLabel}]`;
    console.log(prefix, ...args);
  }
};

// Error logger - always logs (important for debugging in production)
const errorLogger = (...args: unknown[]) => {
  const timestamp = formatTimestamp();
  const prefix = `[${timestamp}] [ERROR]`;
  console.error(prefix, ...args);
};

const createLogger = (): Logger => {
  return {
    // Métodos básicos
    log: isDev ? logWithLevel('log') : noop,
    warn: isDev ? logWithLevel('warn') : noop,
    error: errorLogger, // Sempre loga erros
    info: isDev ? logWithLevel('info') : noop,
    debug: isDev ? logWithLevel('debug') : noop,
    
    // Métodos de agrupamento
    group: isDev ? (label: string) => console.group(label) : noop,
    groupEnd: isDev ? () => console.groupEnd() : noop,
    table: isDev ? (data: unknown) => console.table(data) : noop,
    
    // Loggers categorizados
    quiz: logWithCategory('quiz'),
    auth: logWithCategory('auth'),
    api: logWithCategory('api'),
    form: logWithCategory('form'),
    analytics: logWithCategory('analytics'),
    integration: logWithCategory('integration'),
    admin: logWithCategory('admin'),
  };
};

export const logger = createLogger();

// Helper para logging condicional com contexto
export const logWithContext = (context: string, ...args: unknown[]) => {
  logger.log(`[${context}]`, ...args);
};

// Helper para medir performance (dev only)
export const logTiming = (label: string, fn: () => void) => {
  if (isDev) {
    console.time(label);
    fn();
    console.timeEnd(label);
  } else {
    fn();
  }
};

// Helper assíncrono para medir performance
export const logTimingAsync = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  if (isDev) {
    console.time(label);
    const result = await fn();
    console.timeEnd(label);
    return result;
  }
  return fn();
};

export default logger;
