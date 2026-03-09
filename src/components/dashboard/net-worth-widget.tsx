/**
 * NetWorthWidget — compact Dashboard card showing net worth summary.
 * Assets: investments + physical gold + EF corpus + rental property implied value
 * Liabilities: loans outstanding + credit card balances
 * Shows MoM delta badge by persisting last snapshot in appSettings.
 */
import React, { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/format-utils';
import { Landmark, TrendingUp, TrendingDown, ChevronRight, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props { onNavigate: (m: string) => void; }

const RENTAL_YIELD = 0.08;
const SNAPSHOT_KEY = 'nw-snapshot';

interface NWSnapshot { netWorth: number; savedAt: string; }

export function NetWorthWidget({ onNavigate }: Props) {
  const investments  = useLiveQuery(() => db.investments.toArray().catch(() => []), []) ?? [];
  const gold         = useLiveQuery(() => db.gold.toArray().catch(() => []), []) ?? [];
  const ef           = useLiveQuery(() => db.emergencyFunds.limit(1).first().catch(() => undefined), []);
  const loans        = useLiveQuery(() => db.loans.toArray().catch(() => []), []) ?? [];
  const creditCards  = useLiveQuery(() => db.creditCards.toArray().catch(() => []), []) ?? [];
  const shops        = useLiveQuery(() => db.gunturShops.toArray().catch(() => []), []) ?? [];
  const rooms        = useLiveQuery(() => db.gorantlaRooms.toArray().catch(() => []), []) ?? [];
  const snapshotRow  = useLiveQuery(() => db.appSettings.get(SNAPSHOT_KEY), []);

  // ── Assets ────────────────────────────────────────────────────────────────
  const investmentTotal = investments.reduce((s, i) => s + (i.currentValue || i.investedValue || 0), 0);

  const goldTotal = gold.reduce((s, g) => {
    const w     = (g as any).netWeight ?? (g as any).weight ?? 0;
    const price = (g as any).currentMcxPrice ?? 8_500;
    return s + price * w;
  }, 0);

  const efCorpus = ef?.currentAmount ?? 0;

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

  // ── Month-over-month delta ─────────────────────────────────────────────────
  const prevSnapshot: NWSnapshot | null = snapshotRow?.value ?? null;
  const savedThisMonth = useRef(false);

  useEffect(() => {
    if (totalAssets === 0 || savedThisMonth.current) return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Only update snapshot once per calendar month
    if (!prevSnapshot || !prevSnapshot.savedAt.startsWith(monthKey)) {
      savedThisMonth.current = true;
      db.appSettings.put({
        key: SNAPSHOT_KEY,
        value: { netWorth, savedAt: now.toISOString() } satisfies NWSnapshot,
      }).catch(() => {});
    }
  }, [netWorth, totalAssets]);

  const momDelta = prevSnapshot ? netWorth - prevSnapshot.netWorth : null;
  const momPct   = prevSnapshot && prevSnapshot.netWorth !== 0
    ? (momDelta! / Math.abs(prevSnapshot.netWorth)) * 100
    : null;

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
          <div className="flex items-center gap-1.5">
            {/* MoM delta badge */}
            {momDelta !== null && momPct !== null && Math.abs(momDelta) > 100 && (
              <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                momDelta > 0
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {momDelta > 0
                  ? <ArrowUpRight className="h-2.5 w-2.5" />
                  : <ArrowDownRight className="h-2.5 w-2.5" />}
                {Math.abs(momPct).toFixed(1)}% MoM
              </span>
            )}
            {momDelta !== null && Math.abs(momDelta) <= 100 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted/50">
                <Minus className="h-2.5 w-2.5" /> Flat MoM
              </span>
            )}
            <span className={`text-sm font-black tabular-nums ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '' : '−'}{formatCurrency(Math.abs(netWorth))}
            </span>
          </div>
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
