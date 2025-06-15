
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

interface EnhancedLoadingWrapperProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  progress?: number;
  error?: string | null;
  onRetry?: () => void;
}

export function EnhancedLoadingWrapper({ 
  loading, 
  children, 
  loadingText = "Loading...",
  progress,
  error,
  onRetry
}: EnhancedLoadingWrapperProps) {
  if (error) {
    return (
      <Card className="m-4 border-red-200 bg-red-50 dark:bg-red-950">
        <CardContent className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="m-4">
        <CardContent className="text-center py-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">{loadingText}</p>
            {progress !== undefined && (
              <div className="max-w-xs mx-auto">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
