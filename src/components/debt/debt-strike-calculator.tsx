
import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Target, TrendingDown, Calendar, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { SequentialStrikeEngine } from './sequential-strike-engine';
import { subMonths, startOfMonth } from 'date-fns';

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

// ── Avalanche amortisation ─────────────────────────────────────────────────────
function calcDebtFreedom(debtItems: DebtItem[], monthlyCapacity: number): StrikeResult {
  const totalDebt = debtItems.reduce((s, d) => s + d.outstanding, 0);
  const avalancheOrder = [...debtItems].sort((a, b) => b.interestRate - a.interestRate);

  if (monthlyCapacity <= 0 || totalDebt <= 0) {
    return {
      totalDebt, monthlyCapacity, monthsToFreedom: 0,
      freedomDate: new Date(), onTrackFor2029: true,
      debtItems, surplusAfterDebt: monthlyCapacity,
      avalancheOrder, totalInterestSaved: 0,
    };
  }

  let balances = avalancheOrder.map(d => d.outstanding);
  const rates  = avalancheOrder.map(d => d.interestRate / 100 / 12);
  const minPay = avalancheOrder.map(d => d.monthlyPayment);

  let month = 0, totalInterestPaid = 0, baselineInterest = 0;
  const MAX_MONTHS = 600;

  while (balances.some(b => b > 0.01) && month < MAX_MONTHS) {
    month++;
    let remaining = monthlyCapacity;
    for (let i = 0; i < balances.length; i++) {
      if (balances[i] <= 0) continue;
      const interest = balances[i] * rates[i];
      totalInterestPaid += interest;
      balances[i] += interest;
      const pay = Math.min(balances[i], Math.max(minPay[i] || 0, 0));
      balances[i] -= pay;
      remaining -= pay;
    }
    if (remaining > 0) {
      for (let i = 0; i < balances.length; i++) {
        if (balances[i] <= 0) continue;
        const extra = Math.min(remaining, balances[i]);
        balances[i] -= extra;
        remaining -= extra;
        if (remaining <= 0) break;
      }
    }
    balances = balances.map(b => (b < 0.01 ? 0 : b));
  }

  const minOnlyMonths = Math.ceil(totalDebt / Math.max(1, debtItems.reduce((s, d) => s + d.monthlyPayment, 0)));
  avalancheOrder.forEach(d => {
    baselineInterest += d.outstanding * (d.interestRate / 100 / 12) * minOnlyMonths;
  });
  const totalInterestSaved = Math.max(0, baselineInterest - totalInterestPaid);

  const freedomDate = new Date();
  freedomDate.setMonth(freedomDate.getMonth() + month);
  const onTrackFor2029 = freedomDate <= new Date('2029-12-31');
  const surplusAfterDebt = Math.max(0, monthlyCapacity - debtItems.reduce((s, d) => s + d.monthlyPayment, 0));

  return {
    totalDebt, monthlyCapacity, monthsToFreedom: month,
    freedomDate, onTrackFor2029, debtItems, surplusAfterDebt,
    avalancheOrder, totalInterestSaved,
  };
}

