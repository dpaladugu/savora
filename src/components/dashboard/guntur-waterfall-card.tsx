/**
 * GunturWaterfallCard — Dashboard widget
 * Shows live P1→P5 bucket progress from DB (gunturShops + waterfallProgress).
 * Tapping navigates to the full Rental Engine.
 */
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/format-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Droplets } from 'lucide-react';

// ─── Bucket definitions (mirrors property-rental-engine constants) ─────────────
interface Bucket {
  id: string;
  label: string;
  priority: string;
  target: number;         // monthly target (Infinity = surplus)
  isFlow: boolean;        // true = monthly-flow bucket, false = accumulation
  colorClass: string;
  trackInDb: boolean;     // does waterfallProgress track this?
}

const BUCKETS: Bucket[] = [
  { id: 'premium',   priority: 'P1', label: 'Premium Recovery',  target: 167943, isFlow: false, colorClass: 'bg-primary',     trackInDb: true  },
  { id: 'sinking',   priority: 'P2', label: '2029 Sinking Fund',  target: 5400,   isFlow: true,  colorClass: 'bg-accent',      trackInDb: true  },
  { id: 'household', priority: 'P3', label: 'Household Expenses', target: 45000,  isFlow: true,  colorClass: 'bg-success',     trackInDb: true  },
  { id: 'grandma',   priority: 'P4', label: "Grandma Safety Net", target: 500000, isFlow: false, colorClass: 'bg-warning',     trackInDb: true  },
  { id: 'debt',      priority: 'P5', label: 'ICICI Prepayment',   target: 0,      isFlow: true,  colorClass: 'bg-destructive', trackInDb: false },
];

interface Props {
  onNavigate: (moduleId: string) => void;
}

export function GunturWaterfallCard({ onNavigate }: Props) {
  const shops    = useLiveQuery(() => db.gunturShops.toArray().catch(() => []), []) ?? [];
  const progress = useLiveQuery(() => db.waterfallProgress.toArray().catch(() => []), []) ?? [];

  const totalRent = shops
    .filter(s => s.status === 'Occupied')
    .reduce((s, shop) => s + (shop.rent ?? 0), 0);

  const occupiedCount = shops.filter(s => s.status === 'Occupied').length;
  const vacantCount   = shops.filter(s => s.status === 'Vacant').length;

  // Map accumulated values from DB
  const accMap: Record<string, number> = {};
  for (const row of progress) accMap[row.bucketId] = row.accumulated ?? 0;

  // Calculate remaining after each bucket in the waterfall
  let remaining = totalRent;
  const bucketData = BUCKETS.map(b => {
    let pct = 0;
    let allocated = 0;
    let display = '';

    if (b.id === 'debt') {
      // P5 gets whatever is left
      allocated = Math.max(0, remaining);
      pct = allocated > 0 ? 100 : 0;
      display = formatCurrency(allocated) + '/mo surplus';
    } else if (b.isFlow) {
      // Monthly flow — compare allocation vs target
      allocated = Math.min(remaining, b.target);
      pct = b.target > 0 ? Math.min(100, Math.round((allocated / b.target) * 100)) : 0;
      display = `${formatCurrency(allocated)} / ${formatCurrency(b.target)}/mo`;
      remaining -= allocated;
    } else {
      // Accumulation bucket — use DB progress
      const acc = accMap[b.id] ?? 0;
      allocated = acc;
      pct = b.target > 0 ? Math.min(100, Math.round((acc / b.target) * 100)) : 0;
      display = `${formatCurrency(acc)} / ${formatCurrency(b.target)}`;
      // Deduct monthly contribution from remaining (assume 1 month)
      const monthlyContrib = b.id === 'sinking' ? 5400 : Math.min(remaining, 0);
      remaining -= Math.min(remaining, monthlyContrib);
    }

    return { ...b, pct, display, allocated };
  });

  const fullyFunded = bucketData.filter(b => b.pct >= 100).length;

  return (
    <button
      onClick={() => onNavigate('property-rental')}
      className="w-full text-left"
      aria-label="Open Guntur Waterfall"
    >
      <Card className="glass border-border/40 hover:border-primary/30 transition-colors active:scale-[0.99]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <Droplets className="h-4 w-4 text-primary" />
            </div>
            <span className="flex-1">Guntur Waterfall</span>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              {formatCurrency(totalRent)}/mo
            </Badge>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          </CardTitle>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground">
              {occupiedCount} occupied · {vacantCount} vacant
            </span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-success font-medium">
              {fullyFunded}/{BUCKETS.length} buckets funded
            </span>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-2.5">
          {bucketData.map((b, i) => (
            <div key={b.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center justify-center h-4 w-6 rounded text-[9px] font-bold text-background ${b.colorClass}`}>
                    {b.priority}
                  </span>
                  <span className="text-[11px] font-medium text-foreground">{b.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums">{b.display}</span>
              </div>
              <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${b.colorClass} ${b.pct === 0 ? 'opacity-30' : ''}`}
                  style={{ width: `${b.pct}%` }}
                />
              </div>
            </div>
          ))}

          {/* Flow arrow */}
          <div className="flex items-center gap-1 pt-1">
            {BUCKETS.map((b, i) => (
              <React.Fragment key={b.id}>
                <div className={`h-1.5 flex-1 rounded-full ${b.colorClass} opacity-30`} />
                {i < BUCKETS.length - 1 && (
                  <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground text-center">
            P1 → P2 → P3 → P4 → P5 · overflow cascades down
          </p>
        </CardContent>
      </Card>
    </button>
  );
}
