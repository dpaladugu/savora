/**
 * SIP Planner — §27
 * • Goal-linked or custom corpus target
 * • Step-Up SIP: annual increment %
 * • Inflation-adjusted target toggle
 * • Projection chart (corpus vs invested vs goal line)
 * • Per-goal comparison table for all active goals
 * • One-tap "Start SIP" → creates recurring transaction
 */
import React, { useState, useMemo, useCallback } from 'react';
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
  IndianRupee, Percent, CalendarDays, ArrowUpRight,
  Table2, BarChart2, Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { Goal } from '@/types/financial';

// ── Math helpers ──────────────────────────────────────────────────────────────

/** FV of standard SIP */
function sipFV(monthly: number, annualRate: number, months: number): number {
  if (months <= 0) return 0;
  if (annualRate === 0) return monthly * months;
  const r = annualRate / 12 / 100;
  return monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
}

/** SIP required to hit a target */
function sipNeeded(target: number, annualRate: number, months: number): number {
  if (months <= 0 || target <= 0) return target;
  if (annualRate === 0) return target / months;
  const r = annualRate / 12 / 100;
  return (target * r) / (((Math.pow(1 + r, months) - 1) / r) * (1 + r));
}

/** FV of step-up SIP (annual increment applied every 12 months) */
function stepUpSipFV(
  initialMonthly: number,
  annualRate: number,
  months: number,
  stepUpPct: number,
): number {
  if (stepUpPct === 0) return sipFV(initialMonthly, annualRate, months);
  const r = annualRate / 12 / 100;
  let corpus = 0;
  let monthly = initialMonthly;
  for (let m = 0; m < months; m++) {
    if (m > 0 && m % 12 === 0) monthly *= 1 + stepUpPct / 100;
    corpus = corpus * (1 + r) + monthly * (r > 0 ? 1 + r : 1);
  }
  return Math.round(corpus);
}

/** Inflation-adjusted future cost */
function inflatedTarget(amount: number, inflationPct: number, months: number): number {
  return amount * Math.pow(1 + inflationPct / 100, months / 12);
}

function monthsUntil(deadline?: string | Date): number {
  if (!deadline) return 60;
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const m = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
  return Math.max(1, m);
}

// ── Chart data ────────────────────────────────────────────────────────────────
function buildChartData(
  monthly: number,
  annualRate: number,
  totalMonths: number,
  stepUpPct: number,
) {
  const step = Math.max(1, Math.floor(totalMonths / 24));
  const points: { label: string; corpus: number; invested: number }[] = [];
  let cur = monthly;
  let corpus = 0;
  const r = annualRate / 12 / 100;
  let invested = 0;

  for (let m = 0; m <= totalMonths; m++) {
    if (m > 0 && m % 12 === 0) cur *= 1 + stepUpPct / 100;
    if (m > 0) {
      corpus = corpus * (1 + r) + cur * (r > 0 ? 1 + r : 1);
      invested += cur;
    }
    if (m % step === 0 || m === totalMonths) {
      const y = Math.floor(m / 12);
      const mo = m % 12;
      points.push({
        label: m === 0 ? 'Now' : mo === 0 ? `Y${y}` : `Y${y}M${mo}`,
        corpus: Math.round(corpus),
        invested: Math.round(invested),
      });
    }
  }
  return points;
}

