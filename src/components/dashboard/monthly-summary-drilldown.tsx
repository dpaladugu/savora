/**
 * MonthlySummaryDrilldown
 * Tap-to-open sheet showing category-level breakdown for current vs last month.
 * Categories spiking >30% get an "Ask AI why" button with inline response.
 */
import React, { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import aiChatServiceInstance from '@/services/AiChatService';

function getMonthBounds(monthsAgo = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return { start, end };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

// ── Per-category AI insight widget ───────────────────────────────────────────
function AiInsightButton({
  category, thisAmt, prevAmt, delta, prevMonthLabel,
}: {
  category: string; thisAmt: number; prevAmt: number; delta: number; prevMonthLabel: string;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [insight, setInsight] = useState('');
  const [expanded, setExpanded] = useState(true);

  const ask = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setState('loading');
    setExpanded(true);
    try {
      const prompt = `My "${category}" spending jumped ${delta.toFixed(0)}% this month (${formatCurrency(prevAmt)} → ${formatCurrency(thisAmt)} vs ${prevMonthLabel}). Give me 2-3 brief, practical reasons why this might have happened and one actionable tip to bring it back down. Be concise — max 4 sentences total.`;
      const res = await aiChatServiceInstance.getFinancialAdvice(prompt,
        'You are a concise personal finance advisor. Respond in plain text, no markdown headers or bullet symbols.');
      setInsight(res.advice);
      setState('done');
    } catch {
      setInsight('AI not configured. Go to Settings → LLM to add your API key.');
      setState('error');
    }
  };

  if (state === 'idle') {
    return (
      <button
        onClick={ask}
        className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors mt-1"
        aria-label={`Ask AI why ${category} spiked`}
      >
        <Sparkles className="h-3 w-3" />
        Ask AI why
      </button>
    );
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Analysing…
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-primary/20 bg-primary/4 p-2.5 space-y-1.5">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-between w-full"
      >
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          AI Insight
        </span>
        {expanded
          ? <ChevronUp className="h-3 w-3 text-muted-foreground" />
          : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>
      {expanded && (
        <p className="text-[11px] text-foreground leading-relaxed">{insight}</p>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function MonthlySummaryDrilldown({ open, onClose }: Props) {
  const thisBounds = getMonthBounds(0);
  const prevBounds = getMonthBounds(1);

  const currentTxns = useLiveQuery(
    () => db.txns.where('date').between(thisBounds.start, thisBounds.end, true, false).toArray(),
    [],
  ) ?? [];
  const prevTxns = useLiveQuery(
    () => db.txns.where('date').between(prevBounds.start, prevBounds.end, true, false).toArray(),
    [],
  ) ?? [];
  const currentExpenses = useLiveQuery(
    () => db.expenses.toArray().then(all => all.filter(e => {
      const d = new Date(e.date as any);
      return d >= thisBounds.start && d < thisBounds.end;
    })).catch(() => []),
    [],
  ) ?? [];
  const prevExpenses = useLiveQuery(
    () => db.expenses.toArray().then(all => all.filter(e => {
      const d = new Date(e.date as any);
      return d >= prevBounds.start && d < prevBounds.end;
    })).catch(() => []),
    [],
  ) ?? [];

  const monthLabel = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const prevMonthLabel = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toLocaleString('en-IN', { month: 'long' });

  const { rows, thisTotal, prevTotal } = useMemo(() => {
    const catMap: Record<string, { thisAmt: number; prevAmt: number }> = {};

    for (const t of currentTxns) {
      if (t.amount < 0) {
        const cat = t.category || 'Uncategorized';
        catMap[cat] = catMap[cat] || { thisAmt: 0, prevAmt: 0 };
        catMap[cat].thisAmt += Math.abs(t.amount);
      }
    }
    for (const t of prevTxns) {
      if (t.amount < 0) {
        const cat = t.category || 'Uncategorized';
        catMap[cat] = catMap[cat] || { thisAmt: 0, prevAmt: 0 };
        catMap[cat].prevAmt += Math.abs(t.amount);
      }
    }
    for (const e of currentExpenses) {
      const cat = e.category || 'Uncategorized';
      catMap[cat] = catMap[cat] || { thisAmt: 0, prevAmt: 0 };
      catMap[cat].thisAmt += e.amount;
    }
    for (const e of prevExpenses) {
      const cat = e.category || 'Uncategorized';
      catMap[cat] = catMap[cat] || { thisAmt: 0, prevAmt: 0 };
      catMap[cat].prevAmt += e.amount;
    }

    const rows = Object.entries(catMap)
      .map(([cat, { thisAmt, prevAmt }]) => ({
        cat,
        thisAmt,
        prevAmt,
        delta: prevAmt > 0 ? ((thisAmt - prevAmt) / prevAmt) * 100 : null,
      }))
      .sort((a, b) => b.thisAmt - a.thisAmt);

    const thisTotal = rows.reduce((s, r) => s + r.thisAmt, 0);
    const prevTotal = rows.reduce((s, r) => s + r.prevAmt, 0);

    return { rows, thisTotal, prevTotal };
  }, [currentTxns, prevTxns, currentExpenses, prevExpenses]);

  const maxAmt = Math.max(...rows.map(r => Math.max(r.thisAmt, r.prevAmt)), 1);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border/40">
          <SheetTitle className="text-sm font-semibold">
            {monthLabel} — Category Breakdown
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 py-3 space-y-4">
          {/* Totals row */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'This month', value: thisTotal },
              { label: 'Last month', value: prevTotal },
            ].map(({ label, value }) => (
              <Card key={label} className="glass">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-base font-bold tabular-nums text-foreground">{formatCurrency(value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Overall delta */}
          {prevTotal > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/40">
              {thisTotal > prevTotal
                ? <TrendingUp className="h-4 w-4 text-destructive shrink-0" />
                : thisTotal < prevTotal
                ? <TrendingDown className="h-4 w-4 text-success shrink-0" />
                : <Minus className="h-4 w-4 text-muted-foreground shrink-0" />}
              <p className="text-xs text-muted-foreground">
                {thisTotal > prevTotal
                  ? `Total spending up ${(((thisTotal - prevTotal) / prevTotal) * 100).toFixed(1)}% vs ${prevMonthLabel}`
                  : thisTotal < prevTotal
                  ? `Total spending down ${(((prevTotal - thisTotal) / prevTotal) * 100).toFixed(1)}% vs ${prevMonthLabel}`
                  : `Spending on par with ${prevMonthLabel}`}
              </p>
            </div>
          )}

          {/* AI legend */}
          {rows.some(r => r.delta !== null && r.delta > 30) && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Categories with <span className="text-primary font-medium">"Ask AI why"</span> spiked &gt;30% vs last month</span>
            </div>
          )}

          {/* Category rows */}
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No expense data for this month.</p>
          ) : (
            <div className="space-y-4">
              {rows.map(({ cat, thisAmt, prevAmt, delta }) => (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-foreground">{cat}</span>
                      {delta !== null && (
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 h-4 ${
                            delta > 10 ? 'border-destructive/50 text-destructive bg-destructive/5'
                            : delta < -10 ? 'border-success/50 text-success bg-success/5'
                            : 'border-border/50 text-muted-foreground'
                          }`}
                        >
                          {delta > 0 ? '+' : ''}{delta.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {formatCurrency(thisAmt)}
                    </span>
                  </div>

                  {/* Dual bar */}
                  <div className="relative h-2 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/20"
                      style={{ width: `${(prevAmt / maxAmt) * 100}%` }}
                    />
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                        delta !== null && delta > 10 ? 'bg-destructive' : 'bg-primary'
                      }`}
                      style={{ width: `${(thisAmt / maxAmt) * 100}%` }}
                    />
                  </div>

                  {prevAmt > 0 && (
                    <p className="text-[10px] text-muted-foreground text-right">
                      {prevMonthLabel}: {formatCurrency(prevAmt)}
                    </p>
                  )}

                  {/* Ask AI why — only for >30% spikes */}
                  {delta !== null && delta > 30 && (
                    <AiInsightButton
                      category={cat}
                      thisAmt={thisAmt}
                      prevAmt={prevAmt}
                      delta={delta}
                      prevMonthLabel={prevMonthLabel}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
