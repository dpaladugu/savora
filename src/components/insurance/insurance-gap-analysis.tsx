/**
 * Insurance Gap Analysis — §20 CFA Rule
 * Term life ≥ 10× annual income
 * Health cover ≥ 5× annual income (personal + employer combined)
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
  TrendingUp, Info, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';

interface GapResult {
  label: string;
  rule: string;
  required: number;
  personalCover: number;
  employerCover: number;
  current: number;
  gap: number;
  pct: number;
  ok: boolean;
  approxCost?: string;
  actionLabel?: string;
  breakdown?: { label: string; value: number }[];
}

interface PolicyRow {
  id: string;
  type: string;
  provider: string;
  sumInsured: number;
  familyMember?: string;
  nomineeName?: string;
}

export function InsuranceGapAnalysis() {
  const [annualIncome,   setAnnualIncome]   = useState(1200000);
  const [employerTerm,   setEmployerTerm]   = useState(0);
  const [employerHealth, setEmployerHealth] = useState(500000);
  const [results,        setResults]        = useState<GapResult[]>([]);
  const [policies,       setPolicies]       = useState<PolicyRow[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [expanded,       setExpanded]       = useState<string | null>(null);
  const [incomeLoaded,   setIncomeLoaded]   = useState(false);

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

      // ── Term Life ──────────────────────────────────────────────────────────
      const termPolicies = byType('term');
      const personalTerm = termPolicies.reduce((s, p) => s + (p.sumInsured ?? 0), 0);
      const totalTerm    = personalTerm + employerTerm;
      const termRequired = annualIncome * 10;

      // ── Health ─────────────────────────────────────────────────────────────
      const healthPolicies = all.filter(p =>
        p.type?.toLowerCase().includes('health') ||
        p.type?.toLowerCase().includes('medical')
      );
      const personalHealth = healthPolicies.reduce((s, p) => s + (p.sumInsured ?? 0), 0);
      const totalHealth    = personalHealth + employerHealth;
      const healthRequired = annualIncome * 5;

      // ── Personal Accident ──────────────────────────────────────────────────
      const paPolicies = byType('accident');
      const paSum = paPolicies.reduce((s, p) => s + (p.sumInsured ?? 0), 0);

      // ── Motor ─────────────────────────────────────────────────────────────
      const motorPolicies = byType('vehicle').concat(byType('motor'));
      const motorSum = motorPolicies.reduce((s, p) => s + (p.sumInsured ?? 0), 0);

      const res: GapResult[] = [
        {
          label:        'Term Life Insurance',
          rule:         'CFA Rule: ≥ 10× Annual Income',
          required:     termRequired,
          personalCover: personalTerm,
          employerCover: employerTerm,
          current:      totalTerm,
          gap:          Math.max(0, termRequired - totalTerm),
          pct:          termRequired > 0 ? Math.min(100, (totalTerm / termRequired) * 100) : 0,
          ok:           totalTerm >= termRequired,
          approxCost:   `≈ ₹${Math.round(Math.max(0, termRequired - totalTerm) / 1000 * 0.7).toLocaleString('en-IN')}/yr for a ₹${Math.round((termRequired - totalTerm) / 100000)}L term plan at age 35`,
          actionLabel:  'Compare Term Plans',
          breakdown:    termPolicies.map(p => ({ label: `${p.provider} (${p.familyMember || 'Me'})`, value: p.sumInsured ?? 0 })),
        },
        {
          label:        'Health / Medical Insurance',
          rule:         'CFA Rule: ≥ 5× Annual Income (personal + employer)',
          required:     healthRequired,
          personalCover: personalHealth,
          employerCover: employerHealth,
          current:      totalHealth,
          gap:          Math.max(0, healthRequired - totalHealth),
          pct:          healthRequired > 0 ? Math.min(100, (totalHealth / healthRequired) * 100) : 0,
          ok:           totalHealth >= healthRequired,
          approxCost:   `≈ ₹${Math.round(Math.max(0, healthRequired - totalHealth) / 100).toLocaleString('en-IN')}/yr for a top-up plan`,
          actionLabel:  'Compare Health Plans',
          breakdown:    healthPolicies.map(p => ({ label: `${p.provider} (${p.familyMember || 'Me'})`, value: p.sumInsured ?? 0 })),
        },
      ];

      if (paSum > 0) {
        res.push({
          label: 'Personal Accident Cover',
          rule:  'Recommended: 2–3× Annual Income',
          required: annualIncome * 2,
          personalCover: paSum,
          employerCover: 0,
          current: paSum,
          gap: Math.max(0, annualIncome * 2 - paSum),
          pct: Math.min(100, (paSum / (annualIncome * 2)) * 100),
          ok:  paSum >= annualIncome * 2,
          breakdown: paPolicies.map(p => ({ label: p.provider, value: p.sumInsured ?? 0 })),
        });
      }

      if (motorSum > 0) {
        res.push({
          label:        'Motor / Vehicle Insurance',
          rule:         'At least one active policy per vehicle',
          required:     0, personalCover: motorSum, employerCover: 0,
          current:      motorSum, gap: 0, pct: 100, ok: true,
          breakdown:    motorPolicies.map(p => ({ label: p.provider, value: p.sumInsured ?? 0 })),
        });
      }

      setResults(res);
    } catch {
      toast.error('Failed to load insurance data');
    }
    setLoading(false);
  }

  const urgent  = results.filter(r => !r.ok && r.gap > 0);
  const allOk   = results.length > 0 && urgent.length === 0;
  const missingNominee = policies.filter(p => !p.nomineeName?.trim());

  const pctColor = (pct: number, ok: boolean) =>
    ok ? 'text-success' : pct >= 60 ? 'text-warning' : 'text-destructive';

  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto pb-20">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Insurance Gap Analysis</h2>
          <p className="text-xs text-muted-foreground">CFA Rule: Term ≥ 10× · Health ≥ 5× annual income</p>
        </div>
      </div>

      {/* Income + Employer Cover inputs */}
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
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Annual Income (₹)</Label>
              <Input
                type="number"
                value={annualIncome}
                onChange={e => setAnnualIncome(Number(e.target.value))}
                className="h-9 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Employer Term Cover (₹)</Label>
                <Input
                  type="number"
                  value={employerTerm}
                  onChange={e => setEmployerTerm(Number(e.target.value))}
                  className="h-9 text-sm"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Employer Health Cover (₹)</Label>
                <Input
                  type="number"
                  value={employerHealth}
                  onChange={e => setEmployerHealth(Number(e.target.value))}
                  className="h-9 text-sm"
                  placeholder="500000"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing nominee alert */}
      {missingNominee.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/8 border border-destructive/20 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Antifragility Failure: {missingNominee.length} polic{missingNominee.length > 1 ? 'ies' : 'y'} missing nominee</p>
            <p className="text-destructive/80 mt-0.5">
              {missingNominee.map(p => `${p.provider} (${p.type})`).join(' · ')} — go to Insurance Manager to fix.
            </p>
          </div>
        </div>
      )}

      {/* Overall status banner */}
      {!loading && results.length > 0 && (
        <Card className={`border ${allOk ? 'border-success/40 bg-success/5' : urgent.length >= 2 ? 'border-destructive/40 bg-destructive/5' : 'border-warning/40 bg-warning/5'}`}>
          <CardContent className="py-3 px-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {allOk
                ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                : <AlertTriangle className="h-4 w-4 text-warning shrink-0" />}
              <div>
                <p className="text-sm font-semibold">
                  {allOk ? 'Coverage Adequate ✓' : `${urgent.length} critical gap${urgent.length > 1 ? 's' : ''} detected`}
                </p>
                {!allOk && (
                  <p className="text-xs text-muted-foreground">
                    Total shortfall: {formatCurrency(urgent.reduce((s, r) => s + r.gap, 0))}
                  </p>
                )}
              </div>
            </div>
            {!allOk && (
              <Badge variant="destructive" className="text-[10px] shrink-0">Action Required</Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Analysing policies…</div>
      ) : results.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Shield className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No insurance policies found.</p>
            <p className="text-xs text-muted-foreground mt-1">Add policies in the Insurance module first.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map(r => {
            const isExpanded = expanded === r.label;
            return (
              <Card key={r.label} className={`border ${r.ok ? 'border-border/60' : r.pct < 50 ? 'border-destructive/40' : 'border-warning/40'}`}>
                <CardHeader className="pb-1 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{r.label}</CardTitle>
                    {r.ok
                      ? <Badge className="text-[10px] bg-success/15 text-success border-success/30 border">Covered ✓</Badge>
                      : r.pct < 50
                        ? <Badge variant="destructive" className="text-[10px]">Critical Gap</Badge>
                        : <Badge className="text-[10px] bg-warning/15 text-warning border-warning/30 border">Gap</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{r.rule}</p>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Current: <strong className={`${pctColor(r.pct, r.ok)}`}>{formatCurrency(r.current)}</strong>
                      {r.employerCover > 0 && (
                        <span className="text-muted-foreground/60 ml-1">(incl. ₹{(r.employerCover / 100000).toFixed(0)}L employer)</span>
                      )}
                    </span>
                    <span>Required: <strong className="text-foreground">{formatCurrency(r.required)}</strong></span>
                  </div>
                  <Progress value={r.pct} className={`h-2 ${r.ok ? '' : r.pct < 50 ? '[&>div]:bg-destructive' : '[&>div]:bg-warning'}`} />
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${pctColor(r.pct, r.ok)}`}>{Math.round(r.pct)}% covered</span>
                    {r.breakdown && r.breakdown.length > 0 && (
                      <button
                        className="text-[10px] text-muted-foreground flex items-center gap-0.5"
                        onClick={() => setExpanded(isExpanded ? null : r.label)}
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {isExpanded ? 'Hide' : `${r.breakdown.length} polic${r.breakdown.length > 1 ? 'ies' : 'y'}`}
                      </button>
                    )}
                  </div>

                  {/* Policy breakdown */}
                  {isExpanded && r.breakdown && r.breakdown.length > 0 && (
                    <div className="mt-1 space-y-1 border-t border-border/40 pt-2">
                      {r.breakdown.map((b, i) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">{b.label}</span>
                          <span className="font-medium text-foreground">{formatCurrency(b.value)}</span>
                        </div>
                      ))}
                      {r.employerCover > 0 && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Employer Cover</span>
                          <span className="font-medium text-primary">{formatCurrency(r.employerCover)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Gap action */}
                  {!r.ok && r.gap > 0 && (
                    <div className="flex items-start gap-2 pt-1 border-t border-border/40">
                      <AlertTriangle className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${r.pct < 50 ? 'text-destructive' : 'text-warning'}`} />
                      <div className="flex-1">
                        <p className={`text-xs font-medium ${r.pct < 50 ? 'text-destructive' : 'text-warning'}`}>
                          Shortfall: {formatCurrency(r.gap)}
                        </p>
                        {r.approxCost && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{r.approxCost}</p>
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

      {/* CFA note */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>CFA-standard benchmarks: Term ≥ 10× gross annual income ensures your family's 10-year income replacement. Health ≥ 5× annual income protects against a major medical event wiping out savings.</p>
      </div>
    </div>
  );
}
