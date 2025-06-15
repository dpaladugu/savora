
import { Loader2, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { ReactNode } from "react";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && (
        <p className="text-sm text-muted-foreground text-center">{text}</p>
      )}
    </div>
  );
}

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingCard({ title = "Loading...", description, className = '' }: LoadingCardProps) {
  return (
    <Card className={`${className}`}>
      <CardContent className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" />
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground text-center">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export function ErrorState({ 
  title = "Something went wrong", 
  description, 
  onRetry, 
  retryText = "Try Again",
  className = ''
}: ErrorStateProps) {
  return (
    <Card className={`${className}`}>
      <CardContent className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground text-center mb-4">{description}</p>
        )}
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ 
  title = "No data found", 
  description, 
  action,
  icon,
  className = ''
}: EmptyStateProps) {
  return (
    <Card className={`${className}`}>
      <CardContent className="flex flex-col items-center justify-center p-8">
        {icon || <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground text-center mb-4">{description}</p>
        )}
        {action && (
          <Button onClick={action.onClick} variant="outline" size="sm">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface ProgressiveLoadingProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressiveLoading({ steps, currentStep, className = '' }: ProgressiveLoadingProps) {
  return (
    <Card className={`${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" />
          <div className="mt-6 w-full max-w-sm">
            <div className="mb-4">
              <div className="text-sm font-medium text-center mb-2">
                Step {currentStep + 1} of {steps.length}
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className={`flex items-center text-sm ${
                    index < currentStep 
                      ? 'text-green-600' 
                      : index === currentStep 
                        ? 'text-primary font-medium' 
                        : 'text-muted-foreground'
                  }`}
                >
                  {index < currentStep && <CheckCircle className="w-4 h-4 mr-2" />}
                  {index === currentStep && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {index > currentStep && <div className="w-4 h-4 mr-2" />}
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
