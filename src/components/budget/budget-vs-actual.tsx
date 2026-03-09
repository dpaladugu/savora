/**
 * Budget Planner — unified screen replacing the old read-only Budget vs Actual.
 * • Health score card at top (0–100)
 * • Inline add / edit budgets per category → auto-writes to spendingLimits
 * • RAG bars: Green <80%, Amber 80–99%, Red ≥100%
 * • Categories with spend but no budget shown as "Unbudgeted" section
 */
import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { formatCurrency } from '@/lib/format-utils';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import {
  BarChart3, CheckCircle2, AlertTriangle, XCircle,
  Plus, Edit2, Trash2, Zap, TrendingUp, Wallet,
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '@/lib/categories';

// ─── Helpers ──────────────────────────────────────────────────────────────────
type RAG = 'green' | 'amber' | 'red';

function rag(pct: number): RAG {
  if (pct >= 100) return 'red';
  if (pct >= 80)  return 'amber';
  return 'green';
}

const ragClasses: Record<RAG, { bar: string; badge: string; text: string; icon: string }> = {
  green: { bar: 'bg-success',     badge: 'bg-success/15 text-success border-success/30',         text: 'text-success',     icon: 'text-success' },
  amber: { bar: 'bg-warning',     badge: 'bg-warning/15 text-warning border-warning/30',         text: 'text-warning',     icon: 'text-warning' },
  red:   { bar: 'bg-destructive', badge: 'bg-destructive/15 text-destructive border-destructive/30', text: 'text-destructive', icon: 'text-destructive' },
};

const RAGIcon: Record<RAG, React.ElementType> = {
  green: CheckCircle2,
  amber: AlertTriangle,
  red:   XCircle,
};

// ─── Health Score ─────────────────────────────────────────────────────────────
function healthScore(rows: { pct: number }[]): number {
  if (!rows.length) return 100;
  const avg = rows.reduce((s, r) => s + Math.min(r.pct, 120), 0) / rows.length;
  return Math.max(0, Math.round(100 - avg));
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-success';
  if (score >= 40) return 'text-warning';
  return 'text-destructive';
}
function scoreLabel(score: number) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Caution';
  if (score >= 30) return 'Warning';
  return 'Critical';
}

// ─── Main component ──────────────────────────────────────────────────────────
const emptyForm = { category: '', monthlyCap: '', alertAt: '80' };

