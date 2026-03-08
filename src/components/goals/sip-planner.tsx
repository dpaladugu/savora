/**
 * SIP Planner
 * - Pick a goal (or enter custom target corpus)
 * - Adjust monthly SIP, expected CAGR, tenure
 * - See projected corpus chart vs goal line
 * - One-tap "Start SIP" → creates a recurring transaction
 */
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/format-utils';
import { RecurringTransactionService } from '@/services/RecurringTransactionService';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  TrendingUp, Target, Zap, CheckCircle2, Lightbulb,
  ChevronDown, IndianRupee, Percent, CalendarDays,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Goal } from '@/types/financial';

// ── Math helpers ──────────────────────────────────────────────────────────────

/** Future value of a monthly SIP: FV = SIP × [(1+r)^n − 1] / r × (1+r) */
function sipFV(monthly: number, annualRate: number, months: number): number {
  if (annualRate === 0) return monthly * months;
  const r = annualRate / 12 / 100;
  return monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
}

/** SIP needed to reach a target: reverse of sipFV */
function sipNeeded(target: number, annualRate: number, months: number): number {
  if (months <= 0) return target;
  if (annualRate === 0) return target / months;
  const r = annualRate / 12 / 100;
  return (target * r) / (((Math.pow(1 + r, months) - 1) / r) * (1 + r));
}

function monthsUntil(deadline?: string | Date): number {
  if (!deadline) return 60;
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const m = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
  return Math.max(1, m);
}

