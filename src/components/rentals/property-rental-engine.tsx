import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Home, PiggyBank,
  ChefHat, Droplets, ShoppingBag, Coffee, Scissors,
  ArrowDown, ArrowRight, CheckCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';
import { useRole } from '@/store/rbacStore';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { GunturShopRow, WaterfallProgressRow, GorantlaRoomRow } from '@/lib/db';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const DWACRA_DEDUCTION = 5000;

const DEFAULT_GORANTLA: Omit<GorantlaRoomRow, 'updatedAt'>[] = [
  { id: 'gr-kitchen',   roomId: 'kitchen',   name: 'Kitchen',          tenant: 'Tenant A',    rent: 3000, paid: false },
  { id: 'gr-main',      roomId: 'main-house', name: 'Main House',       tenant: 'Tenant B',    rent: 4500, paid: false },
  { id: 'gr-damini',    roomId: 'damini',     name: 'Damini/Sudhakar',  tenant: 'Damini',      rent: 3500, paid: false },
  { id: 'gr-sudhakar',  roomId: 'sudhakar',   name: 'Sudhakar',         tenant: 'Sudhakar',    rent: 3000, paid: false },
];

const DEFAULT_SHOPS: Omit<GunturShopRow, 'updatedAt'>[] = [
  { id: 'gs-1', shopId: 'shop-1', name: 'Shop 1', tenant: '',        rent: 0,    status: 'Vacant'   },
  { id: 'gs-2', shopId: 'shop-2', name: 'Shop 2', tenant: 'Milk',    rent: 5500, status: 'Occupied' },
  { id: 'gs-3', shopId: 'shop-3', name: 'Shop 3', tenant: 'Salon',   rent: 3700, status: 'Occupied' },
  { id: 'gs-4', shopId: 'shop-4', name: 'Shop 4', tenant: 'Noodles', rent: 3900, status: 'Occupied' },
  { id: 'gs-5', shopId: 'shop-5', name: 'Shop 5', tenant: 'Tea',     rent: 4000, status: 'Occupied' },
  { id: 'gs-6', shopId: 'shop-6', name: 'Shop 6', tenant: 'Bags',    rent: 2500, status: 'Occupied' },
];

interface WaterfallBucket {
  id: string;
  label: string;
  target: number;
  monthly?: number;
  icon: React.ReactNode;
  colorClass: string;
}

