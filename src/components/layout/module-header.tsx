
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import { memo } from "react";

interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  showThemeToggle?: boolean;
  showHeader?: boolean;
  actions?: React.ReactNode;
}

export const ModuleHeader = memo(function ModuleHeader({ 
  title, 
  subtitle,
  onBack, 
  showBackButton = false,
  showThemeToggle = true,
  showHeader = true,
  actions
}: ModuleHeaderProps) {
  const { isDark, toggleTheme } = useTheme();

  if (!showHeader) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 nav-glass border-b border-border/50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBackButton && onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack} 
              className="flex-shrink-0 hover:bg-accent/50 transition-all duration-300"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
          {showThemeToggle && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="bg-background/50 backdrop-blur-sm border-border hover:bg-accent/50 transition-all duration-300 min-h-[40px] min-w-[40px]"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-foreground" />
              ) : (
                <Moon className="h-4 w-4 text-foreground" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