// ── Chart data builder ────────────────────────────────────────────────────────
function buildChartData(monthly: number, annualRate: number, totalMonths: number, target: number) {
  const points: { month: string; corpus: number; invested: number }[] = [];
  for (let m = 0; m <= totalMonths; m += Math.max(1, Math.floor(totalMonths / 24))) {
    const corpus = sipFV(monthly, annualRate, m);
    const invested = monthly * m;
    const year = Math.floor(m / 12);
    const mo   = m % 12;
    points.push({
      month: m === 0 ? 'Now' : mo === 0 ? `Y${year}` : `Y${year}M${mo}`,
      corpus: Math.round(corpus),
      invested: Math.round(invested),
    });
  }
  // Ensure last point
  const last = sipFV(monthly, annualRate, totalMonths);
  if (points[points.length - 1].corpus !== Math.round(last)) {
    points.push({ month: `Y${Math.floor(totalMonths / 12)}`, corpus: Math.round(last), invested: monthly * totalMonths });
  }
  return points;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function SIPPlanner() {
  const goals = useLiveQuery(() => db.goals.toArray().catch(() => []), []) ?? [];

  const [selectedGoalId, setSelectedGoalId] = useState<string>('custom');
  const [customTarget, setCustomTarget] = useState('1000000');
  const [sip, setSip]         = useState('5000');
  const [cagr, setCagr]       = useState(12);
  const [tenure, setTenure]   = useState(60); // months
  const [starting, setStarting] = useState(false);
  const [started, setStarted]   = useState(false);

  const activeGoals = goals.filter(g => (g.targetAmount ?? 0) > (g.currentAmount ?? 0));

  // Resolve selected goal or custom target
  const selectedGoal: Goal | null = selectedGoalId !== 'custom'
    ? (activeGoals.find(g => g.id === selectedGoalId) ?? null)
    : null;

  const targetAmount = selectedGoal
    ? (selectedGoal.targetAmount - (selectedGoal.currentAmount ?? 0))
    : (parseFloat(customTarget) || 0);

  const tenureFromGoal = selectedGoal
    ? monthsUntil((selectedGoal as any).deadline ?? (selectedGoal as any).targetDate)
    : tenure;

  const effectiveTenure = selectedGoal ? tenureFromGoal : tenure;

  const sipAmt = parseFloat(sip) || 0;

  // Derived numbers
  const projectedCorpus = useMemo(
    () => sipFV(sipAmt, cagr, effectiveTenure),
    [sipAmt, cagr, effectiveTenure],
  );
  const totalInvested     = sipAmt * effectiveTenure;
  const wealthGained      = projectedCorpus - totalInvested;
  const goalGap           = projectedCorpus - targetAmount;
  const meetsGoal         = goalGap >= 0;
  const requiredSip       = useMemo(
    () => Math.ceil(sipNeeded(targetAmount, cagr, effectiveTenure) / 100) * 100,
    [targetAmount, cagr, effectiveTenure],
  );

  const chartData = useMemo(
    () => buildChartData(sipAmt, cagr, effectiveTenure, targetAmount),
    [sipAmt, cagr, effectiveTenure, targetAmount],
  );

  // ── Start SIP handler ────────────────────────────────────────────────────────
  const handleStartSip = async () => {
    if (!sipAmt || sipAmt <= 0) { toast.error('Enter a valid SIP amount'); return; }
    setStarting(true);
    try {
      const name = selectedGoal?.name ?? 'SIP Investment';
      const today = new Date().toISOString().split('T')[0];
      await RecurringTransactionService.create({
        amount: sipAmt,
        description: `SIP – ${name}`,
        category: 'SIP',
        frequency: 'monthly',
        interval: 1,
        start_date: today,
        next_date: today,
        is_active: true,
        type: 'expense',
        account: 'Investment Account',
      });
      toast.success(`SIP of ${formatCurrency(sipAmt)}/month started for "${name}"!`);
      setStarted(true);
    } catch (e) {
      console.error(e);
      toast.error('Failed to create SIP');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">SIP Planner</h1>
          <p className="text-xs text-muted-foreground">Simulate monthly investments · reach your goals</p>
        </div>
      </div>

      {/* ── Goal selector ── */}
      <Card className="glass">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-primary" /> Goal
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select goal or custom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom corpus target</SelectItem>
              {activeGoals.map(g => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name} — {formatCurrency(g.targetAmount - (g.currentAmount ?? 0))} remaining
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedGoalId === 'custom' && (
            <div className="space-y-1">
              <Label className="text-xs">Target Corpus (₹)</Label>
              <Input
                type="number"
                value={customTarget}
                onChange={e => setCustomTarget(e.target.value)}
                className="h-9 text-sm font-semibold"
                placeholder="e.g. 1000000"
              />
            </div>
          )}

          {selectedGoal && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
              <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-[11px] text-muted-foreground">
                <span className="text-foreground font-medium">{effectiveTenure} months</span> remaining until deadline
                · remaining corpus: <span className="font-medium">{formatCurrency(targetAmount)}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Inputs ── */}
      <Card className="glass">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-semibold">Parameters</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {/* Monthly SIP */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1">
                <IndianRupee className="h-3 w-3" /> Monthly SIP
              </Label>
              <span className="text-xs font-bold text-primary tabular-nums">{formatCurrency(sipAmt)}</span>
            </div>
            <Input
              type="number"
              value={sip}
              onChange={e => setSip(e.target.value)}
              className="h-9 text-sm font-semibold"
            />
            {/* Quick chips */}
            <div className="flex gap-1.5 flex-wrap">
              {[1000, 2000, 5000, 10000, 25000].map(v => (
                <button
                  key={v}
                  onClick={() => setSip(String(v))}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                    sip === String(v)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary/60 border-border/50 text-foreground hover:border-primary/40'
                  }`}
                >
                  ₹{(v / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* CAGR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1">
                <Percent className="h-3 w-3" /> Expected CAGR
              </Label>
              <span className="text-xs font-bold text-primary">{cagr}%</span>
            </div>
            <Slider
              min={4} max={20} step={0.5}
              value={[cagr]}
              onValueChange={v => setCagr(v[0])}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>4% FD</span>
              <span>12% Equity MF</span>
              <span>20% Small-cap</span>
            </div>
          </div>

          {/* Tenure (only when no goal selected) */}
          {selectedGoalId === 'custom' && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> Tenure
                  </Label>
                  <span className="text-xs font-bold text-primary">{tenure} months ({(tenure / 12).toFixed(1)} yrs)</span>
                </div>
                <Slider
                  min={6} max={360} step={6}
                  value={[tenure]}
                  onValueChange={v => setTenure(v[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>6 mo</span>
                  <span>5 yrs</span>
                  <span>30 yrs</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Results hero ── */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 space-y-0.5 text-center">
          <p className="text-[10px] text-muted-foreground">Projected</p>
          <p className="text-sm font-black text-primary tabular-nums">{formatCurrency(Math.round(projectedCorpus))}</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/60 p-3 space-y-0.5 text-center">
          <p className="text-[10px] text-muted-foreground">Invested</p>
          <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="rounded-2xl border border-success/20 bg-success/5 p-3 space-y-0.5 text-center">
          <p className="text-[10px] text-muted-foreground">Gains</p>
          <p className="text-sm font-bold text-success tabular-nums">{formatCurrency(Math.round(wealthGained))}</p>
        </div>
      </div>

      {/* ── Goal gap badge ── */}
      {targetAmount > 0 && (
        <div className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
          meetsGoal
            ? 'bg-success/5 border-success/25'
            : 'bg-warning/5 border-warning/25'
        }`}>
          {meetsGoal
            ? <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            : <Lightbulb className="h-5 w-5 text-warning shrink-0" />}
          <div className="flex-1">
            {meetsGoal ? (
              <p className="text-sm font-semibold text-success">Goal on track! 🎉</p>
            ) : (
              <p className="text-sm font-semibold text-warning">
                Short by {formatCurrency(Math.abs(Math.round(goalGap)))}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {meetsGoal
                ? `Surplus of ${formatCurrency(Math.round(goalGap))} over target`
                : `Increase SIP to ${formatCurrency(requiredSip)}/month to meet your goal`}
            </p>
          </div>
          {!meetsGoal && (
            <button
              onClick={() => setSip(String(requiredSip))}
              className="shrink-0 text-[10px] font-bold text-warning border border-warning/40 rounded-lg px-2.5 py-1.5 hover:bg-warning/10 transition-colors"
            >
              Use ₹{(requiredSip / 1000).toFixed(0)}k
            </button>
          )}
        </div>
      )}

      {/* ── Projection chart ── */}
      <Card className="glass">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-semibold">Corpus Growth Projection</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--muted-foreground))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip
                formatter={(v: number, name: string) => [formatCurrency(v), name === 'corpus' ? 'Projected Corpus' : 'Total Invested']}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
              {targetAmount > 0 && (
                <ReferenceLine
                  y={targetAmount}
                  stroke="hsl(var(--warning))"
                  strokeDasharray="5 3"
                  label={{ value: 'Goal', fill: 'hsl(var(--warning))', fontSize: 10, position: 'insideTopRight' }}
                />
              )}
              <Area type="monotone" dataKey="invested" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} fill="url(#investedGrad)" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="corpus"   stroke="hsl(var(--primary))"           strokeWidth={2}   fill="url(#corpusGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center mt-2">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-4 h-0.5 bg-primary rounded" />
              Projected corpus
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-4 h-0.5 bg-muted-foreground/50 rounded" style={{ borderTop: '1.5px dashed' }} />
              Amount invested
            </div>
            {targetAmount > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-4 h-0.5 bg-warning rounded" />
                Goal line
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Start SIP CTA ── */}
      <div className="space-y-2">
        {started ? (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-success/5 border border-success/25">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-sm font-semibold text-success">SIP Started!</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(sipAmt)}/month added to Recurring Transactions
              </p>
            </div>
          </div>
        ) : (
          <Button
            className="w-full h-11 rounded-xl font-semibold gap-2"
            onClick={handleStartSip}
            disabled={starting || sipAmt <= 0}
          >
            <Zap className="h-4 w-4" />
            {starting ? 'Creating SIP…' : `Start SIP — ${formatCurrency(sipAmt)}/month`}
          </Button>
        )}
        <p className="text-[10px] text-muted-foreground text-center">
          Creates a monthly recurring transaction · manage it under Recurring
        </p>
      </div>
    </div>
  );
}
