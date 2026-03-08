import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Home, TrendingUp, AlertTriangle, PiggyBank, 
  ChefHat, Droplets, ShoppingBag, Coffee, Scissors,
  ArrowDown, ArrowRight, CheckCircle, Edit
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';

// ─── GORANTLA (NAGARALU) CONFIG ─────────────────────────────────────────────

interface GorantlaRoom {
  id: string;
  name: string;
  tenant: string;
  rent: number;
  paid: boolean;
}

const DWACRA_DEDUCTION = 5000;

const defaultGorantlaRooms: GorantlaRoom[] = [
  { id: 'kitchen', name: 'Kitchen', tenant: 'Tenant A', rent: 3000, paid: false },
  { id: 'main-house', name: 'Main House', tenant: 'Tenant B', rent: 4500, paid: false },
  { id: 'damini', name: 'Damini/Sudhakar', tenant: 'Damini', rent: 3500, paid: false },
  { id: 'sudhakar', name: 'Sudhakar', tenant: 'Sudhakar', rent: 3000, paid: false },
];

// ─── GUNTUR WATERFALL CONFIG ─────────────────────────────────────────────────

interface GunturShop {
  id: string;
  name: string;
  tenant: string;
  rent: number;
  status: 'Vacant' | 'Occupied';
}

const defaultGunturShops: GunturShop[] = [
  { id: 'shop-1', name: 'Shop 1', tenant: '', rent: 0, status: 'Vacant' },
  { id: 'shop-2', name: 'Shop 2', tenant: 'Milk', rent: 5500, status: 'Occupied' },
  { id: 'shop-3', name: 'Shop 3', tenant: 'Salon', rent: 3700, status: 'Occupied' },
  { id: 'shop-4', name: 'Shop 4', tenant: 'Noodles', rent: 3900, status: 'Occupied' },
  { id: 'shop-5', name: 'Shop 5', tenant: 'Tea', rent: 4000, status: 'Occupied' },
  { id: 'shop-6', name: 'Shop 6', tenant: 'Bags', rent: 2500, status: 'Occupied' },
];

interface WaterfallBucket {
  id: string;
  label: string;
  target: number;
  monthly?: number;
  icon: React.ReactNode;
  color: string;
}

const waterfallBuckets: WaterfallBucket[] = [
  { id: 'premium', label: 'Premium Recovery', target: 167943, icon: <ShoppingBag className="w-4 h-4" />, color: 'bg-primary' },
  { id: 'sinking', label: '2029 Sinking Fund', monthly: 5400, target: 5400 * 12 * 3, icon: <PiggyBank className="w-4 h-4" />, color: 'bg-accent' },
  { id: 'household', label: 'Household Expenses', monthly: 45000, target: 45000, icon: <Home className="w-4 h-4" />, color: 'bg-success' },
  { id: 'grandma', label: "Grandma's Safety Net", target: 500000, icon: <CheckCircle className="w-4 h-4" />, color: 'bg-warning' },
  { id: 'debt', label: 'ICICI Loan Prepayment (Debt Strike)', target: Infinity, icon: <ArrowDown className="w-4 h-4" />, color: 'bg-destructive' },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

type ActivePage = 'gorantla' | 'guntur';

export function PropertyRentalEngine() {
  const [activePage, setActivePage] = useState<ActivePage>('guntur');

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Button
          variant={activePage === 'guntur' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActivePage('guntur')}
        >
          Guntur Waterfall
        </Button>
        <Button
          variant={activePage === 'gorantla' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActivePage('gorantla')}
        >
          Gorantla (Nagaralu)
        </Button>
      </div>

      {activePage === 'guntur' && <GunturWaterfallPage />}
      {activePage === 'gorantla' && <GorantlaPage />}
    </div>
  );
}

// ─── GORANTLA PAGE ────────────────────────────────────────────────────────────

