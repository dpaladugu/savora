/**
 * SmartNudgeEngine
 * Proactively surfaces the 2-3 most actionable insights based on:
 *   1. Goals with no linked SIP (no matching recurring txn in "SIP" category)
 *   2. Goals behind schedule (current < expected-by-now based on deadline)
 *   3. Debt health — debt-to-asset ratio too high
 *   4. High-interest debt with no accelerated repayment SIP
 *   5. Emergency fund below 3 months
 *
 * Each nudge has a type, priority score, message, and a one-tap CTA action.
 */
import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/format-utils';
import {
  Sparkles, Target, TrendingDown, PiggyBank,
  Zap, X, AlertTriangle, ArrowUpRight,
} from 'lucide-react';
import type { Goal } from '@/types/financial';
import { useSIPPrefillStore } from '@/store/sipPrefillStore';

interface Nudge {
  id: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  ctaLabel: string;
  ctaAction: () => void;
  priority: number; // lower = more urgent
  color: 'primary' | 'warning' | 'destructive' | 'success';
}

interface Props {
  onMoreNavigation: (m: string) => void;
  onTabChange: (t: string) => void;
}

function monthsUntil(deadline?: string | Date): number | null {
  if (!deadline) return null;
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const m = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
  return Math.round(m);
}

// Expected current amount if contributions had been linear from creation to deadline
function expectedByNow(goal: Goal): number {
  const monthsLeft = monthsUntil((goal as any).deadline ?? (goal as any).targetDate);
  if (!monthsLeft || monthsLeft <= 0) return goal.targetAmount;
  // Estimate total duration from createdAt to deadline
  const createdAt = (goal as any).createdAt ? new Date((goal as any).createdAt) : null;
  const deadline  = (goal as any).deadline ?? (goal as any).targetDate;
  const deadlineDate = deadline ? new Date(deadline) : null;
  if (!createdAt || !deadlineDate) return 0;
  const totalMonths = Math.max(1, Math.ceil((deadlineDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const elapsed = Math.max(0, totalMonths - monthsLeft);
  return (elapsed / totalMonths) * goal.targetAmount;
}

// Simple required SIP (no compounding, conservative)
function sipNeeded(remaining: number, months: number): number {
  if (months <= 0) return remaining;
  const r = 0.12 / 12;
  const sip = (remaining * r) / (((Math.pow(1 + r, months) - 1) / r) * (1 + r));
  return Math.ceil(sip / 100) * 100;
}

// ── Color config ──────────────────────────────────────────────────────────────
const colorMap = {
  primary:     { bg: 'bg-primary/5',     border: 'border-primary/20',     icon: 'text-primary',     cta: 'text-primary border-primary/30 hover:bg-primary/10' },
  warning:     { bg: 'bg-warning/5',     border: 'border-warning/20',     icon: 'text-warning',     cta: 'text-warning border-warning/30 hover:bg-warning/10' },
  destructive: { bg: 'bg-destructive/5', border: 'border-destructive/20', icon: 'text-destructive', cta: 'text-destructive border-destructive/30 hover:bg-destructive/10' },
  success:     { bg: 'bg-success/5',     border: 'border-success/20',     icon: 'text-success',     cta: 'text-success border-success/30 hover:bg-success/10' },
};

// ── Main ──────────────────────────────────────────────────────────────────────
export function SmartNudgeEngine({ onMoreNavigation, onTabChange }: Props) {
  const setPrefill = useSIPPrefillStore(s => s.setPrefill);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const goals       = useLiveQuery(() => db.goals.toArray().catch(() => []), []) ?? [];
  const recurring   = useLiveQuery(() => db.recurringTransactions.toArray().catch(() => []), []) ?? [];
  const loans       = useLiveQuery(() => db.loans.toArray().catch(() => []), []) ?? [];
  const investments = useLiveQuery(() => db.investments.toArray().catch(() => []), []) ?? [];
  const creditCards = useLiveQuery(() => db.creditCards.toArray().catch(() => []), []) ?? [];
  const ef          = useLiveQuery(() => db.emergencyFunds.limit(1).first().catch(() => undefined), []);
  const settings    = useLiveQuery(() => db.globalSettings.limit(1).first().catch(() => undefined), []);

  const activeGoals = goals.filter(g => (g.targetAmount ?? 0) > (g.currentAmount ?? 0));

  const nudges: Nudge[] = useMemo(() => {
    const list: Nudge[] = [];

    // ── 1. Goals with NO active SIP ─────────────────────────────────────────
    const sipKeywords = ['sip', 'investment', 'mutual', 'mf', 'goal'];
    const activeSipDescriptions = recurring
      .filter(r => r.is_active && r.type === 'expense')
      .map(r => r.description.toLowerCase());

    for (const goal of activeGoals) {
      const name = goal.name ?? (goal as any).title ?? 'Goal';
      const hasSip = activeSipDescriptions.some(
        d => sipKeywords.some(k => d.includes(k)) || d.includes(name.toLowerCase().slice(0, 5))
      );
      if (!hasSip) {
        const months = monthsUntil((goal as any).deadline ?? (goal as any).targetDate);
        const remaining = goal.targetAmount - (goal.currentAmount ?? 0);
        const sip = months && months > 0 ? sipNeeded(remaining, months) : null;
        list.push({
          id: `no-sip-${goal.id}`,
          icon: <Target className="h-4 w-4" />,
          title: `No SIP for "${name}"`,
          body: sip
            ? `Start ${formatCurrency(sip)}/month to reach ${formatCurrency(goal.targetAmount)} ${months && months > 0 ? `in ${months} months` : ''}`
            : `You have ${formatCurrency(remaining)} remaining — start a monthly SIP to stay on track`,
          ctaLabel: 'Plan SIP →',
          ctaAction: () => onMoreNavigation('sip-planner'),
          priority: 1,
          color: 'primary',
        });
        if (list.filter(n => n.id.startsWith('no-sip')).length >= 2) break; // max 2 SIP nudges
      }
    }

    // ── 2. Goals behind schedule ────────────────────────────────────────────
    for (const goal of activeGoals) {
      const name = goal.name ?? (goal as any).title ?? 'Goal';
      const expected = expectedByNow(goal);
      const current  = goal.currentAmount ?? 0;
      const behindBy = expected - current;
      if (behindBy > 0 && behindBy > goal.targetAmount * 0.1) { // >10% behind
        list.push({
          id: `behind-${goal.id}`,
          icon: <AlertTriangle className="h-4 w-4" />,
          title: `"${name}" is behind schedule`,
          body: `Expected ${formatCurrency(Math.round(expected))} by now, but at ${formatCurrency(current)}. Gap: ${formatCurrency(Math.round(behindBy))}`,
          ctaLabel: 'Catch up →',
          ctaAction: () => onMoreNavigation('sip-planner'),
          priority: 2,
          color: 'warning',
        });
        if (list.filter(n => n.id.startsWith('behind')).length >= 1) break;
      }
    }

    // ── 3. Debt health ──────────────────────────────────────────────────────
    const totalAssets = investments.reduce((s, i) => s + (i.currentValue || i.investedValue || 0), 0);
    const totalDebt   = loans.reduce((s, l) => s + ((l as any).outstanding ?? l.principal ?? 0), 0)
                      + creditCards.reduce((s, c) => s + (c.currentBalance ?? 0), 0);
    const debtRatio   = totalAssets > 0 ? totalDebt / totalAssets : 0;

    if (totalDebt > 0 && debtRatio > 0.5) {
      list.push({
        id: 'debt-ratio',
        icon: <TrendingDown className="h-4 w-4" />,
        title: 'Debt ratio is high',
        body: `Liabilities are ${Math.round(debtRatio * 100)}% of your assets (${formatCurrency(totalDebt)} debt vs ${formatCurrency(totalAssets)} assets). Use Debt Strike to prioritise payoff.`,
        ctaLabel: 'Debt Strike →',
        ctaAction: () => onMoreNavigation('debt-strike'),
        priority: 2,
        color: 'destructive',
      });
    }

    // High-interest loan with no accelerated repayment SIP
    const highInterestLoans = loans.filter(l => (l.interestRate ?? 0) > 10 && ((l as any).outstanding ?? l.principal ?? 0) > 0);
    if (highInterestLoans.length > 0) {
      const loan = highInterestLoans[0];
      const hasRepaymentSip = recurring.some(
        r => r.is_active && (r.description.toLowerCase().includes('loan') || r.description.toLowerCase().includes('emi') || r.category.toLowerCase().includes('loan'))
      );
      if (!hasRepaymentSip) {
        list.push({
          id: `loan-sip-${loan.id}`,
          icon: <ArrowUpRight className="h-4 w-4" />,
          title: `Prepay "${loan.name}" faster`,
          body: `${loan.interestRate}% interest loan — even ₹1k/month extra prepayment saves years of interest`,
          ctaLabel: 'Add prepayment →',
          ctaAction: () => onMoreNavigation('recurring-transactions'),
          priority: 3,
          color: 'warning',
        });
      }
    }

    // ── 4. Emergency fund low ────────────────────────────────────────────────
    if (ef && ef.targetAmount > 0) {
      const efPct = ef.currentAmount / ef.targetAmount;
      if (efPct < 0.5) {
        const monthly = settings?.salaryCreditDay ? ef.monthlyExpenses ?? 0 : 0;
        list.push({
          id: 'ef-low',
          icon: <PiggyBank className="h-4 w-4" />,
          title: 'Emergency Fund below 50%',
          body: `At ${Math.round(efPct * 100)}% of target. Build to ${ef.targetMonths} months — automate a monthly top-up.`,
          ctaLabel: 'Top up →',
          ctaAction: () => onMoreNavigation('emergency-fund'),
          priority: 1,
          color: 'warning',
        });
      }
    }

    // Sort by priority, cap at 3
    return list.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }, [activeGoals, recurring, loans, investments, creditCards, ef, settings]);

  const visible = nudges.filter(n => !dismissed.has(n.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-0.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Smart Nudges</span>
        <span className="text-[10px] text-muted-foreground">({visible.length} action{visible.length > 1 ? 's' : ''})</span>
      </div>

      {/* Nudge cards */}
      {visible.map(nudge => {
        const c = colorMap[nudge.color];
        return (
          <div
            key={nudge.id}
            className={`relative flex items-start gap-3 p-3.5 rounded-2xl border ${c.bg} ${c.border} transition-all`}
          >
            {/* Dismiss */}
            <button
              onClick={() => setDismissed(prev => new Set([...prev, nudge.id]))}
              className="absolute top-2.5 right-2.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>

            {/* Icon */}
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${c.bg} border ${c.border}`}>
              <span className={c.icon}>{nudge.icon}</span>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-xs font-semibold text-foreground leading-snug">{nudge.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{nudge.body}</p>
            </div>

            {/* CTA */}
            <button
              onClick={nudge.ctaAction}
              className={`shrink-0 self-center text-[10px] font-bold border rounded-xl px-2.5 py-1.5 transition-colors whitespace-nowrap ${c.cta}`}
            >
              {nudge.ctaLabel}
            </button>
          </div>
        );
      })}
    </div>
  );
}
