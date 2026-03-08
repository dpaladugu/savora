/**
 * GoalProgressRow — horizontal scroll strip of active goals
 * shown on the Dashboard below the metric cards.
 */
import React from 'react';
import { Target, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatCurrency } from '@/lib/format-utils';

interface GoalProgressRowProps {
  onNavigate: (module: string) => void;
}

function daysRemaining(deadline: string | Date | undefined): number | null {
  if (!deadline) return null;
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function DaysChip({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days < 0)   return <span className="text-[9px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">Overdue</span>;
  if (days <= 30)  return <span className="text-[9px] font-semibold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">{days}d left</span>;
  if (days <= 90)  return <span className="text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{days}d left</span>;
  return <span className="text-[9px] font-semibold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">{Math.round(days / 30)}mo left</span>;
}

export function GoalProgressRow({ onNavigate }: GoalProgressRowProps) {
  const goals = useLiveQuery(() => db.goals.toArray().catch(() => []), []) ?? [];

  const active = goals
    .filter(g => {
      const target  = (g as any).targetAmount ?? 0;
      const current = (g as any).currentAmount ?? 0;
      return target > 0 && current < target;
    })
    .slice(0, 8); // cap at 8 cards

  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Section header */}
      <button
        onClick={() => onNavigate('goals')}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Goals</span>
          <span className="text-[10px] text-muted-foreground">({active.length} active)</span>
        </div>
        <div className="flex items-center gap-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
          <span className="text-[10px]">View all</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </button>

      {/* Horizontal scroll strip */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {active.map(g => {
          const goal     = g as any;
          const target   = goal.targetAmount ?? 0;
          const current  = goal.currentAmount ?? 0;
          const pct      = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
          const days     = daysRemaining(goal.deadline ?? goal.targetDate);
          const name     = goal.name ?? goal.title ?? 'Goal';

          return (
            <button
              key={goal.id}
              onClick={() => onNavigate('goals')}
              className="
                flex-shrink-0 w-36 p-3 rounded-2xl
                bg-card border border-border/50
                hover:border-primary/30 hover:bg-primary/3
                active:scale-[0.97] transition-all text-left
                space-y-2
              "
            >
              {/* Name + days */}
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground leading-tight line-clamp-1">{name}</p>
                <DaysChip days={days} />
              </div>

              {/* Progress bar */}
              <Progress value={pct} className="h-1.5" />

              {/* Amounts */}
              <div className="flex items-end justify-between">
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {formatCurrency(current)}
                </span>
                <span className="text-[10px] font-bold text-foreground tabular-nums">
                  {pct}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
