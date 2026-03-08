import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Clock, Calculator, TrendingUp, IndianRupee, Bell } from 'lucide-react';
import { GlobalSettingsService } from '@/services/GlobalSettingsService';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdvanceTaxInstalment {
  label: string;
  dueDate: string;           // ISO YYYY-MM-DD
  cumulative: number;        // % of annual liability due by this date
  status: 'upcoming' | 'due-soon' | 'overdue' | 'paid';
  daysAway: number;
}

interface TaxSlabOld { limit: number; rate: number; }
interface TaxSlabNew { limit: number; rate: number; }

// FY 2025-26 slabs (India)
const OLD_SLABS: TaxSlabOld[] = [
  { limit: 250000,  rate: 0    },
  { limit: 500000,  rate: 0.05 },
  { limit: 1000000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 },
];
const NEW_SLABS: TaxSlabNew[] = [
  { limit: 300000,  rate: 0    },
  { limit: 600000,  rate: 0.05 },
  { limit: 900000,  rate: 0.10 },
  { limit: 1200000, rate: 0.15 },
  { limit: 1500000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 },
];

function calcTax(income: number, slabs: (TaxSlabOld | TaxSlabNew)[]): number {
  let tax = 0, prev = 0;
  for (const s of slabs) {
    if (income <= prev) break;
    const taxable = Math.min(income, s.limit) - prev;
    tax += taxable * s.rate;
    prev = s.limit;
  }
  return tax;
}

function addSurchargeAndCess(tax: number): number {
  // 4% cess
  return Math.round(tax * 1.04);
}

// Advance tax due dates for FY 2025-26
const ADVANCE_TAX_DATES = [
  { label: '1st Instalment',  dueDate: '2025-06-15', cumulative: 15 },
  { label: '2nd Instalment',  dueDate: '2025-09-15', cumulative: 45 },
  { label: '3rd Instalment',  dueDate: '2025-12-15', cumulative: 75 },
  { label: '4th Instalment (Final)', dueDate: '2026-03-15', cumulative: 100 },
];

function getAdvanceTaxStatus(dueDate: string): { status: AdvanceTaxInstalment['status']; daysAway: number } {
  const due   = new Date(dueDate);
  const today = new Date();
  const diff  = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { status: 'overdue',   daysAway: diff };
  if (diff <= 30) return { status: 'due-soon', daysAway: diff };
  return { status: 'upcoming', daysAway: diff };
}

