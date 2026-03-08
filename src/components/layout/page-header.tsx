
/**
 * PageHeader — shared component for consistent per-screen titles.
 * Usage:  <PageHeader title="Expenses" subtitle="Track your spending" icon={Receipt} />
 * Handles: font scaling, safe spacing from GlobalHeader (56px fixed), min-w-0 for truncation.
 */
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground tracking-tight leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
