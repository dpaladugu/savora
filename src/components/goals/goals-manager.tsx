
import { motion } from "framer-motion";
import { useState } from "react";
import { Target, Plus, Trash2, Edit } from "lucide-react";
import { EmergencyFundAdvisor } from './EmergencyFundAdvisor';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Goal {
  id: string; name: string; targetAmount: number; currentAmount: number;
  startDate: string; endDate: string;
  category: 'long-term' | 'short-term'; status: 'active' | 'completed' | 'abandoned';
}

const defaultGoals: Goal[] = [
  { id: '1', name: 'Child Education', targetAmount: 2500000, currentAmount: 450000, startDate: '2024-01-01', endDate: '2035-12-31', category: 'long-term',  status: 'active' },
  { id: '2', name: 'Home Purchase',   targetAmount: 8000000, currentAmount: 1200000, startDate: '2024-01-01', endDate: '2028-12-31', category: 'long-term',  status: 'active' },
  { id: '3', name: 'Europe Trip',     targetAmount: 300000,  currentAmount: 85000,   startDate: '2024-01-01', endDate: '2024-12-31', category: 'short-term', status: 'active' },
];

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const pct  = (cur: number, tgt: number) => Math.min((cur / tgt) * 100, 100);

export function GoalsManager() {
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', endDate: '', category: 'short-term' as const });
  const { toast } = useToast();

  const handleAdd = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.endDate) {
      toast({ title: 'Please fill all fields', variant: 'destructive' }); return;
    }
    setGoals(prev => [...prev, { id: Date.now().toString(), name: newGoal.name, targetAmount: parseInt(newGoal.targetAmount), currentAmount: 0, startDate: new Date().toISOString().split('T')[0], endDate: newGoal.endDate, category: newGoal.category, status: 'active' }]);
    setNewGoal({ name: '', targetAmount: '', endDate: '', category: 'short-term' });
    setIsAdding(false);
    toast({ title: 'Goal added' });
  };

  const handleDelete = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    toast({ title: 'Goal removed' });
  };

  const longTerm  = goals.filter(g => g.category === 'long-term'  && g.status === 'active');
  const shortTerm = goals.filter(g => g.category === 'short-term' && g.status === 'active');

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const progress = pct(goal.currentAmount, goal.targetAmount);
    return (
      <Card className="glass">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate">{goal.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Target: {fmt(goal.targetAmount)}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" aria-label="Edit goal"><Edit className="h-3 w-3" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(goal.id)} aria-label="Delete goal"><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold tabular-nums text-foreground">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>{fmt(goal.currentAmount)}</span>
              <span>{fmt(goal.targetAmount - goal.currentAmount)} to go</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const Section = ({ title, items, badge }: { title: string; items: Goal[]; badge: string }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
        <Badge variant="outline" className="text-[10px] h-4 px-1.5">{badge}</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((g, i) => (
          <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GoalCard goal={g} />
          </motion.div>
        ))}
        {items.length === 0 && <p className="text-xs text-muted-foreground col-span-2 py-2">No {title.toLowerCase()} goals yet.</p>}
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

      <EmergencyFundAdvisor />

      {/* Add Form */}
      {isAdding && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass border-primary/20">
            <CardContent className="p-4 space-y-3">
              <h2 className="text-sm font-semibold">New Goal</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-muted-foreground">Goal Name</label>
                  <Input value={newGoal.name} onChange={e => setNewGoal(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Japan Trip" className="h-9 text-sm" />
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
                  <select value={newGoal.category} onChange={e => setNewGoal(p => ({ ...p, category: e.target.value as any }))} className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-ring">
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

      <Section title="Long-term Goals"  items={longTerm}  badge={`${longTerm.length}`}  />
      <Section title="Short-term Goals" items={shortTerm} badge={`${shortTerm.length}`} />

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
