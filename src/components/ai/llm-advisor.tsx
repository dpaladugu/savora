/**
 * LLM Advisor — §25 LLM Prompt Engine
 * Privacy-first: builds an anonymised snapshot (zero PII) → CFA-grade advice.
 * Tab 1: AI Prompt Engine  |  Tab 2: Financial Health Audit (CFA/FRM Rules Engine)
 */
import React, { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FinancialHealthAudit } from '@/components/audit/financial-health-audit';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Brain, Activity, Copy, RefreshCw, ShieldCheck, Sparkles, Zap,
  TrendingDown, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import { LLMPromptService } from '@/services/LLMPromptService';
import { GlobalSettingsService } from '@/services/GlobalSettingsService';

// ── PII Stripper ──────────────────────────────────────────────────────────────
function stripPII(obj: any): any {
  if (!obj) return obj;
  const PII_KEYS = /name|phone|email|nominee|tenant|address|regNo|registration|accountNo|policyNo|policyNumber/i;
  if (Array.isArray(obj)) return obj.map(stripPII);
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([k]) => !PII_KEYS.test(k))
        .map(([k, v]) => [k, stripPII(v)])
    );
  }
  return obj;
}

// ── Snapshot builder ──────────────────────────────────────────────────────────
async function buildAnonymisedSnapshot(): Promise<Record<string, any>> {
  const [txns, incomes, investments, creditCards, loans, emergencyFunds, goals, insurance, subscriptions, settings] =
    await Promise.all([
      db.txns.toArray(),
      db.incomes ? db.incomes.toArray() : Promise.resolve([]),
      db.investments.toArray(),
      db.creditCards.toArray(),
      db.loans.toArray(),
      db.emergencyFunds.toArray(),
      db.goals.toArray(),
      db.insurancePolicies.toArray(),
      db.subscriptions.toArray(),
      GlobalSettingsService.getGlobalSettings(),
    ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart  = new Date(now.getFullYear(), 0, 1);

  // Monthly expense breakdown
  const monthlyExpenses = txns
    .filter(t => (t.amount ?? 0) < 0 && new Date(t.date) >= monthStart)
    .reduce((s, t) => s + Math.abs(t.amount ?? 0), 0);

  const catBreakdown = txns
    .filter(t => (t.amount ?? 0) < 0 && new Date(t.date) >= monthStart)
    .reduce<Record<string, number>>((a, t) => {
      const cat = (t as any).category || 'Other';
      a[cat] = (a[cat] || 0) + Math.abs(t.amount ?? 0);
      return a;
    }, {});

  // Annual income from incomes table
  const annualIncome = (incomes as any[])
    .filter(i => new Date(i.date) >= yearStart)
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  // Fallback: estimate from monthly txn inflows
  const inferredMonthlyIncome = txns
    .filter(t => (t.amount ?? 0) > 0 && new Date(t.date) >= monthStart)
    .reduce((s, t) => s + (t.amount ?? 0), 0);

  const effectiveAnnualIncome = annualIncome > 0
    ? annualIncome
    : inferredMonthlyIncome * 12;

  const totalInvestments = investments.reduce((s, i: any) => s + (i.currentValue || i.investedValue || i.amount || 0), 0);
  const totalLoans       = loans.reduce((s, l: any) => s + (l.outstanding || l.remainingBalance || l.principal || 0), 0);
  const totalCCDebt      = creditCards.reduce((s, c: any) => s + (c.currentBalance || c.balance || 0), 0);
  const ef               = emergencyFunds[0];

  // Loan details (no PII)
  const loanDetails = (loans as any[]).map(l => ({
    type: l.loanType || l.type || 'loan',
    outstanding: Math.round(l.outstanding || l.remainingBalance || l.principal || 0),
    emiMonthly: Math.round(l.emiAmount || l.emi || 0),
    ratePercent: l.interestRate || l.rate || null,
  }));

  return stripPII({
    generatedAt: now.toISOString(),
    disclaimer: 'All PII removed. Amounts in INR.',
    profile: {
      taxRegime: (settings as any).taxRegime || 'new',
      currency: 'INR',
    },
    income: {
      annualIncome: Math.round(effectiveAnnualIncome),
      monthlyIncome: Math.round(effectiveAnnualIncome / 12),
      source: annualIncome > 0 ? 'income_table' : 'inferred_from_txns',
    },
    cashflow: {
      monthlyExpenses: Math.round(monthlyExpenses),
      monthlySurplus: Math.round(effectiveAnnualIncome / 12 - monthlyExpenses),
      categoryBreakdown: Object.fromEntries(
        Object.entries(catBreakdown).map(([k, v]) => [k, Math.round(v)])
      ),
      transactionCount: txns.length,
    },
    investments: {
      totalValue: Math.round(totalInvestments),
      count: investments.length,
      byType: investments.reduce<Record<string, number>>((a, i: any) => {
        const t = i.type || 'Other';
        a[t] = (a[t] || 0) + (i.currentValue || i.investedValue || i.amount || 0);
        return a;
      }, {}),
    },
    liabilities: {
      totalLoans: Math.round(totalLoans),
      loanCount: loans.length,
      loanDetails,
      creditCardDebt: Math.round(totalCCDebt),
      cardCount: creditCards.length,
      debtToIncomeRatio: effectiveAnnualIncome > 0
        ? Math.round(((totalLoans + totalCCDebt) / effectiveAnnualIncome) * 100)
        : null,
    },
    emergencyFund: ef ? {
      current: (ef as any).currentAmount,
      target: (ef as any).targetAmount,
      pct: (ef as any).targetAmount > 0
        ? Math.round(((ef as any).currentAmount / (ef as any).targetAmount) * 100)
        : 0,
      status: (ef as any).status,
    } : null,
    goals: goals.map((g: any) => ({
      category: g.category,
      target: g.targetAmount,
      current: g.currentAmount ?? 0,
      pct: g.targetAmount > 0 ? Math.round(((g.currentAmount ?? 0) / g.targetAmount) * 100) : 0,
      deadlineYear: g.deadline ? new Date(g.deadline).getFullYear() : null,
    })),
    insurance: insurance.map((p: any) => ({
      type: p.type,
      sumInsured: p.sumInsured || p.coverAmount || 0,
      premium: p.premium || p.annualPremium || 0,
      coverToIncome: effectiveAnnualIncome > 0
        ? +(((p.sumInsured || p.coverAmount || 0) / effectiveAnnualIncome)).toFixed(1)
        : null,
    })),
    subscriptions: {
      count: subscriptions.length,
      monthlyTotal: Math.round(
        subscriptions.reduce((s, sub: any) =>
          s + ((sub.billingCycle === 'yearly' || sub.cycle === 'Yearly')
            ? (sub.cost || sub.amount || 0) / 12
            : (sub.cost || sub.amount || 0)), 0)
      ),
    },
  });
}

// ── Prompt templates ──────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'full-review',
    label: 'Full Review',
    icon: Sparkles,
    color: 'text-primary',
    system: `You are a CFA-level financial advisor specialising in Indian personal finance (FY 2025-26 rules, INR). Be precise, actionable, and use bullet points. Use ₹ symbols.`,
    user: (snap: string) =>
      `Anonymised financial snapshot:\n\n${snap}\n\nProvide a structured review:\n1. Financial health score (1-10) with 2-line reasoning\n2. Top 3 strengths\n3. Top 3 urgent fixes with specific ₹ amounts\n4. Investment allocation critique vs age-based glide path\n5. Tax optimisation (Old vs New regime, 80C, 80CCD)\n6. Emergency fund adequacy (6× monthly expenses = good)\n7. Insurance gaps (term ≥ 10× income, health ≥ 5× income)\n8. ONE action to take THIS MONTH`,
  },
  {
    id: 'debt-payoff',
    label: 'Debt Payoff',
    icon: TrendingDown,
    color: 'text-destructive',
    system: `You are a certified financial planner specialising in debt elimination for Indian households.`,
    user: (snap: string) =>
      `Snapshot:\n\n${snap}\n\nCreate an optimised debt payoff plan:\n1. Rank loans by avalanche method (highest interest first)\n2. Calculate exact monthly payment to be debt-free in 24/36/48 months\n3. Credit card debt: minimum vs accelerated payoff comparison\n4. Estimate total interest saved by each strategy\n5. Flag any debt-to-income ratio concerns (DTI > 40% is risky)\n6. Recommended emergency fund level while paying off debt`,
  },
  {
    id: 'sip-sizing',
    label: 'SIP Sizing',
    icon: Brain,
    color: 'text-success',
    system: `You are a CFA charterholder. Give precise SIP recommendations for Indian mutual funds at 12% CAGR assumption.`,
    user: (snap: string) =>
      `Snapshot:\n\n${snap}\n\nCalculate optimal SIP allocations:\n1. For each goal: required monthly SIP at 12% CAGR\n2. Total SIP capacity from monthly surplus\n3. If surplus is insufficient: which goal to prioritise\n4. Asset allocation split (equity/debt/gold) per age group\n5. Specific fund category recommendations (large-cap, flexi-cap, ELSS, etc.)\n6. NPS vs ELSS for tax-saving — which is better given the snapshot`,
  },
  {
    id: 'insurance-gap',
    label: 'Insurance Gap',
    icon: ShieldCheck,
    color: 'text-warning',
    system: `You are an Indian insurance advisor. Apply CFA-standard benchmarks: term ≥ 10× income, health ≥ 5× income.`,
    user: (snap: string) =>
      `Snapshot:\n\n${snap}\n\nInsurance gap analysis:\n1. Term life: current vs 10× annual income — gap in ₹ and suggested cover\n2. Health cover: current vs 5× income — gap and top-up recommendation\n3. Critical illness cover — is it present? Should it be added?\n4. Vehicle and rental property insurance status\n5. Premium optimisation: any over-insured areas?\n6. Priority order for adding cover given budget constraints`,
  },
  {
    id: 'tax',
    label: 'Tax Planning',
    icon: Zap,
    color: 'text-accent',
    system: `You are an Indian chartered accountant. Use FY 2025-26 slabs, all applicable sections, and current surcharge rules.`,
    user: (snap: string) =>
      `Snapshot:\n\n${snap}\n\nTax optimisation plan:\n1. Old vs New regime — exact tax liability under both (show slab calculations)\n2. 80C: utilised vs ₹1.5L limit — best remaining instruments\n3. 80CCD(1B): NPS ₹50k additional deduction — is it beneficial?\n4. Advance tax schedule for next quarter\n5. Any missed deductions (80D, 24B, HRA, LTA)\n6. Estimated tax savings with full optimisation`,
  },
] as const;

