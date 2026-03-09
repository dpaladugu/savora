// Add 12-month cashflow projection to the 6M Summary tab
// ── Projected Year-End Card (appended to 6M Summary tab) ──────────────────────


import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/format-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, ArrowDownLeft,
  ArrowUpRight, BarChart3, Activity,
} from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

// ── helpers ───────────────────────────────────────────────────────────────────
function inRange(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

function buildMonthSlots(count = 6) {
  return Array.from({ length: count }, (_, i) => {
    const d = subMonths(new Date(), count - 1 - i);
    return { start: startOfMonth(d), end: endOfMonth(d), label: format(d, 'MMM yy') };
  });
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-popover shadow-md p-3 text-xs space-y-1 min-w-[140px]">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-medium" style={{ color: p.fill || p.stroke }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function CashflowAnalysis() {
  const slots = useMemo(() => buildMonthSlots(6), []);

  const incomes   = useLiveQuery(() => db.incomes.toArray().catch(() => []),   []) ?? [];
  const txns      = useLiveQuery(() => db.txns.toArray().catch(() => []),      []) ?? [];
  const expenses  = useLiveQuery(() => db.expenses.toArray().catch(() => []),  []) ?? [];

  // ── Build per-month data ──────────────────────────────────────────────────
  const monthData = useMemo(() => {
    return slots.map(({ start, end, label }) => {
      const inc = incomes
        .filter(i => inRange(new Date(i.date), start, end))
        .reduce((s, i) => s + i.amount, 0);

      const exp = [
        ...txns.filter(t => t.amount < 0 && inRange(new Date(t.date), start, end))
          .map(t => Math.abs(t.amount)),
        ...expenses.filter(e => inRange(new Date(e.date), start, end))
          .map(e => Math.abs(e.amount)),
      ].reduce((s, a) => s + a, 0);

      const net = inc - exp;
      const savingsRate = inc > 0 ? (net / inc) * 100 : 0;
      return { label, income: inc, expenses: exp, net, savingsRate };
    });
  }, [slots, incomes, txns, expenses]);

  // ── Current month ─────────────────────────────────────────────────────────
  const current = monthData[monthData.length - 1];
  const prev    = monthData[monthData.length - 2];
  const incomeChange = prev.income > 0 ? ((current.income - prev.income) / prev.income) * 100 : 0;
  const expChange    = prev.expenses > 0 ? ((current.expenses - prev.expenses) / prev.expenses) * 100 : 0;

  // ── 6-month aggregates ───────────────────────────────────────────────────
  const total6mIncome = monthData.reduce((s, m) => s + m.income, 0);
  const total6mExp    = monthData.reduce((s, m) => s + m.expenses, 0);
  const avg6mSavings  = monthData.filter(m => m.income > 0).reduce((s, m) => s + m.savingsRate, 0)
    / Math.max(1, monthData.filter(m => m.income > 0).length);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Cashflow Analysis</h1>
          <p className="text-xs text-muted-foreground">6-month income vs expenses · live data</p>
        </div>
      </div>

      {/* Current month KPIs */}
      <div className="grid grid-cols-2 gap-2">
        {[
          {
            label: 'Income this month', value: current.income,
            change: incomeChange, icon: ArrowDownLeft,
            color: 'text-success', bg: 'bg-success/10',
          },
          {
            label: 'Spent this month', value: current.expenses,
            change: expChange, icon: ArrowUpRight,
            color: 'text-destructive', bg: 'bg-destructive/10',
          },
        ].map(({ label, value, change, icon: Icon, color, bg }) => (
          <Card key={label} className="glass">
            <CardContent className="p-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bg} mb-2`}>
                <Icon className={`h-3.5 w-3.5 ${color}`} />
              </div>
              <p className={`text-base font-black tabular-nums ${color}`}>{formatCurrency(value)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
              {prev.income > 0 && (
                <Badge
                  className={`text-[10px] mt-1 px-1.5 border ${
                    change >= 0
                      ? label.includes('Income') ? 'bg-success/15 text-success border-success/30' : 'bg-destructive/15 text-destructive border-destructive/30'
                      : label.includes('Income') ? 'bg-destructive/15 text-destructive border-destructive/30' : 'bg-success/15 text-success border-success/30'
                  }`}
                  variant="outline"
                >
                  {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% vs last month
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Net cashflow hero */}
      <Card className={`glass border ${current.net >= 0 ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Net Cashflow — {slots[slots.length - 1].label}</p>
              <p className={`text-2xl font-black tabular-nums mt-0.5 ${current.net >= 0 ? 'text-success' : 'text-destructive'}`}>
                {current.net >= 0 ? '+' : ''}{formatCurrency(current.net)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Savings Rate</p>
              <p className={`text-xl font-bold tabular-nums ${current.savingsRate >= 20 ? 'text-success' : current.savingsRate >= 10 ? 'text-warning' : 'text-destructive'}`}>
                {current.savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Savings rate target: 20%</span>
              <span>{current.savingsRate.toFixed(1)}% achieved</span>
            </div>
            <Progress
              value={Math.max(0, Math.min(100, current.savingsRate * 5))}
              className={`h-2 ${current.savingsRate >= 20 ? '[&>div]:bg-success' : current.savingsRate >= 10 ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Charts */}
      <Tabs defaultValue="bar">
        <TabsList className="w-full rounded-xl h-9">
          <TabsTrigger value="bar"    className="flex-1 text-xs">Income vs Exp</TabsTrigger>
          <TabsTrigger value="net"    className="flex-1 text-xs">Net Cashflow</TabsTrigger>
          <TabsTrigger value="summary" className="flex-1 text-xs">6M Summary</TabsTrigger>
        </TabsList>

        {/* Grouped bar: income vs expenses */}
        <TabsContent value="bar" className="mt-3">
          <Card className="glass">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-primary" /> Income vs Expenses (6 months)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income"   name="Income"   radius={[4, 4, 0, 0]} fill="hsl(var(--success))"     opacity={0.85} maxBarSize={24} />
                  <Bar dataKey="expenses" name="Expenses" radius={[4, 4, 0, 0]} fill="hsl(var(--destructive))" opacity={0.7}  maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="h-2 w-4 rounded bg-success/85" /> Income
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="h-2 w-4 rounded bg-destructive/70" /> Expenses
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Net cashflow bar */}
        <TabsContent value="net" className="mt-3">
          <Card className="glass">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-primary" /> Net Cashflow Waterfall
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : `₹${(v / 1000).toFixed(0)}k`} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="net" name="Net Cashflow" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {monthData.map((m, i) => (
                      <Cell key={i} fill={m.net >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6M summary */}
        <TabsContent value="summary" className="mt-3 space-y-2">
          {[
            { label: '6M Total Income',   value: total6mIncome, color: 'text-success',     Icon: TrendingUp   },
            { label: '6M Total Expenses', value: total6mExp,    color: 'text-destructive',  Icon: TrendingDown },
            { label: '6M Net Saved',       value: total6mIncome - total6mExp, color: total6mIncome >= total6mExp ? 'text-success' : 'text-destructive', Icon: Wallet },
          ].map(({ label, value, color, Icon }) => (
            <Card key={label} className="glass">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color} shrink-0`} />
                <span className="flex-1 text-sm text-muted-foreground">{label}</span>
                <span className={`text-base font-black tabular-nums ${color}`}>{formatCurrency(Math.abs(value))}</span>
              </CardContent>
            </Card>
          ))}
          <Card className="glass border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm text-foreground font-medium">Avg. 6M Savings Rate</span>
              <span className={`text-xl font-black tabular-nums ${avg6mSavings >= 20 ? 'text-success' : avg6mSavings >= 10 ? 'text-warning' : 'text-destructive'}`}>
                {avg6mSavings.toFixed(1)}%
              </span>
            </CardContent>
          </Card>

          {/* Month breakdown table */}
          <Card className="glass">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30">
                    {['Month', 'Income', 'Expenses', 'Net', 'Rate'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthData.map(m => (
                    <tr key={m.label} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2 font-medium">{m.label}</td>
                      <td className="px-3 py-2 text-success tabular-nums">{m.income > 0 ? formatCurrency(m.income) : '—'}</td>
                      <td className="px-3 py-2 text-destructive tabular-nums">{m.expenses > 0 ? formatCurrency(m.expenses) : '—'}</td>
                      <td className={`px-3 py-2 font-semibold tabular-nums ${m.net >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {m.income > 0 || m.expenses > 0 ? (m.net >= 0 ? '+' : '') + formatCurrency(m.net) : '—'}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {m.income > 0 ? (
                          <Badge
                            className={`text-[10px] px-1.5 border ${m.savingsRate >= 20 ? 'bg-success/15 text-success border-success/30' : m.savingsRate >= 0 ? 'bg-warning/15 text-warning border-warning/30' : 'bg-destructive/15 text-destructive border-destructive/30'}`}
                            variant="outline"
                          >
                            {m.savingsRate.toFixed(0)}%
                          </Badge>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* ── 12-Month Projection Card ────────────────────────────────── */}
          {(() => {
            const activeMonths = monthData.filter(m => m.income > 0 || m.expenses > 0);
            if (activeMonths.length === 0) return null;
            const avgIncome   = activeMonths.reduce((s, m) => s + m.income, 0)   / activeMonths.length;
            const avgExpenses = activeMonths.reduce((s, m) => s + m.expenses, 0) / activeMonths.length;
            const avgSurplus  = Math.max(0, avgIncome - avgExpenses);
            const projected12mSurplus = avgSurplus * 12;
            const now2 = new Date();
            const monthsRemaining = 12 - (now2.getMonth() + 1);
            const projectedYearEnd = monthData
              .filter(m => {
                const idx = monthData.indexOf(m);
                return idx >= 0;
              })
              .reduce((s, m) => s + m.net, 0) + avgSurplus * monthsRemaining;

            return (
              <Card className="glass border-primary/20 bg-primary/5">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    📈 12-Month Projection
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground">Avg monthly surplus</p>
                      <p className="font-bold text-success tabular-nums">{formatCurrency(avgSurplus)}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground">Projected surplus/yr</p>
                      <p className="font-bold text-primary tabular-nums">{formatCurrency(projected12mSurplus)}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground">Months remaining</p>
                      <p className="font-bold tabular-nums">{monthsRemaining}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground">Projected year-end</p>
                      <p className={`font-bold tabular-nums ${projectedYearEnd >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {projectedYearEnd >= 0 ? '+' : ''}{formatCurrency(projectedYearEnd)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
