/**
 * Insurance Gap Analysis — §20 CFA Rule
 * Term life ≥ 10× annual income
 * Health cover ≥ 5× annual income
 */
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2, Shield, TrendingUp, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

interface GapResult {
  label: string;
  rule: string;
  required: number;
  current: number;
  gap: number;
  pct: number;
  ok: boolean;
}

export function InsuranceGapAnalysis() {
  const [annualIncome, setAnnualIncome] = useState(1200000);
  const [results, setResults]           = useState<GapResult[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => { analyse(); }, [annualIncome]);

  async function analyse() {
    setLoading(true);
    try {
      const policies = await db.insurancePolicies.toArray();

      // Term life total
      const termSum = policies
        .filter(p => p.type?.toLowerCase().includes('term'))
        .reduce((s, p) => s + (p.sumInsured ?? 0), 0);

      // Health cover total
      const healthSum = policies
        .filter(p => p.type?.toLowerCase().includes('health') || p.type?.toLowerCase().includes('medical'))
        .reduce((s, p) => s + (p.sumInsured ?? 0), 0);

      // Motor / vehicle
      const motorSum = policies
        .filter(p => p.type?.toLowerCase().includes('motor') || p.type?.toLowerCase().includes('vehicle'))
        .reduce((s, p) => s + (p.sumInsured ?? 0), 0);

      const termRequired   = annualIncome * 10;
      const healthRequired = annualIncome * 5;

      const res: GapResult[] = [
        {
          label:    'Term Life Insurance',
          rule:     '≥ 10× Annual Income (CFA Rule)',
          required: termRequired,
          current:  termSum,
          gap:      Math.max(0, termRequired - termSum),
          pct:      termRequired > 0 ? Math.min(100, (termSum / termRequired) * 100) : 0,
          ok:       termSum >= termRequired,
        },
        {
          label:    'Health / Medical Insurance',
          rule:     '≥ 5× Annual Income (CFA Rule)',
          required: healthRequired,
          current:  healthSum,
          gap:      Math.max(0, healthRequired - healthSum),
          pct:      healthRequired > 0 ? Math.min(100, (healthSum / healthRequired) * 100) : 0,
          ok:       healthSum >= healthRequired,
        },
      ];

      if (motorSum > 0) {
        res.push({
          label:    'Motor / Vehicle Insurance',
          rule:     'At least one active policy per vehicle',
          required: 0,
          current:  motorSum,
          gap:      0,
          pct:      100,
          ok:       true,
        });
      }

      setResults(res);
    } catch {
      toast.error('Failed to load insurance data');
    }
    setLoading(false);
  }

  const allOk  = results.length > 0 && results.every(r => r.ok);
  const urgent = results.filter(r => !r.ok);

  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Insurance Gap Analysis</h2>
          <p className="text-xs text-muted-foreground">CFA Rule: Term ≥ 10× income · Health ≥ 5× income</p>
        </div>
      </div>

      {/* Income input */}
      <Card className="border-border/60">
        <CardContent className="py-3 px-4 flex items-center gap-3">
          <IndianRupee className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Annual Income (₹)</Label>
            <Input
              type="number"
              value={annualIncome}
              onChange={e => setAnnualIncome(Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Overall status */}
      {!loading && (
        <Card className={`border ${allOk ? 'border-success/40 bg-success/5' : 'border-warning/40 bg-warning/5'}`}>
          <CardContent className="py-3 px-4 flex items-center gap-2">
            {allOk
              ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              : <AlertTriangle className="h-4 w-4 text-warning shrink-0" />}
            <p className="text-sm font-semibold">
              {allOk
                ? 'Insurance coverage is adequate ✓'
                : `${urgent.length} gap${urgent.length > 1 ? 's' : ''} found — action required`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Analysing…</div>
      ) : (
        <div className="space-y-3">
          {results.map(r => (
            <Card key={r.label} className={`border ${r.ok ? 'border-border/60' : 'border-warning/40'}`}>
              <CardHeader className="pb-1 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{r.label}</CardTitle>
                  {r.ok
                    ? <Badge className="text-[10px] bg-success/15 text-success border-success/30 border">Covered ✓</Badge>
                    : <Badge className="text-[10px] bg-warning/15 text-warning border-warning/30 border">Gap!</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{r.rule}</p>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Current: <strong className="text-foreground">₹{r.current.toLocaleString('en-IN')}</strong></span>
                  <span>Required: <strong className="text-foreground">₹{r.required.toLocaleString('en-IN')}</strong></span>
                </div>
                <Progress value={r.pct} className={`h-2 ${r.ok ? '' : '[&>div]:bg-warning'}`} />
                {!r.ok && r.gap > 0 && (
                  <div className="flex items-start gap-2 pt-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                    <p className="text-xs text-warning">
                      Gap: ₹{r.gap.toLocaleString('en-IN')} — 
                      {r.label.includes('Term')
                        ? ` A ₹${r.gap.toLocaleString('en-IN')} term plan at age 35 costs ≈ ₹${Math.round(r.gap / 1000 * 0.8).toLocaleString('en-IN')}/yr`
                        : ` Top-up health plan of ₹${r.gap.toLocaleString('en-IN')} costs ≈ ₹${Math.round(r.gap / 100).toLocaleString('en-IN')}/yr`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {results.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No insurance policies found. Add policies in the Insurance module first.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
