/**
 * GoalsManager — live Dexie data, per-goal contributions, inline edit, "Plan SIP" deep-link
 * Shows SIP needed vs committed from recurring transactions for each goal.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Target, Plus, Trash2, TrendingUp, CheckCircle2, Edit2, PlusCircle, MinusCircle, X, AlertCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { useSIPPrefillStore } from '@/store/sipPrefillStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Goal } from '@/types/financial';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const pct = (cur: number, tgt: number) => Math.min((cur / Math.max(tgt, 1)) * 100, 100);

// ── Contribute / Withdraw Dialog ──────────────────────────────────────────────
function ContributeDialog({
  goal,
  open,
  onClose,
}: {
  goal: Goal | null;
  open: boolean;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'add' | 'withdraw'>('add');

  if (!goal) return null;

  const handleSave = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) { toast.error('Enter a valid amount'); return; }
    const delta = mode === 'add' ? val : -val;
    const next  = Math.max(0, (goal.currentAmount ?? 0) + delta);
    await db.goals.update(goal.id, { currentAmount: next });
    try {
      await db.auditLogs.add({
        id: crypto.randomUUID(), action: 'update', entity: 'goal', entityId: goal.id,
        oldValues: { currentAmount: goal.currentAmount }, newValues: { currentAmount: next }, timestamp: new Date(),
      });
    } catch { /* non-blocking */ }
    toast.success(mode === 'add' ? `+${fmt(val)} added to ${goal.name}` : `${fmt(val)} withdrawn from ${goal.name}`);
    setAmount('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">{goal.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === 'add' ? 'default' : 'outline'}
              className="flex-1 h-9 text-xs gap-1.5"
              onClick={() => setMode('add')}
            >
              <PlusCircle className="h-3.5 w-3.5" /> Add Funds
            </Button>
            <Button
              size="sm"
              variant={mode === 'withdraw' ? 'destructive' : 'outline'}
              className="flex-1 h-9 text-xs gap-1.5"
              onClick={() => setMode('withdraw')}
            >
              <MinusCircle className="h-3.5 w-3.5" /> Withdraw
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Amount (₹)</Label>
            <Input
              type="number"
              placeholder="e.g. 5000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
              className="h-10"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Current: {fmt(goal.currentAmount ?? 0)} / Target: {fmt(goal.targetAmount ?? 0)}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-9 text-xs" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 h-9 text-xs" onClick={handleSave}>
              {mode === 'add' ? 'Add' : 'Withdraw'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Goal Dialog ──────────────────────────────────────────────────────────
function EditGoalDialog({
  goal,
  open,
  onClose,
}: {
  goal: Goal | null;
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName]         = useState(goal?.name ?? '');
  const [target, setTarget]     = useState(String(goal?.targetAmount ?? ''));
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');
  const [category, setCategory] = useState<'short-term' | 'long-term'>(
    (goal?.category as any) ?? 'short-term'
  );

  // Sync when goal changes
  const prevGoalId = useState(goal?.id)[0];

  if (!goal) return null;

  const handleSave = async () => {
    if (!name || !target || !deadline) { toast.error('Fill all fields'); return; }
    await db.goals.update(goal.id, {
      name,
      targetAmount: parseInt(target),
      deadline,
      category,
    });
    toast.success('Goal updated');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader><DialogTitle className="text-sm">Edit Goal</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Goal Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Target Amount (₹)</Label>
            <Input type="number" value={target} onChange={e => setTarget(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Target Date</Label>
            <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="short-term">Short-term (&lt; 3 years)</option>
              <option value="long-term">Long-term (&gt; 3 years)</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 h-9 text-xs" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 h-9 text-xs" onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({
  goal,
  onDelete,
  onPlanSip,
  onContribute,
  onEdit,
  committedSIP,
}: {
  goal: Goal;
  onDelete: (id: string) => void;
  onPlanSip: (id: string) => void;
  onContribute: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  committedSIP: number;
}) {
  const progress = pct(goal.currentAmount ?? 0, goal.targetAmount ?? 1);
  const done = progress >= 100;
  const remaining = Math.max(0, (goal.targetAmount ?? 0) - (goal.currentAmount ?? 0));

  // Days to deadline
  const daysLeft = goal.deadline
    ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000))
    : null;

  // Monthly SIP needed
  const monthsLeft = daysLeft != null ? Math.max(1, Math.ceil(daysLeft / 30)) : null;
  const sipNeeded  = monthsLeft && remaining > 0 ? Math.ceil(remaining / monthsLeft) : null;

  return (
    <Card className="glass">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-semibold text-foreground truncate">{goal.name}</h4>
              {done && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">{goal.category}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Target: {fmt(goal.targetAmount ?? 0)}</p>
            {goal.deadline && (
              <p className="text-[10px] text-muted-foreground">
                {done ? 'Completed' : `${daysLeft}d left · ${goal.deadline}`}
              </p>
            )}
          </div>
          <div className="flex gap-0.5 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => onEdit(goal)} aria-label="Edit goal">
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => onDelete(goal.id)} aria-label="Delete goal">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold tabular-nums text-foreground">{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{fmt(goal.currentAmount ?? 0)}</span>
            <span>{fmt(remaining)} to go</span>
          </div>
        </div>

        {/* SIP needed vs committed */}
        {!done && sipNeeded != null && sipNeeded > 0 && (
          <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] ${
            committedSIP >= sipNeeded
              ? 'bg-success/10 text-success'
              : committedSIP > 0
              ? 'bg-warning/10 text-warning'
              : 'bg-muted/40 text-muted-foreground'
          }`}>
            <span>
              {committedSIP >= sipNeeded ? '✓ SIP on track' : committedSIP > 0 ? '⚠ SIP gap' : '💡 No SIP yet'}
            </span>
            <span className="tabular-nums font-semibold">
              {fmt(committedSIP)}<span className="font-normal opacity-70"> committed · </span>{fmt(sipNeeded)}<span className="font-normal opacity-70">/mo needed</span>
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1 rounded-xl border-success/30 text-success hover:bg-success/5"
            onClick={() => onContribute(goal)}
          >
            <PlusCircle className="h-3 w-3" /> Contribute
          </Button>
          {!done && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => onPlanSip(goal.id)}
            >
              <TrendingUp className="h-3 w-3" /> Plan SIP
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function GoalsManager({ onNavigateToSip }: { onNavigateToSip?: (goalId: string) => void }) {
  const goals     = useLiveQuery(() => db.goals.toArray().catch(() => []), []) ?? [];
  const recurring = useLiveQuery(() => db.recurringTransactions.toArray().catch(() => []), []) ?? [];
  const [isAdding, setIsAdding] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    name: '', targetAmount: '', endDate: '', category: 'short-term' as 'short-term' | 'long-term',
  });

  // Build a map: goal name → monthly committed SIP from recurring transactions
  const sipCommittedByGoal = useMemo(() => {
    const map: Record<string, number> = {};
    const activeSIPs = recurring.filter(r => r.is_active && r.type === 'expense');
    goals.forEach(g => {
      const name = (g.name ?? '').toLowerCase();
      const matched = activeSIPs.filter(r =>
        r.description.toLowerCase().includes(name.slice(0, 5)) ||
        r.description.toLowerCase().includes('sip') ||
        r.category === 'Investment'
      );
      // Only count SIPs whose description references this goal
      const goalSIPs = activeSIPs.filter(r =>
        r.description.toLowerCase().includes(name.slice(0, 4))
      );
      map[g.id] = goalSIPs.reduce((s, r) => {
        const amt = Math.abs(r.amount);
        if (r.frequency === 'monthly') return s + amt;
        if (r.frequency === 'quarterly') return s + amt / 3;
        if (r.frequency === 'yearly') return s + amt / 12;
        return s + amt;
      }, 0);
    });
    return map;
  }, [goals, recurring]);

  const handleAdd = useCallback(async () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.endDate) {
      toast.error('Please fill all fields'); return;
    }
    const goal: Omit<Goal, 'id'> = {
      name: newGoal.name,
      targetAmount: parseInt(newGoal.targetAmount),
      currentAmount: 0,
      deadline: newGoal.endDate,
      category: newGoal.category,
      notes: '',
    };
    const id = crypto.randomUUID();
    await db.goals.add({ ...goal, id });
    setNewGoal({ name: '', targetAmount: '', endDate: '', category: 'short-term' });
    setIsAdding(false);
    toast.success('Goal added');
    try {
      await db.auditLogs.add({ id: crypto.randomUUID(), action: 'create', entity: 'goal', entityId: id, newValues: goal, timestamp: new Date() });
    } catch { /* non-blocking */ }
  }, [newGoal]);

  const handleDelete = useCallback(async (id: string) => {
    const old = await db.goals.get(id);
    await db.goals.delete(id);
    toast.success('Goal removed');
    try {
      await db.auditLogs.add({ id: crypto.randomUUID(), action: 'delete', entity: 'goal', entityId: id, oldValues: old, timestamp: new Date() });
    } catch { /* non-blocking */ }
  }, []);

  const setGoalIdForPlanner = useSIPPrefillStore(s => s.setGoalIdForPlanner);
  const handlePlanSip = useCallback((goalId: string) => {
    setGoalIdForPlanner(goalId);
    if (onNavigateToSip) onNavigateToSip(goalId);
    else window.dispatchEvent(new CustomEvent('navigate-to-module', { detail: 'sip-planner' }));
  }, [onNavigateToSip, setGoalIdForPlanner]);

  const active    = goals.filter(g => pct(g.currentAmount ?? 0, g.targetAmount ?? 1) < 100);
  const longTerm  = active.filter(g => g.category === 'long-term');
  const shortTerm = active.filter(g => g.category !== 'long-term');
  const completed = goals.filter(g => pct(g.currentAmount ?? 0, g.targetAmount ?? 1) >= 100);

  const totalSaved = goals.reduce((s, g) => s + (g.currentAmount ?? 0), 0);
  const totalTarget = goals.reduce((s, g) => s + (g.targetAmount ?? 0), 0);

  const Section = ({ title, items }: { title: string; items: Goal[] }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
        <Badge variant="outline" className="text-[10px] h-4 px-1.5">{items.length}</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((g, i) => (
          <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GoalCard
              goal={g}
              onDelete={handleDelete}
              onPlanSip={handlePlanSip}
              onContribute={setContributeGoal}
              onEdit={setEditGoal}
            />
          </motion.div>
        ))}
        {items.length === 0 && <p className="text-xs text-muted-foreground col-span-2 py-2">No {title.toLowerCase()} yet.</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Goals</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track your financial objectives</p>
        </div>
        <Button size="sm" onClick={() => setIsAdding(true)} className="h-9 gap-1.5 shrink-0 rounded-xl text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Goal
        </Button>
      </div>

      {/* Summary strip */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Goals',   value: String(goals.length) },
            { label: 'Saved',   value: fmt(totalSaved) },
            { label: 'To Go',   value: fmt(Math.max(0, totalTarget - totalSaved)) },
          ].map(({ label, value }) => (
            <Card key={label} className="glass">
              <CardContent className="p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-sm font-bold text-foreground tabular-nums">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <Card className="glass border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">New Goal</h2>
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => setIsAdding(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs text-muted-foreground">Goal Name</label>
                    <Input value={newGoal.name} onChange={e => setNewGoal(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Japan Trip" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Target Amount (₹)</label>
                    <Input type="number" value={newGoal.targetAmount} onChange={e => setNewGoal(p => ({ ...p, targetAmount: e.target.value }))} placeholder="200000" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Target Date</label>
                    <Input type="date" value={newGoal.endDate} onChange={e => setNewGoal(p => ({ ...p, endDate: e.target.value }))} className="h-9 text-sm" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs text-muted-foreground">Category</label>
                    <select value={newGoal.category} onChange={e => setNewGoal(p => ({ ...p, category: e.target.value as any }))}
                      className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="short-term">Short-term (&lt; 3 years)</option>
                      <option value="long-term">Long-term (&gt; 3 years)</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAdd} className="flex-1 h-9 text-xs">Add Goal</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsAdding(false)} className="flex-1 h-9 text-xs">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Section title="Long-term Goals"  items={longTerm} />
      <Section title="Short-term Goals" items={shortTerm} />
      {completed.length > 0 && <Section title="Completed" items={completed} />}

      {goals.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No goals yet</p>
          <Button size="sm" onClick={() => setIsAdding(true)} className="h-9 text-xs rounded-xl gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add First Goal
          </Button>
        </div>
      )}

      {/* Contribute dialog */}
      <ContributeDialog goal={contributeGoal} open={!!contributeGoal} onClose={() => setContributeGoal(null)} />

      {/* Edit dialog */}
      {editGoal && (
        <EditGoalDialog goal={editGoal} open={!!editGoal} onClose={() => setEditGoal(null)} />
      )}
    </div>
  );
}
