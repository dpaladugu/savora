
import * as React from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string;
}

export const AccessibleButton = React.forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(({ className, ariaLabel, children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      className={cn("focus-ring", className)}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </Button>
  );
});

AccessibleButton.displayName = "AccessibleButton";
