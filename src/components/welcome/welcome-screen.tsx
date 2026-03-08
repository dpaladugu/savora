import React from "react";
import { Button } from "@/components/ui/button";
import { useRBACStore, useRole, ROLE_NAMES, ROLE_PASSPHRASES } from "@/store/rbacStore";
import { RevealValuesDialog } from "@/components/auth/RevealValuesDialog";
import { useState } from "react";
import { Shield, Eye, Users, Star, Globe, ChevronRight, Lock } from "lucide-react";

interface WelcomeScreenProps {
  onComplete: () => void;
}

const ROLE_CARDS = [
  {
    role: "ADMIN",
    label: "Admin",
    subtitle: "Full access — all accounts, salary, investments",
    icon: Star,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    badge: "Full Access",
    badgeClass: "bg-primary/10 text-primary",
  },
  {
    role: "SPOUSE",
    label: "Himabindu",
    subtitle: "Household expenses, rentals, health — salary masked",
    icon: Users,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    badge: "Family View",
    badgeClass: "bg-success/10 text-success",
  },
  {
    role: "BROTHER",
    label: "Brother (US)",
    subtitle: "USD Debt Sandbox, InCred loan — Hyderabad assets hidden",
    icon: Globe,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    badge: "US View",
    badgeClass: "bg-accent/10 text-accent",
  },
] as const;

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [revealOpen, setRevealOpen] = useState(false);
  const role = useRole();

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-5 py-8">
        {/* Logo */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl mb-5 shadow-glow"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
          aria-hidden="true"
        >
          <span className="text-2xl font-bold text-white select-none">S</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1 text-center">
          Welcome to Savora
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-7 max-w-xs leading-relaxed">
          Your family's private financial command centre. Each family member gets their own private view.
        </p>

        {/* Role cards */}
        <div className="w-full max-w-sm space-y-2.5 mb-8">
          {ROLE_CARDS.map(({ role: r, label, subtitle, icon: Icon, iconBg, iconColor, badge, badgeClass }) => (
            <div
              key={r}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-secondary/50 border border-border/50"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${iconBg}`}>
                <Icon className={`h-4.5 w-4.5 ${iconColor}`} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>{badge}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>
              </div>
            </div>
          ))}

          {/* Guest locked indicator */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/30 opacity-70">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 bg-muted">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Guest</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">All values masked — enter passphrase to reveal</p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="w-full max-w-sm space-y-2.5">
          <Button
            onClick={() => setRevealOpen(true)}
            className="w-full h-12 rounded-2xl text-sm font-semibold gap-2"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
          >
            <Eye className="h-4 w-4" />
            Enter Passphrase &amp; Reveal Values
          </Button>
          <Button
            onClick={onComplete}
            variant="outline"
            className="w-full h-12 rounded-2xl text-sm font-medium border-border/60 gap-2"
          >
            Continue as Guest
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground/60 text-center mt-6 max-w-xs">
          All data is stored locally on this device. Nothing is sent to any server.
        </p>
      </div>

      <RevealValuesDialog open={revealOpen} onOpenChange={(open) => {
        setRevealOpen(open);
        if (!open) onComplete(); // proceed after reveal
      }} />
    </>
  );
}
