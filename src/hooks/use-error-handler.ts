
import { useState, useCallback } from 'react';
import { Logger } from '@/services/logger';

export interface ErrorState {
  error: Error | null;
  isError: boolean;
  errorMessage: string | null;
}

export function useErrorHandler() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorMessage: null
  });

  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const contextMessage = context ? `${context}: ${errorObj.message}` : errorObj.message;
    
    Logger.error(contextMessage, errorObj);
    
    setErrorState({
      error: errorObj,
      isError: true,
      errorMessage: contextMessage
    });
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorMessage: null
    });
  }, []);

  const retryOperation = useCallback(async (operation: () => Promise<void>) => {
    try {
      clearError();
      await operation();
    } catch (error) {
      handleError(error as Error, 'Retry operation failed');
    }
  }, [clearError, handleError]);

  return {
    ...errorState,
    handleError,
    clearError,
    retryOperation
  };
}
