
import React from 'react';
import {
  CreditCard, FileText, Repeat, Car, Shield, Heart, Coins,
  Users2, Target, TrendingUp, Brain, Settings, Sparkles,
  Home, Banknote, AlertCircle, Globe, Bike, Building,
} from 'lucide-react';
import { useRole } from '@/store/rbacStore';

interface MoreModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'available' | 'coming-soon' | 'beta';
  category: 'financial' | 'tracking' | 'analysis' | 'settings';
  priority: 'high' | 'medium' | 'low';
  /** If set, only that role (or ADMIN) may see it */
  roleRequired?: 'ADMIN' | 'SPOUSE' | 'BROTHER';
  /** If set, this role is BLOCKED from seeing it */
  roleBlocked?: 'SPOUSE' | 'BROTHER';
}

const modules: MoreModule[] = [
  // ── Financial Management ────────────────────────────────────────
  { id: 'credit-cards',    title: 'Credit Cards',           description: 'Cards, balances, due dates',                         icon: CreditCard,  status: 'available',    category: 'financial', priority: 'high' },
  { id: 'loans',           title: 'Loans & EMIs',           description: 'Balances, EMI schedule, prepayment scenarios',        icon: Banknote,    status: 'available',    category: 'financial', priority: 'high' },
  { id: 'subscriptions',   title: 'Subscriptions',          description: 'Recurring charges & cancellations',                  icon: Repeat,      status: 'beta',         category: 'financial', priority: 'high' },
  { id: 'emergency-fund',  title: 'Emergency Fund',         description: 'Build & track your 6-month buffer',                  icon: AlertCircle, status: 'available',    category: 'financial', priority: 'high' },
  { id: 'brother-global',  title: "Brother's US Liability", description: 'InCred loan, USD hand loans, USD↔INR converter',    icon: Globe,       status: 'available',    category: 'financial', priority: 'high', roleRequired: 'BROTHER' },
  { id: 'family-banking',  title: 'Family Banking',         description: 'Shared accounts, family financial planning',         icon: Users2,      status: 'coming-soon',  category: 'financial', priority: 'low' },

  // ── Asset & Expense Tracking ───────────────────────────────────
  { id: 'vehicles',        title: 'Vehicle Watchdog',       description: 'FZS oil alerts, Fuelio CSV sync, insurance',         icon: Bike,        status: 'available',    category: 'tracking',  priority: 'high' },
  { id: 'property-engine', title: 'Guntur / Gorantla',      description: 'Waterfall allocation, Dwacra deduction, Care Fund',  icon: Building,    status: 'available',    category: 'tracking',  priority: 'high', roleBlocked: 'BROTHER' },
  { id: 'enhanced-rentals',title: 'Rental Properties',      description: 'Rental income, expenses & tenant info',              icon: Home,        status: 'beta',         category: 'tracking',  priority: 'medium' },
  { id: 'insurance',       title: 'Insurance',              description: 'Policies, premiums & claims',                        icon: Shield,      status: 'coming-soon',  category: 'tracking',  priority: 'medium', roleBlocked: 'BROTHER' },
  { id: 'health-tracker',  title: 'Health Tracker',         description: 'Medical expenses, BoA + HDFC Optima',               icon: Heart,       status: 'coming-soon',  category: 'tracking',  priority: 'low',   roleBlocked: 'BROTHER' },
  { id: 'gold',            title: 'Gold Investments',       description: 'Gold holdings & price movements',                    icon: Coins,       status: 'beta',         category: 'tracking',  priority: 'low',   roleBlocked: 'BROTHER' },

  // ── Analysis & Intelligence ────────────────────────────────────
  { id: 'cfa-recommendations', title: 'CFA Recommendations', description: 'Professional-grade financial analysis',            icon: Brain,       status: 'available',    category: 'analysis',  priority: 'high' },
  { id: 'recommendations',    title: 'Smart Insights',       description: 'AI-powered insights & suggestions',                icon: Sparkles,    status: 'beta',         category: 'analysis',  priority: 'medium' },
  { id: 'smart-goals',        title: 'Smart Goals',          description: 'Auto-generated goals from your profile',           icon: Target,      status: 'beta',         category: 'analysis',  priority: 'medium' },

  // ── Configuration ──────────────────────────────────────────────
  { id: 'settings', title: 'Settings', description: 'Preferences, security & account', icon: Settings, status: 'available', category: 'settings', priority: 'high' },
];

// ── helpers ───────────────────────────────────────────────────────────────────
function isVisible(mod: MoreModule, role: string): boolean {
  // Must be ADMIN or the required role
  if (mod.roleRequired && role !== 'ADMIN' && role !== mod.roleRequired) return false;
  // Must NOT be the blocked role
  if (mod.roleBlocked && role === mod.roleBlocked) return false;
  return true;
}

function StatusPill({ status }: { status: string }) {
  if (status === 'available')
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success border border-success/30">Live</span>;
  if (status === 'beta')
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning/15 text-warning border border-warning/30">Beta</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">Soon</span>;
}

const categoryIconColors: Record<string, string> = {
  financial: 'bg-primary/10 text-primary',
  tracking:  'bg-accent/10 text-accent',
  analysis:  'bg-warning/10 text-warning',
  settings:  'bg-muted text-muted-foreground',
};

const categoryMeta: Record<string, { label: string; icon: React.ComponentType<any> }> = {
  financial: { label: 'Financial Management',     icon: TrendingUp },
  tracking:  { label: 'Asset & Expense Tracking', icon: FileText   },
  analysis:  { label: 'Analysis & Intelligence',  icon: Brain      },
  settings:  { label: 'Configuration',            icon: Settings   },
};

export function MoreScreen({
  onNavigate,
  onClose,
}: {
  onNavigate?: (id: string) => void;
  onClose?: () => void;
}) {
  const role = useRole();

  const handleClick = (moduleId: string, status: string) => {
    if (status === 'coming-soon') return;
    onNavigate ? onNavigate(moduleId) : window.dispatchEvent(new CustomEvent('navigate-to-module', { detail: moduleId }));
    onClose?.();
  };

  const cats = ['financial', 'tracking', 'analysis', 'settings'] as const;

  return (
    <div className="px-4 pb-6 space-y-5 animate-fade-in">
      {cats.map((cat) => {
        const items = modules.filter((m) => m.category === cat && isVisible(m, role));
        if (items.length === 0) return null;
        const { label, icon: Icon } = categoryMeta[cat];
        return (
          <div key={cat} className="space-y-2">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1 pt-2">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </h2>
            <div className="space-y-1.5">
              {items.map((mod) => {
                const colorClass = categoryIconColors[mod.category] ?? 'bg-muted text-muted-foreground';
                const disabled = mod.status === 'coming-soon';
                return (
                  <button
                    key={mod.id}
                    onClick={() => handleClick(mod.id, mod.status)}
                    disabled={disabled}
                    aria-label={`${mod.title}: ${mod.description}`}
                    className={`
                      group flex items-center gap-3 p-3.5 rounded-2xl border text-left w-full
                      transition-all duration-200 focus-ring
                      ${disabled
                        ? 'opacity-50 cursor-not-allowed border-border/40 bg-muted/20'
                        : 'border-border/60 bg-card/60 hover:bg-card hover:border-primary/30 hover:shadow-card cursor-pointer active:scale-[0.98]'
                      }
                    `}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                      <mod.icon className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight truncate">{mod.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-1">{mod.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusPill status={mod.status} />
                      {!disabled && (
                        <svg className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