// ── Goal Comparison Table ─────────────────────────────────────────────────────
function GoalComparisonTable({
  goals,
  cagr,
  onSelect,
}: {
  goals: Goal[];
  cagr: number;
  onSelect: (id: string) => void;
}) {
  if (!goals.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No active goals found. Add goals first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {goals.map((g) => {
        const remaining = Math.max(0, (g.targetAmount ?? 0) - (g.currentAmount ?? 0));
        const months = monthsUntil((g as any).deadline ?? (g as any).targetDate);
        const reqSip = Math.ceil(sipNeeded(remaining, cagr, months) / 100) * 100;
        const yrs = (months / 12).toFixed(1);
        const feasible = reqSip <= 100_000;

        return (
          <button
            key={g.id}
            onClick={() => onSelect(g.id)}
            className="w-full text-left p-3.5 rounded-2xl border border-border/50 bg-card/60 hover:border-primary/30 hover:bg-card transition-all duration-150 group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{g.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatCurrency(remaining)} remaining · {yrs} yrs
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-sm font-black tabular-nums ${feasible ? 'text-primary' : 'text-warning'}`}>
                  {formatCurrency(reqSip)}/mo
                </p>
                <p className="text-[10px] text-muted-foreground">@ {cagr}% CAGR</p>
              </div>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, ((g.currentAmount ?? 0) / (g.targetAmount ?? 1)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground tabular-nums">
              <span>{((((g.currentAmount ?? 0) / (g.targetAmount ?? 1)) * 100).toFixed(1))}% done</span>
              <span className="text-primary group-hover:underline">Plan SIP →</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Gauge Ring ────────────────────────────────────────────────────────────────
function ProgressRing({
  pct,
  size = 80,
  strokeWidth = 7,
  color = 'hsl(var(--primary))',
  label,
  sublabel,
}: {
  pct: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
  sublabel?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct / 100, 1);
  const cx = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={cx} cy={cx} r={r} stroke="hsl(var(--border))" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={cx} cy={cx} r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <p className="text-xs font-bold text-foreground -mt-1">{label}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function SIPPlanner() {
  const goals = useLiveQuery(() => db.goals.toArray().catch(() => []), []) ?? [];
  const activeGoals = useMemo(
    () => goals.filter((g) => (g.targetAmount ?? 0) > (g.currentAmount ?? 0)),
    [goals],
  );

  const [tab, setTab]               = useState<'planner' | 'compare'>('planner');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('custom');
  const [customTarget, setCustomTarget]     = useState('1000000');
  const [sip, setSip]               = useState('5000');
  const [cagr, setCagr]             = useState(12);
  const [tenure, setTenure]         = useState(60);
  const [stepUp, setStepUp]         = useState(0);
  const [inflAdj, setInflAdj]       = useState(false);
  const [inflRate, setInflRate]     = useState(6);
  const [starting, setStarting]     = useState(false);
  const [started, setStarted]       = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedGoal: Goal | null = selectedGoalId !== 'custom'
    ? (activeGoals.find((g) => g.id === selectedGoalId) ?? null)
    : null;

  const rawTarget = selectedGoal
    ? (selectedGoal.targetAmount - (selectedGoal.currentAmount ?? 0))
    : (parseFloat(customTarget) || 0);

  const effectiveTenure = selectedGoal
    ? monthsUntil((selectedGoal as any).deadline ?? (selectedGoal as any).targetDate)
    : tenure;

  const targetAmount = inflAdj
    ? Math.round(inflatedTarget(rawTarget, inflRate, effectiveTenure))
    : rawTarget;

  const sipAmt = parseFloat(sip) || 0;

  const projectedCorpus = useMemo(
    () => stepUp > 0
      ? stepUpSipFV(sipAmt, cagr, effectiveTenure, stepUp)
      : sipFV(sipAmt, cagr, effectiveTenure),
    [sipAmt, cagr, effectiveTenure, stepUp],
  );
  const totalInvested = useMemo(() => {
    let amt = sipAmt, total = 0;
    for (let m = 0; m < effectiveTenure; m++) {
      if (m > 0 && m % 12 === 0) amt *= 1 + stepUp / 100;
      total += amt;
    }
    return Math.round(total);
  }, [sipAmt, effectiveTenure, stepUp]);
  const wealthGained = Math.max(0, projectedCorpus - totalInvested);
  const goalGap      = projectedCorpus - targetAmount;
  const meetsGoal    = goalGap >= 0;
  const requiredSip  = useMemo(
    () => Math.ceil(sipNeeded(targetAmount, cagr, effectiveTenure) / 100) * 100,
    [targetAmount, cagr, effectiveTenure],
  );
  const progressPct = targetAmount > 0
    ? Math.min(100, (projectedCorpus / targetAmount) * 100)
    : 0;

  const chartData = useMemo(
    () => buildChartData(sipAmt, cagr, effectiveTenure, stepUp),
    [sipAmt, cagr, effectiveTenure, stepUp],
  );

  const handleGoalSelect = useCallback((id: string) => {
    setSelectedGoalId(id);
    setTab('planner');
    if (id !== 'custom') {
      const g = activeGoals.find((x) => x.id === id);
      if (g) {
        const rem = Math.max(0, g.targetAmount - (g.currentAmount ?? 0));
        const months = monthsUntil((g as any).deadline ?? (g as any).targetDate);
        const req = Math.ceil(sipNeeded(rem, cagr, months) / 100) * 100;
        setSip(String(Math.max(500, req)));
      }
    }
  }, [activeGoals, cagr]);

  const handleStartSip = async () => {
    if (!sipAmt || sipAmt <= 0) { toast.error('Enter a valid SIP amount'); return; }
    setStarting(true);
    try {
      const name = selectedGoal?.name ?? 'Custom SIP';
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
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground">SIP Planner</h1>
          <p className="text-xs text-muted-foreground">
            Simulate · step-up · inflation-adjust · start SIP
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary shrink-0">
          §27
        </Badge>
      </div>

      {/* Tab bar */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid grid-cols-2 w-full rounded-2xl bg-muted/50 border border-border/40 p-1">
          <TabsTrigger value="planner"  className="rounded-xl text-xs gap-1.5">
            <BarChart2 className="h-3.5 w-3.5" /> Planner
          </TabsTrigger>
          <TabsTrigger value="compare"  className="rounded-xl text-xs gap-1.5">
            <Table2 className="h-3.5 w-3.5" /> All Goals
            {activeGoals.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold leading-none">
                {activeGoals.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── COMPARE TAB ── */}
        <TabsContent value="compare" className="mt-3">
          <Card className="glass border-border/40">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" /> Required SIP per Goal
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Tap any goal to simulate its SIP in the Planner tab
              </p>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs shrink-0">Assumed CAGR</Label>
                <Slider
                  min={6} max={18} step={1}
                  value={[cagr]}
                  onValueChange={(v) => setCagr(v[0])}
                  className="flex-1"
                />
                <span className="text-xs font-bold text-primary w-8 text-right">{cagr}%</span>
              </div>
              <GoalComparisonTable
                goals={activeGoals}
                cagr={cagr}
                onSelect={handleGoalSelect}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PLANNER TAB ── */}
        <TabsContent value="planner" className="mt-3 space-y-4">

          {/* Goal Selector */}
          <Card className="glass border-border/40">
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
                  {activeGoals.map((g) => (
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
                    onChange={(e) => setCustomTarget(e.target.value)}
                    className="h-9 text-sm font-semibold"
                    placeholder="e.g. 1000000"
                  />
                </div>
              )}

              {selectedGoal && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                  <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                  <p className="text-[11px] text-muted-foreground">
                    <span className="text-foreground font-medium">{effectiveTenure} months</span> remaining
                    · corpus needed: <span className="font-medium">{formatCurrency(rawTarget)}</span>
                  </p>
                </div>
              )}

              {/* Inflation adjustment toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Inflation Adjust</p>
                    <p className="text-[10px] text-muted-foreground">
                      Target = {formatCurrency(rawTarget)} × (1+{inflRate}%)^{(effectiveTenure / 12).toFixed(1)}y
                      {inflAdj && ` = ${formatCurrency(targetAmount)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {inflAdj && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={inflRate}
                        onChange={(e) => setInflRate(parseFloat(e.target.value) || 6)}
                        className="h-6 w-12 text-[10px] text-center"
                        min={1}
                        max={20}
                      />
                      <span className="text-[10px] text-muted-foreground">%</span>
                    </div>
                  )}
                  <Switch checked={inflAdj} onCheckedChange={setInflAdj} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parameters */}
          <Card className="glass border-border/40">
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
                  onChange={(e) => { setSip(e.target.value); setStarted(false); }}
                  className="h-9 text-sm font-semibold"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {[1000, 2000, 5000, 10000, 25000].map((v) => (
                    <button
                      key={v}
                      onClick={() => { setSip(String(v)); setStarted(false); }}
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
                <Slider min={4} max={20} step={0.5} value={[cagr]} onValueChange={(v) => setCagr(v[0])} />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>4% FD</span><span>12% Equity MF</span><span>20% Small-cap</span>
                </div>
              </div>

              {/* Tenure (custom only) */}
              {selectedGoalId === 'custom' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Tenure
                      </Label>
                      <span className="text-xs font-bold text-primary">
                        {tenure} mo ({(tenure / 12).toFixed(1)} yrs)
                      </span>
                    </div>
                    <Slider min={6} max={360} step={6} value={[tenure]} onValueChange={(v) => setTenure(v[0])} />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>6 mo</span><span>5 yrs</span><span>30 yrs</span>
                    </div>
                  </div>
                </>
              )}

              {/* Advanced: Step-Up */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-[11px] text-primary font-medium w-full pt-1"
              >
                {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showAdvanced ? 'Hide' : 'Show'} Step-Up SIP
                <Badge className="ml-1 text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                  Advanced
                </Badge>
              </button>

              {showAdvanced && (
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Annual Step-Up %</Label>
                    <span className="text-xs font-bold text-primary">{stepUp}%</span>
                  </div>
                  <Slider min={0} max={25} step={1} value={[stepUp]} onValueChange={(v) => setStepUp(v[0])} />
                  <p className="text-[10px] text-muted-foreground">
                    Your SIP increases by {stepUp}% each year (mirrors salary hike). 0% = flat SIP.
                  </p>
                  {stepUp > 0 && (
                    <div className="flex gap-2 text-[11px] text-muted-foreground mt-1">
                      <span>Y1: {formatCurrency(sipAmt)}</span>
                      <span>Y3: {formatCurrency(Math.round(sipAmt * Math.pow(1 + stepUp / 100, 2)))}</span>
                      <span>Y5: {formatCurrency(Math.round(sipAmt * Math.pow(1 + stepUp / 100, 4)))}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 space-y-0.5 text-center">
              <p className="text-[10px] text-muted-foreground">Projected</p>
              <p className="text-sm font-black text-primary tabular-nums">
                {formatCurrency(Math.round(projectedCorpus))}
              </p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/60 p-3 space-y-0.5 text-center">
              <p className="text-[10px] text-muted-foreground">Invested</p>
              <p className="text-sm font-bold text-foreground tabular-nums">
                {formatCurrency(totalInvested)}
              </p>
            </div>
            <div className="rounded-2xl border border-success/20 bg-success/5 p-3 space-y-0.5 text-center">
              <p className="text-[10px] text-muted-foreground">Gains</p>
              <p className="text-sm font-bold text-success tabular-nums">
                {formatCurrency(wealthGained)}
              </p>
            </div>
          </div>

          {/* Progress ring + goal gap */}
          {targetAmount > 0 && (
            <div className={`flex items-center gap-4 p-3.5 rounded-2xl border ${
              meetsGoal ? 'bg-success/5 border-success/25' : 'bg-warning/5 border-warning/25'
            }`}>
              <ProgressRing
                pct={progressPct}
                size={72}
                strokeWidth={7}
                color={meetsGoal ? 'hsl(var(--success))' : 'hsl(var(--warning))'}
                label={`${Math.round(progressPct)}%`}
                sublabel="of goal"
              />
              <div className="flex-1 min-w-0">
                {meetsGoal ? (
                  <>
                    <p className="text-sm font-bold text-success">Goal on track 🎉</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Surplus {formatCurrency(Math.round(goalGap))} over target
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-warning">
                      Short by {formatCurrency(Math.abs(Math.round(goalGap)))}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Increase SIP to {formatCurrency(requiredSip)}/month
                    </p>
                    <button
                      onClick={() => { setSip(String(requiredSip)); setStarted(false); }}
                      className="mt-1.5 text-[10px] font-bold text-warning border border-warning/40 rounded-lg px-2.5 py-1 hover:bg-warning/10 transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                      Use ₹{(requiredSip / 1000).toFixed(0)}k
                    </button>
                  </>
                )}
                {inflAdj && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ⚡ Inflation-adjusted target: {formatCurrency(targetAmount)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Chart */}
          <Card className="glass border-border/40">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-semibold flex items-center justify-between">
                <span>Corpus Growth Projection</span>
                {stepUp > 0 && (
                  <Badge className="text-[9px] px-1.5 h-4 bg-accent/10 text-accent border-accent/20">
                    {stepUp}% Step-Up
                  </Badge>
                )}
              </CardTitle>
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
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      formatCurrency(v),
                      name === 'corpus' ? 'Projected Corpus' : 'Total Invested',
                    ]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
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
              <div className="flex items-center gap-4 justify-center mt-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="w-4 h-0.5 bg-primary rounded" /> Projected corpus
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="w-4 h-0.5 rounded" style={{ borderTop: '1.5px dashed hsl(var(--muted-foreground))' }} /> Amount invested
                </div>
                {targetAmount > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="w-4 h-0.5 bg-warning rounded" /> Goal line
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Start SIP CTA */}
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
              Creates a monthly recurring transaction · manage under Recurring Txns
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
