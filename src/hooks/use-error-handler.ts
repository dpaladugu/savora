
import { useState, useCallback } from 'react';
import { Logger } from '@/services/logger';

export function useErrorHandler() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleError = useCallback((error: Error, context?: string) => {
    const message = error.message || 'An unexpected error occurred';
    setErrorMessage(message);
    
    if (context) {
      Logger.error(`${context}: ${message}`, error);
    } else {
      Logger.error(message, error);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    errorMessage,
    handleError,
    clearError,
    hasError: !!errorMessage
  };
}
