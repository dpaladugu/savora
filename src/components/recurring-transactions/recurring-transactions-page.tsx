import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Pencil, Trash2, Plus, Play, Pause, Repeat,
  CalendarClock, TrendingUp, TrendingDown, Zap, Sparkles, X,
} from "lucide-react";
import { RecurringTransactionForm } from "./recurring-transaction-form";
import { RecurringTransactionService } from "@/services/RecurringTransactionService";
import type { RecurringTransaction } from "@/services/RecurringTransactionService";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { formatCurrency } from "@/lib/format-utils";
import { toast } from "sonner";
import { processRecurringTransactions } from "@/services/RecurringTransactionProcessor";
import { useSIPPrefillStore } from "@/store/sipPrefillStore";

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86_400_000);
}

function DueBadge({ next_date }: { next_date: string }) {
  const d = daysUntil(next_date);
  if (d < 0)  return <Badge variant="destructive" className="text-[10px] h-4">Overdue</Badge>;
  if (d === 0) return <Badge className="text-[10px] h-4 bg-warning text-warning-foreground">Today</Badge>;
  if (d <= 3)  return <Badge className="text-[10px] h-4 bg-warning/20 text-warning border-warning/30">{d}d</Badge>;
  if (d <= 7)  return <Badge variant="secondary" className="text-[10px] h-4">{d}d</Badge>;
  return <span className="text-[10px] text-muted-foreground tabular-nums">{new Date(next_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>;
}

const FREQ_ICONS: Record<string, string> = {
  daily: '📅', weekly: '📆', monthly: '🗓️', yearly: '📋',
};

export function RecurringTransactionsPage() {
  const items = useLiveQuery(
    () => db.recurringTransactions.orderBy('next_date').toArray().catch(() => []),
    []
  ) ?? [];

  const { prefill, clearPrefill } = useSIPPrefillStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [running, setRunning] = useState(false);

  // Auto-open form with pre-fill when navigated from a nudge CTA
  useEffect(() => {
    if (prefill) {
      setEditing(null);
      setShowForm(true);
    }
  }, [prefill]);

  const active  = items.filter(i => i.is_active);
  const paused  = items.filter(i => !i.is_active);
  const totalIn  = active.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0);
  const totalOut = active.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0);

  const handleSubmit = async (data: any) => {
    try {
      if (editing) {
        await RecurringTransactionService.update(editing.id, data);
        toast.success('Updated');
      } else {
        await RecurringTransactionService.create(data);
        toast.success('Recurring transaction added');
      }
      setShowForm(false); setEditing(null);
    } catch {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    await RecurringTransactionService.delete(id);
    toast.success('Deleted');
  };

  const handleToggle = async (item: RecurringTransaction) => {
    await RecurringTransactionService.update(item.id, { is_active: !item.is_active });
    toast.success(item.is_active ? 'Paused' : 'Resumed');
  };

  const handleRunNow = async () => {
    setRunning(true);
    // Reset guard so it re-runs
    const settings = await db.globalSettings.limit(1).first();
    if (settings) await db.globalSettings.update(settings.id, { lastAutoRunAt: '' } as any);
    const result = await processRecurringTransactions();
    setRunning(false);
    if (result.processed > 0) {
      toast.success(`Posted ${result.processed} transaction${result.processed > 1 ? 's' : ''}: ${result.items.join(', ')}`);
    } else {
      toast.info('Nothing due yet');
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Repeat className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Recurring</h1>
            <p className="text-xs text-muted-foreground">{active.length} active · {paused.length} paused</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleRunNow} disabled={running} className="h-8 text-xs gap-1">
            <Zap className="h-3.5 w-3.5" />
            {running ? 'Running…' : 'Run now'}
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }} className="h-8 text-xs gap-1">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </div>

      {/* ── Monthly net summary ── */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-success/25 bg-success/5 p-3.5 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Monthly In</span>
            </div>
            <p className="text-lg font-bold text-success tabular-nums">{formatCurrency(totalIn)}</p>
          </div>
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-3.5 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Monthly Out</span>
            </div>
            <p className="text-lg font-bold text-destructive tabular-nums">{formatCurrency(totalOut)}</p>
          </div>
        </div>
      )}

      {/* ── Form ── */}
      {showForm && (
        <RecurringTransactionForm
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={handleSubmit}
          initialData={editing}
        />
      )}

      {/* ── Empty state ── */}
      {items.length === 0 && (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-14 gap-3">
            <CalendarClock className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">No recurring transactions</p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Add your salary, SIPs, EMIs, subscriptions — they'll auto-post on their due date
            </p>
            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add first one
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Active list ── */}
      {active.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">Active ({active.length})</p>
          {active.map((item) => (
            <RecurringCard
              key={item.id}
              item={item}
              onEdit={() => { setEditing(item); setShowForm(true); }}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* ── Paused list ── */}
      {paused.length > 0 && (
        <div className="space-y-2">
          <Separator />
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">Paused ({paused.length})</p>
          {paused.map((item) => (
            <RecurringCard
              key={item.id}
              item={item}
              onEdit={() => { setEditing(item); setShowForm(true); }}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function RecurringCard({
  item, onEdit, onDelete, onToggle,
}: {
  item: RecurringTransaction;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onToggle: (item: RecurringTransaction) => void;
}) {
  const isIncome = item.type === 'income';
  return (
    <Card className={`border-border/50 transition-opacity ${!item.is_active ? 'opacity-50' : ''}`}>
      <CardContent className="flex items-center gap-3 px-3.5 py-3">
        {/* Type dot */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
          isIncome ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
        }`}>
          {FREQ_ICONS[item.frequency] ?? '🔄'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">{item.description}</p>
            <DueBadge next_date={item.next_date} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {item.category} · every {item.interval > 1 ? `${item.interval} ` : ''}{item.frequency}
            {item.account ? ` · ${item.account}` : ''}
          </p>
        </div>

        {/* Amount */}
        <p className={`text-sm font-bold tabular-nums shrink-0 ${isIncome ? 'text-success' : 'text-destructive'}`}>
          {isIncome ? '+' : '−'}{formatCurrency(item.amount)}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggle(item)} title={item.is_active ? 'Pause' : 'Resume'}>
            {item.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Edit">
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(item.id)} title="Delete">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
