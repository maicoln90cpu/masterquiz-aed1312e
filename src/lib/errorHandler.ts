import { logger } from '@/lib/logger';
import { toast } from "sonner";

interface ErrorDetails {
  message: string;
  code?: string;
  details?: string;
}

export class AppError extends Error {
  code?: string;
  details?: string;

  constructor(message: string, code?: string, details?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Centralized error handler with detailed logging and user-friendly messages
 */
export const handleError = (
  error: unknown,
  context: string,
  fallbackMessage: string
): ErrorDetails => {
  let errorDetails: ErrorDetails = {
    message: fallbackMessage
  };

  // Log detailed error for debugging
  logger.error(`[${context}] Error occurred:`, {
    error,
    timestamp: new Date().toISOString(),
    context
  });

  if (error instanceof AppError) {
    errorDetails = {
      message: error.message,
      code: error.code,
      details: error.details
    };
  } else if (error && typeof error === 'object') {
    const err = error as any;
    
    // Supabase error handling
    if (err.code) {
      errorDetails.code = err.code;
      
      // Map common Supabase errors to user-friendly messages
      switch (err.code) {
        case '23505':
          errorDetails.message = 'Este item já existe no sistema';
          break;
        case '23503':
          errorDetails.message = 'Não é possível realizar esta ação devido a dependências';
          break;
        case 'PGRST116':
          errorDetails.message = 'Item não encontrado';
          break;
        case '42501':
          errorDetails.message = 'Você não tem permissão para realizar esta ação';
          break;
        default:
          errorDetails.message = err.message || fallbackMessage;
      }
    } else if (err.message) {
      errorDetails.message = err.message;
    }
    
    errorDetails.details = err.hint || err.details;
  } else if (typeof error === 'string') {
    errorDetails.message = error;
  }

  return errorDetails;
};

/**
 * Show error toast with proper formatting
 */
export const showErrorToast = (error: unknown, context: string, fallbackMessage: string) => {
  const errorDetails = handleError(error, context, fallbackMessage);
  
  toast.error(errorDetails.message, {
    description: errorDetails.details,
    duration: 5000
  });
};

/**
 * Show success toast
 */
export const showSuccessToast = (message: string, description?: string) => {
  toast.success(message, {
    description,
    duration: 3000
  });
};
