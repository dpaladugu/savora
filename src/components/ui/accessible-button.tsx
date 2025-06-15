
import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string;
  isLoading?: boolean;
  loadingText?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ children, ariaLabel, isLoading, loadingText, className, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          className
        )}
        disabled={disabled || isLoading}
        aria-label={ariaLabel}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        )}
        {isLoading ? loadingText || 'Loading...' : children}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
