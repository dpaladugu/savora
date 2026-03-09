/**
 * Financial Health Audit — §25 CFA/FRM Audit Dashboard
 * S22-Ultra optimised Report Card view.
 */
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  RefreshCw, AlertTriangle, CheckCircle2, AlertCircle,
  TrendingUp, TrendingDown, Shield, Droplets, Zap,
  ArrowRight, Target, Activity, Info,
} from 'lucide-react';
import {
  AuditEngineService,
  type AuditEngineResult,
  type TrafficLight,
  DSCR_CRITICAL, DSCR_WARNING, DIR_TARGET_DAYS,
} from '@/services/AuditEngineService';
import { formatCurrency } from '@/lib/format-utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function signalColor(s: TrafficLight): string {
  if (s === 'healthy')  return 'text-success';
  if (s === 'warning')  return 'text-warning';
  return 'text-destructive';
}

function signalBg(s: TrafficLight): string {
  if (s === 'healthy')  return 'bg-success/10 border-success/30';
  if (s === 'warning')  return 'bg-warning/10 border-warning/30';
  return 'bg-destructive/10 border-destructive/30';
}

function signalBadgeVariant(s: TrafficLight): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'healthy')  return 'default';
  if (s === 'warning')  return 'secondary';
  return 'destructive';
}

function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  const color =
    score >= 75 ? 'stroke-success' :
    score >= 50 ? 'stroke-warning' :
    'stroke-destructive';

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8"
          className="stroke-muted/30" />
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8"
          className={color}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className={`text-2xl font-bold leading-none ${color.replace('stroke-', 'text-')}`}>{score}</p>
        <p className="text-[9px] text-muted-foreground font-medium mt-0.5">/ 100</p>
      </div>
    </div>
  );
}

function GaugeRing({
  value, min, max, label, unit, signal,
  lowLabel, highLabel,
}: {
  value: number; min: number; max: number; label: string;
  unit?: string; signal: TrafficLight;
  lowLabel?: string; highLabel?: string;
}) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const pct = Math.min((value - min) / (max - min), 1);
  const dash = pct * circ;

  const strokeClass =
    signal === 'healthy'  ? 'stroke-success' :
    signal === 'warning'  ? 'stroke-warning' :
    'stroke-destructive';

  const displayValue = value > 999 ? '∞' : value.toFixed(value < 10 ? 2 : 0);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7"
            className="stroke-muted/30" />
          <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7"
            className={strokeClass}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="absolute text-center">
          <p className={`text-sm font-bold leading-none ${strokeClass.replace('stroke-', 'text-')}`}>
            {displayValue}
          </p>
          {unit && <p className="text-[9px] text-muted-foreground">{unit}</p>}
        </div>
      </div>
      <p className="text-xs font-medium text-foreground text-center">{label}</p>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between w-full text-[9px] text-muted-foreground px-0.5">
          <span>{lowLabel}</span><span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