function GorantlaPage() {
  const [rooms, setRooms] = useState<GorantlaRoom[]>(defaultGorantlaRooms);
  const [grandmaFund, setGrandmaFund] = useState(0);

  const totalRent = rooms.reduce((s, r) => s + r.rent, 0);
  const collectedRent = rooms.filter(r => r.paid).reduce((s, r) => s + r.rent, 0);
  const netAfterDwacra = totalRent - DWACRA_DEDUCTION;
  const surplus = Math.max(0, collectedRent - DWACRA_DEDUCTION);

  const togglePaid = (id: string) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, paid: !r.paid } : r));
  };

  const handleCollectSurplus = () => {
    if (surplus > 0) {
      setGrandmaFund(prev => prev + surplus);
      toast.success(`₹${surplus.toLocaleString()} added to Grandma Care Fund`);
    }
  };

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
                <Button
                  size="sm"
                  variant={room.paid ? 'default' : 'outline'}
                  onClick={() => togglePaid(room.id)}
                  className="h-7 text-xs"
                >
                  {room.paid ? '✓ Paid' : 'Mark Paid'}
                </Button>
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

          {surplus > 0 && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 space-y-2">
              <p className="text-sm font-medium text-success">
                💚 Surplus: {formatCurrency(surplus)} → Grandma Care Fund
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

function GunturWaterfallPage() {
  const [shops, setShops] = useState<GunturShop[]>(defaultGunturShops);
  const [bucketProgress, setBucketProgress] = useState<Record<string, number>>({
    premium: 0, sinking: 0, household: 0, grandma: 0, debt: 0
  });

  const totalRent = shops.reduce((s, sh) => s + sh.rent, 0);

  const shopIcons: Record<string, React.ReactNode> = {
    'Milk': <Droplets className="w-3 h-3" />,
    'Salon': <Scissors className="w-3 h-3" />,
    'Tea': <Coffee className="w-3 h-3" />,
    'Noodles': <ChefHat className="w-3 h-3" />,
    'Bags': <ShoppingBag className="w-3 h-3" />,
  };

  const runWaterfall = () => {
    let remaining = totalRent;
    const newProgress = { ...bucketProgress };

    for (const bucket of waterfallBuckets) {
      if (remaining <= 0) break;
      const monthlyTarget = bucket.monthly ?? bucket.target;
      const fill = Math.min(remaining, monthlyTarget === Infinity ? remaining : monthlyTarget);
      newProgress[bucket.id] = (newProgress[bucket.id] || 0) + fill;
      remaining -= fill;
    }

    setBucketProgress(newProgress);
    toast.success('Waterfall executed! ₹' + (totalRent - remaining).toLocaleString() + ' allocated.');
  };

  const getWaterfallBar = () => {
    let remaining = totalRent;
    return waterfallBuckets.map(bucket => {
      const monthlyTarget = bucket.monthly ?? bucket.target;
      const fill = Math.min(remaining, monthlyTarget === Infinity ? remaining : monthlyTarget);
      remaining -= fill;
      return { ...bucket, fill, pct: totalRent > 0 ? (fill / totalRent) * 100 : 0 };
    });
  };

  const bars = getWaterfallBar();

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
            <Badge variant="outline">Total: {formatCurrency(totalRent)}/mo</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {shops.map(shop => (
              <div
                key={shop.id}
                className={`p-3 rounded-lg border text-sm ${
                  shop.status === 'Vacant'
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{shop.name}</span>
                  {shop.status === 'Vacant' ? (
                    <Badge variant="destructive" className="text-xs">Vacant</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      {shopIcons[shop.tenant]}
                      {shop.tenant}
                    </Badge>
                  )}
                </div>
                <div className="text-primary font-semibold">
                  {shop.status === 'Vacant' ? '—' : formatCurrency(shop.rent)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Waterfall Logic */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-primary" />
              Waterfall Allocation
            </span>
            <Button size="sm" onClick={runWaterfall}>Run Waterfall</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Visual waterfall bar */}
          <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
            {bars.map(bar => (
              <div
                key={bar.id}
                className={`${bar.color} transition-all`}
                style={{ width: `${bar.pct}%` }}
                title={`${bar.label}: ${formatCurrency(bar.fill)}`}
              />
            ))}
          </div>

          {/* Bucket list */}
          <div className="space-y-2">
            {waterfallBuckets.map((bucket, i) => {
              const monthlyTarget = bucket.monthly ?? bucket.target;
              const fill = bars[i].fill;
              const accumulated = bucketProgress[bucket.id] || 0;
              const targetDisplay = bucket.id === 'debt' ? 'Remaining' : formatCurrency(bucket.target);
              const progressPct = bucket.id === 'debt' ? 100 : Math.min(100, (accumulated / bucket.target) * 100);

              return (
                <div key={bucket.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <ArrowRight className="w-3 h-3" />
                      {bucket.icon}
                      {bucket.label}
                    </span>
                    <span className="font-medium text-xs">
                      {formatCurrency(fill)} this month
                    </span>
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
