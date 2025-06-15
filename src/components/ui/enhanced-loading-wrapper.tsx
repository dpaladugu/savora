
import { memo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Progress } from "./progress";

interface EnhancedLoadingWrapperProps {
  loading: boolean;
  error?: string | null;
  loadingText?: string;
  progress?: number;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const EnhancedLoadingWrapper = memo(function EnhancedLoadingWrapper({
  loading,
  error,
  loadingText = "Loading...",
  progress,
  onRetry,
  children
}: EnhancedLoadingWrapperProps) {
  if (error) {
    return (
      <Card className="mx-4 my-6 border-destructive">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error}
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-muted-foreground mb-4">{loadingText}</p>
        {typeof progress === 'number' && (
          <div className="w-full max-w-xs">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center mt-2">
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
});
