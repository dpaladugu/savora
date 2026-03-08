/**
 * FinancialSetupWizard — 5-step guided onboarding to capture all baseline data
 * Steps: Salary → Rental → Emergency Fund → Loan Balances → Done
 * Saves directly to Dexie; auto-skips if data already exists.
 */
import React, { useState } from 'react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';
import {
  Banknote, Home, Shield, Landmark, CheckCircle2,
  ChevronRight, ChevronLeft, SkipForward
} from 'lucide-react';

interface Props { onComplete: () => void; }

type StepId = 'salary' | 'rental' | 'emergency' | 'loans' | 'done';

const STEPS: { id: StepId; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'salary',    label: 'Salary',         icon: Banknote,  color: 'text-success'     },
  { id: 'rental',    label: 'Rental Income',  icon: Home,      color: 'text-warning'     },
  { id: 'emergency', label: 'Emergency Fund', icon: Shield,    color: 'text-primary'     },
  { id: 'loans',     label: 'Loan Balances',  icon: Landmark,  color: 'text-destructive' },
  { id: 'done',      label: 'All Set',        icon: CheckCircle2, color: 'text-success'  },
];

interface FormState {
  // Step 1 — Salary
  monthlySalary: string;
  salaryDate: string;
  // Step 2 — Rental
  gunturShopsRent: string;      // total from 6 shops
  gorantlaRoomsRent: string;    // total from 4 rooms
  otherIncome: string;
  // Step 3 — Emergency fund
  efCurrentCorpus: string;
  efMonthlyExpenses: string;
  efTargetMonths: string;
  // Step 4 — Loans
  incredOutstanding: string;
  icicOutstanding: string;
}

const DEFAULT: FormState = {
  monthlySalary:      '',
  salaryDate:         new Date().toISOString().split('T')[0],
  gunturShopsRent:    '',
  gorantlaRoomsRent:  '',
  otherIncome:        '',
  efCurrentCorpus:    '',
  efMonthlyExpenses:  '',
  efTargetMonths:     '12',
  incredOutstanding:  '1021156',
  icicOutstanding:    '3300000',
};