export function BudgetVsActual({ onNavigateToLimits }: { onNavigateToLimits?: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState({ ...emptyForm });

  // ── Live data ──────────────────────────────────────────────────────────────
  const limits = useLiveQuery(() => db.spendingLimits?.toArray() ?? Promise.resolve([])) ?? [];

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  // Pull from both txns (negative = expense) and expenses table (positive amounts)
  const txns = useLiveQuery(() =>
    db.txns.filter(t => {
      const d = t.date instanceof Date ? t.date : new Date(t.date as any);
      return d >= new Date(now.getFullYear(), now.getMonth(), 1) && t.amount < 0;
    }).toArray()
  ) ?? [];

  const expenseRows = useLiveQuery(() =>
    db.expenses.filter(e => {
      const d = e.date instanceof Date ? e.date : new Date(e.date as any);
      return d >= new Date(now.getFullYear(), now.getMonth(), 1);
    }).toArray()
  ) ?? [];

  // ── Spend by category this month (union of txns + expenses) ──────────────
  const spendByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    // From txns (negative amounts)
    for (const t of txns) m[t.category] = (m[t.category] ?? 0) + Math.abs(t.amount);
    // From expenses table (positive amounts)
    for (const e of expenseRows) m[e.category] = (m[e.category] ?? 0) + Math.abs(e.amount);
    return m;
  }, [txns, expenseRows]);

  // ── Budgeted rows ─────────────────────────────────────────────────────────
  const rows = useMemo(() =>
    limits.map(l => {
      const spent  = spendByCategory[l.category] ?? 0;
      const pct    = l.monthlyCap > 0 ? Math.round((spent / l.monthlyCap) * 100) : 0;
      const status = rag(pct);
      return { ...l, spent, pct, status } as typeof l & { spent: number; pct: number; status: RAG };
    }).sort((a, b) => b.pct - a.pct),
  [limits, spendByCategory]);

  // ── Unbudgeted categories (spend exists, no limit set) ────────────────────
  const budgetedCats = new Set(limits.map(l => l.category));
  const unbudgeted = useMemo(() =>
    Object.entries(spendByCategory)
      .filter(([cat]) => !budgetedCats.has(cat))
      .sort((a, b) => b[1] - a[1]),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [spendByCategory, limits]);

  // ── Aggregates ────────────────────────────────────────────────────────────
  const totalBudget  = rows.reduce((s, r) => s + r.monthlyCap, 0);
  const totalSpent   = rows.reduce((s, r) => s + r.spent, 0);
  const overCount    = rows.filter(r => r.pct >= 100).length;
  const nearCount    = rows.filter(r => r.pct >= 80 && r.pct < 100).length;
  const score        = healthScore(rows);
  const monthLabel   = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const openAdd = (prefillCategory?: string) => {
    setEditId(null);
    setForm({ ...emptyForm, category: prefillCategory ?? '' });
    setShowModal(true);
  };

  const openEdit = (l: typeof limits[number]) => {
    setEditId(l.id);
    setForm({ category: l.category, monthlyCap: l.monthlyCap.toString(), alertAt: (l.alertAt ?? 80).toString() });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cap = parseFloat(form.monthlyCap);
    if (!form.category || !cap) { toast.error('Category and cap are required'); return; }
    const data = { category: form.category, monthlyCap: cap, alertAt: parseInt(form.alertAt) || 80, updatedAt: new Date() };
    try {
      if (editId) {
        await db.spendingLimits?.update(editId, data);
        toast.success('Budget updated');
      } else {
        // Prevent duplicates
        const existing = limits.find(l => l.category === form.category);
        if (existing) {
          await db.spendingLimits?.update(existing.id, data);
          toast.success('Budget updated');
        } else {
          await db.spendingLimits?.add({ id: crypto.randomUUID(), ...data, createdAt: new Date() });
          toast.success('Budget added');
        }
      }
      setShowModal(false);
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this budget?')) return;
    await db.spendingLimits?.delete(id);
    toast.success('Budget removed');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <PageHeader
        title="Budget Planner"
        subtitle={monthLabel}
        icon={BarChart3}
        action={
          <Button size="sm" onClick={() => openAdd()} className="h-9 text-xs gap-1 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Add Budget
          </Button>
        }
      />

      {/* ── Health Score Card ─────────────────────────────────────────────── */}
      <Card className="glass border-border/40 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Score circle */}
            <div className="relative shrink-0 w-16 h-16 flex items-center justify-center rounded-full border-2 border-border/30 bg-muted/20">
              <Zap className={`h-5 w-5 absolute top-2 left-1/2 -translate-x-1/2 ${scoreColor(score)} opacity-60`} />
              <span className={`text-2xl font-black tabular-nums ${scoreColor(score)}`}>{score}</span>
            </div>
            {/* Stats */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className={`text-base font-bold ${scoreColor(score)}`}>{scoreLabel(score)}</span>
                <span className="text-xs text-muted-foreground">Budget Health</span>
              </div>
              <div className="h-2 rounded-full bg-muted/40 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${score >= 70 ? 'bg-success' : score >= 40 ? 'bg-warning' : 'bg-destructive'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <div className="flex gap-3 text-[10px] text-muted-foreground">
                <span><span className="font-semibold text-foreground tabular-nums">{rows.length}</span> budgeted</span>
                {overCount > 0  && <span className="text-destructive font-semibold">{overCount} over limit</span>}
                {nearCount > 0  && <span className="text-warning font-semibold">{nearCount} near limit</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary chips ─────────────────────────────────────────────────── */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Budget', value: formatCurrency(totalBudget), icon: Wallet,     color: 'text-foreground' },
            { label: 'Spent',        value: formatCurrency(totalSpent),  icon: TrendingUp, color: totalSpent > totalBudget ? 'text-destructive' : 'text-success' },
            { label: 'Remaining',    value: formatCurrency(Math.max(0, totalBudget - totalSpent)), icon: CheckCircle2, color: 'text-foreground' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="glass">
              <CardContent className="p-3 text-center space-y-1">
                <Icon className={`h-3.5 w-3.5 mx-auto ${color} opacity-70`} />
                <p className={`text-xs font-bold tabular-nums ${color}`}>{value}</p>
                <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Alert banner ──────────────────────────────────────────────────── */}
      {(overCount > 0 || nearCount > 0) && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-warning/8 border border-warning/25 text-xs text-warning">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            {overCount > 0 && <strong>{overCount} categor{overCount === 1 ? 'y' : 'ies'} over budget. </strong>}
            {nearCount > 0 && `${nearCount} approaching limit.`}
          </span>
        </div>
      )}

      {/* ── Budgeted rows ─────────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/25" />
            <p className="text-sm font-medium text-muted-foreground">No budgets set yet</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Set a monthly cap per category. The app will alert you at 80% and track your health score.
            </p>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs h-9" onClick={() => openAdd()}>
              <Plus className="h-3.5 w-3.5" /> Set your first budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map(row => {
            const Icon = RAGIcon[row.status];
            const cls  = ragClasses[row.status];
            const remaining = row.monthlyCap - row.spent;
            return (
              <Card key={row.id} className={`glass border ${row.status === 'red' ? 'border-destructive/30' : row.status === 'amber' ? 'border-warning/30' : 'border-border/40'}`}>
                <CardContent className="p-4 space-y-2.5">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${cls.icon}`} />
                      <span className="text-sm font-semibold text-foreground truncate">{row.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className={`text-[10px] px-1.5 border ${cls.badge}`}>{row.pct}%</Badge>
                      <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={() => openEdit(row)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md text-destructive hover:bg-destructive/10" onClick={() => handleDelete(row.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${cls.bar}`}
                      style={{ width: `${Math.min(row.pct, 100)}%` }}
                    />
                  </div>

                  {/* Footer numbers */}
                  <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
                    <span>Spent <span className="font-semibold text-foreground">{formatCurrency(row.spent)}</span></span>
                    <span>Limit <span className="font-semibold text-foreground">{formatCurrency(row.monthlyCap)}</span></span>
                    <span className={remaining < 0 ? 'font-semibold text-destructive' : ''}>
                      {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Unbudgeted section ─────────────────────────────────────────────── */}
      {unbudgeted.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Unbudgeted spending this month
          </p>
          {unbudgeted.map(([cat, spent]) => (
            <Card key={cat} className="glass border-dashed border-border/40">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cat}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{formatCurrency(spent)} spent</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] gap-1 rounded-lg shrink-0 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => openAdd(cat)}
                  >
                    <Plus className="h-3 w-3" /> Set budget
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Add / Edit dialog ──────────────────────────────────────────────── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-base">{editId ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Category *</Label>
              <Input
                list="budget-cats"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="h-10 text-sm"
                placeholder="Food & Dining, Transport…"
                required
              />
              <datalist id="budget-cats">
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Monthly Cap (₹) *</Label>
              <Input
                type="number"
                min="1"
                value={form.monthlyCap}
                onChange={e => setForm(f => ({ ...f, monthlyCap: e.target.value }))}
                className="h-10 text-sm"
                placeholder="5000"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Alert threshold (%)</Label>
              <Input
                type="number"
                min="50"
                max="100"
                value={form.alertAt}
                onChange={e => setForm(f => ({ ...f, alertAt: e.target.value }))}
                className="h-10 text-sm"
              />
              <p className="text-[10px] text-muted-foreground">You'll get a toast alert at this percentage.</p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1 h-10 text-xs rounded-xl">
                {editId ? 'Update' : 'Add Budget'}
              </Button>
              <Button type="button" variant="outline" className="flex-1 h-10 text-xs rounded-xl" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
