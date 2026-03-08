
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Shield, Zap } from "lucide-react";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const navigate = useNavigate();

  const features = [
    { icon: TrendingUp, text: "Track every rupee, every loan, every asset" },
    { icon: Shield,     text: "Role-based privacy — Admin, Spouse, Brother" },
    { icon: Zap,        text: "Guntur waterfall & Gorantla rental engine" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6">
      {/* Logo */}
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl mb-6 shadow-glow"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
        aria-hidden="true"
      >
        <span className="text-2xl font-bold text-white select-none">S</span>
      </div>

      <h1 className="text-3xl font-bold text-foreground tracking-tight mb-1 text-center">
        Welcome to Savora
      </h1>
      <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
        Your family's private financial command centre
      </p>

      {/* Feature list */}
      <div className="w-full max-w-sm space-y-3 mb-10">
        {features.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 p-3.5 rounded-2xl bg-secondary/50 border border-border/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <p className="text-sm text-foreground">{text}</p>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="w-full max-w-sm space-y-3">
        <Button
          onClick={onComplete}
          className="w-full h-12 rounded-2xl text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
        >
          Get Started
        </Button>
        <Button
          onClick={() => navigate("/auth")}
          variant="outline"
          className="w-full h-12 rounded-2xl text-sm font-medium border-border/60"
        >
          Sign In with Account
        </Button>
      </div>
    </div>
  );
}
