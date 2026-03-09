import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  AlertTriangle, CheckCircle2, Clock, Calculator,
  TrendingUp, IndianRupee, Bell, Info,
} from 'lucide-react';
import { GlobalSettingsService } from '@/services/GlobalSettingsService';

// ── Constants ─────────────────────────────────────────────────────────────────
/** Standard deduction FY 2025-26 New Regime */
const STD_DEDUCTION = 75_000;

/**
 * FY 2025-26 New Regime slabs (post-Budget 2024 – applicable from AY 2025-26).
 * Up to ₹7L: nil after rebate u/s 87A.
 */
const NEW_SLABS = [
  { limit: 300_000,  rate: 0    },
  { limit: 600_000,  rate: 0.05 },
  { limit: 900_000,  rate: 0.10 },
  { limit: 1_200_000, rate: 0.15 },
  { limit: 1_500_000, rate: 0.20 },
  { limit: Infinity,  rate: 0.30 },
];

/** Old Regime slabs — kept only for informational "comparison" display */
const OLD_SLABS = [
  { limit: 250_000,  rate: 0    },
  { limit: 500_000,  rate: 0.05 },
  { limit: 1_000_000, rate: 0.20 },
  { limit: Infinity,  rate: 0.30 },
];

// ── Advance-tax schedule FY 2025-26 ──────────────────────────────────────────
const ADVANCE_TAX_DATES = [
  { label: '1st Instalment',        dueDate: '2025-06-15', cumulative: 15  },
  { label: '2nd Instalment',        dueDate: '2025-09-15', cumulative: 45  },
  { label: '3rd Instalment',        dueDate: '2025-12-15', cumulative: 75  },
  { label: '4th Instalment (Final)', dueDate: '2026-03-15', cumulative: 100 },
];

// ── Pure helpers ──────────────────────────────────────────────────────────────
function calcTax(income: number, slabs: { limit: number; rate: number }[]): number {
  let tax = 0, prev = 0;
  for (const s of slabs) {
    if (income <= prev) break;
    tax += (Math.min(income, s.limit) - prev) * s.rate;
    prev = s.limit;
  }
  return tax;
}

/** 4% health & education cess */
function withCess(tax: number) { return Math.round(tax * 1.04); }

/**
 * Section 87A rebate (New Regime FY 2025-26):
 * Full rebate if net taxable ≤ ₹7,00,000 → tax = 0.
 */
function applyRebate87A(tax: number, taxableIncome: number): number {
  if (taxableIncome <= 7_00_000) return 0;
  return tax;
}