const WATERFALL_BUCKETS: WaterfallBucket[] = [
  { id: 'premium',   label: 'Premium Recovery',            target: 167943,              icon: <ShoppingBag className="w-4 h-4" />, colorClass: 'bg-primary'     },
  { id: 'sinking',   label: '2029 Sinking Fund',           monthly: 5400, target: 5400 * 36, icon: <PiggyBank className="w-4 h-4" />,   colorClass: 'bg-accent'      },
  { id: 'household', label: 'Household Expenses',          monthly: 45000, target: 45000, icon: <Home className="w-4 h-4" />,       colorClass: 'bg-success'     },
  { id: 'grandma',   label: "Grandma's Safety Net",        target: 500000,              icon: <CheckCircle className="w-4 h-4" />, colorClass: 'bg-warning'     },
  { id: 'debt',      label: 'ICICI Loan Prepayment',       target: Infinity,            icon: <ArrowDown className="w-4 h-4" />,   colorClass: 'bg-destructive' },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
type ActivePage = 'gorantla' | 'guntur';

export function PropertyRentalEngine() {
  const role = useRole();
  const isBrother = role === 'BROTHER';
  const [activePage, setActivePage] = React.useState<ActivePage>('guntur');

  // Seed default data on first load
  useEffect(() => {
    (async () => {
      const shopCount = await db.gunturShops.count().catch(() => 0);
      if (shopCount === 0) {
        await db.gunturShops.bulkAdd(DEFAULT_SHOPS.map(s => ({ ...s, updatedAt: new Date() }))).catch(() => {});
      }
      const roomCount = await db.gorantlaRooms.count().catch(() => 0);
      if (roomCount === 0) {
        await db.gorantlaRooms.bulkAdd(DEFAULT_GORANTLA.map(r => ({ ...r, updatedAt: new Date() }))).catch(() => {});
      }
    })();
  }, []);

  return (
    <div className="p-4 space-y-4">
      {isBrother && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
          <Home className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>You have <strong className="text-foreground">read-only access</strong> to Guntur &amp; Gorantla data.</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant={activePage === 'guntur' ? 'default' : 'outline'} size="sm" onClick={() => setActivePage('guntur')}>
          Guntur Waterfall
        </Button>
        <Button variant={activePage === 'gorantla' ? 'default' : 'outline'} size="sm" onClick={() => setActivePage('gorantla')}>
          Gorantla (Nagaralu)
        </Button>
      </div>

      {activePage === 'guntur'   && <GunturWaterfallPage readOnly={isBrother} />}
      {activePage === 'gorantla' && <GorantlaPage readOnly={isBrother} />}
    </div>
  );
}

// ─── GORANTLA PAGE ────────────────────────────────────────────────────────────
function GorantlaPage({ readOnly = false }: { readOnly?: boolean }) {
  const rooms = useLiveQuery(() => db.gorantlaRooms.toArray(), []) ?? [];

  const totalRent      = rooms.reduce((s, r) => s + r.rent, 0);
  const collectedRent  = rooms.filter(r => r.paid).reduce((s, r) => s + r.rent, 0);
  const netAfterDwacra = totalRent - DWACRA_DEDUCTION;
  const surplus        = Math.max(0, collectedRent - DWACRA_DEDUCTION);

  const togglePaid = async (id: string, current: boolean) => {
    if (readOnly) return;
    await db.gorantlaRooms.update(id, { paid: !current, updatedAt: new Date() });
  };

  const handleCollectSurplus = async () => {
    if (surplus > 0) {
      // Add to waterfall progress bucket "grandma"
      const existing = await db.waterfallProgress.where('bucketId').equals('grandma').first();
      if (existing) {
        await db.waterfallProgress.update(existing.id, { accumulated: existing.accumulated + surplus, updatedAt: new Date() });
      } else {
        await db.waterfallProgress.add({ id: crypto.randomUUID(), bucketId: 'grandma', accumulated: surplus, updatedAt: new Date() });
      }
      // Reset paid flags for next month
      await db.gorantlaRooms.toCollection().modify({ paid: false, updatedAt: new Date() });
      toast.success(`₹${surplus.toLocaleString()} transferred to Grandma Care Fund`);
    }
  };

  const grandmaProgress = useLiveQuery(
    () => db.waterfallProgress.where('bucketId').equals('grandma').first(),
    []
  );
  const grandmaFund = grandmaProgress?.accumulated ?? 0;

  if (rooms.length === 0) return <div className="text-center text-muted-foreground py-10 text-sm">Loading rooms…</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" />
              Gorantla (Nagaralu) — 4 Rooms
            </span>
            <Badge variant="outline">{formatCurrency(netAfterDwacra)}/mo net</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rooms.map(room => (
            <div key={room.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div>
                <p className="font-medium text-sm">{room.name}</p>
                <p className="text-xs text-muted-foreground">{room.tenant}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">{formatCurrency(room.rent)}</span>
                {readOnly ? (
                  <Badge variant={room.paid ? 'default' : 'outline'} className="text-xs">
                    {room.paid ? '✓ Paid' : 'Unpaid'}
                  </Badge>
                ) : (
                  <Button size="sm" variant={room.paid ? 'default' : 'outline'} onClick={() => togglePaid(room.id, room.paid)} className="h-7 text-xs">
                    {room.paid ? '✓ Paid' : 'Mark Paid'}
                  </Button>
                )}
              </div>
            </div>
          ))}

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Rent</span>
              <span className="font-medium">{formatCurrency(totalRent)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>− Dwacra Loan Deduction</span>
              <span>−{formatCurrency(DWACRA_DEDUCTION)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Net Available</span>
              <span>{formatCurrency(netAfterDwacra)}</span>
            </div>
          </div>

          {surplus > 0 && !readOnly && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 space-y-2">
              <p className="text-sm font-medium text-success">
                Surplus: {formatCurrency(surplus)} → Grandma Care Fund
              </p>
              <Button size="sm" onClick={handleCollectSurplus} className="w-full">
                Transfer to Grandma Care Fund
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-primary" />
            Grandma Care Fund
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{formatCurrency(grandmaFund)}</div>
          <p className="text-xs text-muted-foreground mt-1">Accumulated from rent surplus</p>
          <Progress value={Math.min(100, (grandmaFund / 500000) * 100)} className="mt-3" />
          <p className="text-xs text-muted-foreground mt-1">
            Target: {formatCurrency(500000)} ({Math.round((grandmaFund / 500000) * 100)}%)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── GUNTUR WATERFALL PAGE ────────────────────────────────────────────────────
function GunturWaterfallPage({ readOnly = false }: { readOnly?: boolean }) {
  const shops    = useLiveQuery(() => db.gunturShops.toArray(), []) ?? [];
  const progress = useLiveQuery(() => db.waterfallProgress.toArray(), []) ?? [];

  // Persistent tax settings via appSettings
  const taxSetting = useLiveQuery(
    () => db.appSettings.get('gunturTaxSettings'),
    []
  );
  const taxValues = React.useMemo(() => {
    try { return JSON.parse(taxSetting?.value ?? '{}'); } catch { return {}; }
  }, [taxSetting]);

  const [propertyTax, setPropertyTax] = React.useState(0);
  const [waterTax, setWaterTax]       = React.useState(0);

  // Sync from DB once loaded
  React.useEffect(() => {
    if (taxSetting) {
      setPropertyTax(taxValues.propertyTax ?? 0);
      setWaterTax(taxValues.waterTax ?? 0);
    }
  }, [taxSetting, taxValues]);

  const saveTaxSettings = async (pt: number, wt: number) => {
    await db.appSettings.put({ key: 'gunturTaxSettings', value: JSON.stringify({ propertyTax: pt, waterTax: wt }) });
  };

  const totalTaxDeduction = propertyTax + waterTax;

  const bucketProgress: Record<string, number> = {};
  progress.forEach(p => { bucketProgress[p.bucketId] = p.accumulated; });

  const shopIcons: Record<string, React.ReactNode> = {
    Milk:    <Droplets className="w-3 h-3" />,
    Salon:   <Scissors className="w-3 h-3" />,
    Tea:     <Coffee className="w-3 h-3" />,
    Noodles: <ChefHat className="w-3 h-3" />,
    Bags:    <ShoppingBag className="w-3 h-3" />,
  };

  const grossRent = shops.reduce((s, sh) => s + sh.rent, 0);
  const netRent   = Math.max(0, grossRent - totalTaxDeduction);

  const updateShopRent = async (id: string, rent: number) => {
    if (readOnly) return;
    await db.gunturShops.update(id, { rent, updatedAt: new Date() });
  };

  const runWaterfall = async () => {
    if (readOnly) { toast.error('Read-only access'); return; }
    let remaining = netRent;
    for (const bucket of WATERFALL_BUCKETS) {
      if (remaining <= 0) break;
      const monthlyTarget = bucket.monthly ?? bucket.target;
      const fill = Math.min(remaining, monthlyTarget === Infinity ? remaining : monthlyTarget);
      remaining -= fill;
      const existing = await db.waterfallProgress.where('bucketId').equals(bucket.id).first();
      if (existing) {
        await db.waterfallProgress.update(existing.id, { accumulated: existing.accumulated + fill, updatedAt: new Date() });
      } else {
        await db.waterfallProgress.add({ id: crypto.randomUUID(), bucketId: bucket.id, accumulated: fill, updatedAt: new Date() });
      }
    }
    toast.success(`Waterfall executed! ₹${netRent.toLocaleString('en-IN')} net allocated.`);
  };

  const getWaterfallBars = () => {
    let remaining = netRent;
    return WATERFALL_BUCKETS.map(bucket => {
      const monthlyTarget = bucket.monthly ?? bucket.target;
      const fill = Math.min(remaining, monthlyTarget === Infinity ? remaining : monthlyTarget);
      remaining -= fill;
      return { ...bucket, fill, pct: netRent > 0 ? (fill / netRent) * 100 : 0 };
    });
  };

  const bars = getWaterfallBars();

  if (shops.length === 0) return <div className="text-center text-muted-foreground py-10 text-sm">Loading shops…</div>;

  return (
    <div className="space-y-4">
      {/* Shop Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" />
              Guntur — 6 Shops
            </span>
            <Badge variant="outline">Gross: {formatCurrency(grossRent)}/mo</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {shops.map(shop => (
              <div key={shop.id} className={`p-3 rounded-lg border text-sm ${shop.status === 'Vacant' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{shop.name}</span>
                  {shop.status === 'Vacant'
                    ? <Badge variant="destructive" className="text-xs">Vacant</Badge>
                    : <Badge variant="secondary" className="text-xs flex items-center gap-1">{shopIcons[shop.tenant]}{shop.tenant}</Badge>
                  }
                </div>
                {!readOnly && shop.status === 'Occupied' ? (
                  <Input
                    type="number"
                    defaultValue={shop.rent}
                    className="h-7 text-xs font-semibold text-primary"
                    onBlur={e => updateShopRent(shop.id, parseFloat(e.target.value) || 0)}
                  />
                ) : (
                  <div className="text-primary font-semibold">
                    {shop.status === 'Vacant' ? '—' : formatCurrency(shop.rent)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Systemic Tax Deductions (P0) ── */}
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <ArrowDown className="w-3 h-3 text-destructive" />
              P0 — Systemic Deductions (Tax at Source)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Property Tax /mo</label>
                <Input
                  type="number"
                  disabled={readOnly}
                  value={propertyTax}
                  onChange={e => setPropertyTax(parseFloat(e.target.value) || 0)}
                  onBlur={() => saveTaxSettings(propertyTax, waterTax)}
                  className="h-7 text-xs"
                  placeholder="₹0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Water Tax /mo</label>
                <Input
                  type="number"
                  disabled={readOnly}
                  value={waterTax}
                  onChange={e => setWaterTax(parseFloat(e.target.value) || 0)}
                  onBlur={() => saveTaxSettings(propertyTax, waterTax)}
                  className="h-7 text-xs"
                  placeholder="₹0"
                />
              </div>
            </div>
            {totalTaxDeduction > 0 && (
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                <span className="text-destructive font-medium">Total P0 Deduction</span>
                <span className="text-destructive font-semibold">−{formatCurrency(totalTaxDeduction)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t pt-2">
              <span>Net to Waterfall</span>
              <span className="text-primary">{formatCurrency(netRent)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waterfall Allocation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-primary" />
              Waterfall Allocation
            </span>
            {!readOnly && <Button size="sm" onClick={runWaterfall}>Run Waterfall</Button>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Visual waterfall bar */}
          <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
            {bars.map(bar => (
              <div key={bar.id} className={`${bar.colorClass} transition-all`} style={{ width: `${bar.pct}%` }} title={`${bar.label}: ${formatCurrency(bar.fill)}`} />
            ))}
          </div>

          {/* Bucket list */}
          <div className="space-y-2">
            {WATERFALL_BUCKETS.map((bucket, i) => {
              const fill        = bars[i].fill;
              const accumulated = bucketProgress[bucket.id] ?? 0;
              const targetDisplay = bucket.id === 'debt' ? 'Remaining' : formatCurrency(bucket.target);
              const progressPct   = bucket.id === 'debt' ? 100 : Math.min(100, (accumulated / bucket.target) * 100);

              return (
                <div key={bucket.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <ArrowRight className="w-3 h-3" />
                      {bucket.icon}
                      {bucket.label}
                    </span>
                    <span className="font-medium text-xs">{formatCurrency(fill)} this month</span>
                  </div>
                  {bucket.id !== 'debt' && (
                    <div className="ml-6">
                      <Progress value={progressPct} className="h-1.5" />
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(accumulated)} / {targetDisplay}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
