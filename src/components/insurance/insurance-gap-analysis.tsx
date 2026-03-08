/**
 * Insurance Gap Analysis — §20 CFA/Antifragility Rules
 *
 * Checks:
 *   1. Term Life         ≥ 10× annual income
 *   2. Health / Floater  ≥ 5× annual income (personal + employer)
 *   3. Critical Illness  ≥ 2× annual income (standalone CI or rider)
 *   4. Super Top-Up      recommended if base health < 10L
 *   5. Personal Accident ≥ 2× annual income
 *   6. Nominee audit     — any policy missing nominee = antifragility failure
 *
 * Auto-pulls annual income from the incomes table (last 12 months).
 * Shows employer cover fields for accurate net gap calculation.
 */
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle, CheckCircle2, Shield, IndianRupee,
  Info, ChevronDown, ChevronUp, XCircle, Heart,
  Star, Users, Car, Flame, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';

interface GapResult {
  id: string;
  label: string;
  icon: React.ElementType;
  rule: string;
  required: number;
  personalCover: number;
  employerCover: number;
  current: number;
  gap: number;
  pct: number;
  ok: boolean;
  severity: 'critical' | 'warning' | 'ok';
  approxCost?: string;
  actionTip?: string;
  breakdown?: { label: string; value: number; tag?: string }[];
  // for yes/no checks (no numeric gap)
  isPresent?: boolean;
  isCheckOnly?: boolean;
}

interface PolicyRow {
  id: string;
  type: string;
  provider: string;
  sumInsured: number;
  familyMember?: string;
  nomineeName?: string;
}

interface ScoreItem {
  label: string;
  ok: boolean;
  critical: boolean;
}

