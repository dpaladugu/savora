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
  X, AlertTriangle, ArrowUpRight, ShieldAlert,
} from 'lucide-react';
import type { Goal } from '@/types/financial';
import { useSIPPrefillStore } from '@/store/sipPrefillStore';
import { DataSafetyService } from '@/services/DataSafetyService';

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
  const shops       = useLiveQuery(() => db.gunturShops.toArray().catch(() => []), []) ?? [];
  const rooms       = useLiveQuery(() => db.gorantlaRooms.toArray().catch(() => []), []) ?? [];
  const insurance   = useLiveQuery(() => db.insurance.toArray().catch(() => []), []) ?? [];
  const incomes     = useLiveQuery(() => db.incomes.toArray().catch(() => []), []) ?? [];

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
          ctaLabel: 'Start SIP →',
          ctaAction: () => {
            if (sip) {
              setPrefill({
                description: `SIP – ${name}`,
                amount: sip,
                category: 'Investment',
                frequency: 'monthly',
                type: 'expense',
                account: 'ICICI Salary Account',
                goalName: name,
              });
            }
            onMoreNavigation('recurring-transactions');
          },
          priority: 1,
          color: 'primary',
        });
        if (list.filter(n => n.id.startsWith('no-sip')).length >= 2) break;
      }
    }

    // ── 2. Goals behind schedule ────────────────────────────────────────────
    for (const goal of activeGoals) {
      const name = goal.name ?? (goal as any).title ?? 'Goal';
      const expected = expectedByNow(goal);
      const current  = goal.currentAmount ?? 0;
      const behindBy = expected - current;
      if (behindBy > 0 && behindBy > goal.targetAmount * 0.1) {
        list.push({
          id: `behind-${goal.id}`,
          icon: <AlertTriangle className="h-4 w-4" />,
          title: `"${name}" is behind schedule`,
          body: `Expected ${formatCurrency(Math.round(expected))} by now, but at ${formatCurrency(current)}. Gap: ${formatCurrency(Math.round(behindBy))}`,
          ctaLabel: 'Catch up →',
          ctaAction: () => {
            const months = monthsUntil((goal as any).deadline ?? (goal as any).targetDate);
            const remaining = goal.targetAmount - current;
            if (months && months > 0) {
              setPrefill({
                description: `Catch-up SIP – ${name}`,
                amount: sipNeeded(remaining, months),
                category: 'Investment',
                frequency: 'monthly',
                type: 'expense',
                goalName: name,
              });
            }
            onMoreNavigation('recurring-transactions');
          },
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

    // High-interest loan with no accelerated repayment
    const activeLoans = loans.filter(l => l.isActive !== false);
    const incred = activeLoans.find(l => l.id === 'loan-incred-2026' || (l.name ?? '').toLowerCase().includes('incred'));
    if (incred) {
      const out = (incred as any).outstanding ?? incred.principal ?? 0;
      const emi = (incred as any).emi ?? 32641;
      const roi = (incred as any).roi ?? 14.2;
      // Nudge: InCred close to being cleared (< ₹5L remaining)
      if (out > 0 && out < 5_00_000) {
        list.push({
          id: 'incred-nearly-done',
          icon: <ArrowUpRight className="h-4 w-4" />,
          title: `InCred almost cleared — ₹${(out / 1_00_000).toFixed(2)}L left!`,
          body: `You're within striking distance. One more ₹${formatCurrency(Math.min(out, 25000))} part-payment closes Phase 1 — then redirect full ${formatCurrency(emi)}/mo EMI to ICICI.`,
          ctaLabel: 'Log prepayment →',
          ctaAction: () => onMoreNavigation('debt-strike'),
          priority: 1,
          color: 'success',
        });
      }
    }

    // ── 4. Rental income risk nudge ─────────────────────────────────────────
    const vacantShops  = shops.filter(s => s.status === 'Vacant');
    const unpaidShops  = shops.filter(s => s.status === 'Occupied' && !s.paid);
    const unpaidRooms  = rooms.filter(r => !r.paid);
    const totalUnpaid  = unpaidShops.length + unpaidRooms.length;
    const unpaidAmount = unpaidShops.reduce((s, sh) => s + (sh.rent ?? 0), 0)
                       + unpaidRooms.reduce((s, r) => s + (r.rent ?? 0), 0);

    if (vacantShops.length > 0) {
      list.push({
        id: 'rental-vacancy',
        icon: <ShieldAlert className="h-4 w-4" />,
        title: `${vacantShops.length} Guntur shop${vacantShops.length > 1 ? 's' : ''} vacant — P5 debt strike at risk`,
        body: `Vacancy reduces P5 surplus by ~₹${(vacantShops.length * 3500).toLocaleString('en-IN')}/mo, slowing InCred payoff.`,
        ctaLabel: 'View rentals →',
        ctaAction: () => onMoreNavigation('property-rental'),
        priority: 2,
        color: 'warning',
      });
    } else if (totalUnpaid >= 3) {
      list.push({
        id: 'rental-collection',
        icon: <ShieldAlert className="h-4 w-4" />,
        title: `${totalUnpaid} units not yet paid this month`,
        body: `${formatCurrency(unpaidAmount)} uncollected. Chase tenants to keep P5 debt-strike waterfall flowing.`,
        ctaLabel: 'Mark as paid →',
        ctaAction: () => onMoreNavigation('property-rental'),
        priority: 2,
        color: 'warning',
      });
    }

    // ── 5. Emergency fund low ────────────────────────────────────────────────
    if (ef && ef.targetAmount > 0) {
      const efPct = ef.currentAmount / ef.targetAmount;
      if (efPct < 0.5) {
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

    // ── 6. Insurance renewals within 30 days ────────────────────────────────
    const renewingSoon = insurance.filter(ins => {
      if (ins.isActive === false) return false;
      const due = ins.premiumDueDate ?? ins.endDate;
      if (!due) return false;
      const daysAway = Math.ceil((new Date(due).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysAway >= 0 && daysAway <= 30;
    });
    if (renewingSoon.length > 0) {
      const first = renewingSoon[0];
      const daysAway = Math.ceil(
        (new Date(first.premiumDueDate ?? first.endDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      list.push({
        id: 'insurance-renewal',
        icon: <ShieldAlert className="h-4 w-4" />,
        title: `${renewingSoon.length} insurance renewal${renewingSoon.length > 1 ? 's' : ''} due`,
        body: `"${first.name}" premium due in ${daysAway} day${daysAway !== 1 ? 's' : ''}. Ensure premium is ready to avoid lapse.`,
        ctaLabel: 'View insurance →',
        ctaAction: () => onMoreNavigation('insurance'),
        priority: 1,
        color: 'destructive',
      });
    }

    // ── 7. No salary recorded this month ─────────────────────────────────────
    const monthStart  = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const salaryThisMonth = incomes.filter(i =>
      new Date(i.date) >= monthStart && (i.category === 'Salary' || i.category === 'salary')
    );
    if (salaryThisMonth.length === 0 && new Date().getDate() > 10) {
      list.push({
        id: 'no-salary',
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'No salary recorded this month',
        body: `It's the ${new Date().getDate()}th and no salary entry found for ${new Date().toLocaleString('en-IN', { month: 'long' })}. Log your salary to keep Dashboard surplus accurate.`,
        ctaLabel: 'Add income →',
        ctaAction: () => onTabChange('income'),
        priority: 2,
        color: 'warning',
      });
    }

    // ── 8. Backup overdue ────────────────────────────────────────────────────
    const lastBackupMs = DataSafetyService.getLastBackupMs();
    if (lastBackupMs !== null && DataSafetyService.shouldNudgeBackup()) {
      const days = Math.floor(lastBackupMs / (1000 * 60 * 60 * 24));
      list.push({
        id: 'backup-overdue',
        icon: <ShieldAlert className="h-4 w-4" />,
        title: 'Backup overdue',
        body: `Last backup was ${days} days ago. Export a .savbak to protect your data against device loss.`,
        ctaLabel: 'Backup now →',
        ctaAction: () => onMoreNavigation('settings'),
        priority: 2,
        color: 'warning',
      });
    }

    // ── NPS 80CCD(1B) contribution gap nudge ────────────────────────────────
    // Use the already-loaded `investments` array from useLiveQuery above
    const npsInvestments = investments.filter((i: any) => ['NPS-T1', 'NPS-T2'].includes(i.type ?? ''));
    const npsThisFY = npsInvestments.reduce((s: number, i: any) => s + (i.investedValue ?? i.amount ?? 0), 0);
    if (npsThisFY < 50_000) {
      const annualIncome = settings?.annualIncome ?? 0;
      if (annualIncome > 600_000) {
        list.push({
          id: 'nps-gap',
          icon: <TrendingDown className="h-4 w-4" />,
          title: 'NPS 80CCD(1B) gap this FY',
          body: `Max ₹50,000 deduction available. Only ₹${npsThisFY.toLocaleString('en-IN')} contributed — add ${formatCurrency(50_000 - npsThisFY)} more before 31 Mar to save tax.`,
          ctaLabel: 'Open NPS →',
          ctaAction: () => onMoreNavigation('auto-goals'),
          priority: 2,
          color: 'warning',
        });
      }
    }

    // ── 9. Credit card approaching limit (>80% utilisation) ─────────────────
    const highUtilCards = creditCards.filter(c => {
      const limit = (c as any).creditLimit ?? 0;
      const bal   = c.currentBalance ?? 0;
      return limit > 0 && bal > 0 && (bal / limit) >= 0.8;
    });
    if (highUtilCards.length > 0) {
      const card = highUtilCards[0];
      const limit = (card as any).creditLimit ?? 1;
      const util  = Math.round(((card.currentBalance ?? 0) / limit) * 100);
      list.push({
        id: `cc-utilisation-${card.id}`,
        icon: <AlertTriangle className="h-4 w-4" />,
        title: `${card.name} at ${util}% utilisation`,
        body: `${formatCurrency(card.currentBalance ?? 0)} used of ${formatCurrency(limit)} limit. High utilisation hurts CIBIL score — pay down before statement date.`,
        ctaLabel: 'Pay now →',
        ctaAction: () => onTabChange('credit-cards'),
        priority: 1,
        color: 'destructive',
      });
    }

    // ── 10. Month-on-month spending spike >40% ───────────────────────────────
    // (uses incomes array as a proxy — expenses are not directly available here,
    //  so we'll skip this nudge if no signal. Real impl would need expenses LiveQuery)

    // ── Health insurance gap nudge (benchmark ₹15L total) ───────────────────
    const healthPolicies = insurance.filter(ins =>
      ins.isActive !== false && ((ins.type ?? '').toLowerCase().includes('health') || (ins.name ?? '').toLowerCase().includes('health') || (ins.name ?? '').toLowerCase().includes('mediclaim'))
    );
    const totalHealthCover = healthPolicies.reduce((s, p) => s + ((p as any).sumAssured ?? (p as any).coverAmount ?? 0), 0);
    if (totalHealthCover > 0 && totalHealthCover < 15_00_000) {
      list.push({
        id: 'health-cover-gap',
        icon: <ShieldAlert className="h-4 w-4" />,
        title: `Health cover ₹${(totalHealthCover / 1_00_000).toFixed(1)}L — below ₹15L target`,
        body: `CFA benchmark is ₹15L total health cover per family. You're ₹${((15_00_000 - totalHealthCover) / 1_00_000).toFixed(1)}L short. Consider a top-up super top-up plan.`,
        ctaLabel: 'View Insurance Gap →',
        ctaAction: () => onMoreNavigation('insurance-gap'),
        priority: 2,
        color: 'warning',
      });
    }

    // Sort by priority, cap at 3
    return list.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }, [activeGoals, recurring, loans, investments, creditCards, ef, settings, shops, rooms, insurance, incomes]);

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