export function FinancialSetupWizard({ onComplete }: Props) {
  const [step, setStep]   = useState(0);
  const [form, setForm]   = useState<FormState>(DEFAULT);
  const [saving, setSaving] = useState(false);

  const stepDef = STEPS[step];
  const progress = (step / (STEPS.length - 1)) * 100;

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const prev = () => setStep(s => Math.max(0, s - 1));
  const skip = () => setStep(s => Math.min(STEPS.length - 1, s + 1));

  // ── Save & advance ────────────────────────────────────────────────────────
  const saveAndNext = async () => {
    setSaving(true);
    try {
      const now = new Date();

      if (stepDef.id === 'salary') {
        const salary = parseFloat(form.monthlySalary);
        if (salary > 0) {
          // Record salary as a recurring income entry for this month
          const salaryDate = form.salaryDate ? new Date(form.salaryDate) : now;
          await db.incomes.add({
            id: crypto.randomUUID(),
            amount: salary,
            category: 'Salary',
            sourceName: 'Monthly Salary',
            description: 'Monthly Salary',
            frequency: 'monthly',
            date: salaryDate,
            createdAt: now,
            updatedAt: now,
          });
          toast.success(`Salary ₹${salary.toLocaleString('en-IN')} recorded`);
        }
      }

      if (stepDef.id === 'rental') {
        const entries: { amount: number; source: string }[] = [];
        const shops = parseFloat(form.gunturShopsRent);
        const rooms = parseFloat(form.gorantlaRoomsRent);
        const other = parseFloat(form.otherIncome);
        if (shops > 0) entries.push({ amount: shops, source: 'Guntur Shops Rent' });
        if (rooms > 0) entries.push({ amount: rooms, source: 'Gorantla Rooms Rent' });
        if (other > 0) entries.push({ amount: other, source: 'Other Income' });

        for (const e of entries) {
          await db.incomes.add({
            id: crypto.randomUUID(),
            amount: e.amount,
            category: 'Rental Income',
            sourceName: e.source,
            description: e.source,
            frequency: 'monthly',
            date: now,
            createdAt: now,
            updatedAt: now,
          });
        }
        if (entries.length) toast.success(`${entries.length} rental income source(s) recorded`);
      }

      if (stepDef.id === 'emergency') {
        const corpus   = parseFloat(form.efCurrentCorpus);
        const expenses = parseFloat(form.efMonthlyExpenses);
        const months   = parseInt(form.efTargetMonths) || 12;
        if (corpus > 0 || expenses > 0) {
          const target = expenses * months;
          // Upsert: remove any existing EF and create fresh
          const existing = await db.emergencyFunds.toArray();
          if (existing.length > 0) {
            await db.emergencyFunds.update(existing[0].id, {
              currentAmount: corpus || existing[0].currentAmount,
              targetAmount:  target || existing[0].targetAmount,
              monthlyExpenses: expenses || existing[0].monthlyExpenses,
              targetMonths: months,
              updatedAt: now,
            });
          } else {
            await db.emergencyFunds.add({
              id: crypto.randomUUID(),
              name: 'Emergency Fund',
              currentAmount: corpus,
              targetAmount: target,
              targetMonths: months,
              monthlyExpenses: expenses,
              lastReviewDate: now,
              status: corpus >= target ? 'Achieved' : corpus >= target * 0.5 ? 'OnTrack' : 'Under-Target',
              medicalSubBucket: 0,
              medicalSubBucketUsed: 0,
              createdAt: now,
              updatedAt: now,
            });
          }
          toast.success('Emergency Fund saved');
        }
      }

      if (stepDef.id === 'loans') {
        const incredAmt = parseFloat(form.incredOutstanding);
        const icicAmt   = parseFloat(form.icicOutstanding);
        if (incredAmt > 0) {
          await db.loans.update('loan-incred-2026', { outstanding: incredAmt, updatedAt: now });
        }
        if (icicAmt > 0) {
          await db.loans.update('loan-icici-master-2026', { outstanding: icicAmt, updatedAt: now });
        }
        toast.success('Loan balances updated');
      }

      setStep(s => Math.min(STEPS.length - 1, s + 1));
    } catch (err) {
      console.error(err);
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Summary card (last step) ───────────────────────────────────────────────
  const totalMonthlyIncome =
    (parseFloat(form.monthlySalary)     || 0) +
    (parseFloat(form.gunturShopsRent)   || 0) +
    (parseFloat(form.gorantlaRoomsRent) || 0) +
    (parseFloat(form.otherIncome)       || 0);
  const efTarget   = (parseFloat(form.efMonthlyExpenses) || 0) * (parseInt(form.efTargetMonths) || 12);
  const efCurrent  = parseFloat(form.efCurrentCorpus) || 0;
  const efPct      = efTarget > 0 ? Math.min(100, (efCurrent / efTarget) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl mx-auto mb-3"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}>
            <span className="text-xl font-bold text-white">S</span>
          </div>
          <h1 className="text-xl font-black text-foreground">Financial Setup</h1>
          <p className="text-xs text-muted-foreground">Enter your baseline data — takes ~2 minutes</p>
        </div>

        {/* Step progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
            <p className="text-xs font-semibold text-foreground">{stepDef.label}</p>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="flex justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.id} className={`flex flex-col items-center gap-0.5 ${i <= step ? 'opacity-100' : 'opacity-30'}`}>
                  <Icon className={`h-3.5 w-3.5 ${i <= step ? s.color : 'text-muted-foreground'}`} />
                  <span className="text-[9px] text-muted-foreground hidden sm:block">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Step content ──────────────────────────────────────────────────── */}
        <Card className="border-border/60">
          <CardContent className="pt-5 space-y-4">

            {/* STEP 1 — SALARY */}
            {stepDef.id === 'salary' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Banknote className="h-5 w-5 text-success" />
                  <h2 className="text-base font-bold">Your Monthly Salary</h2>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">This unlocks the surplus calc, debt-freedom countdown, and savings rate.</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Net Monthly Salary (in-hand, ₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input className="pl-7" type="number" step="1000" placeholder="85000"
                        value={form.monthlySalary} onChange={set('monthlySalary')} autoFocus />
                    </div>
                    {form.monthlySalary && (
                      <p className="text-xs text-success font-medium">{formatCurrency(parseFloat(form.monthlySalary) || 0)} / month</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Salary Credit Date (most recent)</Label>
                    <Input type="date" value={form.salaryDate} onChange={set('salaryDate')} />
                  </div>
                </div>
              </>
            )}

            {/* STEP 2 — RENTAL */}
            {stepDef.id === 'rental' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Home className="h-5 w-5 text-warning" />
                  <h2 className="text-base font-bold">Rental Income</h2>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">Used in the Guntur Waterfall allocation engine.</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>6 Guntur Shops — Total Rent/mo (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input className="pl-7" type="number" step="500" placeholder="18000"
                        value={form.gunturShopsRent} onChange={set('gunturShopsRent')} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Enter 0 if currently vacant</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>4 Gorantla Rooms — Total Rent/mo (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input className="pl-7" type="number" step="500" placeholder="8000"
                        value={form.gorantlaRoomsRent} onChange={set('gorantlaRoomsRent')} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Excludes DWACRA ₹5,000 deduction (handled in Waterfall)</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Other Income/mo (₹) — freelance, SGB coupon, etc.</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input className="pl-7" type="number" step="100"
                        value={form.otherIncome} onChange={set('otherIncome')} />
                    </div>
                  </div>
                  {totalMonthlyIncome > 0 && (
                    <div className="p-2.5 rounded-xl bg-success/10 border border-success/20 text-xs">
                      <p className="font-semibold text-success">Total monthly income so far:</p>
                      <p className="font-black text-success text-base">{formatCurrency(totalMonthlyIncome)}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* STEP 3 — EMERGENCY FUND */}
            {stepDef.id === 'emergency' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold">Emergency Fund</h2>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">Target = monthly expenses × months. Antifragile target is 12 months.</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Current EF Corpus (₹) — liquid savings</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input className="pl-7" type="number" step="1000"
                        value={form.efCurrentCorpus} onChange={set('efCurrentCorpus')} autoFocus />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Monthly Essential Expenses (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input className="pl-7" type="number" step="1000" placeholder="45000"
                        value={form.efMonthlyExpenses} onChange={set('efMonthlyExpenses')} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Include rent, EMIs, groceries, utilities — not discretionary</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target Months</Label>
                    <div className="flex gap-2">
                      {[3, 6, 9, 12].map(m => (
                        <button key={m} type="button"
                          onClick={() => setForm(p => ({ ...p, efTargetMonths: String(m) }))}
                          className={`flex-1 h-9 rounded-xl text-xs font-semibold border transition-all ${
                            form.efTargetMonths === String(m)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card border-border/60 text-muted-foreground hover:border-primary/40'
                          }`}
                        >{m}mo</button>
                      ))}
                    </div>
                  </div>
                  {efTarget > 0 && (
                    <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Target ({form.efTargetMonths}mo)</span>
                        <span className="font-bold text-primary">{formatCurrency(efTarget)}</span>
                      </div>
                      <Progress value={efPct} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground">
                        {efPct >= 100 ? '✅ Target achieved' : `${formatCurrency(efTarget - efCurrent)} shortfall`}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* STEP 4 — LOAN BALANCES */}
            {stepDef.id === 'loans' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Landmark className="h-5 w-5 text-destructive" />
                  <h2 className="text-base font-bold">Loan Outstanding Balances</h2>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">Confirm current outstanding — critical for accurate Debt Strike kill dates.</p>
                <div className="space-y-4">
                  <div className="p-3 rounded-xl border border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">InCred Education Loan</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">14.2% ROI · EMI ₹32,641</span>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Current Outstanding (₹)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                        <Input className="pl-7" type="number" step="1000"
                          value={form.incredOutstanding} onChange={set('incredOutstanding')} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Check InCred loan account / statement</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">ICICI Master Loan</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning">9.99% ROI · EMI ₹61,424</span>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Current Outstanding (₹)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                        <Input className="pl-7" type="number" step="1000"
                          value={form.icicOutstanding} onChange={set('icicOutstanding')} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">First EMI: April 5, 2026</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-destructive/5 border border-destructive/20 text-xs">
                    <p className="text-muted-foreground">Total debt</p>
                    <p className="font-black text-destructive text-base">
                      {formatCurrency((parseFloat(form.incredOutstanding) || 0) + (parseFloat(form.icicOutstanding) || 0))}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* STEP 5 — DONE */}
            {stepDef.id === 'done' && (
              <div className="text-center space-y-4 py-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto bg-success/10">
                  <CheckCircle2 className="h-9 w-9 text-success" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">Baseline Set! 🎉</h2>
                  <p className="text-xs text-muted-foreground mt-1">Your dashboard now has real numbers to work with.</p>
                </div>
                <div className="space-y-2 text-left">
                  {[
                    { label: 'Monthly Income', val: formatCurrency(totalMonthlyIncome), show: totalMonthlyIncome > 0 },
                    { label: 'Emergency Fund', val: `${formatCurrency(efCurrent)} / ${formatCurrency(efTarget)} (${efPct.toFixed(0)}%)`, show: efCurrent > 0 },
                    { label: 'Total Debt',     val: formatCurrency((parseFloat(form.incredOutstanding)||0)+(parseFloat(form.icicOutstanding)||0)), show: true },
                  ].filter(r => r.show).map(r => (
                    <div key={r.label} className="flex justify-between items-center px-3 py-2 rounded-xl bg-muted/40">
                      <span className="text-xs text-muted-foreground">{r.label}</span>
                      <span className="text-xs font-bold text-foreground">{r.val}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Next: Enter your investments (SIP/EPF/PPF/NPS/SGB) in the Investments tab.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        {stepDef.id !== 'done' ? (
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" className="flex-1 h-11 rounded-xl gap-1.5" onClick={prev} disabled={saving}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
            <Button variant="ghost" className="h-11 px-3 rounded-xl text-muted-foreground" onClick={skip} disabled={saving}>
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button className="flex-1 h-11 rounded-xl gap-1.5 font-semibold" onClick={saveAndNext} disabled={saving}>
              {saving ? 'Saving…' : step === STEPS.length - 2 ? 'Save & Finish' : 'Save & Continue'}
              {!saving && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <Button
            className="w-full h-12 rounded-2xl text-sm font-bold gap-2"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
            onClick={onComplete}
          >
            Go to Dashboard <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        <p className="text-[11px] text-muted-foreground/60 text-center">
          You can update these values anytime from the relevant modules.
        </p>
      </div>
    </div>
  );
}
