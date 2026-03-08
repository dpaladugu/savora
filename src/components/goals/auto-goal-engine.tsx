import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Zap, Target, Plus, CheckCircle2, AlertTriangle,
  Car, Heart, Shield, Coins, BookOpen, Home, Gift, Landmark
} from 'lucide-react';
import type { Goal } from '@/lib/db';

// ── Types ─────────────────────────────────────────────────────────────────────
interface NudgeRule {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  targetAmount: number;
  horizonMonths: number;
  priority: 'high' | 'medium' | 'low';
  trigger: string;
}

// ── 14 Auto-Goal Trigger Rules (§24.1) ───────────────────────────────────────
const NUDGE_RULES: NudgeRule[] = [
  {
    id:            'vehicle-insurance-renewal',
    title:         'Vehicle Insurance Renewal',
    description:   'Annual insurance renewal corpus for FZS + Shine + CBR250R',
    category:      'Vehicle',
    icon:          Car,
    targetAmount:  35000,
    horizonMonths: 12,
    priority:      'high',
    trigger:       'Vehicle insurance expiry within 60 days',
  },
  {
    id:            'tyre-replacement',
    title:         'Tyre Replacement Fund',
    description:   'Set aside for tyre replacement at 40,000 km',
    category:      'Vehicle',
    icon:          Car,
    targetAmount:  15000,
    horizonMonths: 18,
    priority:      'medium',
    trigger:       'Odometer > 35,000 km',
  },
  {
    id:            'child-education',
    title:         'Child Education Corpus',
    description:   'UG education goal with 7% inflation',
    category:      'Education',
    icon:          BookOpen,
    targetAmount:  2500000,
    horizonMonths: 180,
    priority:      'high',
    trigger:       'Age < 5 or no education goal found',
  },
  {
    id:            'senior-medical-corpus',
    title:         'Senior Medical Corpus',
    description:   'Mother & Grandma medical emergency buffer',
    category:      'Health',
    icon:          Heart,
    targetAmount:  300000,
    horizonMonths: 36,
    priority:      'high',
    trigger:       'Family members aged 60+',
  },
  {
    id:            'nps-annual',
    title:         'NPS Annual Contribution',
    description:   '80CCD(1B) ₹50,000 annual NPS Tier-1 goal',
    category:      'Retirement',
    icon:          Landmark,
    targetAmount:  50000,
    horizonMonths: 12,
    priority:      'high',
    trigger:       'NPS contribution < ₹50,000 in current FY',
  },
  {
    id:            'ppf-annual',
    title:         'PPF Annual Contribution',
    description:   'Max out 80C PPF limit — ₹1.5L per year',
    category:      'Tax Saving',
    icon:          Landmark,
    targetAmount:  150000,
    horizonMonths: 12,
    priority:      'high',
    trigger:       'PPF contribution < ₹1,50,000 in current FY',
  },
  {
    id:            'property-tax',
    title:         'Property Tax Corpus',
    description:   'Guntur + Gorantla annual property tax reserve',
    category:      'Property',
    icon:          Home,
    targetAmount:  50000,
    horizonMonths: 12,
    priority:      'medium',
    trigger:       'Annual property tax due in March',
  },
  {
    id:            'water-tax',
    title:         'Water & Utility Tax',
    description:   'Bi-annual water tax for rental properties',
    category:      'Property',
    icon:          Home,
    targetAmount:  20000,
    horizonMonths: 6,
    priority:      'low',
    trigger:       'Water tax due in April & October',
  },
  {
    id:            'festival-corpus',
    title:         'Festivals & Occasions',
    description:   'Diwali, Ugadi, Dasara gifting + celebrations',
    category:      'Lifestyle',
    icon:          Gift,
    targetAmount:  60000,
    horizonMonths: 12,
    priority:      'medium',
    trigger:       'Festival season (Sep–Nov)',
  },
  {
    id:            'home-maintenance',
    title:         'Home Maintenance Fund',
    description:   'Annual repairs & maintenance for owned properties',
    category:      'Property',
    icon:          Home,
    targetAmount:  80000,
    horizonMonths: 12,
    priority:      'medium',
    trigger:       'Property maintenance inflation 6%/yr',
  },
  {
    id:            'health-insurance-renewal',
    title:         'Health Insurance Premium',
    description:   'Annual health insurance premium reserve',
    category:      'Insurance',
    icon:          Shield,
    targetAmount:  60000,
    horizonMonths: 12,
    priority:      'high',
    trigger:       'Health policy renewal within 30 days',
  },
  {
    id:            'term-insurance',
    title:         'Term Insurance Top-up',
    description:   'Ensure sum assured ≥ 10× annual income',
    category:      'Insurance',
    icon:          Shield,
    targetAmount:  25000,
    horizonMonths: 12,
    priority:      'high',
    trigger:       'Term cover < 10× income (CFA rule)',
  },
  {
    id:            'retirement-corpus',
    title:         'Retirement Corpus',
    description:   '25× annual expenses at 60 (FIRE formula)',
    category:      'Retirement',
    icon:          Landmark,
    targetAmount:  15000000,
    horizonMonths: 300,
    priority:      'high',
    trigger:       'No retirement goal found',
  },
  {
    id:            'gold-sgb',
    title:         'Sovereign Gold Bond',
    description:   '5–10% portfolio in gold — quarterly SGB window',
    category:      'Investment',
    icon:          Coins,
    targetAmount:  200000,
    horizonMonths: 24,
    priority:      'low',
    trigger:       'Gold allocation < 5% of portfolio',
  },
];

