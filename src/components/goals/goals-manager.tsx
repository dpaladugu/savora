/**
 * GoalsManager — live Dexie data, per-goal "Plan SIP" deep-link, add/delete
 */
import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Target, Plus, Trash2, TrendingUp, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Goal } from '@/types/financial';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const pct = (cur: number, tgt: number) => Math.min((cur / tgt) * 100, 100);

function GoalCard({
  goal,
  onDelete,
  onPlanSip,
}: {
  goal: Goal;
  onDelete: (id: string) => void;
  onPlanSip: (id: string) => void;
}) {
  const progress = pct(goal.currentAmount ?? 0, goal.targetAmount ?? 1);
  const done = progress >= 100;

  return (
    <Card className="glass">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-semibold text-foreground truncate">{goal.name}</h4>
              {done && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Target: {fmt(goal.targetAmount ?? 0)}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10 shrink-0"
            onClick={() => onDelete(goal.id)}
            aria-label="Delete goal"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold tabular-nums text-foreground">{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{fmt(goal.currentAmount ?? 0)}</span>
            <span>{fmt(Math.max(0, (goal.targetAmount ?? 0) - (goal.currentAmount ?? 0)))} to go</span>
          </div>
        </div>

        {!done && (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => onPlanSip(goal.id)}
          >
            <TrendingUp className="h-3 w-3" /> Plan SIP for this goal
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function GoalsManager({
  onNavigateToSip,
}: {
  onNavigateToSip?: (goalId: string) => void;
}) {
  const goals = useLiveQuery(() => db.goals.toArray().catch(() => []), []) ?? [];
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    endDate: '',
    category: 'short-term' as 'short-term' | 'long-term',
  });

  const handleAdd = useCallback(async () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.endDate) {
      toast.error('Please fill all fields');
      return;
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
      await db.auditLogs.add({
        id: crypto.randomUUID(),
        action: 'create',
        entity: 'goal',
        entityId: id,
        newValues: goal,
        timestamp: new Date(),
      });
    } catch { /* non-blocking */ }
  }, [newGoal]);

  const handleDelete = useCallback(async (id: string) => {
    const old = await db.goals.get(id);
    await db.goals.delete(id);
    toast.success('Goal removed');
    try {
      await db.auditLogs.add({
        id: crypto.randomUUID(),
        action: 'delete',
        entity: 'goal',
        entityId: id,
        oldValues: old,
        timestamp: new Date(),
      });
    } catch { /* non-blocking */ }
  }, []);

  const handlePlanSip = useCallback((goalId: string) => {
    if (onNavigateToSip) {
      onNavigateToSip(goalId);
    } else {
      // fallback: deep-link via global event
      window.dispatchEvent(new CustomEvent('navigate-to-module', { detail: 'sip-planner' }));
    }
  }, [onNavigateToSip]);

  const active    = goals.filter((g) => g.status === 'active');
  const longTerm  = active.filter((g) => g.category === 'long-term');
  const shortTerm = active.filter((g) => g.category === 'short-term');
  const completed = goals.filter((g) => g.status === 'completed' || pct(g.currentAmount ?? 0, g.targetAmount ?? 1) >= 100);

  const Section = ({
    title,
    items,
  }: {
    title: string;
    items: Goal[];
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
        <Badge variant="outline" className="text-[10px] h-4 px-1.5">{items.length}</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <GoalCard goal={g} onDelete={handleDelete} onPlanSip={handlePlanSip} />
          </motion.div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground col-span-2 py-2">No {title.toLowerCase()} yet.</p>
        )}
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
        <Button
          size="sm"
          onClick={() => setIsAdding(true)}
          className="h-9 gap-1.5 shrink-0 rounded-xl text-xs"
        >
          <Plus className="h-3.5 w-3.5" /> Add Goal
        </Button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass border-primary/20">
            <CardContent className="p-4 space-y-3">
              <h2 className="text-sm font-semibold">New Goal</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-muted-foreground">Goal Name</label>
                  <Input
                    value={newGoal.name}
                    onChange={(e) => setNewGoal((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Japan Trip"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Target Amount (₹)</label>
                  <Input
                    type="number"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal((p) => ({ ...p, targetAmount: e.target.value }))}
                    placeholder="200000"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Target Date</label>
                  <Input
                    type="date"
                    value={newGoal.endDate}
                    onChange={(e) => setNewGoal((p) => ({ ...p, endDate: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-muted-foreground">Category</label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal((p) => ({ ...p, category: e.target.value as any }))}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
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
    </div>
  );
}