type TemplateId = typeof TEMPLATES[number]['id'];

// ── Main Component ────────────────────────────────────────────────────────────
export function LLMAdvisor() {
  const [snapshot, setSnapshot]     = useState<Record<string, any> | null>(null);
  const [building, setBuilding]     = useState(false);
  const [activeTemplate, setActive] = useState<TemplateId>('full-review');
  const [response, setResponse]     = useState('');
  const [sending, setSending]       = useState(false);
  const [showSnapshot, setShowSnap] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function buildSnapshot() {
    setBuilding(true);
    try {
      const snap = await buildAnonymisedSnapshot();
      setSnapshot(snap);
      toast.success('Snapshot built — zero PII included');
    } catch {
      toast.error('Failed to build snapshot');
    } finally {
      setBuilding(false);
    }
  }

  function getFullPrompt(): string {
    if (!snapshot) return '';
    const tpl = TEMPLATES.find(t => t.id === activeTemplate)!;
    const snap = JSON.stringify(snapshot, null, 2);
    return `SYSTEM: ${tpl.system}\n\nUSER: ${tpl.user(snap)}`;
  }

  async function copyPrompt() {
    const text = getFullPrompt();
    if (!text) { toast.error('Build a snapshot first'); return; }
    await navigator.clipboard.writeText(text);
    toast.success('Prompt copied — paste into ChatGPT / Claude / Gemini');
  }

  async function sendToLLM() {
    if (!snapshot) { toast.error('Build a snapshot first'); return; }

    const cfg = await LLMPromptService.getLLMConfig();
    if (!cfg?.apiKey) {
      toast.info('No API key configured — copying prompt instead.');
      copyPrompt();
      return;
    }

    setSending(true);
    setResponse('');
    abortRef.current = new AbortController();

    try {
      const tpl = TEMPLATES.find(t => t.id === activeTemplate)!;
      const snap = JSON.stringify(snapshot, null, 2);

      const res = await fetch(`${cfg.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({
          model: cfg.model || 'gpt-4',
          temperature: cfg.temperature ?? 0.3,
          max_tokens: cfg.maxTokens ?? 2500,
          stream: true,
          messages: [
            { role: 'system', content: tpl.system },
            { role: 'user',   content: tpl.user(snap) },
          ],
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
      }

      // ── SSE streaming ────────────────────────────────────────────────────
      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const chunk: string = parsed.choices?.[0]?.delta?.content ?? '';
            if (chunk) setResponse(prev => prev + chunk);
          } catch { /* partial chunk — wait for next */ }
        }
      }

      toast.success('AI response received');
    } catch (e: any) {
      if (e.name !== 'AbortError') toast.error(e.message ?? 'LLM call failed');
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setSending(false);
  }

  const tpl = TEMPLATES.find(t => t.id === activeTemplate)!;

  // Snapshot quality indicators
  const hasIncome = snapshot?.income?.annualIncome > 0;
  const hasLoans  = snapshot?.liabilities?.loanCount > 0;
  const hasGoals  = snapshot?.goals?.length > 0;
  const hasInsurance = snapshot?.insurance?.length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Top-level Tab bar ── */}
      <Tabs defaultValue="advisor" className="w-full">
        <div className="px-4 pt-4">
          <TabsList className="grid grid-cols-2 w-full rounded-2xl p-1 bg-muted/60 border border-border/40 h-auto gap-0.5 mb-0">
            <TabsTrigger value="advisor"
              className="tab-trigger flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary text-muted-foreground transition-all duration-150">
              <Brain className="h-3.5 w-3.5 shrink-0" />
              AI Advisor
            </TabsTrigger>
            <TabsTrigger value="audit"
              className="tab-trigger flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary text-muted-foreground transition-all duration-150">
              <Activity className="h-3.5 w-3.5 shrink-0" />
              Health Audit
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab 1: AI Prompt Engine ── */}
        <TabsContent value="advisor" className="mt-0">
          <div className="p-4 space-y-4">
            {/* ── Header ── */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">AI Financial Advisor</h1>
                <p className="text-xs text-muted-foreground">Privacy-first · Zero PII · §25 LLM Prompt Engine</p>
              </div>
            </div>

      {/* ── Privacy badge ── */}
      <Card className="border-success/30 bg-success/5">
        <CardContent className="py-3 px-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-success shrink-0" />
          <p className="text-xs text-success">
            <strong>Privacy guaranteed:</strong> Names, account numbers, phone, nominee info — all stripped.
            Only aggregated INR amounts and categories are included.
          </p>
        </CardContent>
      </Card>

      {/* ── Template selector ── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Analysis Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id as TemplateId)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm font-medium transition-all
                ${activeTemplate === t.id
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border/60 bg-card/60 text-foreground hover:border-primary/30'}`}
            >
              <t.icon className={`h-4 w-4 shrink-0 ${activeTemplate === t.id ? 'text-primary' : t.color}`} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Step 1: Build snapshot ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">1</span>
            Build Anonymised Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <Button onClick={buildSnapshot} disabled={building} className="w-full gap-2">
            <RefreshCw className={`h-4 w-4 ${building ? 'animate-spin' : ''}`} />
            {building ? 'Scanning DB…' : snapshot ? 'Rebuild Snapshot' : 'Build Snapshot from DB'}
          </Button>

          {snapshot && (
            <>
              {/* Quality indicators */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Income', ok: hasIncome },
                  { label: 'Loans', ok: hasLoans },
                  { label: 'Goals', ok: hasGoals },
                  { label: 'Insurance', ok: hasInsurance },
                ].map(({ label, ok }) => (
                  <Badge
                    key={label}
                    variant={ok ? 'default' : 'secondary'}
                    className={`text-[10px] gap-1 ${ok ? 'bg-success/15 text-success border-success/30' : 'opacity-50'}`}
                  >
                    {ok && <CheckCircle2 className="h-2.5 w-2.5" />}
                    {label}
                  </Badge>
                ))}
              </div>

              {/* Collapsible raw snapshot */}
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowSnap(s => !s)}
              >
                {showSnapshot ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showSnapshot ? 'Hide' : 'Preview'} raw snapshot
              </button>
              {showSnapshot && (
                <div className="rounded-xl bg-muted/40 border border-border/40 p-3 max-h-48 overflow-y-auto">
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono">
                    {JSON.stringify(snapshot, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Step 2: Send / Copy ── */}
      {snapshot && (
        <Card className="border-border/60">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">2</span>
              Get AI Advice — <span className="text-primary">{tpl.label}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-2" onClick={copyPrompt}>
                <Copy className="h-4 w-4" />
                Copy Prompt
              </Button>
              {sending ? (
                <Button variant="destructive" className="gap-2" onClick={stopStreaming}>
                  Stop
                </Button>
              ) : (
                <Button className="gap-2" onClick={sendToLLM}>
                  <Sparkles className="h-4 w-4" />
                  Send via API
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              "Copy Prompt" → paste into ChatGPT / Claude / Gemini.
              "Send via API" → requires API key in Settings → AI.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Streaming response ── */}
      {(response || sending) && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">3</span>
              AI Response — {tpl.label}
              {sending && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="rounded-xl bg-muted/30 border border-border/40 p-3 max-h-[28rem] overflow-y-auto">
              <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {response}
                {sending && <span className="animate-pulse">▌</span>}
              </pre>
            </div>
            {response && !sending && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 gap-1.5 text-xs"
                onClick={() => navigator.clipboard.writeText(response)}
              >
                <Copy className="h-3 w-3" />
                Copy response
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
