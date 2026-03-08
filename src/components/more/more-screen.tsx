
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  FileText,
  Repeat,
  Car,
  Shield,
  Heart,
  Coins,
  Users2,
  Target,
  TrendingUp,
  Brain,
  Settings,
  Sparkles,
  Home,
  Banknote,
  AlertCircle,
  Globe,
  Bike,
  Building,
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
  roleRequired?: 'ADMIN' | 'SPOUSE' | 'BROTHER';
}

const modules: MoreModule[] = [
  // Financial Management
  {
    id: 'credit-cards',
    title: 'Credit Cards',
    description: 'Manage credit cards, track balances, and monitor due dates',
    icon: CreditCard,
    status: 'available',
    category: 'financial',
    priority: 'high'
  },
  {
    id: 'loans',
    title: 'Loans & EMIs',
    description: 'Track loan balances, EMI schedules, and prepayment scenarios',
    icon: Banknote,
    status: 'coming-soon',
    category: 'financial',
    priority: 'high'
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    description: 'Monitor recurring subscriptions and manage cancellations',
    icon: Repeat,
    status: 'beta',
    category: 'financial',
    priority: 'high'
  },
  {
    id: 'emergency-fund',
    title: 'Emergency Fund',
    description: 'Build and track your emergency fund progress',
    icon: AlertCircle,
    status: 'available',
    category: 'financial',
    priority: 'high'
  },

  // Asset Tracking
  {
    id: 'vehicles',
    title: 'Vehicles',
    description: 'Track vehicle expenses, maintenance, and fuel costs',
    icon: Car,
    status: 'coming-soon',
    category: 'tracking',
    priority: 'medium'
  },
  {
    id: 'insurance',
    title: 'Insurance',
    description: 'Manage insurance policies, premiums, and claims',
    icon: Shield,
    status: 'coming-soon',
    category: 'tracking',
    priority: 'medium'
  },
  {
    id: 'enhanced-rentals',
    title: 'Rental Properties',
    description: 'Manage rental income, expenses, and tenant information',
    icon: Home,
    status: 'beta',
    category: 'tracking',
    priority: 'medium'
  },
  {
    id: 'gold',
    title: 'Gold Investments',
    description: 'Track gold investments and price movements',
    icon: Coins,
    status: 'beta',
    category: 'tracking',
    priority: 'low'
  },

  // Analysis & Intelligence
  {
    id: 'cfa-recommendations',
    title: 'CFA Recommendations',
    description: 'Professional-grade financial analysis and recommendations',
    icon: Brain,
    status: 'available',
    category: 'analysis',
    priority: 'high'
  },
  {
    id: 'recommendations',
    title: 'Smart Recommendations',
    description: 'AI-powered financial insights and suggestions',
    icon: Sparkles,
    status: 'beta',
    category: 'analysis',
    priority: 'medium'
  },
  {
    id: 'smart-goals',
    title: 'Smart Goals',
    description: 'Auto-generated financial goals based on your profile',
    icon: Target,
    status: 'beta',
    category: 'analysis',
    priority: 'medium'
  },

  // Personal & Family
  {
    id: 'health-tracker',
    title: 'Health Tracker',
    description: 'Track medical expenses and health-related costs',
    icon: Heart,
    status: 'coming-soon',
    category: 'tracking',
    priority: 'low'
  },
  {
    id: 'family-banking',
    title: 'Family Banking',
    description: 'Manage shared accounts and family financial planning',
    icon: Users2,
    status: 'coming-soon',
    category: 'financial',
    priority: 'low'
  },

  // Settings & Configuration
  {
    id: 'settings',
    title: 'Settings',
    description: 'App preferences, security, and account settings',
    icon: Settings,
    status: 'available',
    category: 'settings',
    priority: 'high'
  },

  // New March 2026 Modules
  {
    id: 'vehicles',
    title: 'Vehicle Fleet & Watchdog',
    description: 'FZS oil alerts, Fuelio CSV sync, insurance reminders',
    icon: Bike,
    status: 'available',
    category: 'tracking',
    priority: 'high',
  },
  {
    id: 'property-engine',
    title: 'Guntur / Gorantla Rentals',
    description: 'Waterfall allocation, Dwacra deduction, Grandma Care Fund',
    icon: Building,
    status: 'available',
    category: 'tracking',
    priority: 'high',
  },
  {
    id: 'brother-global',
    title: "Brother's Global Liability",
    description: 'InCred loan, US Hand Loans, USD↔INR converter',
    icon: Globe,
    status: 'available',
    category: 'financial',
    priority: 'high',
    roleRequired: 'BROTHER' as const,
  },
];

