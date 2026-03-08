
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Target, TrendingDown, Calendar, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';

interface DebtItem {
  name: string;
  outstanding: number;
  monthlyPayment: number;
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
  snowballOrder: DebtItem[];
}

function calcDebtFreedom(debtItems: DebtItem[], monthlyCapacity: number): StrikeResult {
  const totalDebt = debtItems.reduce((s, d) => s + d.outstanding, 0);

  // Snowball: sort smallest outstanding first for psychological wins
  const snowballOrder = [...debtItems].sort((a, b) => a.outstanding - b.outstanding);

  let months = 0;
  let remaining = totalDebt;

  if (monthlyCapacity <= 0 || totalDebt <= 0) {
    return {
      totalDebt,
      monthlyCapacity,
      monthsToFreedom: 0,
      freedomDate: new Date(),
      onTrackFor2029: true,
      debtItems,
      surplusAfterDebt: monthlyCapacity,
      snowballOrder,
    };
  }

  // Simple simulation: apply full capacity each month, no interest compounding for MVP
  months = Math.ceil(totalDebt / monthlyCapacity);

  const freedomDate = new Date();
  freedomDate.setMonth(freedomDate.getMonth() + months);

  const deadline2029 = new Date('2029-12-31');
  const onTrackFor2029 = freedomDate <= deadline2029;

  const monthlyDebtPayments = debtItems.reduce((s, d) => s + d.monthlyPayment, 0);
  const surplusAfterDebt = Math.max(0, monthlyCapacity - monthlyDebtPayments);

  return {
    totalDebt,
    monthlyCapacity,
    monthsToFreedom: months,
    freedomDate,
    onTrackFor2029,
    debtItems,
    surplusAfterDebt,
    snowballOrder,
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
        const [loans, cards, incomes, txns] = await Promise.all([
          db.loans.toArray(),
          db.creditCards.toArray(),
          db.incomes.toArray(),
          db.txns.toArray(),
        ]);

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        // Monthly income
        const monthlyIncomeTxns = incomes.filter(i => new Date(i.date) >= monthStart);
        const income = monthlyIncomeTxns.reduce((s, i) => s + i.amount, 0)
          || incomes.reduce((s, i) => s + i.amount, 0) / Math.max(1, new Set(incomes.map(i => new Date(i.date).toISOString().slice(0, 7))).size);

        // Monthly expenses
        const expenseTxns = txns.filter(t => t.amount < 0 && new Date(t.date) >= monthStart);
        const expenses = expenseTxns.reduce((s, t) => s + Math.abs(t.amount), 0);

        setMonthlyIncome(income);
        setMonthlyExpenses(expenses);

        const surplus = Math.max(0, income - expenses);

        // Build debt items from loans
        const debtItems: DebtItem[] = [];

        loans.forEach((l: any) => {
          const outstanding = l.outstanding ?? l.principal ?? 0;
          if (outstanding > 0) {
            debtItems.push({
              name: l.name,
              outstanding,
              monthlyPayment: l.emi ?? 0,
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

  const { totalDebt, monthlyCapacity, monthsToFreedom, freedomDate, onTrackFor2029, snowballOrder, surplusAfterDebt } = result;

  const yearsLeft = Math.floor(monthsToFreedom / 12);
  const moLeft = monthsToFreedom % 12;
  const deadline2029 = new Date('2029-12-31');
  const msTo2029 = deadline2029.getTime() - Date.now();
  const months2029 = Math.max(0, Math.ceil(msTo2029 / (1000 * 60 * 60 * 24 * 30.4)));
  const progressPct = months2029 > 0 ? Math.min(100, Math.round(((months2029 - monthsToFreedom) / months2029) * 100)) : 100;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight">Debt Strike</h2>
        <Badge
          variant={onTrackFor2029 ? 'default' : 'destructive'}
          className="ml-auto"
        >
          {onTrackFor2029 ? '✓ On Track for 2029' : '⚠ Behind Target'}
        </Badge>
      </div>

      {/* ── Hero card ── */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Debt</p>
              <p className="text-2xl font-bold text-destructive tabular-nums">
                {formatCurrency(totalDebt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Strike Capacity</p>
              <p className="text-2xl font-bold text-success tabular-nums">
                {formatCurrency(monthlyCapacity)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Debt-Free Date</p>
                <p className="text-sm font-semibold">
                  {totalDebt === 0
                    ? '🎉 Already Free!'
                    : monthlyCapacity === 0
                    ? 'Add income first'
                    : `${freedomDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} · ${yearsLeft > 0 ? `${yearsLeft}y ` : ''}${moLeft}m`}
                </p>
              </div>
            </div>
            {onTrackFor2029 ? (
              <CheckCircle2 className="h-8 w-8 text-success" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-warning" />
            )}
          </div>

          {/* Progress toward 2029 */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress toward 2029 goal</span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2.5" />
            <p className="text-xs text-muted-foreground mt-1">
              {months2029} months remaining to Dec 2029 deadline
            </p>
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
            <span className={monthlyCapacity > 0 ? 'text-success' : 'text-destructive'}>
              {formatCurrency(monthlyCapacity)}
            </span>
          </div>
          {surplusAfterDebt > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>After min. debt payments</span>
              <span>{formatCurrency(surplusAfterDebt)} investable</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Snowball order ── */}
      {snowballOrder.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning" />
              Snowball Attack Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {snowballOrder.map((d, i) => {
              const monthsToKill = monthlyCapacity > 0 ? Math.ceil(d.outstanding / monthlyCapacity) : 0;
              return (
                <div key={d.name + i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{d.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-destructive tabular-nums">{formatCurrency(d.outstanding)}</p>
                    <p className="text-xs text-muted-foreground">
                      {monthsToKill > 0 ? `~${monthsToKill}mo` : '—'}
                    </p>
                  </div>
                </div>
              );
            })}
            {snowballOrder.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                🎉 No active debts found!
              </p>
            )}
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
  );
}
