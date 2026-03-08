/**
 * NetWorthWidget — compact Dashboard card showing net worth summary.
 * Assets: investments + physical gold + EF corpus + rental property implied value
 * Liabilities: loans outstanding + credit card balances
 */
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/format-utils';
import { Landmark, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props { onNavigate: (m: string) => void; }

// Rental yield multiplier — Indian tier-2 city commercial/residential typical gross yield ~8%
// Implied capital value = annual rent / 0.08 (i.e. × 12.5)
const RENTAL_YIELD = 0.08;

export function NetWorthWidget({ onNavigate }: Props) {
  const investments  = useLiveQuery(() => db.investments.toArray().catch(() => []), []) ?? [];
  const gold         = useLiveQuery(() => db.gold.toArray().catch(() => []), []) ?? [];
  const ef           = useLiveQuery(() => db.emergencyFunds.limit(1).first().catch(() => undefined), []);
  const loans        = useLiveQuery(() => db.loans.toArray().catch(() => []), []) ?? [];
  const creditCards  = useLiveQuery(() => db.creditCards.toArray().catch(() => []), []) ?? [];
  const shops        = useLiveQuery(() => db.gunturShops.toArray().catch(() => []), []) ?? [];
  const rooms        = useLiveQuery(() => db.gorantlaRooms.toArray().catch(() => []), []) ?? [];

  // ── Assets ────────────────────────────────────────────────────────────────
  const investmentTotal = investments.reduce((s, i) => s + (i.currentValue || i.investedValue || 0), 0);

  const goldTotal = gold.reduce((s, g) => {
    const w     = (g as any).netWeight ?? (g as any).weight ?? 0;
    const price = (g as any).currentMcxPrice ?? 8_500; // approx ₹8,500/gram fallback
    return s + price * w;
  }, 0);

  const efCorpus = ef?.currentAmount ?? 0;

  // Rental property implied market value: annual gross rent / yield
  const annualShopRent = shops
    .filter(s => s.status === 'Occupied')
    .reduce((s, sh) => s + (sh.rent ?? 0), 0) * 12;
  const annualRoomRent = rooms.reduce((s, r) => s + (r.rent ?? 0), 0) * 12;
  const rentalPropertyValue = Math.round((annualShopRent + annualRoomRent) / RENTAL_YIELD);

  const totalAssets = investmentTotal + goldTotal + efCorpus + rentalPropertyValue;

  // ── Liabilities ───────────────────────────────────────────────────────────
  const loanTotal = loans
    .filter(l => l.isActive !== false)
    .reduce((s, l) => s + ((l as any).outstanding ?? l.principal ?? 0), 0);
  const ccDebt = creditCards.reduce((s, c) => s + ((c as any).currentBalance ?? 0), 0);
  const totalLiabilities = loanTotal + ccDebt;

  const netWorth   = totalAssets - totalLiabilities;
  const isPositive = netWorth >= 0;
  const debtPct    = totalAssets > 0 ? Math.min(100, (totalLiabilities / totalAssets) * 100) : 0;

  // If no data at all, render nothing
  if (totalAssets === 0 && totalLiabilities === 0) return null;

  return (
    <button
      onClick={() => onNavigate('net-worth')}
      className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/30 active:scale-[0.98] transition-all text-left"
      aria-label="Open Net Worth Tracker"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isPositive ? 'bg-success/10' : 'bg-destructive/10'}`}>
        <Landmark className={`h-5 w-5 ${isPositive ? 'text-success' : 'text-destructive'}`} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">Net Worth</p>
          <span className={`text-sm font-black tabular-nums ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? '' : '−'}{formatCurrency(Math.abs(netWorth))}
          </span>
        </div>
        <Progress
          value={debtPct}
          className={`h-1.5 ${debtPct > 70 ? '[&>div]:bg-destructive' : debtPct > 40 ? '[&>div]:bg-warning' : ''}`}
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            <span className="text-success">{formatCurrency(totalAssets)}</span>
            {rentalPropertyValue > 0 && (
              <span className="text-muted-foreground/60"> (incl. property)</span>
            )}
            {' '}·{' '}
            <span className="text-destructive">{formatCurrency(totalLiabilities)}</span>
          </p>
          <div className="flex items-center gap-0.5 text-muted-foreground/60">
            {isPositive
              ? <TrendingUp className="h-3 w-3 text-success" />
              : <TrendingDown className="h-3 w-3 text-destructive" />}
          </div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
    </button>
  );
}
