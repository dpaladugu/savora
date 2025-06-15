
import { useState, useCallback } from 'react';
import { NotificationService } from '@/services/notification-service';
import { Logger } from '@/services/logger';

interface AsyncOperationOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export function useAsyncOperation<T = any>(
  operation: () => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (...args: any[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await operation();
      setData(result);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      if (options.showSuccessToast && options.successMessage) {
        NotificationService.success({
          title: options.successMessage
        });
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      Logger.error('Async operation failed:', error);
      
      if (options.onError) {
        options.onError(error);
      }
      
      if (options.showErrorToast) {
        NotificationService.error({
          title: options.errorMessage || 'Operation failed',
          description: error.message
        });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [operation, options]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    loading,
    error,
    data,
    reset
  };
}
