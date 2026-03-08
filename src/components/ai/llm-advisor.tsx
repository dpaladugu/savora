/**
 * LLM Advisor — §25 LLM Prompt Engine
 * Builds an anonymised financial snapshot (zero PII) → copy-paste into any LLM.
 * Also supports direct API call if user has configured an API key.
 */
import React, { useState } from 'react';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Brain, Copy, RefreshCw, ShieldCheck, Sparkles, FileText, Zap } from 'lucide-react';
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
  const [txns, investments, creditCards, loans, emergencyFunds, goals, insurance, subscriptions, settings] = await Promise.all([
    db.txns.toArray(),
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
  const monthlyExpenses = txns
    .filter(t => t.amount < 0 && new Date(t.date) >= monthStart)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const catBreakdown = txns
    .filter(t => t.amount < 0 && new Date(t.date) >= monthStart)
    .reduce<Record<string, number>>((a, t) => { a[t.category] = (a[t.category] || 0) + Math.abs(t.amount); return a; }, {});

  const totalInvestments = investments.reduce((s, i: any) => s + (i.currentValue || i.investedValue || 0), 0);
  const totalLoans       = loans.reduce((s, l: any) => s + (l.outstanding || l.principal || 0), 0);
  const totalCCDebt      = creditCards.reduce((s, c: any) => s + (c.currentBalance || 0), 0);
  const ef               = emergencyFunds[0];

  return stripPII({
    generatedAt: now.toISOString(),
    disclaimer: 'All PII removed. Amounts in INR.',
    profile: {
      taxRegime: settings.taxRegime,
      timeZone:  settings.timeZone,
    },
    cashflow: {
      monthlyExpenses: Math.round(monthlyExpenses),
      categoryBreakdown: Object.fromEntries(
        Object.entries(catBreakdown).map(([k, v]) => [k, Math.round(v)])
      ),
      transactionCount: txns.length,
    },
    investments: {
      totalValue: Math.round(totalInvestments),
      count: investments.length,
      byType: investments.reduce<Record<string, number>>((a, i: any) => {
        a[i.type] = (a[i.type] || 0) + (i.currentValue || i.investedValue || 0);
        return a;
      }, {}),
    },
    liabilities: {
      totalLoans: Math.round(totalLoans),
      loanCount: loans.length,
      creditCardDebt: Math.round(totalCCDebt),
      cardCount: creditCards.length,
    },
    emergencyFund: ef ? {
      current: ef.currentAmount,
      target:  ef.targetAmount,
      pct:     ef.targetAmount > 0 ? Math.round((ef.currentAmount / ef.targetAmount) * 100) : 0,
      status:  ef.status,
    } : null,
    goals: goals.map((g: any) => ({
      category:  g.category,
      target:    g.targetAmount,
      current:   g.currentAmount ?? 0,
      pct:       g.targetAmount > 0 ? Math.round(((g.currentAmount ?? 0) / g.targetAmount) * 100) : 0,
    })),
    insurance: insurance.map((p: any) => ({
      type:       p.type,
      sumInsured: p.sumInsured,
      premium:    p.premium,
    })),
    subscriptions: {
      count:      subscriptions.length,
      monthlyTotal: Math.round(
        subscriptions.reduce((s, sub: any) =>
          s + (sub.billingCycle === 'yearly' || sub.cycle === 'Yearly'
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
    label: 'Full Financial Review',
    icon: Sparkles,
    system: `You are a CFA-level financial advisor specialising in Indian personal finance (FY 2025-26 rules, INR, Indian tax system). Analyse the anonymised snapshot and give a structured review.`,
    user: (snap: string) => `Here is my anonymised financial snapshot:\n\n${snap}\n\nPlease provide:\n1. Health score (1-10) with reasoning\n2. Top 3 strengths\n3. Top 3 urgent fixes with specific INR amounts\n4. Investment allocation critique (India-specific)\n5. Tax optimisation opportunities (Old vs New regime, 80C, 80CCD)\n6. Emergency fund adequacy\n7. Insurance gap analysis (term ≥ 10× income, health ≥ 5× income)\n8. One action to take THIS MONTH`,
  },
  {
    id: 'tax',
    label: 'Tax Optimisation',
    icon: Zap,
    system: `You are an Indian tax consultant. Use FY 2025-26 rules, current slabs, and Indian deduction sections.`,
    user: (snap: string) => `Snapshot:\n\n${snap}\n\nAdvise:\n1. Old vs New regime — which is better and why (show calculations)\n2. 80C unused capacity and best instruments\n3. 80CCD(1B) NPS opportunity\n4. Advance tax instalment check\n5. Any other deductions I'm missing`,
  },
  {
    id: 'investments',
    label: 'Portfolio Review',
    icon: Brain,
    system: `You are a CFA charterholder. Analyse the Indian investment portfolio and give actionable advice.`,
    user: (snap: string) => `Snapshot:\n\n${snap}\n\nAdvise:\n1. Asset allocation vs age-based glide path\n2. Over/under-allocated categories\n3. SIP amount recommendation based on monthly surplus\n4. Specific rebalancing actions\n5. Any red flags`,
  },
  {
    id: 'insurance-gap',
    label: 'Insurance Gap',
    icon: ShieldCheck,
    system: `You are an insurance advisor specialising in Indian market products.`,
    user: (snap: string) => `Snapshot:\n\n${snap}\n\nCheck:\n1. Is term life ≥ 10× annual income? What is the gap?\n2. Is health cover ≥ 5× annual income? What is the gap?\n3. Are rental properties covered?\n4. Vehicle insurance status\n5. Recommended products and approximate premiums`,
  },
];

// ── Main Component ────────────────────────────────────────────────────────────
export function LLMAdvisor() {
  const [snapshot, setSnapshot]     = useState<Record<string, any> | null>(null);
  const [building, setBuilding]     = useState(false);
  const [activeTemplate, setActive] = useState(TEMPLATES[0].id);
  const [response, setResponse]     = useState('');
  const [sending, setSending]       = useState(false);

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
    const cfg = await LLMPromptService.getLLMConfig();
    if (!cfg?.apiKey) {
      toast.info('No API key configured — copy prompt and paste into your preferred AI.');
      copyPrompt();
      return;
    }
    setSending(true);
    try {
      const tpl = TEMPLATES.find(t => t.id === activeTemplate)!;
      const snap = JSON.stringify(snapshot, null, 2);
      const res = await fetch(`${cfg.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({
          model: cfg.model || 'gpt-4',
          temperature: cfg.temperature ?? 0.3,
          max_tokens: cfg.maxTokens ?? 2000,
          messages: [
            { role: 'system', content: tpl.system },
            { role: 'user',   content: tpl.user(snap) },
          ],
        }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setResponse(data.choices?.[0]?.message?.content ?? 'No response');
      toast.success('AI response received');
    } catch (e: any) {
      toast.error(e.message ?? 'LLM call failed');
    } finally {
      setSending(false);
    }
  }

  const tpl = TEMPLATES.find(t => t.id === activeTemplate)!;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">AI Financial Advisor</h1>
          <p className="text-xs text-muted-foreground">Privacy-first · Zero PII sent · §25 LLM Prompt Engine</p>
        </div>
      </div>

      {/* Privacy badge */}
      <Card className="border-success/30 bg-success/5">
        <CardContent className="py-3 px-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-success shrink-0" />
          <p className="text-xs text-success">
            <strong>Privacy guaranteed:</strong> Names, account numbers, policy numbers, tenant info — all stripped before export.
            Only aggregated INR amounts and categories are included.
          </p>
        </CardContent>
      </Card>

      {/* Template selector */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Analysis Type</p>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm font-medium transition-all
                ${activeTemplate === t.id
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border/60 bg-card/60 text-foreground hover:border-primary/30'}`}
            >
              <t.icon className="h-4 w-4 shrink-0" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1 — Build snapshot */}
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
            {building ? 'Building…' : 'Build Snapshot from DB'}
          </Button>
          {snapshot && (
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3 max-h-40 overflow-y-auto">
              <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono">
                {JSON.stringify(snapshot, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2 — Send / Copy */}
      {snapshot && (
        <Card className="border-border/60">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">2</span>
              Send to AI
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-2" onClick={copyPrompt}>
                <Copy className="h-4 w-4" />
                Copy Prompt
              </Button>
              <Button className="gap-2" onClick={sendToLLM} disabled={sending}>
                <Sparkles className={`h-4 w-4 ${sending ? 'animate-pulse' : ''}`} />
                {sending ? 'Thinking…' : 'Send via API'}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              "Copy Prompt" works with any AI (ChatGPT, Claude, Gemini). "Send via API" requires an API key in Settings.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Response */}
      {response && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">3</span>
              AI Response — {tpl.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="rounded-xl bg-muted/30 border border-border/40 p-3">
              <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{response}</pre>
            </div>
            <Button variant="ghost" size="sm" className="mt-2 gap-1.5 text-xs" onClick={() => navigator.clipboard.writeText(response)}>
              <Copy className="h-3 w-3" /> Copy response
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
