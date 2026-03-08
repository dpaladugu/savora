/**
 * DebtFreedomCountdown — Phase-aware Mission Widget
 *
 * Phase 1 (both loans active)  → Sequential strike countdown + vacancy buffer
 * Phase 2 (InCred = 0)         → Power-up celebration, ICICI-only countdown
 * Phase 3 (both = 0)           → Mission Selector: Home Loan / Wealth / Hybrid / Medical Corpus
 */

import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Zap, AlertTriangle, CheckCircle2, ChevronRight,
  Home, TrendingUp, Shuffle, Heart, Trophy, ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { addMonths, format, differenceInMonths } from 'date-fns';
import { toast } from 'sonner';

const INCRED_MIN_PART = 25_000;
const DEADLINE = new Date(2029, 11, 31);
const fmt = (d: Date) => format(d, 'MMM yyyy');

// ── SIP FV helper  ─────────────────────────────────────────────────────────────
function sipFV(monthly: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

// ── Home loan eligibility (max loan where EMI ≤ capacity) ─────────────────────
function maxHomeLoan(emiCapacity: number, annualRate: number, tenureYears: number): number {
  const r = annualRate / 100 / 12;
  const n = tenureYears * 12;
  return Math.round(emiCapacity / (r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)));
}

// ── Amortisation sim ──────────────────────────────────────────────────────────
function simLoan(outstanding: number, roi: number, emi: number, extra: number, minPart = 0) {
  if (outstanding <= 0) return { months: 0, freedomDate: new Date() };
  const r = roi / 100 / 12;
  let bal = outstanding, month = 0, acc = 0;
  while (bal > 0 && month < 600) {
    month++;
    bal -= Math.min(bal, emi - bal * r);
    if (extra > 0) {
      acc += extra;
      if (minPart > 0 ? acc >= minPart : true) { bal = Math.max(0, bal - acc); acc = 0; }
    }
    if (bal <= 0) break;
  }
  return { months: month, freedomDate: addMonths(new Date(), month) };
}

// ── Mission definitions ───────────────────────────────────────────────────────
const MISSIONS = [
  {
    id: 'home-loan',
    label: 'Home Loan',
    icon: Home,
    color: 'text-primary',
    bg: 'bg-primary/8 border-primary/25',
    activeBg: 'bg-primary/15 border-primary/50',
    desc: 'Use freed EMI capacity for a home loan',
  },
  {
    id: 'wealth',
    label: 'Wealth Building',
    icon: TrendingUp,
    color: 'text-success',
    bg: 'bg-success/8 border-success/25',
    activeBg: 'bg-success/15 border-success/50',
    desc: 'Redirect entire surplus to SIP at 12% CAGR',
  },
  {
    id: 'hybrid',
    label: 'Hybrid Split',
    icon: Shuffle,
    color: 'text-warning',
    bg: 'bg-warning/8 border-warning/25',
    activeBg: 'bg-warning/15 border-warning/50',
    desc: 'Split freed cash: part EMI, part SIP',
  },
  {
    id: 'medical',
    label: "Mother's Corpus",
    icon: Heart,
    color: 'text-destructive',
    bg: 'bg-destructive/8 border-destructive/25',
    activeBg: 'bg-destructive/15 border-destructive/50',
    desc: 'Build a dedicated medical safety corpus',
  },
] as const;

type MissionId = (typeof MISSIONS)[number]['id'];

interface Props {
  onNavigate: (moduleId: string) => void;
}

