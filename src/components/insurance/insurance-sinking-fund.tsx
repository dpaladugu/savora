/**
 * InsuranceSinkingFund
 *
 * For every personal-pay insurance policy, calculates the monthly amount
 * the user should set aside so the full annual premium is ready on renewal
 * date. Allows one-click creation of a Dexie Goal for each policy.
 *
 * Corporate / employer-paid and Government-scheme policies are shown
 * separately for reference but not included in the savings calculation.
 */
import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  PiggyBank, Shield, CheckCircle2, AlertTriangle,
  Building2, Heart, Plus, Info,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';

// ─── helpers ─────────────────────────────────────────────────────────────────
function monthsUntilRenewal(endDate: Date | string | undefined): number {
  if (!endDate) return 12;
  const diff = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44);
  return Math.max(1, Math.round(diff));
}

function renewalLabel(endDate: Date | string | undefined): string {
  if (!endDate) return '—';
  return new Date(endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

const CORP_SOURCES  = ['Corporate / Employer'];
const GOVT_SOURCES  = ['Government Scheme'];

function sourceTag(source?: string, isCorporate?: boolean) {
  if (GOVT_SOURCES.includes(source ?? '') || source?.toLowerCase().includes('govt') || source?.toLowerCase().includes('government')) {
    return <Badge className="text-[9px] px-1.5 bg-blue-500/15 text-blue-600 border-blue-500/30 border">Govt</Badge>;
  }
  if (CORP_SOURCES.includes(source ?? '') || isCorporate) {
    return <Badge className="text-[9px] px-1.5 bg-warning/15 text-warning border-warning/30 border">Corp</Badge>;
  }
  return <Badge variant="outline" className="text-[9px] px-1.5">Personal</Badge>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function InsuranceSinkingFund() {
  const policies = useLiveQuery(() => db.insurancePolicies?.toArray() ?? Promise.resolve([]), []) ?? [];
  const goals    = useLiveQuery(() => db.goals.toArray(), []) ?? [];

  // Separate into pay-categories
  const { personalPay, corpPay, govtPay } = useMemo(() => {
    const personalPay: typeof policies = [];
    const corpPay:     typeof policies = [];
    const govtPay:     typeof policies = [];

    for (const p of policies) {
      const src = (p as any).policySource ?? '';
      const isCorp = (p as any).isCorporate ?? false;
      if (GOVT_SOURCES.includes(src) || src.toLowerCase().includes('gov') || p.type?.toLowerCase().includes('aarogya')) {
        govtPay.push(p);
      } else if (CORP_SOURCES.includes(src) || isCorp || p.type?.toLowerCase().includes('corporate') || p.type?.toLowerCase().includes('group')) {
        corpPay.push(p);
      } else {
        personalPay.push(p);
      }
    }
    return { personalPay, corpPay, govtPay };
  }, [policies]);

  const totalAnnualPremium = personalPay.reduce((s, p) => s + (p.premium ?? 0), 0);
  const totalMonthlySave   = Math.ceil(totalAnnualPremium / 12);

  // Which policies already have a sinking-fund goal?
  const hasGoal = (policyId: string) =>
    goals.some(g => g.notes?.includes(`insurance-sf:${policyId}`));

  const createGoal = async (p: typeof policies[0]) => {
    const months   = monthsUntilRenewal(p.endDate);
    const monthly  = Math.ceil((p.premium ?? 0) / Math.max(1, months));
    const goalName = `💳 Insurance: ${p.provider} ${p.type}`;

    // Avoid duplicates
    if (hasGoal(p.id)) {
      toast.info('Sinking fund goal already exists for this policy');
      return;
    }

    try {
      await db.goals.add({
        id:            crypto.randomUUID(),
        name:          goalName,
        targetAmount:  p.premium ?? 0,
        currentAmount: 0,
        deadline:      p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : undefined,
        category:      'Insurance',
        type:          'Short',
        notes:         `insurance-sf:${p.id} | Monthly save: ₹${monthly.toLocaleString('en-IN')} for ${months} months. Renewal: ${renewalLabel(p.endDate)}`,
        createdAt:     new Date(),
        updatedAt:     new Date(),
      } as any);
      toast.success(`Sinking fund goal created — save ₹${monthly.toLocaleString('en-IN')}/mo`);
    } catch {
      toast.error('Failed to create goal');
    }
  };

  const createAllGoals = async () => {
    let created = 0;
    for (const p of personalPay) {
      if (!hasGoal(p.id) && (p.premium ?? 0) > 0) {
        await createGoal(p);
        created++;
      }
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

      {/* ── Summary ──────────────────────────────────────────────────────────── */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 shrink-0">
                <PiggyBank className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total annual premium (personal-pay)</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(totalAnnualPremium)}</p>
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
            const months  = monthsUntilRenewal(p.endDate);
            const monthly = Math.ceil((p.premium ?? 0) / Math.max(1, months));
            const alreadyHas = hasGoal(p.id);

            return (
              <Card key={p.id} className="glass">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <Heart className="h-3.5 w-3.5 text-primary shrink-0" />
                        <p className="text-sm font-semibold truncate">{p.provider}</p>
                        <Badge variant="secondary" className="text-[9px] px-1.5">{p.type}</Badge>
                        {(p as any).hasMaternity && (
                          <Badge className="text-[9px] px-1.5 bg-pink-500/15 text-pink-600 border-pink-500/30 border">Maternity ✓</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.familyMember} · Sum insured: {formatCurrency(p.sumInsured)} · Renewal: {renewalLabel(p.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
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

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-muted/40">
                      <p className="text-[10px] text-muted-foreground">Annual Premium</p>
                      <p className="font-semibold tabular-nums">{formatCurrency(p.premium ?? 0)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/8">
                      <p className="text-[10px] text-muted-foreground">Save / Month</p>
                      <p className="font-semibold text-primary tabular-nums">{formatCurrency(monthly)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/40">
                      <p className="text-[10px] text-muted-foreground">Months Left</p>
                      <p className="font-semibold tabular-nums">{months}m</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Corporate-Pay (info-only) ────────────────────────────────────────── */}
      {corpPay.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-0.5 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Employer / Corporate Cover — No Sinking Fund Needed
          </p>
          <div className="space-y-1.5">
            {corpPay.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-warning/5 border border-warning/20 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {sourceTag((p as any).policySource, (p as any).isCorporate)}
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

      {/* ── Government Scheme (info-only) ────────────────────────────────────── */}
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
                    {sourceTag((p as any).policySource)}
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
        <p>Sinking fund goals are added to your <strong>Goals</strong> tab. Monthly save amount = annual premium ÷ months until renewal. Update goals after renewing a policy.</p>
      </div>
    </div>
  );
}
