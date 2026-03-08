/**
 * UpcomingRecurringStrip — shows next 3 due recurring transactions
 * on the Dashboard with a days-until badge.
 */
import React from 'react';
import { CalendarClock, ChevronRight } from 'lucide-react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatCurrency } from '@/lib/format-utils';

interface Props {
  onNavigate: (m: string) => void;
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86_400_000);
}

export function UpcomingRecurringStrip({ onNavigate }: Props) {
  const upcoming = useLiveQuery(async () => {
    try {
      const all = await db.recurringTransactions
        .filter(r => !!r.is_active)
        .toArray();
      return all
        .sort((a, b) => a.next_date.localeCompare(b.next_date))
        .slice(0, 4);
    } catch { return []; }
  }, []) ?? [];

  if (upcoming.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => onNavigate('recurring-transactions')}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Upcoming</span>
        </div>
        <div className="flex items-center gap-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
          <span className="text-[10px]">Manage</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </button>

      <div className="space-y-1.5">
        {upcoming.map(item => {
          const d = daysUntil(item.next_date);
          const isIncome = item.type === 'income';
          let dueLabel = '';
          let dueColor = 'text-muted-foreground';
          if (d < 0)   { dueLabel = 'Overdue'; dueColor = 'text-destructive font-bold'; }
          else if (d === 0) { dueLabel = 'Today'; dueColor = 'text-warning font-bold'; }
          else if (d <= 3)  { dueLabel = `${d}d`; dueColor = 'text-warning'; }
          else              { dueLabel = `${d}d`; }

          return (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border/40"
            >
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                isIncome ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive'
              }`}>
                {isIncome ? '↑' : '↓'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{item.description}</p>
                <p className="text-[10px] text-muted-foreground">{item.category}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-xs font-bold tabular-nums ${isIncome ? 'text-success' : 'text-destructive'}`}>
                  {isIncome ? '+' : '−'}{formatCurrency(item.amount)}
                </p>
                <p className={`text-[10px] ${dueColor}`}>{dueLabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
