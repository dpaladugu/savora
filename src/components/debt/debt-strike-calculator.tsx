
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Target, TrendingDown, Calendar, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { SequentialStrikeEngine } from './sequential-strike-engine';

interface DebtItem {
  name: string;
  outstanding: number;
  monthlyPayment: number;
  interestRate: number;
  type: 'loan' | 'card';
}

interface StrikeResult {
  totalDebt: number;
  monthlyCapacity: number;
  monthsToFreedom: number;
  freedomDate: Date;
  onTrackFor2029: boolean;
  debtItems: DebtItem[];
  surplusAfterDebt: number;
  avalancheOrder: DebtItem[];
  totalInterestSaved: number;
}

// ── Interest-aware avalanche amortisation ─────────────────────────────────────
function calcDebtFreedom(debtItems: DebtItem[], monthlyCapacity: number): StrikeResult {
  const totalDebt = debtItems.reduce((s, d) => s + d.outstanding, 0);
  // Avalanche: highest-rate first (minimises total interest paid)
  const avalancheOrder = [...debtItems].sort((a, b) => b.interestRate - a.interestRate);

  if (monthlyCapacity <= 0 || totalDebt <= 0) {
    return {
      totalDebt, monthlyCapacity, monthsToFreedom: 0,
      freedomDate: new Date(), onTrackFor2029: true,
      debtItems, surplusAfterDebt: monthlyCapacity,
      avalancheOrder, totalInterestSaved: 0,
    };
  }

  // ── Month-by-month compound simulation ────────────────────────────────────
  // Each debt accrues interest at its own rate.
  // Minimum payments are applied first; remaining capacity snowballs into the top-priority debt.
  let balances   = avalancheOrder.map(d => d.outstanding);
  const rates    = avalancheOrder.map(d => d.interestRate / 100 / 12);
  const minPay   = avalancheOrder.map(d => d.monthlyPayment);

  let month = 0;
  let totalInterestPaid = 0;
  // Simple baseline: what would total interest be paying only minimums forever?
  let baselineInterest = 0;
  const MAX_MONTHS = 600;

  while (balances.some(b => b > 0.01) && month < MAX_MONTHS) {
    month++;
    let remaining = monthlyCapacity;

    // Accrue interest & apply minimums
    for (let i = 0; i < balances.length; i++) {
      if (balances[i] <= 0) continue;
      const interest = balances[i] * rates[i];
      totalInterestPaid += interest;
      balances[i] += interest;

      // Apply minimum payment (or full balance if smaller)
      const pay = Math.min(balances[i], Math.max(minPay[i] || 0, 0));
      balances[i] -= pay;
      remaining -= pay;
    }

    // Extra capacity → avalanche target (first non-zero balance)
    if (remaining > 0) {
      for (let i = 0; i < balances.length; i++) {
        if (balances[i] <= 0) continue;
        const extra = Math.min(remaining, balances[i]);
        balances[i] -= extra;
        remaining -= extra;
        if (remaining <= 0) break;
      }
    }

    // Floor tiny rounding errors
    balances = balances.map(b => (b < 0.01 ? 0 : b));
  }

  // Rough "minimum-only" interest estimate for interest saved calc
  const minOnlyMonths = Math.ceil(totalDebt / Math.max(1, debtItems.reduce((s, d) => s + d.monthlyPayment, 0)));
  avalancheOrder.forEach(d => {
    baselineInterest += d.outstanding * (d.interestRate / 100 / 12) * minOnlyMonths;
  });
  const totalInterestSaved = Math.max(0, baselineInterest - totalInterestPaid);

  const freedomDate = new Date();
  freedomDate.setMonth(freedomDate.getMonth() + month);
  const deadline2029   = new Date('2029-12-31');
  const onTrackFor2029 = freedomDate <= deadline2029;
  const monthlyDebtPayments = debtItems.reduce((s, d) => s + d.monthlyPayment, 0);
  const surplusAfterDebt    = Math.max(0, monthlyCapacity - monthlyDebtPayments);

  return {
    totalDebt, monthlyCapacity, monthsToFreedom: month,
    freedomDate, onTrackFor2029, debtItems, surplusAfterDebt,
    avalancheOrder, totalInterestSaved,
  };
}

