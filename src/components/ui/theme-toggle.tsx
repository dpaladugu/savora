
import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center gap-2"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4" />
          Light
        </>
      ) : (
        <>
          <Moon className="w-4 h-4" />
          Dark
        </>
      )}
    </Button>
  );
}
