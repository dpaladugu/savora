
import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  message: string;
  progress?: number;
}

export function useLoadingState() {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    message: '',
    progress: undefined
  });

  const startLoading = useCallback((message: string = 'Loading...', progress?: number) => {
    setState({
      isLoading: true,
      message,
      progress
    });
  }, []);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setState(prev => ({
      ...prev,
      progress,
      message: message || prev.message
    }));
  }, []);

  const stopLoading = useCallback(() => {
    setState({
      isLoading: false,
      message: '',
      progress: undefined
    });
  }, []);

  return {
    isLoading: state.isLoading,
    loadingMessage: state.message,
    progress: state.progress,
    startLoading,
    updateProgress,
    stopLoading
  };
}
