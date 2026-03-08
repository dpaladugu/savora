/**
 * Budget vs Actual — compares per-category SpendingLimit caps
 * against real month spend from db.txns (negative amounts).
 * RAG status: Green < 80%, Amber 80–99%, Red ≥ 100%.
 */
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { formatCurrency } from '@/lib/format-utils';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart3, CheckCircle2, AlertTriangle, XCircle, Plus } from 'lucide-react';

function rag(pct: number): 'green' | 'amber' | 'red' {
  if (pct >= 100) return 'red';
  if (pct >= 80)  return 'amber';
  return 'green';
}

const ragBar: Record<string, string> = {
  green: 'bg-success',
  amber: 'bg-warning',
  red:   'bg-destructive',
};

const ragBadge: Record<string, string> = {
  green: 'bg-success/15 text-success border-success/30',
  amber: 'bg-warning/15 text-warning border-warning/30',
  red:   'bg-destructive/15 text-destructive border-destructive/30',
};

const ragIcon: Record<string, React.ElementType> = {
  green: CheckCircle2,
  amber: AlertTriangle,
  red:   XCircle,
};

export function BudgetVsActual({ onNavigateToLimits }: { onNavigateToLimits?: () => void }) {
  const limits = useLiveQuery(() => db.spendingLimits?.toArray() ?? Promise.resolve([])) || [];

  const now       = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const txns = useLiveQuery(() =>
    db.txns.filter(t => {
      const d = t.date instanceof Date ? t.date.toISOString().split('T')[0] : String(t.date).slice(0, 10);
      return d >= monthStart && t.amount < 0;
    }).toArray()
  ) || [];

  // Also pull from db.expenses for compatibility
  const expenses = useLiveQuery(() =>
    db.expenses?.where('date').aboveOrEqual(monthStart).toArray() ?? Promise.resolve([])
  ) || [];

  const spendByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of txns)     m[t.category] = (m[t.category] || 0) + Math.abs(t.amount);
    for (const e of expenses) m[e.category] = (m[e.category] || 0) + e.amount;
    return m;
  }, [txns, expenses]);

  const rows = useMemo(() =>
    limits.map(l => {
      const spent = spendByCategory[l.category] ?? 0;
      const pct   = l.monthlyCap > 0 ? Math.round((spent / l.monthlyCap) * 100) : 0;
      const status = rag(pct);
      return { ...l, spent, pct, status };
    }).sort((a, b) => b.pct - a.pct),
  [limits, spendByCategory]);

  const overBudget  = rows.filter(r => r.pct >= 100).length;
  const nearLimit   = rows.filter(r => r.pct >= 80 && r.pct < 100).length;
  const totalBudget = rows.reduce((s, r) => s + r.monthlyCap, 0);
  const totalSpent  = rows.reduce((s, r) => s + r.spent, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Budget vs Actual"
        subtitle={`${now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`}
        icon={BarChart3}
        action={
          onNavigateToLimits && (
            <Button size="sm" onClick={onNavigateToLimits} className="h-9 text-xs gap-1 rounded-xl">
              <Plus className="h-3.5 w-3.5" /> Edit Limits
            </Button>
          )
        }
      />

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Budget',  value: formatCurrency(totalBudget), color: 'text-foreground'  },
          { label: 'Spent',         value: formatCurrency(totalSpent),  color: totalSpent > totalBudget ? 'value-negative' : 'value-positive' },
          { label: 'Over Limit',    value: String(overBudget),          color: overBudget > 0 ? 'value-negative' : 'value-positive' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="glass">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1 leading-tight">{label}</p>
              <p className={`text-sm font-bold tabular-nums ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Near-limit alert */}
      {(overBudget > 0 || nearLimit > 0) && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/8 border border-warning/25 text-xs text-warning">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            {overBudget > 0 && <strong>{overBudget} categor{overBudget === 1 ? 'y' : 'ies'} over budget. </strong>}
            {nearLimit > 0 && `${nearLimit} approaching limit.`}
          </span>
        </div>
      )}

      {/* Category rows */}
      <div className="space-y-2">
        {rows.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No spending limits set yet.</p>
              {onNavigateToLimits && (
                <Button size="sm" variant="outline" className="mt-3 h-9 text-xs rounded-xl gap-1.5" onClick={onNavigateToLimits}>
                  <Plus className="h-3.5 w-3.5" /> Add spending limits
                </Button>
              )}
            </CardContent>
          </Card>
        ) : rows.map(row => {
          const Icon = ragIcon[row.status];
          return (
            <Card key={row.id} className="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${row.status === 'green' ? 'text-success' : row.status === 'amber' ? 'text-warning' : 'text-destructive'}`} />
                    <span className="text-sm font-semibold text-foreground truncate">{row.category}</span>
                  </div>
                  <Badge className={`text-[10px] shrink-0 ${ragBadge[row.status]}`}>
                    {row.pct}%
                  </Badge>
                </div>
                <Progress
                  value={Math.min(row.pct, 100)}
                  className={`h-2 mb-2 [&>div]:${ragBar[row.status]}`}
                />
                <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                  <span>Spent: <span className="font-medium text-foreground">{formatCurrency(row.spent)}</span></span>
                  <span>Limit: <span className="font-medium text-foreground">{formatCurrency(row.monthlyCap)}</span></span>
                  <span className={row.monthlyCap - row.spent < 0 ? 'text-destructive font-medium' : ''}>
                    {row.monthlyCap - row.spent >= 0
                      ? `${formatCurrency(row.monthlyCap - row.spent)} left`
                      : `${formatCurrency(Math.abs(row.monthlyCap - row.spent))} over`}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
