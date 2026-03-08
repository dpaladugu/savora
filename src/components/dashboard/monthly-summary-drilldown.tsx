/**
 * MonthlySummaryDrilldown
 * Tap-to-open sheet showing category-level breakdown for current vs last month.
 */
import React, { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

function getMonthBounds(monthsAgo = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return { start, end };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MonthlySummaryDrilldown({ open, onClose }: Props) {
  const thisBounds = getMonthBounds(0);
  const prevBounds = getMonthBounds(1);

  const currentTxns = useLiveQuery(
    () => db.txns.where('date').between(thisBounds.start, thisBounds.end, true, false).toArray(),
    [],
  ) ?? [];
  const prevTxns = useLiveQuery(
    () => db.txns.where('date').between(prevBounds.start, prevBounds.end, true, false).toArray(),
    [],
  ) ?? [];
  const currentExpenses = useLiveQuery(
    () => db.expenses.toArray().then(all => all.filter(e => {
      const d = new Date(e.date as any);
      return d >= thisBounds.start && d < thisBounds.end;
    })).catch(() => []),
    [],
  ) ?? [];
  const prevExpenses = useLiveQuery(
    () => db.expenses.toArray().then(all => all.filter(e => {
      const d = new Date(e.date as any);
      return d >= prevBounds.start && d < prevBounds.end;
    })).catch(() => []),
    [],
  ) ?? [];

  const monthLabel = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const prevMonthLabel = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toLocaleString('en-IN', { month: 'long' });

  const { rows, thisTotal, prevTotal } = useMemo(() => {
    // Combine txns (negative = expense) + legacy expenses table
    const catMap: Record<string, { thisAmt: number; prevAmt: number }> = {};

    // From txns table
    for (const t of currentTxns) {
      if (t.amount < 0) {
        const cat = t.category || 'Uncategorized';
        catMap[cat] = catMap[cat] || { thisAmt: 0, prevAmt: 0 };
        catMap[cat].thisAmt += Math.abs(t.amount);
      }
    }
    for (const t of prevTxns) {
      if (t.amount < 0) {
        const cat = t.category || 'Uncategorized';
        catMap[cat] = catMap[cat] || { thisAmt: 0, prevAmt: 0 };
        catMap[cat].prevAmt += Math.abs(t.amount);
      }
    }
    // From expenses table
    for (const e of currentExpenses) {
      const cat = e.category || 'Uncategorized';
      catMap[cat] = catMap[cat] || { thisAmt: 0, prevAmt: 0 };
      catMap[cat].thisAmt += e.amount;
    }
    for (const e of prevExpenses) {
      const cat = e.category || 'Uncategorized';
      catMap[cat] = catMap[cat] || { thisAmt: 0, prevAmt: 0 };
      catMap[cat].prevAmt += e.amount;
    }

    const rows = Object.entries(catMap)
      .map(([cat, { thisAmt, prevAmt }]) => ({
        cat,
        thisAmt,
        prevAmt,
        delta: prevAmt > 0 ? ((thisAmt - prevAmt) / prevAmt) * 100 : null,
      }))
      .sort((a, b) => b.thisAmt - a.thisAmt);

    const thisTotal = rows.reduce((s, r) => s + r.thisAmt, 0);
    const prevTotal = rows.reduce((s, r) => s + r.prevAmt, 0);

    return { rows, thisTotal, prevTotal };
  }, [currentTxns, prevTxns, currentExpenses, prevExpenses]);

  const maxAmt = Math.max(...rows.map(r => Math.max(r.thisAmt, r.prevAmt)), 1);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border/40">
          <SheetTitle className="text-sm font-semibold flex items-center justify-between">
            <span>{monthLabel} — Category Breakdown</span>
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 py-3 space-y-4">
          {/* Totals row */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'This month', value: thisTotal, month: monthLabel.split(' ')[0] },
              { label: 'Last month', value: prevTotal, month: prevMonthLabel },
            ].map(({ label, value, month }) => (
              <Card key={label} className="glass">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-base font-bold tabular-nums text-foreground">{formatCurrency(value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Overall delta */}
          {prevTotal > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/40">
              {thisTotal > prevTotal
                ? <TrendingUp className="h-4 w-4 text-destructive shrink-0" />
                : thisTotal < prevTotal
                ? <TrendingDown className="h-4 w-4 text-success shrink-0" />
                : <Minus className="h-4 w-4 text-muted-foreground shrink-0" />}
              <p className="text-xs text-muted-foreground">
                {thisTotal > prevTotal
                  ? `Total spending up ${(((thisTotal - prevTotal) / prevTotal) * 100).toFixed(1)}% vs ${prevMonthLabel}`
                  : thisTotal < prevTotal
                  ? `Total spending down ${(((prevTotal - thisTotal) / prevTotal) * 100).toFixed(1)}% vs ${prevMonthLabel}`
                  : `Spending on par with ${prevMonthLabel}`}
              </p>
            </div>
          )}

          {/* Category rows */}
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No expense data for this month.</p>
          ) : (
            <div className="space-y-3">
              {rows.map(({ cat, thisAmt, prevAmt, delta }) => (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{cat}</span>
                      {delta !== null && (
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 h-4 ${
                            delta > 10 ? 'border-destructive/50 text-destructive bg-destructive/5'
                            : delta < -10 ? 'border-success/50 text-success bg-success/5'
                            : 'border-border/50 text-muted-foreground'
                          }`}
                        >
                          {delta > 0 ? '+' : ''}{delta.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {formatCurrency(thisAmt)}
                    </span>
                  </div>
                  {/* Dual bar: this month (solid) vs last month (faint) */}
                  <div className="relative h-2 rounded-full bg-muted/40 overflow-hidden">
                    {/* Last month — background */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/20"
                      style={{ width: `${(prevAmt / maxAmt) * 100}%` }}
                    />
                    {/* This month — foreground */}
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                        delta !== null && delta > 10 ? 'bg-destructive' : 'bg-primary'
                      }`}
                      style={{ width: `${(thisAmt / maxAmt) * 100}%` }}
                    />
                  </div>
                  {prevAmt > 0 && (
                    <p className="text-[10px] text-muted-foreground text-right">
                      {prevMonthLabel}: {formatCurrency(prevAmt)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
