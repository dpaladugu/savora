/**
 * EnhancedAutoGoalDashboard — live data from IndexedDB
 * Computes surplus from incomes minus expenses, then recommends
 * monthly SIP amounts for each goal that is behind schedule.
 */
import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/layout/page-header';
import {
  Target, TrendingUp, AlertTriangle, Zap, Plus,
  CheckCircle2, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import { differenceInMonths, addMonths } from 'date-fns';

// ── SIP needed to reach a target ─────────────────────────────────────────────
function sipNeeded(target: number, current: number, months: number, annualRate = 12): number {
  if (months <= 0 || target <= current) return 0;
  const remaining = target - current;
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.ceil(remaining / months);
  return Math.ceil(remaining / (((Math.pow(1 + r, months) - 1) / r) * (1 + r)));
}

export function EnhancedAutoGoalDashboard() {
  const goals       = useLiveQuery(() => db.goals.toArray().catch(() => []),               []) ?? [];
  const incomes     = useLiveQuery(() => db.incomes.toArray().catch(() => []),             []) ?? [];
  const expenses    = useLiveQuery(() => db.expenses.toArray().catch(() => []),            []) ?? [];
  const txns        = useLiveQuery(() => db.txns.toArray().catch(() => []),                []) ?? [];
  const recurTxns   = useLiveQuery(() => db.recurringTransactions.toArray().catch(() => []), []) ?? [];
  const settings    = useLiveQuery(() => db.globalSettings.limit(1).first().catch(() => undefined), []);

  // ── Monthly surplus (last full month avg) ────────────────────────────────
  const { totalSurplus, monthlyIncome, monthlyExpenses } = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = addMonths(now, -6);

    const inc = incomes
      .filter(i => new Date(i.date) >= sixMonthsAgo)
      .reduce((s, i) => s + i.amount, 0) / 6;

    const exp = [
      ...expenses.filter(e => new Date(e.date) >= sixMonthsAgo).map(e => e.amount),
      ...txns.filter(t => t.amount < 0 && new Date(t.date) >= sixMonthsAgo).map(t => Math.abs(t.amount)),
    ].reduce((s, a) => s + a, 0) / 6;

    return { totalSurplus: Math.max(0, inc - exp), monthlyIncome: inc, monthlyExpenses: exp };
  }, [incomes, expenses, txns]);

  // ── Committed SIPs from recurring transactions ───────────────────────────
  const committedSipByGoal = useMemo(() => {
    const map: Record<string, number> = {};
    for (const rt of recurTxns) {
      if (!rt.isActive) continue;
      const norm = rt.frequency === 'yearly' ? (rt.amount / 12) : rt.amount;
      // try to match recurring txn description to a goal name
      const matchedGoal = goals.find(g =>
        (g.name ?? g.title ?? '').toLowerCase().split(' ').some(w =>
          w.length > 3 && (rt.description ?? '').toLowerCase().includes(w)
        )
      );
      if (matchedGoal?.id) {
        map[matchedGoal.id] = (map[matchedGoal.id] ?? 0) + norm;
      }
    }
    return map;
  }, [recurTxns, goals]);

  // ── Goal enrichment ──────────────────────────────────────────────────────
  const enrichedGoals = useMemo(() => {
    return goals.map(g => {
      const current   = g.currentAmount ?? 0;
      const target    = g.targetAmount ?? 0;
      const pct       = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      const deadline  = g.deadline ?? g.targetDate;
      const months    = deadline ? Math.max(1, differenceInMonths(new Date(deadline), new Date())) : 120;
      const needed    = sipNeeded(target, current, months);
      const committed = committedSipByGoal[g.id] ?? 0;
      const gap       = Math.max(0, needed - committed);
      const status: 'on-track' | 'partial' | 'no-sip' =
        committed >= needed ? 'on-track' : committed > 0 ? 'partial' : 'no-sip';
      return { ...g, pct, months, needed, committed, gap, status };
    }).sort((a, b) => {
      const order = { 'no-sip': 0, 'partial': 1, 'on-track': 2 };
      return order[a.status] - order[b.status];
    });
  }, [goals, committedSipByGoal]);

  // ── Auto-fund: increase goal currentAmount from surplus ─────────────────
  const handleAutoFund = async (goalId: string, amount: number) => {
    try {
      const goal = await db.goals.get(goalId);
      if (!goal) return;
      await db.goals.update(goalId, {
        currentAmount: (goal.currentAmount ?? 0) + amount,
        updatedAt: new Date(),
      });
      toast.success(`₹${formatCurrency(amount)} allocated to "${goal.name ?? goal.title}"`);
    } catch {
      toast.error('Failed to allocate funds');
    }
  };

  const annualIncome = settings?.annualIncome ?? monthlyIncome * 12;
  const noGoals = goals.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Smart Goal Engine"
        subtitle="Live surplus · SIP gap analysis · auto-funding"
        icon={Target}
      />

      {/* Surplus summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Monthly Income',   value: monthlyIncome,   color: 'text-success'     },
          { label: 'Monthly Spend',    value: monthlyExpenses,  color: 'text-destructive' },
          { label: 'Monthly Surplus',  value: totalSurplus,     color: totalSurplus > 0 ? 'text-primary' : 'text-destructive' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="glass">
            <CardContent className="p-3 text-center space-y-0.5">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className={`text-sm font-bold tabular-nums ${color}`}>{formatCurrency(Math.round(value))}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalSurplus > 0 && enrichedGoals.some(g => g.gap > 0) && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15">
          <Zap className="h-4 w-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            You have <span className="font-semibold text-foreground">{formatCurrency(Math.round(totalSurplus))}/mo</span> surplus — allocate it to goals below that are behind schedule.
          </p>
        </div>
      )}

      {/* Goal cards */}
      {noGoals ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <Target className="h-10 w-10 mx-auto text-muted-foreground/25" />
            <p className="text-sm text-muted-foreground">No goals yet. Create goals from the Goals tab to see SIP gap analysis here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {enrichedGoals.map(g => {
            const name = g.name ?? (g as any).title ?? 'Goal';
            const statusConfig = {
              'on-track': { label: 'On Track',   cls: 'border-success/40 text-success',     bg: 'bg-success/5 border-success/20'     },
              'partial':  { label: 'Partial SIP', cls: 'border-warning/40 text-warning',    bg: 'bg-warning/5 border-warning/20'     },
              'no-sip':   { label: 'No SIP',      cls: 'border-destructive/40 text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
            }[g.status];

            return (
              <Card key={g.id} className={`border ${statusConfig.bg}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${statusConfig.cls}`}>
                          {g.status === 'on-track' ? <CheckCircle2 className="h-2.5 w-2.5 mr-1 inline" /> : <AlertTriangle className="h-2.5 w-2.5 mr-1 inline" />}
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{g.months}m left</span>
                        <span>₹{formatCurrency(g.current ?? 0)} / ₹{formatCurrency(g.targetAmount ?? 0)}</span>
                      </div>
                    </div>
                    {g.gap > 0 && totalSurplus >= g.gap && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs shrink-0 gap-1 rounded-xl"
                        onClick={() => handleAutoFund(g.id, Math.min(g.gap, totalSurplus))}
                      >
                        <Plus className="h-3 w-3" />Fund
                      </Button>
                    )}
                  </div>

                  <Progress value={g.pct} className="h-1.5" />

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/40">
                      <p className="text-[9px] text-muted-foreground">Needed SIP</p>
                      <p className="text-xs font-bold tabular-nums">{formatCurrency(g.needed)}/mo</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/40">
                      <p className="text-[9px] text-muted-foreground">Committed</p>
                      <p className={`text-xs font-bold tabular-nums ${g.committed > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                        {g.committed > 0 ? formatCurrency(g.committed) + '/mo' : '—'}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/40">
                      <p className="text-[9px] text-muted-foreground">Gap</p>
                      <p className={`text-xs font-bold tabular-nums ${g.gap > 0 ? 'text-destructive' : 'text-success'}`}>
                        {g.gap > 0 ? '−' + formatCurrency(g.gap) + '/mo' : '✓'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