function advanceTaxStatus(dueDate: string) {
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000);
  if (diff < 0)   return { status: 'overdue'  as const, daysAway: diff };
  if (diff <= 30) return { status: 'due-soon' as const, daysAway: diff };
  return           { status: 'upcoming'  as const, daysAway: diff };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function AdvanceTaxSection({ annualTaxLiability }: { annualTaxLiability: number }) {
  const statusColors = {
    overdue:  'border-destructive/40 bg-destructive/5',
    'due-soon': 'border-warning/40 bg-warning/5',
    upcoming: 'border-border/60 bg-card/60',
    paid:     'border-success/40 bg-success/5',
  };
  const statusBadge: Record<string, React.ReactNode> = {
    overdue:    <Badge variant="destructive" className="text-[10px]">Overdue</Badge>,
    'due-soon': <Badge className="text-[10px] bg-warning/15 text-warning border-warning/30">Due Soon</Badge>,
    upcoming:   <Badge variant="outline" className="text-[10px]">Upcoming</Badge>,
    paid:       <Badge className="text-[10px] bg-success/15 text-success border-success/30">Paid ✓</Badge>,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Advance Tax Instalments – FY 2025-26</p>
      </div>
      {annualTaxLiability < 10_000 ? (
        <Card className="border-success/40 bg-success/5">
          <CardContent className="py-3 px-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <p className="text-sm text-success font-medium">
              Advance tax not applicable — liability &lt; ₹10,000
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {ADVANCE_TAX_DATES.map(d => {
            const { status, daysAway } = advanceTaxStatus(d.dueDate);
            const amount = Math.round(annualTaxLiability * d.cumulative / 100);
            return (
              <Card key={d.label} className={`border ${statusColors[status]}`}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{d.label}</p>
                      {statusBadge[status]}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Due: {new Date(d.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {daysAway >= 0 ? ` · ${daysAway}d away` : ` · ${Math.abs(daysAway)}d ago`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">₹{amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">{d.cumulative}% cumulative</p>
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

/** NPS 80CCD(2) — employer contribution deductible even in New Regime (up to 10% of salary) */
function NPSNewRegimeSection({ employerNPS, onEmployerNPSChange, grossIncome }: {
  employerNPS: number;
  onEmployerNPSChange: (v: number) => void;
  grossIncome: number;
}) {
  const limit    = Math.round(grossIncome * 0.10);
  const eligible = Math.min(employerNPS, limit);
  const pct      = limit > 0 ? Math.min(100, (employerNPS / limit) * 100) : 0;
  const taxSaving = withCess(calcTax(eligible, NEW_SLABS));

  return (
    <Card className={employerNPS > 0 ? 'border-success/40 bg-success/5' : 'border-border/60'}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          80CCD(2) – Employer NPS Contribution
          <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30 border">New Regime OK</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>
            Employer's NPS contribution (80CCD(2)) is deductible in the <strong>New Regime</strong> — up to 10% of Basic + DA.
            Your own (employee) NPS contribution (80CCD(1B)) is <strong>not deductible</strong> in New Regime.
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₹{employerNPS.toLocaleString('en-IN')} employer contribution</span>
            <span>10% limit: ₹{limit.toLocaleString('en-IN')}</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Employer NPS contribution this FY (₹)</Label>
          <Input
            type="number"
            value={employerNPS || ''}
            onChange={e => onEmployerNPSChange(Number(e.target.value))}
            placeholder="0"
            className="h-8 text-sm"
          />
        </div>
        {eligible > 0 && (
          <p className="text-xs text-success">
            ✓ Deductible: ₹{eligible.toLocaleString('en-IN')} · estimated tax saving ≈ ₹{taxSaving.toLocaleString('en-IN')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function TaxEngine() {
  const [grossIncome,  setGrossIncome]  = useState(1_200_000);
  const [employerNPS,  setEmployerNPS]  = useState(0);
  // Old-regime comparison inputs (display-only, not used to compute user's actual tax)
  const [deductions80C, setDeductions80C] = useState(150_000);
  const [deductions80D, setDeductions80D] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [autoLoaded,   setAutoLoaded]   = useState(false);

  // ── FY helpers ────────────────────────────────────────────────────────────────
  const fyStart = new Date(
    new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1, 3, 1
  );
  const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31);
  const fyMonthsElapsed = Math.max(1,
    Math.round((Date.now() - fyStart.getTime()) / (1000 * 60 * 60 * 24 * 30.4))
  );
  const fyProgressPct = Math.min(100, Math.round((fyMonthsElapsed / 12) * 100));

  useEffect(() => {
    async function loadData() {
      try {
        const s = await GlobalSettingsService.getGlobalSettings();
        // Enforce New Regime
        if (s && s.taxRegime !== 'New') {
          await GlobalSettingsService.updateGlobalSettings({ taxRegime: 'New' });
        }

        // 1. Priority: annualIncome from globalSettings (set by user in profile)
        const settingsIncome = (s as any)?.annualIncome ?? 0;

        // 2. Fallback: sum FY income from db.incomes
        const incomes = await db.incomes.toArray();
        const fyIncome = incomes
          .filter((i: any) => {
            const d = new Date(i.date);
            return d >= fyStart && d <= fyEnd;
          })
          .reduce((sum: number, i: any) => sum + (i.amount ?? 0), 0);

        // 3. Last resort: trailing 12-month income from DB
        const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 1);
        const ttmIncome = incomes
          .filter((i: any) => new Date(i.date) >= cutoff)
          .reduce((sum: number, i: any) => sum + (i.amount ?? 0), 0);

        const resolvedIncome = settingsIncome || fyIncome || ttmIncome;
        if (resolvedIncome > 0) setGrossIncome(Math.round(resolvedIncome));

        // Auto-pull 80C (comparison only)
        const investments = await db.investments.toArray();
        const c80 = investments
          .filter((inv: any) => {
            const d = inv.startDate ?? inv.purchaseDate ?? inv.createdAt;
            return d && new Date(d) >= fyStart && ['EPF', 'PPF', 'MF-Growth', 'SIP'].includes(inv.type ?? '');
          })
          .reduce((s: number, inv: any) => s + (inv.investedValue ?? inv.amount ?? 0), 0);
        if (c80 > 0) setDeductions80C(Math.min(150_000, Math.round(c80)));

        // Auto-pull 80D (comparison only)
        const policies = await db.insurancePolicies?.toArray() ?? [];
        const d80 = policies
          .filter((p: any) => {
            const src = p.policySource ?? '';
            return src === 'Personal' || (!p.isCorporate && src !== 'Corporate / Employer' && src !== 'Government Scheme');
          })
          .reduce((s: number, p: any) => s + (p.premium ?? 0), 0);
        if (d80 > 0) setDeductions80D(Math.min(100_000, Math.round(d80)));

        // Auto-pull employer NPS
        const npsEmp = investments
          .filter((inv: any) => (inv.type ?? '').startsWith('NPS') && (inv.subType ?? '') === 'employer'
            && inv.startDate && new Date(inv.startDate) >= fyStart)
          .reduce((s: number, inv: any) => s + (inv.investedValue ?? 0), 0);
        if (npsEmp > 0) setEmployerNPS(Math.min(Math.round(grossIncome * 0.10), Math.round(npsEmp)));

        setAutoLoaded(true);
      } catch (e) { console.warn('TaxEngine load error:', e); }
      setLoading(false);
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tax calculations ─────────────────────────────────────────────────────────
  // NEW REGIME (user's actual tax):
  // Deductions: Standard ₹75k + 80CCD(2) employer NPS only
  const newTaxableIncome = Math.max(0, grossIncome - STD_DEDUCTION - Math.min(employerNPS, Math.round(grossIncome * 0.10)));
  const newTaxBeforeRebate = calcTax(newTaxableIncome, NEW_SLABS);
  const newTaxAfterRebate  = applyRebate87A(newTaxBeforeRebate, newTaxableIncome);
  const newTax             = withCess(newTaxAfterRebate);

  // OLD REGIME (comparison only — shown so user sees what they'd owe if they switched):
  const oldTaxableIncome = Math.max(0, grossIncome - STD_DEDUCTION - deductions80C - deductions80D);
  const oldTax           = withCess(calcTax(oldTaxableIncome, OLD_SLABS));

  const saving       = Math.abs(newTax - oldTax);
  const betterRegime = newTax <= oldTax ? 'New' : 'Old';

  if (loading) return <div className="p-6 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Tax Engine</h1>
          <p className="text-xs text-muted-foreground">FY 2025-26 · New Regime · Standard deduction ₹75,000</p>
        </div>
        <Badge className="ml-auto bg-primary/15 text-primary border-primary/30 border text-xs">New Regime</Badge>
      </div>

      {/* ── New Regime notice ────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-primary/8 border border-primary/20 text-xs text-primary">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          You are on the <strong>New Tax Regime</strong>. Deductions like 80C (ELSS, PPF, LIC) and 80D (health
          insurance premiums) are <strong>not applicable</strong>. Only the ₹75,000 standard deduction and employer
          NPS contribution (80CCD(2)) reduce your taxable income.
        </p>
      </div>

      {autoLoaded && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success/8 border border-success/20 text-xs text-success">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Auto-loaded from DB · Settings income priority → FY income → trailing 12M
        </div>
      )}

      {/* ── FY progress bar ── */}
      <Card className="glass border-border/40">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">FY 2025-26 Progress</span>
            <span className="tabular-nums font-semibold">{fyProgressPct}% elapsed</span>
          </div>
          <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${fyProgressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Apr 2025</span>
            <span className="font-medium text-foreground">
              ₹{(grossIncome / 1_00_000).toFixed(1)}L income · ₹{(newTax / 1000).toFixed(0)}k tax
            </span>
            <span>Mar 2026</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="advance">
        <TabsList className="w-full">
          <TabsTrigger value="advance" className="flex-1 text-xs">Advance Tax</TabsTrigger>
          <TabsTrigger value="compare" className="flex-1 text-xs">Old vs New</TabsTrigger>
          <TabsTrigger value="nps"     className="flex-1 text-xs">80CCD(2)</TabsTrigger>
        </TabsList>

        {/* ── Advance Tax ───────────────────────────────────────────────────── */}
        <TabsContent value="advance" className="space-y-4 mt-3">
          <Card>
            <CardContent className="pt-4 pb-4 px-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Annual Gross Income (₹)</Label>
                <Input
                  type="number"
                  value={grossIncome || ''}
                  onChange={e => setGrossIncome(Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/40">
                  <p className="text-[10px] text-muted-foreground">Gross Income</p>
                  <p className="font-semibold tabular-nums">₹{grossIncome.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40">
                  <p className="text-[10px] text-muted-foreground">Std. Deduction</p>
                  <p className="font-semibold tabular-nums">−₹{STD_DEDUCTION.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/8">
                  <p className="text-[10px] text-primary">Net Taxable</p>
                  <p className="font-semibold text-primary tabular-nums">₹{newTaxableIncome.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {newTaxableIncome <= 7_00_000 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/8 border border-success/20 text-xs text-success">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  87A Rebate applies — taxable income ≤ ₹7L → <strong>Zero tax liability</strong>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <span className="text-xs text-muted-foreground">Annual Tax Liability (incl. 4% cess)</span>
                <span className="text-base font-bold tabular-nums">₹{newTax.toLocaleString('en-IN')}</span>
              </div>
            </CardContent>
          </Card>
          <AdvanceTaxSection annualTaxLiability={newTax} />
        </TabsContent>

        {/* ── Old vs New comparison ─────────────────────────────────────────── */}
        <TabsContent value="compare" className="space-y-4 mt-3">
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/40 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>
              These inputs are used <strong>only for comparison</strong>. Since you are on the New Regime,
              80C and 80D deductions do not reduce your actual tax bill.
            </p>
          </div>
          <Card>
            <CardContent className="pt-4 pb-4 px-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Gross Income (₹)</Label>
                  <Input type="number" value={grossIncome || ''} onChange={e => setGrossIncome(Number(e.target.value))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">80C Deductions (₹) <span className="text-muted-foreground">[Old only]</span></Label>
                  <Input type="number" value={deductions80C || ''} onChange={e => setDeductions80C(Math.min(150_000, Number(e.target.value)))} className="h-8 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">80D Health Premium (₹) <span className="text-muted-foreground">[Old only]</span></Label>
                <Input type="number" value={deductions80D || ''} onChange={e => setDeductions80D(Math.min(100_000, Number(e.target.value)))} className="h-8 text-sm" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            {([
              { label: 'Old Regime', tax: oldTax, taxable: oldTaxableIncome, isUser: false },
              { label: 'New Regime', tax: newTax, taxable: newTaxableIncome, isUser: true  },
            ] as const).map(({ label, tax, taxable, isUser }) => {
              const isBetter = label === (newTax <= oldTax ? 'New Regime' : 'Old Regime');
              return (
                <Card key={label} className={`relative ${isBetter ? 'border-success/50 bg-success/5' : 'border-border/60'}`}>
                  {isBetter && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="text-[10px] bg-success text-success-foreground">Saves More</Badge>
                    </div>
                  )}
                  <CardContent className="pt-5 pb-4 px-4 text-center space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold tabular-nums">₹{tax.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">Taxable: ₹{taxable.toLocaleString('en-IN')}</p>
                    {isUser && <Badge variant="outline" className="text-[10px] mt-1">Your Regime ✓</Badge>}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <IndianRupee className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  {betterRegime} Regime saves ₹{saving.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {betterRegime === 'New'
                    ? '✓ New Regime is optimal for you — no action needed'
                    : 'Old Regime would save more — but only if you maximise deductions (80C + 80D)'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 80CCD(2) NPS Tab ─────────────────────────────────────────────── */}
        <TabsContent value="nps" className="mt-3">
          <NPSNewRegimeSection
            employerNPS={employerNPS}
            onEmployerNPSChange={setEmployerNPS}
            grossIncome={grossIncome}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