export function DebtStrikeCalculator() {
  // ── Live data ────────────────────────────────────────────────────────────────
  const loans       = useLiveQuery(() => db.loans.toArray().catch(() => []),   []) ?? [];
  const cards       = useLiveQuery(() => db.creditCards.toArray().catch(() => []), []) ?? [];
  const incomes     = useLiveQuery(() => db.incomes.toArray().catch(() => []), []) ?? [];
  const txns        = useLiveQuery(() => db.txns.toArray().catch(() => []),    []) ?? [];
  const expenses    = useLiveQuery(() => db.expenses.toArray().catch(() => []), []) ?? [];

  const { result, monthlyIncome, monthlyExpenses } = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

    // ── Monthly income: current month or 6-month average ─────────────────────
    const currentMonthIncome = incomes
      .filter(i => new Date(i.date) >= monthStart)
      .reduce((s, i) => s + i.amount, 0);

    const income6m = incomes
      .filter(i => new Date(i.date) >= sixMonthsAgo)
      .reduce((s, i) => s + i.amount, 0);
    const income6mMonths = new Set(
      incomes.filter(i => new Date(i.date) >= sixMonthsAgo)
        .map(i => new Date(i.date).toISOString().slice(0, 7))
    ).size;
    const avgMonthlyIncome = income6mMonths > 0 ? income6m / income6mMonths : 0;
    const monthlyIncome = currentMonthIncome || avgMonthlyIncome;

    // ── Monthly expenses: current month from txns + expenses table ────────────
    const expTxns = txns
      .filter(t => t.amount < 0 && new Date(t.date) >= monthStart)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const expRows = expenses
      .filter(e => new Date(e.date) >= monthStart)
      .reduce((s, e) => s + e.amount, 0);
    const monthlyExpenses = expTxns + expRows;

    const surplus = Math.max(0, monthlyIncome - monthlyExpenses);

    // ── Debt items ────────────────────────────────────────────────────────────
    const debtItems: DebtItem[] = [];
    loans.forEach((l: any) => {
      const outstanding = l.outstanding ?? l.principal ?? 0;
      if (outstanding > 0 && l.isActive !== false) {
        debtItems.push({
          name: l.name ?? 'Loan',
          outstanding,
          monthlyPayment: l.emi ?? 0,
          interestRate: l.roi ?? l.interestRate ?? 0,
          type: 'loan',
        });
      }
    });
    cards.forEach((c: any) => {
      const bal = c.currentBalance ?? c.balance ?? 0;
      if (bal > 0) {
        debtItems.push({
          name: c.name ?? `${c.bankName ?? 'CC'} Card`,
          outstanding: bal,
          monthlyPayment: 0,
          interestRate: c.interestRate ?? 36,
          type: 'card',
        });
      }
    });

    return { result: calcDebtFreedom(debtItems, surplus), monthlyIncome, monthlyExpenses };
  }, [loans, cards, incomes, txns, expenses]);

  const { totalDebt, monthlyCapacity, monthsToFreedom, freedomDate, onTrackFor2029, avalancheOrder, surplusAfterDebt, totalInterestSaved } = result;

  const yearsLeft  = Math.floor(monthsToFreedom / 12);
  const moLeft     = monthsToFreedom % 12;
  const deadline2029 = new Date('2029-12-31');
  const msTo2029   = deadline2029.getTime() - Date.now();
  const months2029 = Math.max(0, Math.ceil(msTo2029 / (1000 * 60 * 60 * 24 * 30.4)));
  const progressPct = months2029 > 0
    ? Math.min(100, Math.round(((months2029 - monthsToFreedom) / months2029) * 100))
    : 100;

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

      {/* Sequential Strike Engine */}
      <TabsContent value="sequential" className="m-0">
        <SequentialStrikeEngine />
      </TabsContent>

      {/* Overview */}
      <TabsContent value="overview" className="m-0">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={onTrackFor2029 ? 'default' : 'destructive'}>
              {onTrackFor2029 ? '✓ On Track for 2029' : '⚠ Behind Target'}
            </Badge>
            {totalInterestSaved > 0 && (
              <Badge variant="outline" className="text-xs border-success/40 text-success">
                💰 Saves {formatCurrency(totalInterestSaved)} interest
              </Badge>
            )}
          </div>

          {/* Hero card */}
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
                        ? 'Add income to calculate'
                        : `${freedomDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} · ${yearsLeft > 0 ? `${yearsLeft}y ` : ''}${moLeft}m`}
                    </p>
                  </div>
                </div>
                {onTrackFor2029
                  ? <CheckCircle2 className="h-8 w-8 text-success" />
                  : <AlertTriangle className="h-8 w-8 text-warning" />
                }
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress toward Dec 2029 goal</span>
                  <span>{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2.5" />
                <p className="text-xs text-muted-foreground mt-1">{months2029} months remaining to Dec 2029 deadline</p>
              </div>
            </CardContent>
          </Card>

          {/* Income vs Expenses */}
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

          {/* Avalanche order */}
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
