
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingWrapperProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function LoadingWrapper({ loading, children, loadingText = "Loading..." }: LoadingWrapperProps) {
  if (loading) {
    return (
      <Card className="m-4">
        <CardContent className="text-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{loadingText}</p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
