
import { useState, useCallback, useRef } from 'react';
import { Logger } from '@/services/logger';

export interface LoadingState {
  isLoading: boolean;
  loadingText: string;
  error: Error | null;
  progress?: number;
}

export interface LoadingOperation {
  id: string;
  text: string;
  progress?: number;
}

export function useComprehensiveLoading() {
  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingOperation>>(new Map());
  const [globalError, setGlobalError] = useState<Error | null>(null);
  const operationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startLoading = useCallback((id: string, text: string, progress?: number) => {
    Logger.debug('Starting loading operation:', { id, text, progress });
    
    // Clear any existing timeout for this operation
    const existingTimeout = operationTimeouts.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    setLoadingStates(prev => {
      const newStates = new Map(prev);
      newStates.set(id, { id, text, progress });
      return newStates;
    });

    setGlobalError(null);

    // Auto-timeout after 30 seconds
    const timeout = setTimeout(() => {
      Logger.warn('Loading operation timed out:', id);
      stopLoading(id, new Error(`Operation '${text}' timed out after 30 seconds`));
    }, 30000);

    operationTimeouts.current.set(id, timeout);
  }, []);

  const updateProgress = useCallback((id: string, progress: number, text?: string) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      const existing = newStates.get(id);
      if (existing) {
        newStates.set(id, { 
          ...existing, 
          progress, 
          text: text || existing.text 
        });
      }
      return newStates;
    });
  }, []);

  const stopLoading = useCallback((id: string, error?: Error) => {
    Logger.debug('Stopping loading operation:', { id, error: !!error });
    
    // Clear timeout
    const timeout = operationTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      operationTimeouts.current.delete(id);
    }

    setLoadingStates(prev => {
      const newStates = new Map(prev);
      newStates.delete(id);
      return newStates;
    });

    if (error) {
      Logger.error('Loading operation failed:', error);
      setGlobalError(error);
    }
  }, []);

  const clearError = useCallback(() => {
    setGlobalError(null);
  }, []);

  const stopAllLoading = useCallback(() => {
    Logger.debug('Stopping all loading operations');
    
    // Clear all timeouts
    operationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    operationTimeouts.current.clear();
    
    setLoadingStates(new Map());
  }, []);

  // Computed states
  const isAnyLoading = loadingStates.size > 0;
  const primaryLoadingState = Array.from(loadingStates.values())[0] || null;
  const loadingCount = loadingStates.size;

  return {
    // State
    isLoading: isAnyLoading,
    loadingText: primaryLoadingState?.text || '',
    progress: primaryLoadingState?.progress,
    error: globalError,
    loadingCount,
    activeOperations: Array.from(loadingStates.values()),

    // Actions
    startLoading,
    stopLoading,
    updateProgress,
    clearError,
    stopAllLoading
  };
}

// Hook for single operation loading
export function useSingleLoading() {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    loadingText: '',
    error: null
  });

  const startLoading = useCallback((text: string, progress?: number) => {
    setState({
      isLoading: true,
      loadingText: text,
      error: null,
      progress
    });
  }, []);

  const updateProgress = useCallback((progress: number, text?: string) => {
    setState(prev => ({
      ...prev,
      progress,
      loadingText: text || prev.loadingText
    }));
  }, []);

  const stopLoading = useCallback((error?: Error) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: error || null
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    startLoading,
    stopLoading,
    updateProgress,
    clearError
  };
}
