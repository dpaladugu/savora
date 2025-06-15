
import { Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "@/contexts/theme-context";

export function DarkModeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="bg-background/95 backdrop-blur-sm border-border hover:bg-accent transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[48px] min-w-[48px]"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-foreground" />
      ) : (
        <Moon className="h-4 w-4 text-foreground" />
      )}
    </Button>
  );
}