function RiskCard({
  risk,
  onCTA,
}: {
  risk: AuditEngineResult['risks'][number];
  onCTA: (action: string) => void;
}) {
  const Icon = risk.severity === 'critical' ? AlertTriangle :
               risk.severity === 'warning'  ? AlertCircle : Info;
  const colorCls =
    risk.severity === 'critical' ? 'text-destructive border-destructive/30 bg-destructive/5' :
    risk.severity === 'warning'  ? 'text-warning border-warning/30 bg-warning/5' :
    'text-muted-foreground border-border/40 bg-muted/20';

  return (
    <div className={`rounded-xl border p-3 ${colorCls}`}>
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-snug">{risk.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{risk.detail}</p>
        </div>
        {risk.ctaLabel && risk.ctaAction && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] px-2 shrink-0 gap-1 font-medium"
            onClick={() => onCTA(risk.ctaAction!)}
          >
            {risk.ctaLabel}
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  /** Pass-through: navigate to a more-module when user clicks a CTA */
  onMoreNavigation?: (moduleId: string) => void;
}

export function FinancialHealthAudit({ onMoreNavigation }: Props) {
  const [result, setResult]   = useState<AuditEngineResult | null>(null);
  const [running, setRunning] = useState(false);

  const runAudit = useCallback(async () => {
    setRunning(true);
    try {
      const r = await AuditEngineService.run();
      setResult(r);
      toast.success('Audit complete');
    } catch (e: any) {
      toast.error('Audit failed: ' + (e.message || 'Unknown error'));
    } finally {
      setRunning(false);
    }
  }, []);

  // Auto-run on first mount
  React.useEffect(() => { runAudit(); }, []);

  const handleCTA = useCallback((action: string) => {
    onMoreNavigation?.(action);
  }, [onMoreNavigation]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Financial Health Audit</h1>
            <p className="text-xs text-muted-foreground">CFA/FRM-style · Real-time · Rules Engine</p>
          </div>
        </div>
        <Button onClick={runAudit} disabled={running} size="sm" className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Running…' : result ? 'Re-run' : 'Run Audit'}
        </Button>
      </div>

      {/* Empty state */}
      {!result && !running && (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
            <Shield className="h-10 w-10 text-muted-foreground/30" />
            <p className="font-semibold text-sm text-foreground">Antifragile Audit</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Run a deterministic CFA-grade health check across all your financial data.
              DSCR, DIR, Debt-to-Freedom Velocity, and the Antifragile checklist in one tap.
            </p>
            <Button onClick={runAudit} className="mt-1 gap-2">
              <Zap className="h-4 w-4" /> Run Full Audit
            </Button>
          </CardContent>
        </Card>
      )}

      {running && (
        <Card className="border-primary/20">
          <CardContent className="py-8 flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Scanning IndexedDB…</p>
          </CardContent>
        </Card>
      )}

      {result && !running && (
        <>
          {/* ── Report Card Header ── */}
          <Card className="border-border/60">
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-4">
                <ScoreRing score={result.overallScore} />
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-base font-bold text-foreground">
                      {result.overallScore >= 75 ? '✅ Antifragile' :
                       result.overallScore >= 50 ? '⚠️ Needs Attention' :
                       '🚨 Critical Issues'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.risks.filter(r => r.severity === 'critical').length} critical ·{' '}
                      {result.risks.filter(r => r.severity === 'warning').length} warnings
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Last run: {new Date(result.calculatedAt).toLocaleTimeString()}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(['dscr', 'dir', 'ycs'] as const).map(key => {
                      const sig =
                        key === 'dscr' ? result.dscr.signal :
                        key === 'dir'  ? result.dir.signal  :
                        result.yieldCostSpread.signal;
                      const label =
                        key === 'dscr' ? 'DSCR' :
                        key === 'dir'  ? 'DIR'  : 'Yield';
                      return (
                        <Badge key={key} variant={signalBadgeVariant(sig)}
                          className={`text-[10px] ${sig === 'healthy' ? 'bg-success/15 text-success border-success/30' : ''}`}>
                          {label}: {sig}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Gauge Row: DSCR + DIR ── */}
          <Card className="border-border/60">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Core Ratios
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <GaugeRing
                  value={result.dscr.value}
                  min={0} max={3}
                  label="DSCR"
                  unit="×"
                  signal={result.dscr.signal}
                  lowLabel={`< ${DSCR_CRITICAL}`}
                  highLabel={`≥ ${DSCR_WARNING}`}
                />
                <GaugeRing
                  value={result.dir.days}
                  min={0} max={DIR_TARGET_DAYS}
                  label="Def. Interval"
                  unit="days"
                  signal={result.dir.signal}
                  lowLabel="< 90d"
                  highLabel="180d ✓"
                />
              </div>

              <Separator className="my-3" />

              {/* DSCR breakdown */}
              <div className="space-y-1.5 text-xs">
                <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">DSCR Breakdown (Guntur)</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Guntur Rent', value: formatCurrency(result.dscr.netGunturRent), sub: 'occupied shops' },
                    { label: '− Sinking Fund', value: `−${formatCurrency(result.dscr.sinkingFundMonthly)}`, sub: '₹5,400/mo priority' },
                    { label: '÷ Total EMI', value: formatCurrency(result.dscr.totalMonthlyEMI), sub: 'all active loans' },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="bg-muted/30 rounded-lg p-2 border border-border/40">
                      <p className="font-bold text-foreground text-[11px]">{value}</p>
                      <p className="text-[9px] text-muted-foreground">{label}</p>
                      <p className="text-[9px] text-muted-foreground/60">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-3" />

              {/* DIR breakdown */}
              <div className="space-y-1.5 text-xs">
                <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">DIR Breakdown</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/30 rounded-lg p-2 border border-border/40">
                    <p className="font-bold text-foreground text-[11px]">{formatCurrency(result.dir.liquidAssets)}</p>
                    <p className="text-[9px] text-muted-foreground">Liquid Assets</p>
                    <p className="text-[9px] text-muted-foreground/60">EF + Liquid MFs + Savings</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2 border border-border/40">
                    <p className="font-bold text-foreground text-[11px]">{formatCurrency(result.dir.avgDailyExpenses)}/day</p>
                    <p className="text-[9px] text-muted-foreground">Avg Daily Expense</p>
                    <p className="text-[9px] text-muted-foreground/60">Trailing 90 days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Debt-to-Freedom ── */}
          <Card className="border-border/60">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                2029 Debt-Freedom Velocity
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{result.debtFreedom.pct}%</p>
                  <p className="text-xs text-muted-foreground">Mission complete</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-destructive">{formatCurrency(result.debtFreedom.currentOutstanding)}</p>
                  <p className="text-[10px] text-muted-foreground">remaining</p>
                </div>
              </div>
              <Progress value={result.debtFreedom.pct} className="h-2.5" />
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Debt Reduced', value: formatCurrency(result.debtFreedom.debtReduced), color: 'text-success' },
                  { label: 'Months Left', value: `${result.debtFreedom.monthsRemaining}mo`, color: 'text-foreground' },
                  { label: 'Reqd/Month', value: formatCurrency(result.debtFreedom.requiredMonthlyPaydown), color: 'text-warning' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-muted/30 rounded-lg p-2 border border-border/40">
                    <p className={`font-bold text-[11px] ${color}`}>{value}</p>
                    <p className="text-[9px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs"
                onClick={() => handleCTA('debt-strike')}
              >
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                Open Debt Strike Calculator
              </Button>
            </CardContent>
          </Card>

          {/* ── Yield-Cost Spread ── */}
          <Card className={`border ${signalBg(result.yieldCostSpread.signal)}`}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className={`h-4 w-4 ${signalColor(result.yieldCostSpread.signal)}`} />
                Yield-Cost Spread
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Loan Cost', value: `${result.yieldCostSpread.weightedLoanRate.toFixed(1)}%`, sub: 'wtd avg rate', color: 'text-destructive' },
                  { label: 'Invest XIRR', value: `${result.yieldCostSpread.investmentXIRR.toFixed(1)}%`, sub: 'trailing 12mo', color: 'text-success' },
                  {
                    label: 'Spread',
                    value: `${result.yieldCostSpread.spread >= 0 ? '+' : ''}${result.yieldCostSpread.spread.toFixed(1)}%`,
                    sub: result.yieldCostSpread.spread >= 0 ? 'investments winning' : 'debt costlier',
                    color: signalColor(result.yieldCostSpread.signal),
                  },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="bg-background/60 rounded-lg p-2.5 border border-border/40">
                    <p className={`text-base font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
                    <p className="text-[9px] text-muted-foreground/60">{sub}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Antifragile Risk Checklist ── */}
          <Card className="border-border/60">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Antifragile Checklist
                </span>
                <Badge variant={result.risks.length === 0 ? 'default' : 'secondary'}
                  className={result.risks.length === 0 ? 'bg-success/15 text-success border-success/30 text-[10px]' : 'text-[10px]'}>
                  {result.risks.length === 0 ? '✓ All Clear' : `${result.risks.length} issue${result.risks.length > 1 ? 's' : ''}`}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {result.risks.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-success/8 border border-success/20">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <p className="text-xs text-success font-medium">
                    No antifragility gaps detected. System is operating at peak defensive posture.
                  </p>
                </div>
              )}
              {result.risks
                .sort((a, b) =>
                  a.severity === 'critical' ? -1 :
                  b.severity === 'critical' ? 1 :
                  a.severity === 'warning'  ? -1 : 1
                )
                .map(risk => (
                  <RiskCard key={risk.id} risk={risk} onCTA={handleCTA} />
                ))}
            </CardContent>
          </Card>

          {/* ── Guntur Waterfall Priority Reminder ── */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5" />
                Guntur Waterfall — Priority Sequence
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <ol className="text-[11px] text-muted-foreground space-y-0.5 list-none">
                {[
                  { n: 1, label: 'Premium Recovery', value: '₹1,67,943' },
                  { n: 2, label: '2029 Sinking Fund', value: '₹5,400/mo' },
                  { n: 3, label: 'Household Expenses', value: '₹45,000/mo' },
                  { n: 4, label: "Grandma's Safety Net", value: '₹5,00,000' },
                  { n: 5, label: 'ICICI Loan Prepayment', value: 'surplus' },
                ].map(({ n, label, value }) => (
                  <li key={n} className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[9px] shrink-0">{n}</span>
                    <span className="flex-1">{label}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </li>
                ))}
              </ol>
              <Button variant="ghost" size="sm" className="mt-2 w-full text-xs gap-1 text-primary"
                onClick={() => handleCTA('property-engine')}>
                Open Waterfall Engine <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
