
import { ArrowLeft, Moon, Sun, Shield, Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/theme-context";
import { useState } from "react";
import { useRBACStore, useRole, ROLE_NAMES } from "@/store/rbacStore";
import { RevealValuesDialog } from "@/components/auth/RevealValuesDialog";
import { toast } from "sonner";

interface GlobalHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function GlobalHeader({ title, onBack, showBackButton = false }: GlobalHeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const [revealOpen, setRevealOpen] = useState(false);
  const role = useRole();
  const { clearSession } = useRBACStore();

  const roleBadgeVariant = role === 'GUEST' ? 'outline' : role === 'ADMIN' ? 'default' : 'secondary';

  const handleLogout = () => {
    clearSession();
    toast.info('Session cleared. Values are masked.');
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {showBackButton && onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <img src="/placeholder.svg" alt="Savora Logo" className="h-7 w-7" />
            <h1 className="text-lg font-bold text-foreground tracking-tight">{title || "Savora"}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Role Badge */}
            {role !== 'GUEST' ? (
              <div className="flex items-center gap-1">
                <Badge variant={roleBadgeVariant as any} className="text-xs h-6 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {ROLE_NAMES[role].split(' ')[0]}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Lock session"
                >
                  <LogOut className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevealOpen(true)}
                className="h-7 text-xs gap-1"
              >
                <Eye className="h-3 w-3" />
                Reveal Values
              </Button>
            )}

            {/* Theme toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 bg-background/95 backdrop-blur-sm border-border hover:bg-accent"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-foreground" />
              ) : (
                <Moon className="h-4 w-4 text-foreground" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <RevealValuesDialog open={revealOpen} onOpenChange={setRevealOpen} />
    </>
  );
}
