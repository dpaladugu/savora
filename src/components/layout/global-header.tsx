
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";

interface GlobalHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function GlobalHeader({ title, onBack, showBackButton = false }: GlobalHeaderProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between p-4">
<div className="flex items-center gap-2">
          <img src="/placeholder.svg" alt="Savora Logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-foreground tracking-tight">{title || "Savora"}</h1>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="bg-background/95 backdrop-blur-sm border-border hover:bg-accent transition-all duration-300"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-foreground" />
          ) : (
            <Moon className="h-4 w-4 text-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
}
