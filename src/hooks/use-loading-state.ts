
import { useState, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  loadingText: string;
  progress?: number;
}

export function useLoadingState(initialText = 'Loading...') {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    loadingText: initialText
  });

  const startLoading = useCallback((text?: string, progress?: number) => {
    setLoadingState({
      isLoading: true,
      loadingText: text || initialText,
      progress
    });
  }, [initialText]);

  const stopLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false
    }));
  }, []);

  const updateProgress = useCallback((progress: number, text?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress,
      loadingText: text || prev.loadingText
    }));
  }, []);

  return {
    ...loadingState,
    startLoading,
    stopLoading,
    updateProgress
  };
}
