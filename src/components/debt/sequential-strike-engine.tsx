
/**
 * Sequential Debt Strike Engine
 * Phase 1: Kill InCred (14.2%) — min ₹25k per part-payment
 * Phase 2: Redirect InCred EMI + P5 surplus → ICICI (9.99%)
 *
 * P5 is sourced live from the Guntur waterfall (shops + rooms).
 * Vacancy Stress Test: toggle any unit vacant to see the 2029 slip in real-time.
 */

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Target, Zap, AlertTriangle, CheckCircle2,
  ArrowRight, Info, Building2, Home,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { addMonths, format, differenceInMonths } from 'date-fns';

const INCRED_MIN_PART_PAYMENT = 25_000;
const DEADLINE = new Date(2029, 11, 31);
const fmt = (d: Date) => format(d, 'MMM yyyy');

// ── Waterfall constants (mirrors property-rental-engine) ─────────────────────
const DWACRA          = 5_000;
const INS_RECOVERY    = 5_400;
const INS_SINKING     = 5_400;
const HOUSEHOLD       = 45_000;

function computeP5(shopRent: number, roomRent: number): number {
  let rem = Math.max(0, shopRent + roomRent - DWACRA);
  rem = Math.max(0, rem - INS_RECOVERY);
  rem = Math.max(0, rem - INS_SINKING);
  rem = Math.max(0, rem - HOUSEHOLD);
  return rem;
}

// ── Amortisation helper ───────────────────────────────────────────────────────
function simLoan(
  outstanding: number,
  annualRoi: number,
  emi: number,
  monthlyExtra: number,
  minPartPayment = 0,
): { months: number; totalInterest: number; freedomDate: Date } {
  if (outstanding <= 0) return { months: 0, totalInterest: 0, freedomDate: new Date() };
  const r = annualRoi / 100 / 12;
  let balance = outstanding;
  let totalInterest = 0;
  let month = 0;
  let accumulated = 0;

  while (balance > 0 && month < 600) {
    month++;
    const interest = balance * r;
    const principal = Math.min(balance, emi - interest);
    balance -= principal;
    totalInterest += interest;

    if (monthlyExtra > 0) {
      accumulated += monthlyExtra;
      if (minPartPayment > 0) {
        if (accumulated >= minPartPayment) {
          balance = Math.max(0, balance - accumulated);
          accumulated = 0;
        }
      } else {
        balance = Math.max(0, balance - accumulated);
        accumulated = 0;
      }
    }
    if (balance <= 0) break;
  }

  return { months: month, totalInterest: Math.round(totalInterest), freedomDate: addMonths(new Date(), month) };
}

function runSequentialSim(
  incred: { outstanding: number; roi: number; emi: number },
  icici:  { outstanding: number; roi: number; emi: number },
  p5Monthly: number,
) {
  const phase1 = simLoan(incred.outstanding, incred.roi, incred.emi, p5Monthly, INCRED_MIN_PART_PAYMENT);
  const phase2Extra = incred.emi + p5Monthly;
  const phase2 = simLoan(icici.outstanding, icici.roi, icici.emi, phase2Extra, 0);
  const totalMonths = phase1.months + phase2.months;
  const finalFreedom = addMonths(new Date(), totalMonths);

  return {
    incredMonths:   phase1.months,
    incredFreedom:  phase1.freedomDate,
    incredInterest: phase1.totalInterest,
    iciciMonths:    phase2.months,
    iciciFreedom:   finalFreedom,
    iciciInterest:  phase2.totalInterest,
    totalInterest:  phase1.totalInterest + phase2.totalInterest,
    finalFreedom,
    onTrack:        finalFreedom <= DEADLINE,
    phase2ExtraMonthly: phase2Extra,
  };
}

// ── Vacancy Stress Toggle ────────────────────────────────────────────────────
interface UnitToggle {
  id: string;
  name: string;
  rent: number;
  type: 'shop' | 'room';
  vacant: boolean; // local override for stress test
}

