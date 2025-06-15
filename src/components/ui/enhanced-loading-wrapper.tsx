
import { memo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Progress } from "./progress";

interface EnhancedLoadingWrapperProps {
  loading: boolean;
  error?: string | Error | null;
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
  
  const errorMessage = error instanceof Error ? error.message : (error || "An unexpected error occurred");

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px] p-4">
        <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground mb-4 break-words">
              {errorMessage}
            </p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-muted-foreground mb-4 text-center">{loadingText}</p>
        {typeof progress === 'number' && (
          <div className="w-full max-w-xs">
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground text-center">
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
});