export function MoreScreen({ onNavigate, onClose }: { onNavigate?: (id: string) => void; onClose?: () => void }) {
  const role = useRole();

  const handleModuleClick = (moduleId: string, status: string) => {
    if (status === 'coming-soon') return;
    if (onNavigate) {
      onNavigate(moduleId);
    } else {
      window.dispatchEvent(new CustomEvent('navigate-to-module', { detail: moduleId }));
    }
    onClose?.();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success border border-success/30">Live</span>;
      case 'beta':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning/15 text-warning border border-warning/30">Beta</span>;
      case 'coming-soon':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">Soon</span>;
      default:
        return null;
    }
  };

  const categoryIconColors: Record<string, string> = {
    financial: 'bg-primary/10 text-primary',
    tracking:  'bg-accent/10 text-accent',
    analysis:  'bg-warning/10 text-warning',
    settings:  'bg-muted text-muted-foreground',
  };

  const categorizedModules = {
    financial: modules.filter(m => m.category === 'financial' && (role === 'ADMIN' || !m.roleRequired || m.roleRequired === role)),
    tracking:  modules.filter(m => m.category === 'tracking'  && (role === 'ADMIN' || !m.roleRequired || m.roleRequired === role)),
    analysis:  modules.filter(m => m.category === 'analysis'  && (role === 'ADMIN' || !m.roleRequired || m.roleRequired === role)),
    settings:  modules.filter(m => m.category === 'settings'  && (role === 'ADMIN' || !m.roleRequired || m.roleRequired === role)),
  };

  const Section = ({
    label,
    icon: Icon,
    items,
  }: {
    label: string;
    icon: React.ComponentType<any>;
    items: MoreModule[];
  }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1 py-2">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </h2>
        <div className="grid grid-cols-1 gap-2">
          {items.map((mod) => {
            const colorClass = categoryIconColors[mod.category] ?? 'bg-muted text-muted-foreground';
            const disabled = mod.status === 'coming-soon';
            return (
              <button
                key={mod.id}
                onClick={() => handleModuleClick(mod.id, mod.status)}
                disabled={disabled}
                aria-label={`${mod.title}: ${mod.description}`}
                className={`
                  group flex items-center gap-3 p-3.5 rounded-2xl border text-left w-full
                  transition-all duration-200 focus-ring
                  ${disabled
                    ? 'opacity-50 cursor-not-allowed border-border bg-muted/30'
                    : 'border-border/60 bg-card/60 hover:bg-card hover:border-primary/30 hover:shadow-card cursor-pointer active:scale-[0.98]'
                  }
                `}
              >
                {/* Icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                  <mod.icon className="h-5 w-5" aria-hidden="true" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight truncate">
                    {mod.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-1">
                    {mod.description}
                  </p>
                </div>

                {/* Status + chevron */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {getStatusBadge(mod.status)}
                  {!disabled && (
                    <svg className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
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
  };

  return (
    <div className="px-4 pb-6 space-y-5 animate-fade-in">
      <Section label="Financial Management" icon={TrendingUp} items={categorizedModules.financial} />
      <Section label="Asset & Expense Tracking" icon={FileText}    items={categorizedModules.tracking} />
      <Section label="Analysis & Intelligence"  icon={Brain}        items={categorizedModules.analysis} />
      <Section label="Configuration"            icon={Settings}     items={categorizedModules.settings} />
    </div>
  );
}
