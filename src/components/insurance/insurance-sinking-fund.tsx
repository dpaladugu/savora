/**
 * InsuranceSinkingFund
 *
 * For every personal-pay insurance policy, calculates the monthly amount
 * the user should set aside so the PROJECTED next premium (after inflation)
 * is ready on renewal date.
 *
 * Medical inflation rate is read from globalSettings.medicalInflationRate
 * (defaults to 14% p.a. — IRDAI benchmark for India).
 * For multi-year policies the sinking fund spreads over premiumTermYears × 12 months.
 *
 * Corporate / employer-paid and Government-scheme policies are shown
 * separately for reference but not included in the savings calculation.
 */
import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  PiggyBank, Shield, CheckCircle2, AlertTriangle,
  Building2, Heart, Plus, Info, TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';

/** Default 14% p.a. medical inflation per IRDAI benchmark */
const DEFAULT_MEDICAL_INFLATION = 0.14;

// ─── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Projects the next premium at renewal using compound medical inflation.
 * years = number of policy term years (1, 2, 3 …)
 * For a 3-year policy last paid today, the next premium is due in 3 years
 * so we inflate by (1 + inflation)^3.
 */
function projectedNextPremium(currentPremium: number, termYears: number, inflationRate: number): number {
  const inflated = currentPremium * Math.pow(1 + inflationRate, termYears);
  return Math.round(inflated);
}

/** Returns months between now and the renewal end date (min 1). */
function monthsUntilRenewal(endDate: Date | string | undefined): number {
  if (!endDate) return 12;
  const diff = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44);
  return Math.max(1, Math.round(diff));
}

