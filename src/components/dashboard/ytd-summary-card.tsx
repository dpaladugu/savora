/**
 * YTDSummaryCard — Year-to-date income vs expense card with projected year-end surplus.
 * Reads from db.incomes, db.txns (negative) and db.expenses.
 * Uses 6-month average surplus to project year-end.
 */
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, ChevronRight, CalendarRange } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Progress } from '@/components/ui/progress';

interface Props { onNavigate?: (m: string) => void; }

export function YTDSummaryCard({ onNavigate }: Props) {
  const now = new Date();
  const ytdStart = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year

  const allIncomes  = useLiveQuery(() => db.incomes.toArray().catch(() => []),  []) ?? [];
  const allTxns     = useLiveQuery(() => db.txns.toArray().catch(() => []),     []) ?? [];
  const allExpenses = useLiveQuery(() => db.expenses.toArray().catch(() => []), []) ?? [];

  const { ytdIncome, ytdExpenses, ytdSurplus, projectedYearEnd, savingsRate, monthsElapsed } = useMemo(() => {
    const isYTD = (d: Date | string) => {
      const dt = d instanceof Date ? d : new Date(d as string);
      return dt >= ytdStart && dt <= now;
    };

    const ytdIncome = allIncomes
      .filter(i => isYTD(i.date))
      .reduce((s, i) => s + i.amount, 0);

    const txnSpend = allTxns
      .filter(t => t.amount < 0 && isYTD(t.date))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const dbSpend = allExpenses
      .filter(e => isYTD(e.date))
      .reduce((s, e) => s + Math.abs(e.amount), 0);
    const ytdExpenses = txnSpend + dbSpend;

    const ytdSurplus = Math.max(0, ytdIncome - ytdExpenses);
    const savingsRate = ytdIncome > 0 ? (ytdSurplus / ytdIncome) * 100 : 0;

    // Months elapsed in year (at least 1)
    const monthsElapsed = Math.max(1, now.getMonth() + 1);
    const monthsRemaining = 12 - monthsElapsed;

    // Avg monthly surplus from YTD data
    const avgMonthlySurplus = ytdSurplus / monthsElapsed;
    const projectedYearEnd = ytdSurplus + avgMonthlySurplus * monthsRemaining;

    return { ytdIncome, ytdExpenses, ytdSurplus, projectedYearEnd, savingsRate, monthsElapsed };
  }, [allIncomes, allTxns, allExpenses]);

  // Don't render if no data
  if (ytdIncome === 0 && ytdExpenses === 0) return null;

  const yearProgress = (monthsElapsed / 12) * 100;

  return (
    <button
      onClick={() => onNavigate?.('cashflow')}
      className="w-full text-left"
      aria-label="View cashflow analysis"
    >
      <Card className="glass border-border/50">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">{now.getFullYear()} Year-to-Date</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">{monthsElapsed}/12 months</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
          </div>

          {/* Year progress bar */}
          <Progress value={yearProgress} className="h-1" />

          {/* 3-column metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-2.5 w-2.5 text-success" /> Income
              </p>
              <p className="text-sm font-bold tabular-nums text-success">{formatCurrency(ytdIncome)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-2.5 w-2.5 text-destructive" /> Spent
              </p>
              <p className="text-sm font-bold tabular-nums text-destructive">{formatCurrency(ytdExpenses)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Wallet className="h-2.5 w-2.5 text-primary" /> Saved
              </p>
              <p className="text-sm font-bold tabular-nums text-primary">{formatCurrency(ytdSurplus)}</p>
            </div>
          </div>

          {/* Savings rate + projection */}
          <div className="flex items-center justify-between pt-0.5 border-t border-border/30">
            <div className="flex items-center gap-2">
              {savingsRate > 0 && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  savingsRate >= 20 ? 'bg-success/10 text-success' : savingsRate >= 10 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'
                }`}>
                  {savingsRate.toFixed(0)}% savings rate
                </span>
              )}
            </div>
            {projectedYearEnd > 0 && (
              <p className="text-[10px] text-muted-foreground">
                Projected: <span className="font-semibold text-foreground">{formatCurrency(projectedYearEnd)}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
