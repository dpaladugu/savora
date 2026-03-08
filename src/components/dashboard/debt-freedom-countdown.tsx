/**
 * DebtFreedomCountdown — compact dashboard card
 * Shows InCred kill date, ICICI freedom date, months buffer to Dec 2029
 * and a slip indicator when P5 is low.
 */

import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { addMonths, format, differenceInMonths } from 'date-fns';

const INCRED_MIN_PART = 25_000;
const DEADLINE = new Date(2029, 11, 31); // Dec 31 2029
const fmt = (d: Date) => format(d, 'MMM yyyy');

function simLoan(
  outstanding: number,
  annualRoi: number,
  emi: number,
  monthlyExtra: number,
  minPartPayment = 0,
): { months: number; freedomDate: Date } {
  if (outstanding <= 0) return { months: 0, freedomDate: new Date() };
  const r = annualRoi / 100 / 12;
  let balance = outstanding;
  let month = 0;
  let accumulated = 0;

  while (balance > 0 && month < 600) {
    month++;
    const interest = balance * r;
    const principal = Math.min(balance, emi - interest);
    balance -= principal;

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

  return { months: month, freedomDate: addMonths(new Date(), month) };
}

interface Props {
  onNavigate: (moduleId: string) => void;
}

export function DebtFreedomCountdown({ onNavigate }: Props) {
  const loans = useLiveQuery(() => db.loans.toArray(), []);
  const shops = useLiveQuery(() => db.gunturShops.toArray(), []);
  const rooms = useLiveQuery(() => db.gorantlaRooms.toArray(), []);
  const wpRows = useLiveQuery(() => db.waterfallProgress.toArray(), []);

  const { incredData, iciciData, p5Monthly, incredSim, iciciSim, onTrack, monthsBuffer } = useMemo(() => {
    const activeLoans = (loans ?? []).filter(l => l.isActive !== false);

    const incredLoan = activeLoans.find(l => l.id === 'loan-incred-2026')
      ?? activeLoans.find(l => {
        const n = (l.name ?? l.type ?? '').toLowerCase();
        return n.includes('incred') || n.includes('education') || (l.roi ?? 0) >= 14;
      });
    const iciciLoan = activeLoans.find(l => l.id === 'loan-icici-master-2026')
      ?? activeLoans.find(l => {
        const n = (l.name ?? '').toLowerCase();
        return n.includes('master') || (n.includes('icici') && (l.principal ?? 0) >= 20_00_000);
      });

    const incred = incredLoan
      ? { outstanding: incredLoan.outstanding ?? incredLoan.principal, roi: incredLoan.roi ?? 14.2, emi: incredLoan.emi ?? 12000 }
      : { outstanding: 10_21_156, roi: 14.2, emi: 12000 };

    const icici = iciciLoan
      ? { outstanding: iciciLoan.outstanding ?? iciciLoan.principal, roi: iciciLoan.roi ?? 9.99, emi: iciciLoan.emi ?? 55000 }
      : { outstanding: 33_00_000, roi: 9.99, emi: 55000 };

    // ── Compute live P5 from Guntur waterfall ──────────────────────────────────
    const shopRent = (shops ?? [])
      .filter(s => s.status === 'Occupied')
      .reduce((s, sh) => s + (sh.rent ?? 0), 0);
    const roomRent = (rooms ?? []).reduce((s, r) => s + (r.rent ?? 0), 0);
    const gross = shopRent + roomRent;

    // Mirroring cascadeIncome from property-rental-engine
    const DWACRA = 5000;
    const INS_RECOVERY = 5400;
    const INS_SINKING  = 5400; // INS_2029_MONTHLY_UPSHIFT approximated
    const HOUSEHOLD    = 45000;
    let rem = Math.max(0, gross - DWACRA);
    rem = Math.max(0, rem - INS_RECOVERY);
    rem = Math.max(0, rem - INS_SINKING);
    rem = Math.max(0, rem - HOUSEHOLD);
    const p5 = rem; // whatever remains after P0-P4 is the debt strike bucket

    // ── Simulate Phase 1: InCred ───────────────────────────────────────────────
    const ph1 = simLoan(incred.outstanding, incred.roi, incred.emi, p5, INCRED_MIN_PART);

    // ── Simulate Phase 2: ICICI (gets freed InCred EMI + P5) ─────────────────
    const phase2Extra = incred.emi + p5;
    const ph2 = simLoan(icici.outstanding, icici.roi, icici.emi, phase2Extra, 0);

    const totalMonths = ph1.months + ph2.months;
    const finalFreedom = addMonths(new Date(), totalMonths);
    const onTrack = finalFreedom <= DEADLINE;
    const monthsBuffer = differenceInMonths(DEADLINE, finalFreedom);

    return {
      incredData: incred,
      iciciData: icici,
      p5Monthly: p5,
      incredSim: ph1,
      iciciSim: { ...ph2, freedomDate: finalFreedom },
      onTrack,
      monthsBuffer,
    };
  }, [loans, shops, rooms]);

  if (!loans) return null;

  const monthsTo2029 = Math.max(0, differenceInMonths(DEADLINE, new Date()));
  const totalMonths = incredSim.months + iciciSim.months;
  const progressPct = monthsTo2029 > 0
    ? Math.min(100, Math.round(((monthsTo2029 - totalMonths) / monthsTo2029) * 100))
    : 100;

  const isLowP5 = p5Monthly < 5400;

  return (
    <button
      onClick={() => onNavigate('debt')}
      className="w-full text-left"
      aria-label="Open Debt Strike"
    >
      <Card className={`border-2 transition-colors ${onTrack ? 'border-success/30 bg-success/5 hover:border-success/50' : 'border-destructive/30 bg-destructive/5 hover:border-destructive/50'}`}>
        <CardContent className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${onTrack ? 'bg-success/15' : 'bg-destructive/15'}`}>
                {onTrack
                  ? <CheckCircle2 className="h-4 w-4 text-success" />
                  : <AlertTriangle className="h-4 w-4 text-destructive" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Debt-Free Countdown</p>
                <p className="text-[10px] text-muted-foreground">Sequential Strike · Debt Avalanche</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant={onTrack ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0.5">
                {onTrack ? `+${monthsBuffer}mo buffer` : `${Math.abs(monthsBuffer)}mo slip`}
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </div>
          </div>

          {/* Phase tiles */}
          <div className="grid grid-cols-2 gap-2">
            {/* Phase 1: InCred */}
            <div className="rounded-xl bg-destructive/8 border border-destructive/20 p-2.5 space-y-0.5">
              <div className="flex items-center gap-1">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">1</span>
                <p className="text-[10px] font-semibold text-destructive">InCred 14.2%</p>
              </div>
              <p className="text-xs font-bold tabular-nums">{fmt(incredSim.freedomDate)}</p>
              <p className="text-[10px] text-muted-foreground">{incredSim.months}mo · {formatCurrency(incredData.outstanding)}</p>
            </div>

            {/* Phase 2: ICICI */}
            <div className="rounded-xl bg-primary/8 border border-primary/20 p-2.5 space-y-0.5">
              <div className="flex items-center gap-1">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">2</span>
                <p className="text-[10px] font-semibold text-primary">ICICI 9.99%</p>
              </div>
              <p className="text-xs font-bold tabular-nums">{fmt(iciciSim.freedomDate)}</p>
              <p className="text-[10px] text-muted-foreground">{iciciSim.months}mo · {formatCurrency(iciciData.outstanding)}</p>
            </div>
          </div>

          {/* Progress bar toward 2029 */}
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span className="flex items-center gap-1">
                <Zap className="h-2.5 w-2.5 text-warning" />
                P5 Waterfall: <span className="font-semibold text-foreground ml-0.5">{formatCurrency(p5Monthly)}/mo</span>
              </span>
              <span>{progressPct > 0 ? `${progressPct}% cushion` : 'Behind 2029'}</span>
            </div>
            <Progress value={Math.max(0, progressPct)} className="h-1.5" />
          </div>

          {/* Low P5 slip warning */}
          {isLowP5 && (
            <p className="text-[10px] text-warning flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              Low P5 surplus — vacancy detected or waterfall buckets not filled. 2029 date may slip.
            </p>
          )}
        </CardContent>
      </Card>
    </button>
  );
}