export function InsuranceGapAnalysis() {
  const [annualIncome,    setAnnualIncome]    = useState(1200000);
  const [employerTerm,    setEmployerTerm]    = useState(0);
  const [employerHealth,  setEmployerHealth]  = useState(500000);
  const [results,         setResults]         = useState<GapResult[]>([]);
  const [policies,        setPolicies]        = useState<PolicyRow[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [expanded,        setExpanded]        = useState<string | null>(null);
  const [incomeLoaded,    setIncomeLoaded]    = useState(false);
  const [scoreItems,      setScoreItems]      = useState<ScoreItem[]>([]);

  // Auto-load income from DB
  useEffect(() => {
    async function loadIncome() {
      try {
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - 1);
        const incomes = await db.incomes.toArray();
        const annualTotal = incomes
          .filter(i => new Date(i.date) >= cutoff)
          .reduce((s, i) => s + i.amount, 0);
        if (annualTotal > 0) {
          setAnnualIncome(Math.round(annualTotal));
          setIncomeLoaded(true);
        }
      } catch {}
    }
    loadIncome();
  }, []);

  useEffect(() => { analyse(); }, [annualIncome, employerTerm, employerHealth]);

  async function analyse() {
    setLoading(true);
    try {
      const all = await db.insurancePolicies.toArray();
      setPolicies(all as PolicyRow[]);

      const byType = (keyword: string) =>
        all.filter(p => p.type?.toLowerCase().includes(keyword.toLowerCase()));

      // ── Term Life ────────────────────────────────────────────────────────────
      const termPolicies   = byType('term');
      const personalTerm   = termPolicies.reduce((s, p) => s + (p.sumInsured ?? 0), 0);
      const totalTerm      = personalTerm + employerTerm;
      const termRequired   = annualIncome * 10;

      // ── Health / Floater ──────────────────────────────────────────────────────
      const healthPolicies  = all.filter(p =>
        p.type?.toLowerCase().includes('health') ||
        p.type?.toLowerCase().includes('medical') ||
        p.type?.toLowerCase().includes('floater')
      );
      const personalHealth  = healthPolicies.reduce((s, p) => s + (p.sumInsured ?? 0), 0);
      const totalHealth     = personalHealth + employerHealth;
      const healthRequired  = annualIncome * 5;

      // ── Critical Illness ──────────────────────────────────────────────────────
      const ciPolicies   = byType('critical');
      const ciSum        = ciPolicies.reduce((s, p) => s + (p.sumInsured ?? 0), 0);
      const ciRequired   = annualIncome * 2;

      // ── Super Top-Up / Top-Up ─────────────────────────────────────────────────
      const superTopUp  = byType('top').concat(byType('super'));
      const superTopUpSum = superTopUp.reduce((s, p) => s + (p.sumInsured ?? 0), 0);
      const baseHealthOk  = totalHealth >= 1_000_000; // 10L base
      const superTopUpNeeded = !baseHealthOk || superTopUpSum === 0;

      // ── Personal Accident ─────────────────────────────────────────────────────
      const paPolicies = byType('accident');
      const paSum      = paPolicies.reduce((s, p) => s + (p.sumInsured ?? 0), 0);
      const paRequired = annualIncome * 2;

      // ── Motor / Vehicle ───────────────────────────────────────────────────────
      const motorPolicies = byType('vehicle').concat(byType('motor'));
      const motorSum      = motorPolicies.reduce((s, p) => s + (p.sumInsured ?? 0), 0);

      // ── Missing nominees ──────────────────────────────────────────────────────
      const missingNominee = all.filter(p => !p.nomineeName?.trim());

      const res: GapResult[] = [
        // 1. Term Life
        {
          id: 'term',
          label: 'Term Life Insurance',
          icon: Shield,
          rule: 'CFA Rule: ≥ 10× Annual Income',
          required: termRequired,
          personalCover: personalTerm,
          employerCover: employerTerm,
          current: totalTerm,
          gap: Math.max(0, termRequired - totalTerm),
          pct: termRequired > 0 ? Math.min(100, (totalTerm / termRequired) * 100) : 0,
          ok: totalTerm >= termRequired,
          severity: totalTerm >= termRequired ? 'ok' : totalTerm >= termRequired * 0.6 ? 'warning' : 'critical',
          approxCost: totalTerm < termRequired
            ? `≈ ₹${Math.round(Math.max(0, termRequired - totalTerm) / 1_000 * 0.7).toLocaleString('en-IN')}/yr for a ₹${Math.round((termRequired - totalTerm) / 100_000)}L term plan at age 35`
            : undefined,
          actionTip: totalTerm < termRequired
            ? 'Compare iSelect Star Term / HDFC Click 2 Protect — cheapest at age < 40.'
            : undefined,
          breakdown: [
            ...termPolicies.map(p => ({ label: `${p.provider} (${p.familyMember || 'Me'})`, value: p.sumInsured ?? 0 })),
            ...(employerTerm > 0 ? [{ label: 'Employer Group Term', value: employerTerm, tag: 'employer' }] : []),
          ],
        },

        // 2. Health / Floater
        {
          id: 'health',
          label: 'Health / Medical Insurance',
          icon: Heart,
          rule: 'CFA Rule: ≥ 5× Annual Income (personal + employer)',
          required: healthRequired,
          personalCover: personalHealth,
          employerCover: employerHealth,
          current: totalHealth,
          gap: Math.max(0, healthRequired - totalHealth),
          pct: healthRequired > 0 ? Math.min(100, (totalHealth / healthRequired) * 100) : 0,
          ok: totalHealth >= healthRequired,
          severity: totalHealth >= healthRequired ? 'ok' : totalHealth >= healthRequired * 0.5 ? 'warning' : 'critical',
          approxCost: totalHealth < healthRequired
            ? `≈ ₹${Math.round(Math.max(0, healthRequired - totalHealth) / 100).toLocaleString('en-IN')}/yr for a top-up plan`
            : undefined,
          actionTip: totalHealth < healthRequired
            ? 'Consider a Star Health or Niva Bupa family floater with a ₹10L–₹20L base + super top-up.'
            : undefined,
          breakdown: [
            ...healthPolicies.map(p => ({ label: `${p.provider} (${p.familyMember || 'Me'})`, value: p.sumInsured ?? 0 })),
            ...(employerHealth > 0 ? [{ label: 'Employer Group Health', value: employerHealth, tag: 'employer' }] : []),
          ],
        },

        // 3. Critical Illness
        {
          id: 'ci',
          label: 'Critical Illness Cover',
          icon: Activity,
          rule: 'Antifragile Rule: ≥ 2× Annual Income (standalone CI / rider)',
          required: ciRequired,
          personalCover: ciSum,
          employerCover: 0,
          current: ciSum,
          gap: Math.max(0, ciRequired - ciSum),
          pct: ciRequired > 0 ? Math.min(100, (ciSum / ciRequired) * 100) : 0,
          ok: ciSum >= ciRequired,
          severity: ciSum >= ciRequired ? 'ok' : ciSum > 0 ? 'warning' : 'critical',
          approxCost: ciSum < ciRequired
            ? `≈ ₹3,000–₹7,000/yr for a ₹${Math.round(ciRequired / 100_000)}L CI standalone plan`
            : undefined,
          actionTip: 'CI pays a lump sum on diagnosis of cancer, heart attack, stroke, etc. — protects income replacement during treatment.',
          breakdown: ciPolicies.map(p => ({ label: `${p.provider} (CI)`, value: p.sumInsured ?? 0 })),
        },

        // 4. Super Top-Up
        {
          id: 'super-topup',
          label: 'Super Top-Up Health Cover',
          icon: Star,
          rule: 'Antifragile Rule: ₹30L–₹50L super top-up above a ₹5L–₹10L deductible',
          required: 3_000_000,
          personalCover: superTopUpSum,
          employerCover: 0,
          current: superTopUpSum,
          gap: Math.max(0, 3_000_000 - superTopUpSum),
          pct: Math.min(100, (superTopUpSum / 3_000_000) * 100),
          ok: superTopUpSum >= 3_000_000,
          severity: superTopUpSum >= 3_000_000 ? 'ok' : superTopUpSum > 0 ? 'warning' : 'critical',
          approxCost: superTopUpSum < 3_000_000
            ? `≈ ₹4,000–₹8,000/yr for a ₹30L super top-up with ₹5L deductible`
            : undefined,
          actionTip: 'A super top-up kicks in after your base plan is exhausted — cheapest way to get ₹30L+ cover. Star Super Surplus or Care Supreme are strong options.',
          breakdown: superTopUp.map(p => ({ label: `${p.provider} (Top-Up)`, value: p.sumInsured ?? 0 })),
        },

        // 5. Personal Accident (only shown if paSum > 0 or always as a gap)
        {
          id: 'pa',
          label: 'Personal Accident Cover',
          icon: Users,
          rule: 'Recommended: ≥ 2× Annual Income (lump sum on accidental death/disability)',
          required: paRequired,
          personalCover: paSum,
          employerCover: 0,
          current: paSum,
          gap: Math.max(0, paRequired - paSum),
          pct: paRequired > 0 ? Math.min(100, (paSum / paRequired) * 100) : 0,
          ok: paSum >= paRequired,
          severity: paSum >= paRequired ? 'ok' : paSum > 0 ? 'warning' : 'critical',
          approxCost: paSum < paRequired
            ? `≈ ₹2,000–₹5,000/yr for a ₹${Math.round(paRequired / 100_000)}L PA policy`
            : undefined,
          actionTip: 'PA cover is especially important if you commute by bike or car — covers accidental death, permanent disability, temporary disability.',
          breakdown: paPolicies.map(p => ({ label: p.provider, value: p.sumInsured ?? 0 })),
        },
      ];

      // 6. Motor (info-only if present)
      if (motorSum > 0) {
        res.push({
          id: 'motor',
          label: 'Motor / Vehicle Insurance',
          icon: Car,
          rule: 'At least one active comprehensive policy per vehicle',
          required: 0,
          personalCover: motorSum,
          employerCover: 0,
          current: motorSum,
          gap: 0,
          pct: 100,
          ok: true,
          severity: 'ok',
          breakdown: motorPolicies.map(p => ({ label: p.provider, value: p.sumInsured ?? 0 })),
        });
      }

      // ── Antifragility Scorecard ───────────────────────────────────────────────
      const sc: ScoreItem[] = [
        { label: 'Term Life ≥ 10× income',        ok: totalTerm    >= termRequired,   critical: true },
        { label: 'Health ≥ 5× income',             ok: totalHealth  >= healthRequired, critical: true },
        { label: 'Critical Illness cover',          ok: ciSum        >= ciRequired,     critical: true },
        { label: 'Super Top-Up ≥ ₹30L',            ok: superTopUpSum >= 3_000_000,     critical: false },
        { label: 'PA cover ≥ 2× income',            ok: paSum        >= paRequired,     critical: false },
        { label: 'All policies have nominees',       ok: missingNominee.length === 0,   critical: true },
      ];

      setResults(res);
      setScoreItems(sc);
    } catch {
      toast.error('Failed to load insurance data');
    }
    setLoading(false);
  }

  const urgent       = results.filter(r => !r.ok && r.gap > 0);
  const allOk        = results.length > 0 && urgent.length === 0;
  const missingNominee = policies.filter(p => !p.nomineeName?.trim());
  const score        = scoreItems.filter(s => s.ok).length;
  const maxScore     = scoreItems.length;
  const criticalFails = scoreItems.filter(s => !s.ok && s.critical).length;

  const severityColor = (s: 'critical' | 'warning' | 'ok') =>
    s === 'ok' ? 'border-success/40' : s === 'warning' ? 'border-warning/40' : 'border-destructive/40';

  const badgeForResult = (r: GapResult) => {
    if (r.ok) return <Badge className="text-[10px] bg-success/15 text-success border-success/30 border shrink-0">Covered ✓</Badge>;
    if (r.severity === 'critical') return <Badge variant="destructive" className="text-[10px] shrink-0">Critical Gap</Badge>;
    return <Badge className="text-[10px] bg-warning/15 text-warning border-warning/30 border shrink-0">Gap</Badge>;
  };

  const progressColor = (r: GapResult) =>
    r.ok ? '' : r.severity === 'critical' ? '[&>div]:bg-destructive' : '[&>div]:bg-warning';

  return (
    <div className="space-y-4 pb-20">

      {/* ── Income & Employer Cover inputs ─────────────────────────────────── */}
      <Card className="border-border/60">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5" /> Income & Employer Cover
          </CardTitle>
          {incomeLoaded && (
            <p className="text-[10px] text-success flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Auto-loaded from your income records
            </p>
          )}
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Annual Gross Income (₹)</Label>
            <Input type="number" value={annualIncome}
              onChange={e => setAnnualIncome(Number(e.target.value))} className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Employer Group Term (₹)</Label>
              <Input type="number" value={employerTerm}
                onChange={e => setEmployerTerm(Number(e.target.value))} className="h-9 text-sm" placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Employer Group Health (₹)</Label>
              <Input type="number" value={employerHealth}
                onChange={e => setEmployerHealth(Number(e.target.value))} className="h-9 text-sm" placeholder="500000" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Antifragility Scorecard ─────────────────────────────────────────── */}
      {!loading && scoreItems.length > 0 && (
        <Card className={`border ${criticalFails === 0 ? 'border-success/40 bg-success/5' : criticalFails >= 2 ? 'border-destructive/40 bg-destructive/5' : 'border-warning/40 bg-warning/5'}`}>
          <CardContent className="py-3 px-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {criticalFails === 0
                  ? <CheckCircle2 className="h-4 w-4 text-success" />
                  : <Flame className="h-4 w-4 text-destructive" />}
                <div>
                  <p className="text-sm font-bold">
                    Antifragility Score: {score}/{maxScore}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {criticalFails === 0 ? 'All critical checks passed' : `${criticalFails} critical check${criticalFails > 1 ? 's' : ''} failing`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black tabular-nums">
                  <span className={criticalFails === 0 ? 'text-success' : 'text-destructive'}>
                    {Math.round((score / maxScore) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            <Progress
              value={(score / maxScore) * 100}
              className={`h-2 ${criticalFails === 0 ? '' : criticalFails >= 2 ? '[&>div]:bg-destructive' : '[&>div]:bg-warning'}`}
            />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {scoreItems.map((si, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px]">
                  {si.ok
                    ? <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                    : si.critical
                      ? <XCircle className="h-3 w-3 text-destructive shrink-0" />
                      : <AlertTriangle className="h-3 w-3 text-warning shrink-0" />}
                  <span className={si.ok ? 'text-foreground' : si.critical ? 'text-destructive' : 'text-warning'}>
                    {si.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing nominee critical alert */}
      {missingNominee.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/8 border border-destructive/20 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Antifragility Failure: {missingNominee.length} polic{missingNominee.length > 1 ? 'ies' : 'y'} missing nominee</p>
            <p className="text-destructive/80 mt-0.5">
              {missingNominee.slice(0, 3).map(p => `${p.provider} (${p.type})`).join(' · ')}
              {missingNominee.length > 3 ? ` + ${missingNominee.length - 3} more` : ''} — tap Policies tab to fix.
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Analysing policies…</div>
      ) : results.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Shield className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No insurance policies found.</p>
            <p className="text-xs text-muted-foreground mt-1">Add policies in the Policies tab first, then come back here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map(r => {
            const isExpanded = expanded === r.id;
            const Icon = r.icon;
            return (
              <Card key={r.id} className={`border ${severityColor(r.severity)}`}>
                <CardHeader className="pb-1 pt-3 px-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${r.ok ? 'bg-success/10' : r.severity === 'critical' ? 'bg-destructive/10' : 'bg-warning/10'}`}>
                        <Icon className={`h-3.5 w-3.5 ${r.ok ? 'text-success' : r.severity === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                      </div>
                      <CardTitle className="text-sm font-semibold">{r.label}</CardTitle>
                    </div>
                    {badgeForResult(r)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 pl-9">{r.rule}</p>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {/* Coverage bar */}
                  {r.required > 0 && (
                    <>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          Current:{' '}
                          <strong className={r.ok ? 'text-success' : r.severity === 'critical' ? 'text-destructive' : 'text-warning'}>
                            {formatCurrency(r.current)}
                          </strong>
                          {r.employerCover > 0 && (
                            <span className="text-muted-foreground/60 ml-1">
                              (incl. {formatCurrency(r.employerCover)} employer)
                            </span>
                          )}
                        </span>
                        <span>Required: <strong className="text-foreground">{formatCurrency(r.required)}</strong></span>
                      </div>
                      <Progress value={r.pct} className={`h-2 ${progressColor(r)}`} />
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${r.ok ? 'text-success' : r.severity === 'critical' ? 'text-destructive' : 'text-warning'}`}>
                          {Math.round(r.pct)}% covered
                        </span>
                        {r.breakdown && r.breakdown.length > 0 && (
                          <button
                            className="text-[10px] text-muted-foreground flex items-center gap-0.5"
                            onClick={() => setExpanded(isExpanded ? null : r.id)}
                          >
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {isExpanded ? 'Hide' : `${r.breakdown.length} polic${r.breakdown.length > 1 ? 'ies' : 'y'}`}
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* Breakdown */}
                  {isExpanded && r.breakdown && r.breakdown.length > 0 && (
                    <div className="mt-1 space-y-1 border-t border-border/40 pt-2">
                      {r.breakdown.map((b, i) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            {b.label}
                            {b.tag === 'employer' && (
                              <span className="ml-1 px-1 py-0.5 rounded text-[9px] bg-primary/10 text-primary">employer</span>
                            )}
                          </span>
                          <span className="font-medium text-foreground">{formatCurrency(b.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Gap action */}
                  {!r.ok && r.gap > 0 && (
                    <div className="flex items-start gap-2 pt-1 border-t border-border/40">
                      <AlertTriangle className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${r.severity === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                      <div className="flex-1 space-y-0.5">
                        <p className={`text-xs font-medium ${r.severity === 'critical' ? 'text-destructive' : 'text-warning'}`}>
                          Shortfall: {formatCurrency(r.gap)}
                        </p>
                        {r.approxCost && (
                          <p className="text-[11px] text-muted-foreground">{r.approxCost}</p>
                        )}
                        {r.actionTip && (
                          <p className="text-[11px] text-muted-foreground italic">{r.actionTip}</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* CFA + Antifragility note */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          CFA benchmarks: Term ≥ 10× ensures 10-year income replacement. Health ≥ 5× protects against major medical events.
          Critical Illness cover pays lump-sum on diagnosis — acts as income replacement during treatment. Super top-up is the cheapest way to get ₹30L+ health cover.
        </p>
      </div>
    </div>
  );
}
