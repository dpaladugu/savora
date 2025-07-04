import React from 'react';
import { CriticalErrorBoundary } from './critical-error-boundary';
import { Logger } from '@/services/logger';

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    Logger.error('Global error caught by boundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  };

  return (
    <CriticalErrorBoundary onError={handleError}>
      {children}
    </CriticalErrorBoundary>
  );
}