export function DebtStrikeCalculator() {
  const [result, setResult] = useState<StrikeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [loans, cards, incomes, txns, expenses] = await Promise.all([
          db.loans.toArray(),
          db.creditCards.toArray(),
          db.incomes.toArray(),
          db.txns.toArray(),
          db.expenses.toArray().catch(() => []),
        ]);

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        // Monthly income
        const monthlyIncomeTxns = incomes.filter(i => {
          const d = i.date instanceof Date ? i.date : new Date(i.date);
          return d >= monthStart;
        });
        const income = monthlyIncomeTxns.reduce((s, i) => s + i.amount, 0)
          || incomes.reduce((s, i) => s + i.amount, 0) / Math.max(1, new Set(incomes.map(i => {
            const d = i.date instanceof Date ? i.date : new Date(i.date);
            return d.toISOString().slice(0, 7);
          })).size);

        // Monthly expenses: union of negative txns + db.expenses
        const expenseTxns = txns.filter(t => t.amount < 0 && new Date(t.date) >= monthStart);
        const expenseDbRows = expenses.filter(e => {
          const d = e.date instanceof Date ? e.date : new Date(e.date);
          return d >= monthStart;
        });
        const expenseTotal = expenseTxns.reduce((s, t) => s + Math.abs(t.amount), 0)
                           + expenseDbRows.reduce((s, e) => s + e.amount, 0);

        setMonthlyIncome(income);
        setMonthlyExpenses(expenseTotal);

        const surplus = Math.max(0, income - expenseTotal);

        // Build debt items from loans
        const debtItems: DebtItem[] = [];
        loans.forEach((l: any) => {
          const outstanding = l.outstanding ?? l.principal ?? 0;
          if (outstanding > 0) {
            debtItems.push({
              name: l.name ?? 'Loan',
              outstanding,
              monthlyPayment: l.emi ?? 0,
              interestRate: l.roi ?? l.interestRate ?? 0,
              type: 'loan',
            });
          }
        });

        // Credit card balances
        cards.forEach((c: any) => {
          const bal = c.currentBalance ?? c.balance ?? 0;
          if (bal > 0) {
            debtItems.push({
              name: c.name ?? `${c.bankName} Card`,
              outstanding: bal,
              monthlyPayment: 0,
              interestRate: c.interestRate ?? 36, // ~3%/month default
              type: 'card',
            });
          }
        });

        setResult(calcDebtFreedom(debtItems, surplus));
      } catch (e) {
        console.warn('DebtStrike load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-8 bg-muted rounded-xl w-2/3" />
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-24 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (!result) return null;

  const { totalDebt, monthlyCapacity, monthsToFreedom, freedomDate, onTrackFor2029, avalancheOrder, surplusAfterDebt, totalInterestSaved } = result;

  const yearsLeft  = Math.floor(monthsToFreedom / 12);
  const moLeft     = monthsToFreedom % 12;
  const deadline2029 = new Date('2029-12-31');
  const msTo2029   = deadline2029.getTime() - Date.now();
  const months2029 = Math.max(0, Math.ceil(msTo2029 / (1000 * 60 * 60 * 24 * 30.4)));
  const progressPct = months2029 > 0 ? Math.min(100, Math.round(((months2029 - monthsToFreedom) / months2029) * 100)) : 100;

  return (
    <Tabs defaultValue="sequential" className="w-full">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Debt Strike</h2>
        </div>
        <TabsList className="w-full grid grid-cols-2 h-8 text-xs">
          <TabsTrigger value="sequential" className="text-xs">⚡ Sequential Strike</TabsTrigger>
          <TabsTrigger value="overview" className="text-xs">📊 Overview</TabsTrigger>
        </TabsList>
      </div>

      {/* ── Sequential Strike Engine (Primary) ── */}
      <TabsContent value="sequential" className="m-0">
        <SequentialStrikeEngine />
      </TabsContent>

      {/* ── Classic Overview ── */}
      <TabsContent value="overview" className="m-0">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={onTrackFor2029 ? 'default' : 'destructive'}>
              {onTrackFor2029 ? '✓ On Track for 2029' : '⚠ Behind Target'}
            </Badge>
            {totalInterestSaved > 0 && (
              <Badge variant="outline" className="text-xs border-success/40 text-success">
                💰 Saves {formatCurrency(totalInterestSaved)} interest
              </Badge>
            )}
          </div>

          {/* ── Hero card ── */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Debt</p>
                  <p className="text-2xl font-bold text-destructive tabular-nums">{formatCurrency(totalDebt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Strike Capacity</p>
                  <p className="text-2xl font-bold text-success tabular-nums">{formatCurrency(monthlyCapacity)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Debt-Free Date (Avalanche)</p>
                    <p className="text-sm font-semibold">
                      {totalDebt === 0
                        ? '🎉 Already Free!'
                        : monthlyCapacity === 0
                        ? 'Add income first'
                        : `${freedomDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} · ${yearsLeft > 0 ? `${yearsLeft}y ` : ''}${moLeft}m`}
                    </p>
                  </div>
                </div>
                {onTrackFor2029
                  ? <CheckCircle2 className="h-8 w-8 text-success" />
                  : <AlertTriangle className="h-8 w-8 text-warning" />
                }
              </div>
              {/* Progress toward 2029 */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress toward 2029 goal</span>
                  <span>{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2.5" />
                <p className="text-xs text-muted-foreground mt-1">{months2029} months remaining to Dec 2029 deadline</p>
              </div>
            </CardContent>
          </Card>

          {/* ── Income vs Expenses ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">This Month's Capacity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Income</span>
                <span className="font-medium text-success tabular-nums">{formatCurrency(monthlyIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Expenses</span>
                <span className="font-medium text-destructive tabular-nums">−{formatCurrency(monthlyExpenses)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Strike Capacity (Surplus)</span>
                <span className={monthlyCapacity > 0 ? 'text-success' : 'text-destructive'}>{formatCurrency(monthlyCapacity)}</span>
              </div>
              {surplusAfterDebt > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>After min. debt payments</span>
                  <span>{formatCurrency(surplusAfterDebt)} investable</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Avalanche order ── */}
          {avalancheOrder.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" />
                  Avalanche Attack Order (Highest Rate First)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {avalancheOrder.map((d, i) => {
                  // Per-debt months: interest-aware single-debt amortisation
                  const r = d.interestRate / 100 / 12;
                  let months = 0;
                  if (monthlyCapacity > 0 && d.outstanding > 0) {
                    if (r === 0) {
                      months = Math.ceil(d.outstanding / monthlyCapacity);
                    } else {
                      let bal = d.outstanding;
                      while (bal > 0 && months < 600) {
                        months++;
                        bal += bal * r;
                        bal -= Math.min(bal, monthlyCapacity);
                      }
                    }
                  }
                  return (
                    <div key={d.name + i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{d.type} · {d.interestRate}% p.a.</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-destructive tabular-nums">{formatCurrency(d.outstanding)}</p>
                        <p className="text-xs text-muted-foreground">{months > 0 ? `~${months}mo` : '—'}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {totalDebt === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
              <CheckCircle2 className="h-12 w-12 text-success" />
              <p className="font-semibold text-lg">Debt-Free! 🎉</p>
              <p className="text-sm text-muted-foreground">Antifragile by 2029 — mission accomplished early.</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
