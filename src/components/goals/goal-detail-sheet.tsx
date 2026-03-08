/**
 * GoalDetailSheet — bottom sheet opened when a goal card is tapped.
 * Shows: full goal details, quick-contribute input, SIP recommendation,
 * and a mini contribution history (linked txns by goalId).
 */
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Target, CalendarDays, TrendingUp, PiggyBank, IndianRupee,
  Lightbulb, CheckCircle2, Clock, ChevronDown,
} from 'lucide-react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';
import type { Goal } from '@/types/financial';

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysRemaining(deadline?: string | Date): number | null {
  if (!deadline) return null;
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

function monthsRemaining(deadline?: string | Date): number | null {
  const d = daysRemaining(deadline);
  return d === null ? null : Math.max(1, Math.ceil(d / 30));
}

function sipRecommendation(goal: Goal): number | null {
  const remaining = goal.targetAmount - goal.currentAmount;
  if (remaining <= 0) return null;
  const months = monthsRemaining((goal as any).deadline ?? (goal as any).targetDate);
  if (!months) return null;
  // Simple future-value formula assuming 12% CAGR
  const r = 0.12 / 12;
  const sip = (remaining * r) / (Math.pow(1 + r, months) - 1);
  return Math.ceil(sip / 100) * 100; // round up to nearest ₹100
}

function statusColor(pct: number) {
  if (pct >= 100) return 'text-success';
  if (pct >= 50)  return 'text-warning';
  return 'text-destructive';
}

// ── Main Component ────────────────────────────────────────────────────────────

interface GoalDetailSheetProps {
  goal: Goal | null;
  open: boolean;
  onClose: () => void;
}

export function GoalDetailSheet({ goal, open, onClose }: GoalDetailSheetProps) {
  const [amount, setAmount]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Live contribution history: txns tagged with this goalId
  const contributions = useLiveQuery(
    async () => {
      if (!goal?.id) return [];
      try {
        return await db.txns
          .where('goalId').equals(goal.id)
          .reverse()
          .limit(10)
          .toArray();
      } catch {
        return [];
      }
    },
    [goal?.id],
  ) ?? [];

  if (!goal) return null;

  const target  = goal.targetAmount ?? 0;
  const current = goal.currentAmount ?? 0;
  const pct     = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const days    = daysRemaining((goal as any).deadline ?? (goal as any).targetDate);
  const sip     = sipRecommendation(goal);
  const name    = goal.name ?? (goal as any).title ?? 'Goal';

  const handleContribute = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      const now = new Date();
      // Record as a Txn linked to this goal
      await db.txns.add({
        id: crypto.randomUUID(),
        date: now,
        amount: amt,
        currency: 'INR',
        category: 'Goal Contribution',
        note: `Contribution to "${name}"`,
        tags: ['goal'],
        goalId: goal.id,
        isPartialRent: false,
        paymentMix: [],
        isSplit: false,
        splitWith: [],
        createdAt: now,
        updatedAt: now,
      } as any);
      // Update goal's currentAmount
      await db.goals.update(goal.id, {
        currentAmount: current + amt,
        updatedAt: now,
      } as any);
      toast.success(`₹${amt.toLocaleString('en-IN')} added to "${name}"`);
      setAmount('');
    } catch (e) {
      console.error(e);
      toast.error('Failed to record contribution');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto px-5 pb-8">
        <SheetHeader className="pb-2 pt-1">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            {name}
          </SheetTitle>
        </SheetHeader>

        {/* ── Progress hero ── */}
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-3 mt-1">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{formatCurrency(current)}</p>
              <p className="text-xs text-muted-foreground">of {formatCurrency(target)}</p>
            </div>
            <span className={`text-3xl font-black tabular-nums ${statusColor(pct)}`}>{pct}%</span>
          </div>
          <Progress value={pct} className="h-2.5" />
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {days !== null && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {days < 0 ? 'Overdue' : `${days} days left`}
              </span>
            )}
            <span className="flex items-center gap-1">
              <PiggyBank className="h-3 w-3" />
              {formatCurrency(target - current)} remaining
            </span>
            {goal.category && (
              <Badge variant="secondary" className="text-[10px] h-4">{goal.category}</Badge>
            )}
          </div>
        </div>

        {/* ── SIP Recommendation ── */}
        {sip !== null && pct < 100 && (
          <div className="mt-4 flex items-start gap-3 p-3.5 rounded-2xl bg-warning/5 border border-warning/20">
            <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">SIP Suggestion</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Invest <span className="font-bold text-warning">{formatCurrency(sip)}/month</span> to reach
                your goal on time <span className="text-muted-foreground/70">(@ 12% CAGR)</span>
              </p>
            </div>
          </div>
        )}

        {/* ── Goal achieved banner ── */}
        {pct >= 100 && (
          <div className="mt-4 flex items-center gap-3 p-3.5 rounded-2xl bg-success/5 border border-success/20">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-sm font-semibold text-success">Goal achieved! 🎉</p>
              <p className="text-xs text-muted-foreground">You've reached your target amount.</p>
            </div>
          </div>
        )}

        {/* ── Quick Contribute ── */}
        {pct < 100 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 text-primary" />
                Quick Contribute
              </p>

              {/* Fast-tap chips */}
              <div className="flex gap-2 flex-wrap">
                {[500, 1000, 2000, 5000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      amount === String(v)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary/60 border-border/50 text-foreground hover:border-primary/40'
                    }`}
                  >
                    ₹{v.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Custom amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-10 text-sm font-semibold"
                  />
                </div>
              </div>

              <Button
                className="w-full h-10 rounded-xl font-semibold"
                onClick={handleContribute}
                disabled={saving || !amount}
              >
                {saving ? 'Saving…' : `Add ₹${parseFloat(amount || '0').toLocaleString('en-IN')}`}
              </Button>
            </div>
          </>
        )}

        {/* ── Notes ── */}
        {(goal as any).notes && (
          <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/40">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
            <p className="text-xs text-foreground">{(goal as any).notes}</p>
          </div>
        )}

        {/* ── Contribution History ── */}
        {contributions.length > 0 && (
          <>
            <Separator className="my-4" />
            <button
              onClick={() => setShowHistory(h => !h)}
              className="w-full flex items-center justify-between text-xs font-semibold text-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Contribution History ({contributions.length})
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </button>
            {showHistory && (
              <ul className="mt-3 space-y-2">
                {contributions.map((t: any) => (
                  <li key={t.id} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-foreground">{t.note || 'Contribution'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-success tabular-nums">+{formatCurrency(t.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

      </SheetContent>
    </Sheet>
  );
}
