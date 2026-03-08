/**
 * MonthlySummaryCard — compact income vs expense vs surplus bar comparison
 * with a month-over-month trend note.
 */
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

function getMonthBounds(monthsAgo = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return { start, end };
}

export function MonthlySummaryCard({ onDrilldown }: { onDrilldown?: () => void }) {
  const thisBounds = getMonthBounds(0);
  const prevBounds = getMonthBounds(1);

  // Current month txns
  const currentTxns = useLiveQuery(
    () => db.txns.where('date').between(thisBounds.start, thisBounds.end, true, false).toArray(),
    [],
  ) ?? [];

  // Previous month txns (for trend)
  const prevTxns = useLiveQuery(
    () => db.txns.where('date').between(prevBounds.start, prevBounds.end, true, false).toArray(),
    [],
  ) ?? [];

  // Current month incomes
  const currentIncomes = useLiveQuery(
    () => db.incomes
      .where('date')
      .between(
        thisBounds.start.toISOString().split('T')[0],
        thisBounds.end.toISOString().split('T')[0],
        true,
        false,
      )
      .toArray()
      .catch(() => []),
    [],
  ) ?? [];

  const prevIncomes = useLiveQuery(
    () => db.incomes
      .where('date')
      .between(
        prevBounds.start.toISOString().split('T')[0],
        prevBounds.end.toISOString().split('T')[0],
        true,
        false,
      )
      .toArray()
      .catch(() => []),
    [],
  ) ?? [];

  const { income, expenses, surplus, prevExpenses, prevIncome } = useMemo(() => {
    const income   = currentIncomes.reduce((s, i) => s + i.amount, 0);
    const expenses = currentTxns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const surplus  = Math.max(0, income - expenses);

    const prevExpenses = prevTxns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const prevIncome   = prevIncomes.reduce((s, i) => s + i.amount, 0);

    return { income, expenses, surplus, prevExpenses, prevIncome };
  }, [currentTxns, prevTxns, currentIncomes, prevIncomes]);

  // Trend calculation
  const expenseDelta = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : null;
  const savingsRate  = income > 0 ? Math.round((surplus / income) * 100) : 0;

  const maxBar = Math.max(income, expenses, 1);

  const bars = [
    { label: 'Income',   value: income,   colorClass: 'bg-success',     pct: (income   / maxBar) * 100 },
    { label: 'Expenses', value: expenses, colorClass: 'bg-destructive',  pct: (expenses / maxBar) * 100 },
    { label: 'Surplus',  value: surplus,  colorClass: 'bg-primary',      pct: (surplus  / maxBar) * 100 },
  ];

  const monthLabel = new Date().toLocaleString('en-IN', { month: 'long' });

  return (
    <Card className="glass">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">{monthLabel} Summary</p>
          {savingsRate > 0 && (
            <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
              {savingsRate}% saved
            </span>
          )}
        </div>

        {/* Bar chart */}
        <div className="space-y-2">
          {bars.map(({ label, value, colorClass, pct }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-14 shrink-0">{label}</span>
              <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold tabular-nums text-foreground w-20 text-right shrink-0">
                {formatCurrency(value)}
              </span>
            </div>
          ))}
        </div>

        {/* Trend note */}
        {expenseDelta !== null && (
          <div className="flex items-center gap-1.5 pt-0.5">
            {expenseDelta > 5 ? (
              <TrendingUp className="h-3 w-3 text-destructive shrink-0" />
            ) : expenseDelta < -5 ? (
              <TrendingDown className="h-3 w-3 text-success shrink-0" />
            ) : (
              <Minus className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            <p className="text-[10px] text-muted-foreground">
              {expenseDelta > 5
                ? `Spending up ${expenseDelta.toFixed(0)}% vs last month`
                : expenseDelta < -5
                ? `Spending down ${Math.abs(expenseDelta).toFixed(0)}% vs last month`
                : 'Spending on par with last month'}
              {prevIncome > 0 && income === 0 && ' · Add income for full picture'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
