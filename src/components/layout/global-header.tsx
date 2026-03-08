
import { ArrowLeft, Moon, Sun, Shield, Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const handleLogout = () => {
    clearSession();
    toast.info("Session cleared. Values are masked.");
  };

  const roleBadgeClass =
    role === "ADMIN"   ? "badge-admin"   :
    role === "SPOUSE"  ? "badge-spouse"  :
    role === "BROTHER" ? "badge-brother" : "";

  return (
    <>
      <header
        role="banner"
        className="fixed top-0 left-0 right-0 z-50 nav-glass border-b border-border/30"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/*
          Header inner: full width, horizontal padding scales with breakpoint.
          No max-w-lg cap here — the sidebar + content already constrain layout.
        */}
        <div className="flex items-center justify-between h-14 px-4 lg:px-6 w-full">
          {/* ── Left: back / logo / wordmark ── */}
          <div className="flex items-center gap-2.5 min-w-0">
            {showBackButton && onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                aria-label="Go back"
                className="h-9 w-9 rounded-xl hover:bg-secondary/60 focus-ring"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              aria-hidden="true"
            >
              <span className="text-xs font-bold text-white select-none">S</span>
            </div>
            <span className="text-base font-semibold text-foreground tracking-tight truncate select-none">
              {title || "Savora"}
            </span>
          </div>

          {/* ── Right: role badge + actions ── */}
          <div className="flex items-center gap-1.5 shrink-0">
            {role !== "GUEST" ? (
              <div className="flex items-center gap-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold leading-none ${roleBadgeClass}`}
                  aria-label={`Signed in as ${ROLE_NAMES[role]}`}
                >
                  <Shield className="w-3 h-3 shrink-0" aria-hidden="true" />
                  {ROLE_NAMES[role].split(" ")[0]}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  aria-label="Lock session and mask values"
                  title="Lock session"
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 focus-ring"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevealOpen(true)}
                aria-label="Enter passphrase to reveal financial values"
                className="h-9 px-3 rounded-xl text-xs font-medium gap-1.5 border-primary/30 text-primary hover:bg-primary/8 hover:border-primary/50 focus-ring"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden xs:inline">Reveal</span>
                <span className="xs:hidden">Reveal</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="h-9 w-9 rounded-xl hover:bg-secondary/60 focus-ring"
            >
              {isDark
                ? <Sun  className="h-4 w-4 text-warning"          aria-hidden="true" />
                : <Moon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              }
            </Button>
          </div>
        </div>
      </header>

      <RevealValuesDialog open={revealOpen} onOpenChange={setRevealOpen} />
    </>
  );
}
