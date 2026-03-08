
/**
 * Sequential Debt Strike Engine
 * Phase 1: Kill InCred (14.2%) — min ₹25k per part-payment
 * Phase 2: Redirect InCred EMI + P5 surplus → ICICI (9.99%)
 */

import React, { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Target, Zap, Calendar, AlertTriangle, CheckCircle2,
  ArrowRight, TrendingDown, Info,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { addMonths, format } from 'date-fns';

const INCRED_MIN_PART_PAYMENT = 25_000;
const feb2029 = new Date(2029, 1, 1);
const fmt = (d: Date) => format(d, 'MMM yyyy');

// ── Amortisation helper ───────────────────────────────────────────────────────
function simLoan(
  outstanding: number,
  annualRoi: number,
  emi: number,
  monthlyExtra: number,
  minPartPayment = 0,
): { months: number; totalInterest: number; freedomDate: Date } {
  const r = annualRoi / 100 / 12;
  let balance = outstanding;
  let totalInterest = 0;
  let month = 0;
  let accumulated = 0; // for min-part-payment accumulation logic

  while (balance > 0 && month < 600) {
    month++;
    const interest = balance * r;
    const principal = Math.min(balance, emi - interest);
    balance -= principal;
    totalInterest += interest;

    // Accumulate extra until threshold is met
    if (monthlyExtra > 0) {
      accumulated += monthlyExtra;
      if (minPartPayment > 0) {
        if (accumulated >= minPartPayment) {
          const strike = Math.min(balance, accumulated);
          balance -= strike;
          accumulated = 0;
        }
      } else {
        const strike = Math.min(balance, accumulated);
        balance -= strike;
        accumulated = 0;
      }
    }

    if (balance <= 0) break;
  }

  const freedomDate = addMonths(new Date(), month);
  return { months: month, totalInterest: Math.round(totalInterest), freedomDate };
}

// ── Sequential two-phase simulation ──────────────────────────────────────────
function runSequentialSim(
  incred: { outstanding: number; roi: number; emi: number },
  icici:  { outstanding: number; roi: number; emi: number },
  p5Monthly: number,
): {
  incredMonths: number;
  incredFreedom: Date;
  incredInterest: number;
  iciciMonths: number;
  iciciFreedom: Date;
  iciciInterest: number;
  totalInterest: number;
  finalFreedom: Date;
  onTrack: boolean;
  phase2ExtraMonthly: number; // InCred EMI freed + P5
} {
  // Phase 1: Kill InCred — P5 surplus flows here, min ₹25k per part-payment
  const phase1 = simLoan(
    incred.outstanding,
    incred.roi,
    incred.emi,
    p5Monthly,
    INCRED_MIN_PART_PAYMENT,
  );

  // Phase 2: ICICI gets its own EMI + freed InCred EMI + P5 surplus
  const phase2Extra = incred.emi + p5Monthly;
  const phase2 = simLoan(
    icici.outstanding,
    icici.roi,
    icici.emi,
    phase2Extra,
    0, // ICICI has no min part-payment constraint
  );

  const totalMonths = phase1.months + phase2.months;
  const finalFreedom = addMonths(new Date(), totalMonths);

  return {
    incredMonths: phase1.months,
    incredFreedom: phase1.freedomDate,
    incredInterest: phase1.totalInterest,
    iciciMonths: phase2.months,
    iciciFreedom: finalFreedom,
    iciciInterest: phase2.totalInterest,
    totalInterest: phase1.totalInterest + phase2.totalInterest,
    finalFreedom,
    onTrack: finalFreedom <= feb2029,
    phase2ExtraMonthly: phase2Extra,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SequentialStrikeEngine() {
  const [incredLoan, setIncredLoan] = useState<any>(null);
  const [iciciLoan,  setIciciLoan]  = useState<any>(null);
  const [p5Monthly,  setP5Monthly]  = useState(5400); // default waterfall P5
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const loans = await db.loans.toArray();
        const incred = loans.find(l =>
          l.isActive &&
          (l.type?.toLowerCase().includes('incred') ||
           l.type?.toLowerCase().includes('education') ||
           (l.roi ?? 0) >= 14)
        );
        const icici = loans.find(l =>
          l.isActive &&
          (l.type?.toLowerCase().includes('icici') ||
           l.type?.toLowerCase().includes('personal') ||
           (l.borrower === 'Me' && (l.roi ?? 0) < 12 && (l.principal ?? 0) >= 2_000_000))
        );
        setIncredLoan(incred ?? null);
        setIciciLoan(icici ?? null);
      } catch (e) {
        console.warn('SequentialStrike load error', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Fallback hard-coded values if DB not yet populated
  const incred = incredLoan
    ? { outstanding: incredLoan.outstanding ?? incredLoan.principal, roi: incredLoan.roi ?? 14.2, emi: incredLoan.emi ?? 0 }
    : { outstanding: 10_21_156, roi: 14.2, emi: 12000 };

  const icici = iciciLoan
    ? { outstanding: iciciLoan.outstanding ?? iciciLoan.principal, roi: iciciLoan.roi ?? 9.99, emi: iciciLoan.emi ?? 0 }
    : { outstanding: 33_00_000, roi: 9.99, emi: 55000 };

  const sim = useMemo(
    () => runSequentialSim(incred, icici, p5Monthly),
    [incred.outstanding, incred.roi, incred.emi, icici.outstanding, icici.roi, icici.emi, p5Monthly]
  );

  // Months till InCred zero to show ₹25k accumulator progress
  const now = new Date();
  const monthsTo2029 = Math.max(0,
    (feb2029.getFullYear() - now.getFullYear()) * 12 + (feb2029.getMonth() - now.getMonth())
  );

  // Accumulation tracker: how many months of P5 needed before first strike
  const monthsToFirstStrike = p5Monthly > 0 ? Math.ceil(INCRED_MIN_PART_PAYMENT / p5Monthly) : '∞';
  const accumulatedSoFar = (p5Monthly > 0 && typeof monthsToFirstStrike === 'number')
    ? Math.min(p5Monthly, INCRED_MIN_PART_PAYMENT) : 0;
  const accumPct = p5Monthly > 0 ? Math.min(100, Math.round((p5Monthly / INCRED_MIN_PART_PAYMENT) * 100)) : 0;

  // Interest saved vs targeting ICICI first
  const reverseOrder = runSequentialSim(
    { outstanding: icici.outstanding, roi: icici.roi, emi: icici.emi },
    { outstanding: incred.outstanding, roi: incred.roi, emi: incred.emi },
    p5Monthly,
  );
  const interestSavedVsReverse = Math.max(0, reverseOrder.totalInterest - sim.totalInterest);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse p-4">
        <div className="h-6 bg-muted rounded w-1/2" />
        <div className="h-28 bg-muted rounded-2xl" />
        <div className="h-28 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-warning" />
        <h2 className="text-xl font-bold tracking-tight">Sequential Strike Engine</h2>
        <Badge variant={sim.onTrack ? 'default' : 'destructive'} className="ml-auto text-xs">
          {sim.onTrack ? '✓ On Track 2029' : '⚠ Behind 2029'}
        </Badge>
      </div>

      {/* Strategy banner */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-primary">Debt Avalanche Strategy Active</p>
          <p className="text-muted-foreground mt-0.5">
            Targeting InCred ({incred.roi}%) first — saves{' '}
            <span className="font-semibold text-foreground">{formatCurrency(interestSavedVsReverse)}</span>{' '}
            vs targeting ICICI first. Min ₹25k per InCred part-payment enforced.
          </p>
        </div>
      </div>

      {/* Phase Timeline */}
      <div className="space-y-3">
        {/* Phase 1 */}
        <Card className="border-2 border-destructive/20">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">1</span>
                InCred Education Loan
              </span>
              <Badge variant="destructive" className="text-[10px]">{incred.roi}% ROI</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Outstanding</p>
                <p className="font-bold text-destructive tabular-nums">{formatCurrency(incred.outstanding)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">EMI</p>
                <p className="font-bold tabular-nums">{formatCurrency(incred.emi)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Kill Date</p>
                <p className="font-bold tabular-nums text-warning">{fmt(sim.incredFreedom)}</p>
              </div>
            </div>

            {/* ₹25k accumulator */}
            <div className="p-2.5 rounded-lg bg-warning/5 border border-warning/20 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-warning font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Min ₹25k Part-Payment Gate
                </span>
                <span className="text-muted-foreground tabular-nums">{formatCurrency(p5Monthly)}/mo accumulating</span>
              </div>
              <Progress value={accumPct} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground">
                {typeof monthsToFirstStrike === 'number'
                  ? `P5 surplus fires a ₹25k strike every ${monthsToFirstStrike} month${monthsToFirstStrike !== 1 ? 's' : ''}`
                  : 'Set a P5 surplus to activate strikes'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Arrow */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ArrowRight className="h-4 w-4 text-primary" />
          <span>InCred cleared → <span className="font-semibold text-foreground">{formatCurrency(sim.phase2ExtraMonthly)}/mo</span> power-up redirects to ICICI</span>
        </div>

        {/* Phase 2 */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                ICICI Master Loan
              </span>
              <Badge variant="outline" className="text-[10px]">{icici.roi}% ROI</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Outstanding</p>
                <p className="font-bold text-destructive tabular-nums">{formatCurrency(icici.outstanding)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">EMI</p>
                <p className="font-bold tabular-nums">{formatCurrency(icici.emi)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Freedom</p>
                <p className={`font-bold tabular-nums ${sim.onTrack ? 'text-success' : 'text-warning'}`}>
                  {fmt(sim.iciciFreedom)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 text-xs">
              <Zap className="h-3 w-3 text-primary shrink-0" />
              <span className="text-muted-foreground">
                Phase 2 boost: own EMI + freed InCred EMI{' '}
                <span className="text-foreground font-medium">(+{formatCurrency(incred.emi)})</span>
                {' '}+ P5{' '}
                <span className="text-foreground font-medium">(+{formatCurrency(p5Monthly)})</span>
                {' '}= <span className="font-bold text-primary">{formatCurrency(sim.phase2ExtraMonthly)}/mo extra</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Final status */}
      <Card className={`border-2 ${sim.onTrack ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {sim.onTrack
                ? <CheckCircle2 className="h-5 w-5 text-success" />
                : <AlertTriangle className="h-5 w-5 text-warning" />}
              <div>
                <p className="text-xs text-muted-foreground">Total Debt-Free Date</p>
                <p className={`text-lg font-bold ${sim.onTrack ? 'text-success' : 'text-warning'}`}>
                  {fmt(sim.finalFreedom)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Interest Cost</p>
              <p className="text-sm font-bold text-destructive tabular-nums">{formatCurrency(sim.totalInterest)}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">InCred done in</p>
              <p className="font-semibold">{sim.incredMonths} months ({fmt(sim.incredFreedom)})</p>
            </div>
            <div>
              <p className="text-muted-foreground">ICICI done in</p>
              <p className="font-semibold">{sim.iciciMonths} months after InCred</p>
            </div>
            <div>
              <p className="text-muted-foreground">Months to Dec 2029</p>
              <p className={`font-semibold ${sim.onTrack ? 'text-success' : 'text-destructive'}`}>{monthsTo2029} available</p>
            </div>
            <div>
              <p className="text-muted-foreground">Saved vs ICICI-first</p>
              <p className="font-semibold text-success tabular-nums">+{formatCurrency(interestSavedVsReverse)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* P5 Waterfall Tuner */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            P5 Waterfall Strike Capacity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Monthly P5 surplus allocated to debt</span>
            <span className="font-bold text-primary tabular-nums">{formatCurrency(p5Monthly)}/mo</span>
          </div>
          <Slider
            min={0} max={50000} step={500}
            value={[p5Monthly]}
            onValueChange={([v]) => setP5Monthly(v)}
          />
          <div className="grid grid-cols-4 gap-1">
            {[0, 5400, 10000, 25000].map(v => (
              <Button
                key={v} size="sm" variant={p5Monthly === v ? 'default' : 'outline'}
                className="h-6 text-[10px]" onClick={() => setP5Monthly(v)}
              >
                {v === 0 ? 'None' : v === 5400 ? '₹5.4k' : v === 10000 ? '₹10k' : '₹25k'}
              </Button>
            ))}
          </div>
          {p5Monthly > 0 && p5Monthly < INCRED_MIN_PART_PAYMENT && (
            <p className="text-[10px] text-warning flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Accumulating {typeof monthsToFirstStrike === 'number' ? `${monthsToFirstStrike} months` : ''} before first ₹25k InCred part-payment fires
            </p>
          )}
          {p5Monthly >= INCRED_MIN_PART_PAYMENT && (
            <p className="text-[10px] text-success flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Full ₹25k strike fires every month — maximum velocity!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