export function SequentialStrikeEngine() {
  // Live data
  const loans   = useLiveQuery(() => db.loans.toArray(), []);
  const shops   = useLiveQuery(() => db.gunturShops.toArray(), []);
  const rooms   = useLiveQuery(() => db.gorantlaRooms.toArray(), []);

  // Stress-test vacancy overrides (unit id → vacant)
  const [vacantOverrides, setVacantOverrides] = useState<Record<string, boolean>>({});
  const [manualP5Override, setManualP5Override] = useState<number | null>(null);

  const toggleVacant = (id: string) =>
    setVacantOverrides(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Derive loan data ────────────────────────────────────────────────────────
  const { incred, icici } = useMemo(() => {
    const active = (loans ?? []).filter(l => l.isActive !== false);
    const incredLoan = active.find(l => l.id === 'loan-incred-2026')
      ?? active.find(l => {
        const n = (l.name ?? l.type ?? '').toLowerCase();
        return n.includes('incred') || n.includes('education') || (l.roi ?? 0) >= 14;
      });
    const iciciLoan = active.find(l => l.id === 'loan-icici-master-2026')
      ?? active.find(l => {
        const n = (l.name ?? '').toLowerCase();
        return n.includes('master') || (n.includes('icici') && (l.principal ?? 0) >= 20_00_000);
      });
    return {
      incred: incredLoan
        ? { outstanding: incredLoan.outstanding ?? incredLoan.principal, roi: incredLoan.roi ?? 14.2, emi: incredLoan.emi ?? 12000 }
        : { outstanding: 10_21_156, roi: 14.2, emi: 12000 },
      icici: iciciLoan
        ? { outstanding: iciciLoan.outstanding ?? iciciLoan.principal, roi: iciciLoan.roi ?? 9.99, emi: iciciLoan.emi ?? 55000 }
        : { outstanding: 33_00_000, roi: 9.99, emi: 55000 },
    };
  }, [loans]);

  // ── Build unit list for stress-test panel ──────────────────────────────────
  const units: UnitToggle[] = useMemo(() => {
    const shopUnits: UnitToggle[] = (shops ?? []).map(s => ({
      id: s.id,
      name: s.name,
      rent: s.rent ?? 0,
      type: 'shop',
      vacant: vacantOverrides[s.id] ?? (s.status === 'Vacant'),
    }));
    const roomUnits: UnitToggle[] = (rooms ?? []).map(r => ({
      id: r.id,
      name: r.name,
      rent: r.rent ?? 0,
      type: 'room',
      vacant: vacantOverrides[r.id] ?? false,
    }));
    return [...shopUnits, ...roomUnits];
  }, [shops, rooms, vacantOverrides]);

  // ── Compute live P5 from active units ─────────────────────────────────────
  const liveP5 = useMemo(() => {
    const shopRent = units.filter(u => u.type === 'shop' && !u.vacant).reduce((s, u) => s + u.rent, 0);
    const roomRent = units.filter(u => u.type === 'room' && !u.vacant).reduce((s, u) => s + u.rent, 0);
    return computeP5(shopRent, roomRent);
  }, [units]);

  const p5Monthly = manualP5Override ?? liveP5;

  // ── Run simulation ─────────────────────────────────────────────────────────
  const sim = useMemo(
    () => runSequentialSim(incred, icici, p5Monthly),
    [incred.outstanding, incred.roi, incred.emi, icici.outstanding, icici.roi, icici.emi, p5Monthly]
  );

  // ── Reverse-order comparison (for interest-saved banner) ──────────────────
  const reverseOrder = useMemo(() => runSequentialSim(
    { outstanding: icici.outstanding, roi: icici.roi, emi: icici.emi },
    { outstanding: incred.outstanding, roi: incred.roi, emi: incred.emi },
    p5Monthly,
  ), [incred, icici, p5Monthly]);
  const interestSaved = Math.max(0, reverseOrder.totalInterest - sim.totalInterest);

  // ── Months to deadline / accumulator stats ────────────────────────────────
  const monthsTo2029 = Math.max(0, differenceInMonths(DEADLINE, new Date()));
  const monthsBuffer = differenceInMonths(DEADLINE, sim.finalFreedom);
  const monthsToFirstStrike = p5Monthly > 0 ? Math.ceil(INCRED_MIN_PART_PAYMENT / p5Monthly) : null;
  const accumPct = p5Monthly > 0 ? Math.min(100, Math.round((p5Monthly / INCRED_MIN_PART_PAYMENT) * 100)) : 0;

  const vacantCount = units.filter(u => u.vacant).length;
  const isStressMode = Object.keys(vacantOverrides).some(k => vacantOverrides[k]);

  if (!loans) {
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
          {sim.onTrack ? `✓ +${monthsBuffer}mo buffer` : `⚠ ${Math.abs(monthsBuffer)}mo slip`}
        </Badge>
      </div>

      {/* Live P5 source banner */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-primary">
            Debt Avalanche · Saves {formatCurrency(interestSaved)} vs ICICI-first
          </p>
          <p className="text-muted-foreground mt-0.5">
            Live P5 from Guntur waterfall:{' '}
            <span className="font-semibold text-foreground">{formatCurrency(liveP5)}/mo</span>
            {isStressMode && (
              <span className="ml-1 text-warning font-semibold">(stress-test active — {vacantCount} unit{vacantCount !== 1 ? 's' : ''} vacant)</span>
            )}
          </p>
        </div>
      </div>

      {/* Phase 1 — InCred */}
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
              <span className="text-muted-foreground tabular-nums">{formatCurrency(p5Monthly)}/mo</span>
            </div>
            <Progress value={accumPct} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">
              {monthsToFirstStrike
                ? `Strike fires every ${monthsToFirstStrike} month${monthsToFirstStrike !== 1 ? 's' : ''}`
                : 'Set a P5 surplus to activate strikes'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Arrow */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ArrowRight className="h-4 w-4 text-primary" />
        <span>InCred cleared → <span className="font-semibold text-foreground">{formatCurrency(sim.phase2ExtraMonthly)}/mo</span> redirects to ICICI</span>
      </div>

      {/* Phase 2 — ICICI */}
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
              Phase 2 boost: ICICI EMI + freed InCred EMI{' '}
              <span className="text-foreground font-medium">(+{formatCurrency(incred.emi)})</span>
              {' '}+ P5{' '}
              <span className="text-foreground font-medium">(+{formatCurrency(p5Monthly)})</span>
              {' '}= <span className="font-bold text-primary">{formatCurrency(sim.phase2ExtraMonthly)}/mo extra</span>
            </span>
          </div>
        </CardContent>
      </Card>

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
              <p className="font-semibold">{sim.incredMonths}mo · {fmt(sim.incredFreedom)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ICICI done in</p>
              <p className="font-semibold">{sim.iciciMonths}mo after InCred</p>
            </div>
            <div>
              <p className="text-muted-foreground">Months to Dec 2029</p>
              <p className={`font-semibold ${sim.onTrack ? 'text-success' : 'text-destructive'}`}>{monthsTo2029} available</p>
            </div>
            <div>
              <p className="text-muted-foreground">Saved vs ICICI-first</p>
              <p className="font-semibold text-success tabular-nums">+{formatCurrency(interestSaved)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Vacancy Stress Test ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Vacancy Stress Test
            {isStressMode && (
              <Badge variant="destructive" className="text-[10px] ml-auto">
                {vacantCount} unit{vacantCount !== 1 ? 's' : ''} vacant
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Toggle any unit vacant to see the real-time impact on your 2029 freedom date.
          </p>

          {/* Shops */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Guntur Shops
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {units.filter(u => u.type === 'shop').map(u => (
                <button
                  key={u.id}
                  onClick={() => toggleVacant(u.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                    u.vacant
                      ? 'border-destructive/40 bg-destructive/8 text-destructive'
                      : 'border-success/30 bg-success/5 text-foreground hover:bg-success/10'
                  }`}
                >
                  <span className="truncate font-medium">{u.name}</span>
                  <span className="tabular-nums shrink-0 ml-1">
                    {u.vacant ? '✗ vacant' : `₹${(u.rent / 1000).toFixed(1)}k`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Rooms */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Home className="h-3 w-3" /> Gorantla Rooms
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {units.filter(u => u.type === 'room').map(u => (
                <button
                  key={u.id}
                  onClick={() => toggleVacant(u.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                    u.vacant
                      ? 'border-destructive/40 bg-destructive/8 text-destructive'
                      : 'border-success/30 bg-success/5 text-foreground hover:bg-success/10'
                  }`}
                >
                  <span className="truncate font-medium">{u.name}</span>
                  <span className="tabular-nums shrink-0 ml-1">
                    {u.vacant ? '✗ vacant' : `₹${(u.rent / 1000).toFixed(1)}k`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {isStressMode && (
            <div className={`p-2.5 rounded-lg border text-xs space-y-1 ${sim.onTrack ? 'border-warning/30 bg-warning/5' : 'border-destructive/30 bg-destructive/5'}`}>
              <p className="font-semibold flex items-center gap-1">
                {sim.onTrack
                  ? <><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Still on track with {vacantCount} unit{vacantCount !== 1 ? 's' : ''} vacant</>
                  : <><AlertTriangle className="h-3.5 w-3.5 text-destructive" /> {Math.abs(monthsBuffer)} months behind 2029 with {vacantCount} unit{vacantCount !== 1 ? 's' : ''} vacant</>}
              </p>
              <p className="text-muted-foreground">
                P5 drops to <span className="font-semibold text-foreground">{formatCurrency(p5Monthly)}/mo</span> · Freedom date slips to <span className="font-semibold">{fmt(sim.finalFreedom)}</span>
              </p>
            </div>
          )}

          {isStressMode && (
            <Button
              size="sm" variant="outline"
              className="h-7 text-xs w-full"
              onClick={() => setVacantOverrides({})}
            >
              Reset stress test
            </Button>
          )}
        </CardContent>
      </Card>

      {/* P5 Manual Override Tuner */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            P5 Waterfall Override
            {manualP5Override !== null && (
              <Badge variant="outline" className="text-[10px] ml-auto">Manual</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">
              {manualP5Override !== null ? 'Manual override' : 'Live from Guntur waterfall'}
            </span>
            <span className="font-bold text-primary tabular-nums">{formatCurrency(p5Monthly)}/mo</span>
          </div>
          <Slider
            min={0} max={50000} step={500}
            value={[p5Monthly]}
            onValueChange={([v]) => setManualP5Override(v)}
          />
          <div className="grid grid-cols-4 gap-1">
            {[null, 5400, 10000, 25000].map((v, i) => (
              <Button
                key={i} size="sm"
                variant={
                  v === null
                    ? manualP5Override === null ? 'default' : 'outline'
                    : manualP5Override === v ? 'default' : 'outline'
                }
                className="h-6 text-[10px]"
                onClick={() => setManualP5Override(v)}
              >
                {v === null ? 'Live' : v === 5400 ? '₹5.4k' : v === 10000 ? '₹10k' : '₹25k'}
              </Button>
            ))}
          </div>
          {p5Monthly > 0 && p5Monthly < INCRED_MIN_PART_PAYMENT && (
            <p className="text-[10px] text-warning flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Accumulating {monthsToFirstStrike ? `${monthsToFirstStrike} months` : ''} before first ₹25k InCred strike
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