// ── Advance Tax Section ───────────────────────────────────────────────────────
function AdvanceTaxSection({ annualTaxLiability }: { annualTaxLiability: number }) {
  const instalments: AdvanceTaxInstalment[] = ADVANCE_TAX_DATES.map(d => {
    const { status, daysAway } = getAdvanceTaxStatus(d.dueDate);
    return {
      ...d,
      status,
      daysAway,
    };
  });

  const statusColors: Record<string, string> = {
    overdue:   'border-destructive/40 bg-destructive/5',
    'due-soon':'border-warning/40 bg-warning/5',
    upcoming:  'border-border/60 bg-card/60',
    paid:      'border-success/40 bg-success/5',
  };
  const statusBadge: Record<string, React.ReactNode> = {
    overdue:   <Badge variant="destructive" className="text-[10px]">Overdue</Badge>,
    'due-soon':<Badge className="text-[10px] bg-warning/15 text-warning border-warning/30">Due Soon</Badge>,
    upcoming:  <Badge variant="outline" className="text-[10px]">Upcoming</Badge>,
    paid:      <Badge className="text-[10px] bg-success/15 text-success border-success/30">Paid ✓</Badge>,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Advance Tax Instalments – FY 2025-26</p>
      </div>
      {annualTaxLiability < 10000 ? (
        <Card className="border-success/40 bg-success/5">
          <CardContent className="py-3 px-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <p className="text-sm text-success font-medium">Advance tax not applicable — liability &lt; ₹10,000</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {instalments.map(inst => {
            const amount = Math.round(annualTaxLiability * inst.cumulative / 100);
            return (
              <Card key={inst.label} className={`border ${statusColors[inst.status]}`}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{inst.label}</p>
                      {statusBadge[inst.status]}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Due: {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {inst.daysAway >= 0 ? ` · ${inst.daysAway}d away` : ` · ${Math.abs(inst.daysAway)}d ago`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">₹{amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">{inst.cumulative}% cumulative</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 80CCD(1B) NPS Section ─────────────────────────────────────────────────────
function NPSSection({ taxRegime, npsInvested, onNpsChange }: {
  taxRegime: 'Old' | 'New';
  npsInvested: number;
  onNpsChange: (v: number) => void;
}) {
  const limit       = 50000;
  const remaining   = Math.max(0, limit - npsInvested);
  const pct         = Math.min(100, (npsInvested / limit) * 100);
  const taxSaving   = taxRegime === 'Old' ? Math.min(npsInvested, limit) * 0.30 : 0;

  return (
    <Card className={npsInvested < limit ? 'border-warning/40 bg-warning/5' : 'border-success/40 bg-success/5'}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          80CCD(1B) – NPS Additional Deduction
          {taxRegime === 'New' && <Badge variant="outline" className="text-[10px]">N/A for New Regime</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₹{npsInvested.toLocaleString('en-IN')} invested</span>
            <span>Limit: ₹50,000</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">NPS Tier-1 invested this year (₹)</Label>
          <Input
            type="number"
            value={npsInvested || ''}
            onChange={e => onNpsChange(Number(e.target.value))}
            placeholder="0"
            className="h-8 text-sm"
          />
        </div>
        {remaining > 0 && taxRegime === 'Old' && (
          <div className="flex items-start gap-2 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
            <span className="text-warning">
              Invest ₹{remaining.toLocaleString('en-IN')} more to claim full 80CCD(1B) —
              saves ≈ ₹{Math.round(remaining * 0.30).toLocaleString('en-IN')} in tax (30% slab)
            </span>
          </div>
        )}
        {taxSaving > 0 && (
          <p className="text-xs text-success">✓ Estimated tax saving: ₹{Math.round(taxSaving).toLocaleString('en-IN')}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function TaxEngine() {
  const [taxRegime, setTaxRegime] = useState<'Old' | 'New'>('New');
  const [grossIncome, setGrossIncome] = useState(1200000);
  const [deductions80C, setDeductions80C] = useState(150000);
  const [deductions80D, setDeductions80D] = useState(0);
  const [npsInvested, setNpsInvested] = useState(0);
  const [standardDeduction] = useState(75000); // FY 2025-26
  const [loading, setLoading] = useState(true);
  const [autoLoaded, setAutoLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Regime preference
        const s = await GlobalSettingsService.getGlobalSettings();
        if (s?.taxRegime) setTaxRegime(s.taxRegime);

        // Auto-pull gross income from last 12 months of income records
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - 1);
        const incomes = await db.incomes.toArray();
        const annualIncome = incomes
          .filter((i: any) => new Date(i.date) >= cutoff)
          .reduce((s: number, i: any) => s + (i.amount ?? 0), 0);
        if (annualIncome > 0) setGrossIncome(Math.round(annualIncome));

        // Auto-pull 80C: EPF + PPF + ELSS investments this FY
        const fyStart = new Date(new Date().getMonth() >= 3
          ? new Date().getFullYear() : new Date().getFullYear() - 1, 3, 1);
        const investments = await db.investments.toArray();
        const c80 = investments
          .filter((inv: any) => {
            const d = inv.startDate ?? inv.purchaseDate ?? inv.createdAt;
            return d && new Date(d) >= fyStart &&
              ['EPF', 'PPF', 'MF-Growth', 'SIP'].includes(inv.type ?? '');
          })
          .reduce((s: number, inv: any) => s + (inv.investedValue ?? inv.amount ?? 0), 0);
        if (c80 > 0) setDeductions80C(Math.min(150000, Math.round(c80)));

        // Auto-pull 80D: personal insurance premiums (personal-pay only)
        const policies = await db.insurancePolicies?.toArray() ?? [];
        const d80 = policies
          .filter((p: any) => {
            const src = p.policySource ?? '';
            return src === 'Personal' || (!p.isCorporate && src !== 'Corporate / Employer' && src !== 'Government Scheme');
          })
          .reduce((s: number, p: any) => s + (p.premium ?? 0), 0);
        if (d80 > 0) setDeductions80D(Math.min(100000, Math.round(d80)));

        // Auto-pull NPS from investments
        const nps = investments
          .filter((inv: any) => (inv.type ?? '').startsWith('NPS') && inv.startDate && new Date(inv.startDate) >= fyStart)
          .reduce((s: number, inv: any) => s + (inv.investedValue ?? 0), 0);
        if (nps > 0) setNpsInvested(Math.min(50000, Math.round(nps)));

        setAutoLoaded(true);
      } catch {}
      setLoading(false);
    }
    loadData();
  }, []);

  const handleRegimeChange = async (v: 'Old' | 'New') => {
    setTaxRegime(v);
    await GlobalSettingsService.updateGlobalSettings({ taxRegime: v });
    toast.success(`Tax regime updated to ${v}`);
  };

  // Note: user is on New Regime, so 80C/80D not applicable for final tax
  // but we still compute Old regime for comparison
  const oldTaxableIncome = Math.max(0, grossIncome - standardDeduction - deductions80C - Math.min(npsInvested, 50000) - deductions80D);
  const oldTax           = addSurchargeAndCess(calcTax(oldTaxableIncome, OLD_SLABS));

  // New regime: only standard deduction applies
  const newTaxableIncome = Math.max(0, grossIncome - standardDeduction);
  const newTax           = addSurchargeAndCess(calcTax(newTaxableIncome, NEW_SLABS));

  const saving = Math.abs(oldTax - newTax);
  const betterRegime = oldTax <= newTax ? 'Old' : 'New';
  const currentTax   = taxRegime === 'Old' ? oldTax : newTax;

  if (loading) return <div className="p-6 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Tax Engine</h1>
          <p className="text-xs text-muted-foreground">FY 2025-26 · Advance tax reminders + regime comparison</p>
        </div>
        <Select value={taxRegime} onValueChange={handleRegimeChange as any}>
          <SelectTrigger className="ml-auto w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="New">New Regime</SelectItem>
            <SelectItem value="Old">Old Regime</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="advance">
        <TabsList className="w-full">
          <TabsTrigger value="advance" className="flex-1 text-xs">Advance Tax</TabsTrigger>
          <TabsTrigger value="compare" className="flex-1 text-xs">Regime Compare</TabsTrigger>
          <TabsTrigger value="nps"     className="flex-1 text-xs">80CCD(1B)</TabsTrigger>
        </TabsList>

        {/* ── Advance Tax Tab ───────────────────────────────────── */}
        <TabsContent value="advance" className="space-y-4 mt-3">
          {autoLoaded && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success/8 border border-success/20 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Auto-loaded: income from DB · 80C from EPF/PPF/SIP · 80D from personal insurance premiums
            </div>
          )}
          <Card>
            <CardContent className="pt-4 pb-4 px-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Annual Gross Income (₹)</Label>
                <Input type="number" value={grossIncome || ''} onChange={e => setGrossIncome(Number(e.target.value))} className="h-8 text-sm" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <span className="text-xs text-muted-foreground">Estimated Annual Tax Liability</span>
                <span className="text-base font-bold text-foreground">₹{currentTax.toLocaleString('en-IN')}</span>
              </div>
            </CardContent>
          </Card>
          <AdvanceTaxSection annualTaxLiability={currentTax} />
        </TabsContent>

        {/* ── Regime Compare Tab ───────────────────────────────── */}
        <TabsContent value="compare" className="space-y-4 mt-3">
          <Card>
            <CardContent className="pt-4 pb-4 px-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Gross Income (₹)</Label>
                  <Input type="number" value={grossIncome || ''} onChange={e => setGrossIncome(Number(e.target.value))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">80C Deductions (₹) <span className="text-muted-foreground">(Old regime)</span></Label>
                  <Input type="number" value={deductions80C || ''} onChange={e => setDeductions80C(Number(e.target.value))} className="h-8 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">80D Health Insurance Premium (₹) <span className="text-muted-foreground">(Old regime)</span></Label>
                <Input type="number" value={deductions80D || ''} onChange={e => setDeductions80D(Number(e.target.value))} className="h-8 text-sm" />
              </div>
              {taxRegime === 'New' && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  You are on New Regime — 80C/80D not deductible. Shown here for Old vs New comparison only.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Comparison cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Old Regime', tax: oldTax, taxable: oldTaxableIncome, regime: 'Old' as const },
              { label: 'New Regime', tax: newTax, taxable: newTaxableIncome, regime: 'New' as const },
            ].map(({ label, tax, taxable, regime }) => {
              const isBetter  = regime === betterRegime;
              const isCurrent = regime === taxRegime;
              return (
                <Card key={regime} className={`relative ${isBetter ? 'border-success/50 bg-success/5' : 'border-border/60'}`}>
                  {isBetter && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="text-[10px] bg-success text-success-foreground">Saves More</Badge>
                    </div>
                  )}
                  <CardContent className="pt-5 pb-4 px-4 text-center space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold text-foreground">₹{tax.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">Taxable: ₹{taxable.toLocaleString('en-IN')}</p>
                    {isCurrent && <Badge variant="outline" className="text-[10px] mt-1">Active</Badge>}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <IndianRupee className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {betterRegime} Regime saves you ₹{saving.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {taxRegime === betterRegime
                    ? '✓ You are already on the optimal regime'
                    : `Consider switching to ${betterRegime} regime`}
                </p>
              </div>
              {taxRegime !== betterRegime && (
                <Button size="sm" className="ml-auto text-xs" onClick={() => handleRegimeChange(betterRegime)}>
                  Switch
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── NPS Tab ───────────────────────────────────────────── */}
        <TabsContent value="nps" className="mt-3">
          <NPSSection taxRegime={taxRegime} npsInvested={npsInvested} onNpsChange={setNpsInvested} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