// ── Priority Stack (§24.2) ────────────────────────────────────────────────────
const PRIORITY_STACK = [
  { rank: 1, label: 'Emergency Fund (12 months)',     color: 'text-destructive' },
  { rank: 2, label: 'Insurance & Statutory Dues',     color: 'text-warning' },
  { rank: 3, label: 'Education & Retirement',         color: 'text-primary' },
  { rank: 4, label: 'Discretionary & Lifestyle',      color: 'text-muted-foreground' },
];

const catColors: Record<string, string> = {
  Vehicle:     'bg-primary/10 text-primary',
  Education:   'bg-accent/10 text-accent',
  Health:      'bg-destructive/10 text-destructive',
  Retirement:  'bg-warning/10 text-warning',
  'Tax Saving':'bg-success/10 text-success',
  Property:    'bg-warning/15 text-warning',
  Lifestyle:   'bg-primary/15 text-primary',
  Insurance:   'bg-accent/15 text-accent',
  Investment:  'bg-success/15 text-success',
};

export function AutoGoalEngine() {
  const [goals, setGoals]       = useState<Goal[]>([]);
  const [created, setCreated]   = useState<Set<string>>(new Set());
  const [loading, setLoading]   = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const g = await db.goals.toArray();
      setGoals(g);
      // Mark rules already converted to goals (by matching title prefix)
      const titles = new Set(g.map(x => x.name?.toLowerCase() ?? x.title?.toLowerCase() ?? ''));
      const matched = new Set(
        NUDGE_RULES.filter(r => titles.has(r.title.toLowerCase())).map(r => r.id)
      );
      setCreated(matched);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function createGoal(rule: NudgeRule) {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + rule.horizonMonths);
    await db.goals.add({
      id:            crypto.randomUUID(),
      name:          rule.title,
      title:         rule.title,
      targetAmount:  rule.targetAmount,
      currentAmount: 0,
      deadline:      targetDate,
      category:      rule.category,
      createdAt:     new Date(),
      updatedAt:     new Date(),
    } as any);
    setCreated(prev => new Set([...prev, rule.id]));
    toast.success(`Goal "${rule.title}" created`);
    load();
  }

  async function createAllHighPriority() {
    const pending = NUDGE_RULES.filter(r => r.priority === 'high' && !created.has(r.id));
    for (const r of pending) await createGoal(r);
    toast.success(`${pending.length} high-priority goals created`);
  }

  const notCreated = NUDGE_RULES.filter(r => !created.has(r.id));
  const highCount  = notCreated.filter(r => r.priority === 'high').length;

  if (loading) return <div className="p-6 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Auto-Goal Engine</h1>
          <p className="text-xs text-muted-foreground">14 CFA-aligned goal rules · §24.1 Nudge Engine</p>
        </div>
        {highCount > 0 && (
          <Button size="sm" className="gap-1.5" onClick={createAllHighPriority}>
            <Zap className="h-3.5 w-3.5" />
            Create {highCount} High-Priority
          </Button>
        )}
      </div>

      <Tabs defaultValue="nudges">
        <TabsList className="w-full">
          <TabsTrigger value="nudges"   className="flex-1 text-xs">Goal Nudges ({notCreated.length})</TabsTrigger>
          <TabsTrigger value="active"   className="flex-1 text-xs">Active Goals ({goals.length})</TabsTrigger>
          <TabsTrigger value="priority" className="flex-1 text-xs">Priority Stack</TabsTrigger>
        </TabsList>

        {/* ── Nudges Tab ───────────────────────────────────────── */}
        <TabsContent value="nudges" className="space-y-2 mt-3">
          {NUDGE_RULES.map(rule => {
            const done = created.has(rule.id);
            return (
              <Card key={rule.id} className={`border ${done ? 'border-success/30 bg-success/5' : 'border-border/60 bg-card/60'}`}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${catColors[rule.category] ?? 'bg-muted text-muted-foreground'}`}>
                    <rule.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{rule.title}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${rule.priority === 'high' ? 'border-destructive/50 text-destructive' : rule.priority === 'medium' ? 'border-warning/50 text-warning' : ''}`}
                      >
                        {rule.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{rule.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Trigger: {rule.trigger}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-xs font-bold text-foreground">₹{rule.targetAmount.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-muted-foreground">{rule.horizonMonths}m horizon</p>
                  </div>
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => createGoal(rule)}>
                      <Plus className="h-3 w-3 mr-1" />Add
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ── Active Goals Tab ─────────────────────────────────── */}
        <TabsContent value="active" className="space-y-2 mt-3">
          {goals.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No goals yet. Use nudges above to create your first goal.
              </CardContent>
            </Card>
          ) : (
            goals.map(goal => {
              const current = goal.currentAmount ?? 0;
              const target  = goal.targetAmount ?? 1;
              const pct     = Math.min(100, Math.round((current / target) * 100));
              return (
                <Card key={goal.id} className="border-border/60">
                  <CardContent className="py-3 px-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{goal.name ?? goal.title}</p>
                      <p className="text-xs font-bold text-primary">{pct}%</p>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>₹{current.toLocaleString('en-IN')} saved</span>
                      <span>Target: ₹{target.toLocaleString('en-IN')}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ── Priority Stack Tab ───────────────────────────────── */}
        <TabsContent value="priority" className="space-y-3 mt-3">
          <p className="text-xs text-muted-foreground px-1">§24.2 Funding Priority Stack — allocate surplus in this order:</p>
          {PRIORITY_STACK.map(p => (
            <Card key={p.rank} className="border-border/60">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-bold text-primary">#{p.rank}</span>
                </div>
                <p className={`text-sm font-semibold ${p.color}`}>{p.label}</p>
              </CardContent>
            </Card>
          ))}
          <Card className="border-primary/20 bg-primary/5 mt-2">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted-foreground">
                Monthly surplus should flow down this stack — only fund lower-priority buckets once higher ones are fully funded or on track.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
