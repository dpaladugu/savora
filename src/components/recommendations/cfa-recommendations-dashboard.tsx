import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Target, PieChart, BarChart3, Brain, Lightbulb,
  ShieldCheck, Zap, Home, PiggyBank, RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { addMonths, differenceInMonths, format } from 'date-fns';

// ── Amort helper ──────────────────────────────────────────────────────────────
function simLoanMonths(out: number, roi: number, emi: number, extra = 0): number {
  if (out <= 0) return 0;
  const r = roi / 100 / 12;
  let bal = out, m = 0;
  while (bal > 0 && m < 600) {
    m++;
    bal -= Math.min(bal, emi - bal * r);
    if (extra > 0) bal = Math.max(0, bal - extra);
    if (bal <= 0) break;
  }
  return m;
}

interface Rec {
  id: string;
  type: 'debt' | 'insurance' | 'tax' | 'portfolio' | 'emergency' | 'rental';
  priority: 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  actionItems: string[];
  expectedImpact: string;
  icon: React.ReactNode;
}

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };
const fmt = (d: Date) => format(d, 'MMM yyyy');

export function CFARecommendationsDashboard() {
  const loans       = useLiveQuery(() => db.loans.toArray().catch(() => []),         []) ?? [];
  const investments = useLiveQuery(() => db.investments.toArray().catch(() => []),   []) ?? [];
  const insurance   = useLiveQuery(() => db.insurance.toArray().catch(() => []),     []) ?? [];
  const expenses    = useLiveQuery(() => db.expenses.toArray().catch(() => []),      []) ?? [];
  const incomes     = useLiveQuery(() => db.incomes.toArray().catch(() => []),       []) ?? [];
  const goals       = useLiveQuery(() => db.goals.toArray().catch(() => []),         []) ?? [];
  const ef          = useLiveQuery(() => db.emergencyFunds.limit(1).first().catch(() => undefined), []);
  const shops       = useLiveQuery(() => db.gunturShops.toArray().catch(() => []),   []) ?? [];
  const rooms       = useLiveQuery(() => db.gorantlaRooms.toArray().catch(() => []), []) ?? [];
  const settings    = useLiveQuery(() => db.globalSettings.limit(1).first().catch(() => undefined), []);

  const [selectedType, setSelectedType] = React.useState<string>('all');
  const [refreshKey,   setRefreshKey]   = React.useState(0);

  const recs: Rec[] = useMemo(() => {
    const list: Rec[] = [];

    // ── Active loans ─────────────────────────────────────────────────────────
    const activeLoans = loans.filter(l => l.isActive !== false && ((l as any).outstanding ?? l.principal ?? 0) > 0);
    const incred = activeLoans.find(l => l.id === 'loan-incred-2026' || (l.name ?? '').toLowerCase().includes('incred'));
    const icici  = activeLoans.find(l => l.id === 'loan-icici-master-2026' || ((l.name ?? '').toLowerCase().includes('master') && (l.principal ?? 0) > 20_00_000));

    // DEBT #1 — InCred high-ROI priority
    if (incred) {
      const out = (incred as any).outstanding ?? incred.principal ?? 0;
      const emi = (incred as any).emi ?? 32641;
      const roi = (incred as any).roi ?? 14.2;
      const moBase = simLoanMonths(out, roi, emi, 0);
      const moWith25k = simLoanMonths(out, roi, emi, 25000);
      const saving = Math.max(0, moBase - moWith25k);
      list.push({
        id: 'incred-priority',
        type: 'debt',
        priority: 'High',
        title: `Kill InCred @ ${roi}% — Phase 1 Priority`,
        description: `Outstanding ₹${(out / 1_00_000).toFixed(2)}L at ${roi}% is your highest-cost liability. Every ₹25,000 prepayment saves ~${saving} months of interest.`,
        actionItems: [
          `Target ₹25k minimum part-payment gate each time P5 rental surplus accumulates`,
          `Post-February 2026 salary surplus → all to InCred prepayment first`,
          `Expected kill: ${fmt(addMonths(new Date(), moWith25k > 0 ? moWith25k : moBase))} with current EMI + P5 surplus`,
        ],
        expectedImpact: `Adding ₹25k/mo extra prepayment shortens payoff by ~${saving} months vs EMI-only`,
        icon: <Zap className="w-4 h-4" />,
      });
    }

    // DEBT #2 — ICICI sequencing advice
    if (icici && incred) {
      const iciciOut = (icici as any).outstanding ?? icici.principal ?? 0;
      list.push({
        id: 'icici-sequencing',
        type: 'debt',
        priority: 'High',
        title: 'Do NOT split — avalanche order saves ₹ lakhs',
        description: `Paying InCred first (14.2%) before ICICI (9.99%) saves significant interest. Splitting EMI between both loans wastes the avalanche benefit.`,
        actionItems: [
          `Maintain ICICI minimum EMI only (₹${formatCurrency((icici as any).emi ?? 61424)}) until InCred is zero`,
          `Once InCred is cleared, redirect full InCred EMI + P5 surplus to ICICI`,
          `Current ICICI outstanding: ${formatCurrency(iciciOut)} — Phase 2 target by Dec 2029`,
        ],
        expectedImpact: `Avalanche order vs parallel repayment: saves ₹3–5L in cumulative interest`,
        icon: <TrendingDown className="w-4 h-4" />,
      });
    }

    // INSURANCE #1 — Coverage gap analysis
    const personalInsurance = insurance.filter(ins =>
      ins.policySource !== 'Corporate / Employer' && ins.policySource !== 'Government Scheme' && ins.isActive !== false
    );
    const corporateInsurance = insurance.filter(ins => ins.policySource === 'Corporate / Employer' && ins.isActive !== false);
    const totalHealthCoverage = [...personalInsurance, ...corporateInsurance]
      .filter(ins => (ins.type ?? '').toLowerCase().includes('health'))
      .reduce((s, ins) => s + (ins.sumInsured ?? ins.sumAssured ?? 0), 0);

    if (totalHealthCoverage < 15_00_000) {
      list.push({
        id: 'health-coverage-gap',
        type: 'insurance',
        priority: 'High',
        title: 'Health coverage below ₹15L recommended minimum',
        description: `Current health sum insured is ${formatCurrency(totalHealthCoverage)}. For a family of 3 in 2026 (14% medical inflation), IRDAI recommends minimum ₹15L cover.`,
        actionItems: [
          'Check if corporate group health from employer is included; it lapses if you change jobs',
          'Add a super top-up policy (₹15–25L deductible ₹5L) — typically < ₹10k/yr premium',
          corporateInsurance.length > 0 ? 'Your corporate cover creates job-risk exposure — personal base cover is essential' : 'Get a floater family plan with at least ₹10L base cover',
        ],
        expectedImpact: 'Prevents a single hospitalization from wiping out the emergency fund or triggering new loans',
        icon: <ShieldCheck className="w-4 h-4" />,
      });
    }

    // INSURANCE #2 — Term insurance adequacy (income replacement)
    const monthlyIncome = incomes
      .filter(i => new Date(i.date) > addMonths(new Date(), -3))
      .reduce((s, i) => s + i.amount, 0) / 3;
    const termPolicies = insurance.filter(ins => (ins.type ?? '').toLowerCase().includes('term') && ins.isActive !== false);
    const totalTermCover = termPolicies.reduce((s, ins) => s + (ins.sumInsured ?? ins.sumAssured ?? 0), 0);
    const recommendedTerm = monthlyIncome * 12 * 15; // 15x annual income

    if (monthlyIncome > 0 && totalTermCover < recommendedTerm * 0.7) {
      list.push({
        id: 'term-cover-gap',
        type: 'insurance',
        priority: 'Medium',
        title: `Term cover gap: have ${formatCurrency(totalTermCover)} vs recommended ${formatCurrency(recommendedTerm)}`,
        description: `For a 35-yr old with ₹${(monthlyIncome / 1000).toFixed(0)}k/mo income, CFA standard is 15× annual income in term cover to protect dependents from debt burden.`,
        actionItems: [
          `Add a pure-term plan for ₹${formatCurrency(Math.ceil((recommendedTerm - totalTermCover) / 10_00_000) * 10_00_000)} to close the gap`,
          'Prefer annual premium (not single premium) for flexibility',
          'Ensure nominee details and KYC are complete on all existing policies',
        ],
        expectedImpact: 'Family is protected against InCred + ICICI total ₹43L liability in case of income loss',
        icon: <ShieldCheck className="w-4 h-4" />,
      });
    }

    // TAX — New Regime optimisation
    const annualIncome = incomes
      .filter(i => new Date(i.date) > addMonths(new Date(), -12))
      .reduce((s, i) => s + i.amount, 0);
    const npsInvestments = investments.filter(i => (i.type ?? '').toUpperCase().includes('NPS'));
    const totalNpsContrib = npsInvestments.reduce((s, i) => s + (i.investedValue ?? (i as any).amount ?? 0), 0);

    if (annualIncome > 7_00_000) {
      list.push({
        id: 'new-regime-nps',
        type: 'tax',
        priority: 'Medium',
        title: 'Maximise 80CCD(2) NPS — only deduction in New Regime',
        description: `Under New Tax Regime, Sec 80CCD(2) employer NPS contribution (up to 10% of salary) is the ONLY deduction allowed. Your current NPS corpus: ${formatCurrency(totalNpsContrib)}.`,
        actionItems: [
          'Ask HR to route 10% of basic salary into NPS Tier 1 under 80CCD(2)',
          '80CCD(1B) ₹50k voluntary NPS is NOT available in New Regime — skip it',
          'Standard deduction ₹75,000 is auto-applied; no other investments reduce tax',
          `At ₹${(annualIncome / 1_00_000).toFixed(1)}L income, Section 87A rebate applies only up to ₹7L taxable income`,
        ],
        expectedImpact: `Employer NPS at 10% of basic can reduce taxable income by ₹${formatCurrency(Math.round(annualIncome * 0.4 * 0.1))} annually`,
        icon: <Target className="w-4 h-4" />,
      });
    }

    // PORTFOLIO — Debt-heavy, needs equity balance
    const totalInvestmentValue = investments.reduce((s, i) => s + (i.currentValue ?? i.investedValue ?? (i as any).amount ?? 0), 0);
    const totalDebt = activeLoans.reduce((s, l) => s + ((l as any).outstanding ?? l.principal ?? 0), 0);
    const equityInvestments = investments.filter(i => ['MF', 'SIP', 'Equity', 'SGB', 'Stocks'].some(k => (i.type ?? '').includes(k)));
    const equityValue = equityInvestments.reduce((s, i) => s + (i.currentValue ?? i.investedValue ?? (i as any).amount ?? 0), 0);
    const equityPct = totalInvestmentValue > 0 ? (equityValue / totalInvestmentValue) * 100 : 0;

    if (totalDebt > 0 && totalDebt > totalInvestmentValue * 0.5) {
      list.push({
        id: 'debt-heavy-portfolio',
        type: 'portfolio',
        priority: 'Medium',
        title: `Debt ratio high: ${formatCurrency(totalDebt)} liabilities vs ${formatCurrency(totalInvestmentValue)} assets`,
        description: `Debt-to-asset ratio is ${totalInvestmentValue > 0 ? ((totalDebt / totalInvestmentValue) * 100).toFixed(0) : '∞'}%. New investments should wait until InCred is cleared — guaranteed 14.2% return on prepayment beats any market SIP in this interest-rate environment.`,
        actionItems: [
          'Maintain existing SIPs for goal-linked investments only (e.g., emergency fund, retirement)',
          `Avoid taking on any new loans until post Dec 2029 debt-free milestone`,
          'Keep 3 months EMI buffer (₹2.8L) in liquid FD or savings account',
          'Post debt-freedom: 60% equity + 20% debt + 20% gold is the target allocation',
        ],
        expectedImpact: 'Clearing ₹43L total debt at avg 11.5% ROI = equivalent of earning ₹5L/yr risk-free',
        icon: <PieChart className="w-4 h-4" />,
      });
    }

    // EMERGENCY FUND
    if (ef) {
      const efPct = ef.targetAmount > 0 ? (ef.currentAmount / ef.targetAmount) * 100 : 0;
      if (efPct < 80) {
        list.push({
          id: 'ef-gap',
          type: 'emergency',
          priority: efPct < 40 ? 'High' : 'Medium',
          title: `Emergency fund at ${efPct.toFixed(0)}% — target 6 months`,
          description: `Current emergency fund covers ${ef.targetMonths ?? 6} months of expenses but is only ${efPct.toFixed(0)}% funded. With ₹43L in loans, a job loss without a buffer would force new borrowing at high rates.`,
          actionItems: [
            `Top up emergency fund by ${formatCurrency(Math.max(0, ef.targetAmount - ef.currentAmount))}`,
            'Split into liquid savings (1 mo) + FD (5 mo) — don\'t lock it all in FD',
            'Medical sub-bucket: keep ₹50k always in savings for mother\'s health emergencies',
          ],
          expectedImpact: 'Full emergency fund prevents loan restructuring or credit card debt during income disruption',
          icon: <PiggyBank className="w-4 h-4" />,
        });
      }
    }

    // RENTAL — P1 recovery progress
    const occupiedShops = shops.filter(s => s.status === 'Occupied');
    const totalRent = occupiedShops.reduce((s, sh) => s + (sh.rent ?? 0), 0)
                    + rooms.reduce((s, r) => s + (r.rent ?? 0), 0);
    const vacantCount = shops.filter(s => s.status === 'Vacant').length;
    if (vacantCount > 0) {
      list.push({
        id: 'vacant-shops',
        type: 'rental',
        priority: 'Medium',
        title: `${vacantCount} Guntur shop${vacantCount > 1 ? 's' : ''} vacant — income leakage`,
        description: `Monthly rental income is ${formatCurrency(totalRent)}/mo. ${vacantCount} vacant shop${vacantCount > 1 ? 's mean' : ' means'} potential ₹${formatCurrency(vacantCount * 3500)}/mo missed — directly reduces P5 debt-strike surplus.`,
        actionItems: [
          'List vacant shops with photos and rental terms on local classifieds',
          'Consider short-term rental or co-working arrangement for Shop 1 to plug the gap',
          `Even at ₹2,500/mo, filling the vacancy adds ~${Math.round(vacantCount * 2500 / 1000)}k to P5 and saves ${Math.ceil(vacantCount * 2500 / 32641 * 12)} weeks on InCred payoff`,
        ],
        expectedImpact: `Filling vacant shops adds ${formatCurrency(vacantCount * 3000)}/mo to P5 debt surplus`,
        icon: <Home className="w-4 h-4" />,
      });
    }

    return list.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }, [loans, investments, insurance, expenses, incomes, goals, ef, shops, rooms, settings, refreshKey]);

  // ── Age-based glide path ─────────────────────────────────────────────────
  const glidePathData = useMemo(() => {
    const dob = settings?.dateOfBirth;
    const annualInc = (settings as any)?.annualIncome ?? 0;
    if (!dob) return null;
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
    if (age <= 0 || age > 80) return null;

    // CFA glide path: equity starts high, tapers with age
    const targetEquityPct  = Math.max(20, Math.min(80, 100 - age));
    const targetDebtPct    = Math.round((100 - targetEquityPct) * 0.7);
    const targetGoldPct    = 100 - targetEquityPct - targetDebtPct;

    // Actual allocation from investments
    const totalInvVal = investments.reduce((s, i) => s + (i.currentValue || i.investedValue || 0), 0);
    const equityVal   = investments.filter(i => ['MF', 'SIP', 'Equity', 'SGB', 'Stocks', 'MF-Growth', 'MF-Dividend'].some(k => (i.type || '').includes(k)))
      .reduce((s, i) => s + (i.currentValue || i.investedValue || 0), 0);
    const debtVal     = investments.filter(i => ['EPF', 'PPF', 'FD', 'RD', 'Bonds', 'NPS'].some(k => (i.type || '').includes(k)))
      .reduce((s, i) => s + (i.currentValue || i.investedValue || 0), 0);
    const goldVal     = investments.filter(i => ['SGB', 'Gold-ETF'].some(k => (i.type || '').includes(k)))
      .reduce((s, i) => s + (i.currentValue || i.investedValue || 0), 0);

    const actualEquityPct = totalInvVal > 0 ? (equityVal / totalInvVal) * 100 : 0;
    const actualDebtPct   = totalInvVal > 0 ? (debtVal  / totalInvVal) * 100 : 0;
    const actualGoldPct   = totalInvVal > 0 ? (goldVal  / totalInvVal) * 100 : 0;

    return { age, targetEquityPct, targetDebtPct, targetGoldPct, actualEquityPct, actualDebtPct, actualGoldPct, totalInvVal, annualInc };
  }, [settings, investments]);



  const filtered = selectedType === 'all' ? recs : recs.filter(r => r.type === selectedType);

  const highCount   = recs.filter(r => r.priority === 'High').length;
  const mediumCount = recs.filter(r => r.priority === 'Medium').length;

  const TYPES = [
    { id: 'all',       label: 'All' },
    { id: 'debt',      label: 'Debt' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'tax',       label: 'Tax' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'emergency', label: 'Emergency' },
    { id: 'rental',    label: 'Rental' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            CFA-Grade Recommendations
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Personalised from your live Dexie DB — loans, insurance, income, rentals</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setRefreshKey(k => k + 1)} className="h-8 gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{highCount}</p>
            <p className="text-[10px] text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-warning">{mediumCount}</p>
            <p className="text-[10px] text-muted-foreground">Medium Priority</p>
          </CardContent>
        </Card>
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-success">{recs.length - highCount - mediumCount}</p>
            <p className="text-[10px] text-muted-foreground">Low / Info</p>
          </CardContent>
        </Card>
      </div>

      {/* Type filter */}
      <div className="flex gap-1.5 flex-wrap">
        {TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedType(t.id)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
              selectedType === t.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
            }`}
          >
            {t.label} {t.id !== 'all' ? `(${recs.filter(r => r.type === t.id).length})` : `(${recs.length})`}
          </button>
        ))}
      </div>

      {/* Recommendations list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-10">
              <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-sm font-medium">No issues in this category</p>
              <p className="text-xs text-muted-foreground mt-1">Add more financial data for a complete analysis.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map(rec => {
            const borderColor = rec.priority === 'High' ? 'border-l-destructive' : rec.priority === 'Medium' ? 'border-l-warning' : 'border-l-success';
            const badgeVariant: any = rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'default' : 'secondary';
            return (
              <Card key={rec.id} className={`border-l-4 ${borderColor}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        rec.priority === 'High' ? 'bg-destructive/10 text-destructive' :
                        rec.priority === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                      }`}>
                        {rec.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-tight">{rec.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0">{rec.priority}</Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{rec.type}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>

                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/15 text-xs">
                    <p className="font-semibold text-primary mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Expected Impact
                    </p>
                    <p className="text-foreground">{rec.expectedImpact}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Action Items</p>
                    <ul className="space-y-1">
                      {rec.actionItems.map((item, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                          <span className="text-foreground/80">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