export function DebtFreedomCountdown({ onNavigate }: Props) {
  const loans  = useLiveQuery(() => db.loans.toArray(), []);
  const shops  = useLiveQuery(() => db.gunturShops.toArray(), []);
  const rooms  = useLiveQuery(() => db.gorantlaRooms.toArray(), []);
  const savedMission = useLiveQuery(
    () => db.appSettings.get('nextMission').then(r => (r?.value as MissionId) ?? null),
    []
  );

  const [hybridSipPct, setHybridSipPct] = useState(50); // % going to SIP in hybrid mode

  // ── Loan data ─────────────────────────────────────────────────────────────
  const { incred, icici } = useMemo(() => {
    const active = (loans ?? []).filter(l => l.isActive !== false);
    const il = active.find(l => l.id === 'loan-incred-2026')
      ?? active.find(l => { const n = (l.name ?? l.type ?? '').toLowerCase(); return n.includes('incred') || n.includes('education') || (l.roi ?? 0) >= 14; });
    const cl = active.find(l => l.id === 'loan-icici-master-2026')
      ?? active.find(l => { const n = (l.name ?? '').toLowerCase(); return n.includes('master') || (n.includes('icici') && (l.principal ?? 0) >= 20_00_000); });
    return {
      incred: il ? { outstanding: il.outstanding ?? il.principal, roi: il.roi ?? 14.2, emi: il.emi ?? 32641 } : { outstanding: 10_21_156, roi: 14.2, emi: 32641 },
      icici:  cl ? { outstanding: cl.outstanding ?? cl.principal, roi: cl.roi ?? 9.99,  emi: cl.emi ?? 61424 } : { outstanding: 33_00_000,  roi: 9.99,  emi: 61424 },
    };
  }, [loans]);

  // ── Live P5 ───────────────────────────────────────────────────────────────
  const p5 = useMemo(() => {
    const sr = (shops ?? []).filter(s => s.status === 'Occupied').reduce((a, s) => a + (s.rent ?? 0), 0);
    const rr = (rooms ?? []).reduce((a, r) => a + (r.rent ?? 0), 0);
    let rem = Math.max(0, sr + rr - 5000 - 5400 - 5400 - 45000);
    return rem;
  }, [shops, rooms]);

  // ── Phase detection ───────────────────────────────────────────────────────
  const phase = incred.outstanding === 0 && icici.outstanding === 0 ? 3
    : incred.outstanding === 0 ? 2
    : 1;

  // ── Phase 1 simulation ────────────────────────────────────────────────────
  const sim1 = useMemo(() => {
    const ph1 = simLoan(incred.outstanding, incred.roi, incred.emi, p5, INCRED_MIN_PART);
    const ph2Extra = incred.emi + p5;
    const ph2 = simLoan(icici.outstanding, icici.roi, icici.emi, ph2Extra, 0);
    const totalMonths = ph1.months + ph2.months;
    const finalFreedom = addMonths(new Date(), totalMonths);
    return {
      ph1, ph2,
      totalMonths,
      finalFreedom,
      onTrack: finalFreedom <= DEADLINE,
      buffer: differenceInMonths(DEADLINE, finalFreedom),
      phase2Extra: ph2Extra,
    };
  }, [incred, icici, p5]);

  // ── Phase 2 simulation (InCred cleared, ICICI only) ───────────────────────
  const sim2 = useMemo(() => {
    const extra = incred.emi + p5;
    return simLoan(icici.outstanding, icici.roi, icici.emi, extra, 0);
  }, [icici, incred.emi, p5]);

  // ── Freed cash (Phase 3) ──────────────────────────────────────────────────
  const freedMonthly = incred.emi + icici.emi + p5;

  // ── Mission save ──────────────────────────────────────────────────────────
  const saveMission = async (id: MissionId) => {
    await db.appSettings.put({ key: 'nextMission', value: id });
    toast.success(`Mission set: ${MISSIONS.find(m => m.id === id)?.label}`);
  };

  const activeMission = savedMission ?? null;

  // ── Render helpers ────────────────────────────────────────────────────────
  const monthsTo2029 = Math.max(0, differenceInMonths(DEADLINE, new Date()));
  const progressPct = monthsTo2029 > 0 ? Math.max(0, Math.min(100,
    Math.round(((monthsTo2029 - sim1.totalMonths) / monthsTo2029) * 100)
  )) : 100;

  if (!loans) return null;

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 3 — Both loans cleared 🎉
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 3) {
    const homeLoanEligibility = maxHomeLoan(Math.round(freedMonthly * 0.6), 8.5, 20);
    const sipCorpus5  = sipFV(freedMonthly, 12, 5);
    const sipCorpus10 = sipFV(freedMonthly, 12, 10);
    const hybridSip   = Math.round(freedMonthly * (hybridSipPct / 100));
    const hybridEmi   = freedMonthly - hybridSip;
    const hybridLoan  = maxHomeLoan(hybridEmi, 8.5, 20);
    const hybridCorpus10 = sipFV(hybridSip, 12, 10);
    const medicalTarget = 15_00_000; // ₹15L medical corpus target
    const monthsToMedical = Math.ceil(medicalTarget / freedMonthly);

    return (
      <Card className="border-2 border-success/40 bg-gradient-to-br from-success/8 to-primary/5">
        <CardContent className="p-4 space-y-4">
          {/* Celebration header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20">
              <Trophy className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-bold text-success">Debt-Free! Mission Complete 🎉</p>
              <p className="text-[11px] text-muted-foreground">
                {formatCurrency(freedMonthly)}/mo unlocked — choose your next mission
              </p>
            </div>
          </div>

          {/* Mission selector tiles */}
          <div className="grid grid-cols-2 gap-2">
            {MISSIONS.map(m => {
              const Icon = m.icon;
              const isActive = activeMission === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => saveMission(m.id)}
                  className={`flex flex-col gap-1 p-2.5 rounded-xl border text-left transition-all ${isActive ? m.activeBg : m.bg} hover:opacity-90`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${m.color}`} />
                    <span className={`text-xs font-semibold ${isActive ? m.color : 'text-foreground'}`}>{m.label}</span>
                    {isActive && <CheckCircle2 className={`h-3 w-3 ml-auto ${m.color}`} />}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{m.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Mission-specific projection */}
          {activeMission === 'home-loan' && (
            <div className="p-3 rounded-xl bg-primary/8 border border-primary/20 space-y-2 text-xs">
              <p className="font-semibold text-primary flex items-center gap-1"><Home className="h-3.5 w-3.5" /> Home Loan Projection</p>
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-muted-foreground">Max Eligibility</p><p className="font-bold tabular-nums">{formatCurrency(homeLoanEligibility)}</p></div>
                <div><p className="text-muted-foreground">EMI Capacity</p><p className="font-bold tabular-nums">{formatCurrency(Math.round(freedMonthly * 0.6))}/mo</p></div>
                <div><p className="text-muted-foreground">Down-payment (20%)</p><p className="font-bold tabular-nums">{formatCurrency(Math.round(homeLoanEligibility * 0.25))}</p></div>
                <div><p className="text-muted-foreground">Rate assumed</p><p className="font-bold">8.5% / 20yr</p></div>
              </div>
              <p className="text-[10px] text-muted-foreground">Remaining {formatCurrency(Math.round(freedMonthly * 0.4))}/mo → SIP investment</p>
            </div>
          )}

          {activeMission === 'wealth' && (
            <div className="p-3 rounded-xl bg-success/8 border border-success/20 space-y-2 text-xs">
              <p className="font-semibold text-success flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> SIP Corpus @ 12% CAGR</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-1.5 rounded-lg bg-background/60">
                  <p className="text-muted-foreground">5 years</p>
                  <p className="font-bold text-success tabular-nums">{formatCurrency(sipCorpus5)}</p>
                </div>
                <div className="p-1.5 rounded-lg bg-background/60">
                  <p className="text-muted-foreground">10 years</p>
                  <p className="font-bold text-success tabular-nums">{formatCurrency(sipCorpus10)}</p>
                </div>
                <div className="p-1.5 rounded-lg bg-background/60">
                  <p className="text-muted-foreground">Monthly SIP</p>
                  <p className="font-bold tabular-nums">{formatCurrency(freedMonthly)}</p>
                </div>
              </div>
            </div>
          )}

          {activeMission === 'hybrid' && (
            <div className="p-3 rounded-xl bg-warning/8 border border-warning/20 space-y-2.5 text-xs">
              <p className="font-semibold text-warning flex items-center gap-1"><Shuffle className="h-3.5 w-3.5" /> Hybrid Split</p>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-muted-foreground">SIP: <span className="font-semibold text-foreground">{formatCurrency(hybridSip)}/mo</span></span>
                  <span className="text-muted-foreground">Home EMI: <span className="font-semibold text-foreground">{formatCurrency(hybridEmi)}/mo</span></span>
                </div>
                <Slider min={20} max={80} step={5} value={[hybridSipPct]}
                  onValueChange={([v]) => setHybridSipPct(v)} className="mb-2" />
                <div className="flex gap-2 text-[10px] text-muted-foreground">
                  <span>← More home loan</span>
                  <span className="ml-auto">More SIP →</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-muted-foreground">Home Loan Eligibility</p><p className="font-bold tabular-nums">{formatCurrency(hybridLoan)}</p></div>
                <div><p className="text-muted-foreground">SIP Corpus (10yr)</p><p className="font-bold text-success tabular-nums">{formatCurrency(hybridCorpus10)}</p></div>
              </div>
            </div>
          )}

          {activeMission === 'medical' && (
            <div className="p-3 rounded-xl bg-destructive/8 border border-destructive/20 space-y-2 text-xs">
              <p className="font-semibold text-destructive flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> Mother's Medical Corpus</p>
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-muted-foreground">Target Corpus</p><p className="font-bold tabular-nums">{formatCurrency(medicalTarget)}</p></div>
                <div><p className="text-muted-foreground">Monthly Allocation</p><p className="font-bold tabular-nums">{formatCurrency(freedMonthly)}</p></div>
                <div><p className="text-muted-foreground">Months to Target</p><p className="font-bold">{monthsToMedical} months</p></div>
                <div><p className="text-muted-foreground">Target Date</p><p className="font-bold">{fmt(addMonths(new Date(), monthsToMedical))}</p></div>
              </div>
              <Progress value={0} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground">Remaining surplus → SIP after corpus is funded</p>
            </div>
          )}

          {!activeMission && (
            <p className="text-[11px] text-muted-foreground text-center py-1">
              👆 Select your next mission above
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 2 — InCred cleared, ICICI remaining 💪
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 2) {
    const onTrack = sim2.freedomDate <= DEADLINE;
    const buffer  = differenceInMonths(DEADLINE, sim2.freedomDate);
    return (
      <button onClick={() => onNavigate('debt')} className="w-full text-left">
        <Card className="border-2 border-success/40 bg-success/5 hover:border-success/60 transition-colors">
          <CardContent className="p-4 space-y-3">
            {/* Power-up banner */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-success/15 border border-success/30">
              <Zap className="h-4 w-4 text-success shrink-0" />
              <div>
                <p className="text-xs font-bold text-success">InCred Cleared! Power-Up Active ⚡</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatCurrency(incred.emi + p5)}/mo extra now hits ICICI every month
                </p>
              </div>
            </div>

            {/* ICICI countdown */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">ICICI Master Loan — Final Target</p>
                <p className="text-xl font-bold text-primary tabular-nums">{fmt(sim2.freedomDate)}</p>
                <p className="text-[11px] text-muted-foreground">{sim2.months} months · {formatCurrency(icici.outstanding)} remaining</p>
              </div>
              <div className="text-right">
                <Badge variant={onTrack ? 'default' : 'destructive'} className="text-[10px]">
                  {onTrack ? `+${buffer}mo buffer` : `${Math.abs(buffer)}mo slip`}
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-1">vs Dec 2029</p>
              </div>
            </div>

            {/* P5 indicator */}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Zap className="h-2.5 w-2.5 text-warning" />
              Live P5: <span className="font-semibold text-foreground ml-0.5">{formatCurrency(p5)}/mo</span>
              <ArrowRight className="h-3 w-3 mx-1" />
              <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </button>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 1 — Both loans active (default state)
  // ══════════════════════════════════════════════════════════════════════════
  const isLowP5 = p5 < 5400;

  return (
    <button onClick={() => onNavigate('debt')} className="w-full text-left" aria-label="Open Debt Strike">
      <Card className={`border-2 transition-colors ${sim1.onTrack
        ? 'border-success/30 bg-success/5 hover:border-success/50'
        : 'border-destructive/30 bg-destructive/5 hover:border-destructive/50'}`}>
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${sim1.onTrack ? 'bg-success/15' : 'bg-destructive/15'}`}>
                {sim1.onTrack
                  ? <CheckCircle2 className="h-4 w-4 text-success" />
                  : <AlertTriangle className="h-4 w-4 text-destructive" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Debt-Free Countdown</p>
                <p className="text-[10px] text-muted-foreground">Debt Avalanche · InCred → ICICI</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant={sim1.onTrack ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0.5">
                {sim1.onTrack ? `+${sim1.buffer}mo buffer` : `${Math.abs(sim1.buffer)}mo slip`}
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </div>
          </div>

          {/* Phase tiles */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-destructive/8 border border-destructive/20 p-2.5 space-y-0.5">
              <div className="flex items-center gap-1">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">1</span>
                <p className="text-[10px] font-semibold text-destructive">InCred 14.2%</p>
              </div>
              <p className="text-xs font-bold tabular-nums">{fmt(sim1.ph1.freedomDate)}</p>
              <p className="text-[10px] text-muted-foreground">{sim1.ph1.months}mo · {formatCurrency(incred.outstanding)}</p>
            </div>
            <div className="rounded-xl bg-primary/8 border border-primary/20 p-2.5 space-y-0.5">
              <div className="flex items-center gap-1">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">2</span>
                <p className="text-[10px] font-semibold text-primary">ICICI 9.99%</p>
              </div>
              <p className="text-xs font-bold tabular-nums">{fmt(sim1.finalFreedom)}</p>
              <p className="text-[10px] text-muted-foreground">{sim1.ph2.months}mo · {formatCurrency(icici.outstanding)}</p>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span className="flex items-center gap-1">
                <Zap className="h-2.5 w-2.5 text-warning" />
                P5 live: <span className="font-semibold text-foreground ml-0.5">{formatCurrency(p5)}/mo</span>
              </span>
              <span>{progressPct > 0 ? `${progressPct}% cushion` : 'Behind 2029'}</span>
            </div>
            <Progress value={Math.max(0, progressPct)} className="h-1.5" />
          </div>

          {isLowP5 && (
            <p className="text-[10px] text-warning flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              Low P5 — vacancy or waterfall gap detected. 2029 date may slip.
            </p>
          )}
        </CardContent>
      </Card>
    </button>
  );
}