function renewalLabel(endDate: Date | string | undefined): string {
  if (!endDate) return '—';
  return new Date(endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

const CORP_SOURCES = ['Corporate / Employer'];
const GOVT_SOURCES = ['Government Scheme'];

function isGovt(p: any) {
  const src = (p.policySource ?? '').toLowerCase();
  return GOVT_SOURCES.map(s => s.toLowerCase()).includes(src)
    || src.includes('gov')
    || (p.type ?? '').toLowerCase().includes('aarogya');
}
function isCorp(p: any) {
  const src = (p.policySource ?? '').toLowerCase();
  return CORP_SOURCES.map(s => s.toLowerCase()).includes(src)
    || p.isCorporate === true
    || (p.type ?? '').toLowerCase().includes('corporate')
    || (p.type ?? '').toLowerCase().includes('group');
}

function sourceTag(p: any) {
  if (isGovt(p)) return <Badge className="text-[9px] px-1.5 bg-info/15 text-info border-info/30 border">Govt</Badge>;
  if (isCorp(p)) return <Badge className="text-[9px] px-1.5 bg-warning/15 text-warning border-warning/30 border">Corp</Badge>;
  return <Badge variant="outline" className="text-[9px] px-1.5">Personal</Badge>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function InsuranceSinkingFund() {
  const policies       = useLiveQuery(() => db.insurancePolicies?.toArray() ?? Promise.resolve([]), []) ?? [];
  const goals          = useLiveQuery(() => db.goals.toArray(), []) ?? [];
  const globalSettings = useLiveQuery(() => db.globalSettings.limit(1).first().catch(() => undefined), []);

  // Use rate from globalSettings if set, else default 14% IRDAI benchmark
  const medicalInflation = globalSettings?.medicalInflationRate ?? DEFAULT_MEDICAL_INFLATION;

  const { personalPay, corpPay, govtPay } = useMemo(() => {
    const personalPay: typeof policies = [];
    const corpPay:     typeof policies = [];
    const govtPay:     typeof policies = [];
    for (const p of policies) {
      if (isGovt(p))      govtPay.push(p);
      else if (isCorp(p)) corpPay.push(p);
      else                personalPay.push(p);
    }
    return { personalPay, corpPay, govtPay };
  }, [policies]);

  // Summary row: use projected premiums for the monthly save total
  const { totalProjectedPremium, totalMonthlySave } = useMemo(() => {
    let totalProjPremium = 0;
    let totalMonSave = 0;
    for (const p of personalPay) {
      const termYears = (p as any).premiumTermYears ?? 1;
      const proj = projectedNextPremium(p.premium ?? 0, termYears, medicalInflation);
      const effectiveMonths = termYears > 1 ? termYears * 12 : monthsUntilRenewal(p.endDate);
      totalProjPremium += proj;
      totalMonSave += Math.ceil(proj / Math.max(1, effectiveMonths));
    }
    return { totalProjectedPremium: totalProjPremium, totalMonthlySave: totalMonSave };
  }, [personalPay, medicalInflation]);

  const hasGoal = (policyId: string) =>
    goals.some(g => (g as any).notes?.includes(`insurance-sf:${policyId}`));

  const createGoal = async (p: typeof policies[0]) => {
    if (hasGoal(p.id)) { toast.info('Sinking fund goal already exists'); return; }
    const termYears       = (p as any).premiumTermYears ?? 1;
    const effectiveMonths = termYears > 1 ? termYears * 12 : monthsUntilRenewal(p.endDate);
    const projPremium     = projectedNextPremium(p.premium ?? 0, termYears, medicalInflation);
    const monthly         = Math.ceil(projPremium / Math.max(1, effectiveMonths));
    const inflationPct    = Math.round((projPremium / (p.premium || 1) - 1) * 100);
    const goalName        = `🛡️ Insurance SF: ${p.provider ?? ''} ${p.type ?? ''}`.trim();
    const inflationLabel  = `${Math.round(medicalInflation * 100)}%`;

    try {
      await db.goals.add({
        id:            crypto.randomUUID(),
        name:          goalName,
        targetAmount:  projPremium,
        currentAmount: 0,
        deadline:      p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : undefined,
        category:      'Insurance',
        type:          termYears >= 3 ? 'Long' : termYears >= 2 ? 'Medium' : 'Short',
        notes: [
          `insurance-sf:${p.id}`,
          `Monthly save: ₹${monthly.toLocaleString('en-IN')} for ${effectiveMonths}mo`,
          `Projected premium @${inflationLabel} inflation: ₹${projPremium.toLocaleString('en-IN')} (+${inflationPct}% vs ₹${(p.premium ?? 0).toLocaleString('en-IN')} paid)`,
          `Renewal: ${renewalLabel(p.endDate)}`,
        ].join(' | '),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      toast.success(`Goal created — save ₹${monthly.toLocaleString('en-IN')}/mo (projected ₹${projPremium.toLocaleString('en-IN')} next premium @ ${inflationLabel} hike)`);
    } catch {
      toast.error('Failed to create goal');
    }
  };

  const createAllGoals = async () => {
    let created = 0;
    for (const p of personalPay) {
      if (!hasGoal(p.id) && (p.premium ?? 0) > 0) { await createGoal(p); created++; }
    }
    if (created === 0) toast.info('All sinking fund goals already exist');
  };

  if (policies.length === 0) {
    return (
      <Card className="border-dashed border-border/60">
        <CardContent className="py-10 text-center">
          <PiggyBank className="h-9 w-9 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Add insurance policies first to generate sinking fund goals.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Inflation notice ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-warning/8 border border-warning/20 text-xs text-warning">
        <TrendingUp className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          Premiums inflated at <strong>14% p.a.</strong> (IRDAI medical inflation benchmark).
          Sinking fund target = <em>projected next premium</em>, not the last amount paid.
        </p>
      </div>

      {/* ── Summary ──────────────────────────────────────────────────────────── */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 shrink-0">
                <PiggyBank className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total projected premium (personal-pay)</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(totalProjectedPremium)}</p>
                <p className="text-xs text-primary font-medium">→ Save {formatCurrency(totalMonthlySave)}/month</p>
              </div>
            </div>
            <Button size="sm" className="h-8 text-xs rounded-xl gap-1 shrink-0" onClick={createAllGoals}>
              <Plus className="h-3.5 w-3.5" /> All Goals
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Personal-Pay Policies ────────────────────────────────────────────── */}
      {personalPay.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-0.5">
            Personal-Pay Policies — Sinking Fund Required
          </p>
          {personalPay.map(p => {
            const termYears       = (p as any).premiumTermYears ?? 1;
            const effectiveMonths = termYears > 1 ? termYears * 12 : monthsUntilRenewal(p.endDate);
            const projPremium     = projectedNextPremium(p.premium ?? 0, termYears, medicalInflation);
            const monthly         = Math.ceil(projPremium / Math.max(1, effectiveMonths));
            const inflationAmt    = projPremium - (p.premium ?? 0);
            const alreadyHas      = hasGoal(p.id);

            return (
              <Card key={p.id} className="glass">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <Heart className="h-3.5 w-3.5 text-primary shrink-0" />
                        <p className="text-sm font-semibold truncate">{p.provider}</p>
                        <Badge variant="secondary" className="text-[9px] px-1.5">{p.type}</Badge>
                        {termYears > 1 && <Badge variant="outline" className="text-[9px] px-1.5">{termYears}yr policy</Badge>}
                        {(p as any).hasMaternity && (
                          <Badge className="text-[9px] px-1.5 bg-accent/30 text-accent-foreground border-accent/30 border">Maternity ✓</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.familyMember} · Sum insured: {formatCurrency(p.sumInsured)} · Renewal: {renewalLabel(p.endDate)}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {alreadyHas
                        ? <Badge className="text-[10px] bg-success/15 text-success border-success/30 border gap-1"><CheckCircle2 className="h-3 w-3" /> Goal set</Badge>
                        : (
                          <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg gap-1" onClick={() => createGoal(p)}>
                            <Plus className="h-3 w-3" /> Goal
                          </Button>
                        )
                      }
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-muted/40">
                      <p className="text-[10px] text-muted-foreground">Last Paid</p>
                      <p className="font-semibold tabular-nums">{formatCurrency(p.premium ?? 0)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-warning/8 border border-warning/20">
                      <p className="text-[10px] text-warning">Projected (+14%×{termYears}yr)</p>
                      <p className="font-semibold text-warning tabular-nums">{formatCurrency(projPremium)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/8">
                      <p className="text-[10px] text-muted-foreground">Save / Month</p>
                      <p className="font-semibold text-primary tabular-nums">{formatCurrency(monthly)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/40">
                      <p className="text-[10px] text-muted-foreground">Over (months)</p>
                      <p className="font-semibold tabular-nums">{effectiveMonths}m</p>
                    </div>
                  </div>

                  {inflationAmt > 0 && (
                    <p className="text-[10px] text-warning mt-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Buffer for inflation: +{formatCurrency(inflationAmt)} vs last premium
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Corporate-Pay ────────────────────────────────────────────────────── */}
      {corpPay.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-0.5 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Employer / Corporate Cover — No Sinking Fund
          </p>
          <div className="space-y-1.5">
            {corpPay.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-warning/5 border border-warning/20 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {sourceTag(p)}
                    <p className="font-medium truncate">{p.provider} · {p.type}</p>
                  </div>
                  <p className="text-muted-foreground mt-0.5">{p.familyMember} · {formatCurrency(p.sumInsured)} cover</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-warning font-medium">Job-dependent</p>
                  <p className="text-muted-foreground">Lapses if role changes</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Government Schemes ───────────────────────────────────────────────── */}
      {govtPay.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-0.5">
            Government Schemes — Free
          </p>
          <div className="space-y-1.5">
            {govtPay.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-success/5 border border-success/20 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {sourceTag(p)}
                    <p className="font-medium truncate">{p.provider} · {p.type}</p>
                  </div>
                  <p className="text-muted-foreground mt-0.5">{p.familyMember} · {formatCurrency(p.sumInsured)} cover</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Info note ────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/40 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          Goals auto-target the <strong>inflated next premium</strong> (14% p.a. × policy term years).
          For a 3-year policy paid in Feb 2026, the next premium is due Feb 2029 — inflated by (1.14)³.
          Update goals after each renewal to recalculate.
        </p>
      </div>
    </div>
  );
}
