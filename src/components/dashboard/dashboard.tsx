
import React, { useState, useEffect } from 'react';
import { DashboardCharts } from './dashboard-charts';
import { MetricSection } from './metric-section';
import { MonthlySummaryCard } from './monthly-summary-card';
import { MonthlySummaryDrilldown } from './monthly-summary-drilldown';
import { GoalProgressRow } from './goal-progress-row';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { TrendingUp, TrendingDown, Wallet, CreditCard, Plus, Target, Shield, Scale, AlertTriangle, PiggyBank, ChevronRight, BarChart3, Crosshair, Banknote, MessageCircle, ListChecks, ChevronDown, CheckCircle2 } from 'lucide-react';
import type { MetricCardProps } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRole, usePermissions } from '@/store/rbacStore';
import { MaskedValue } from '@/components/ui/masked-value';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import type { EmergencyFund } from '@/types/financial';



interface DashboardProps {
  onTabChange: (tab: string) => void;
  onMoreNavigation: (moduleId: string) => void;
}

// ── Income Quick-Add Dialog ────────────────────────────────────────────────────
function IncomeQuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Salary');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      const now = new Date();
      await db.incomes.add({
        id: crypto.randomUUID(),
        amount: amt,
        category,
        description: description || category,
        date: now,
        createdAt: now,
        updatedAt: now,
      });
      toast.success(`₹${amt.toLocaleString('en-IN')} income recorded`);
      setAmount(''); setDescription(''); setCategory('Salary');
      onClose();
    } catch (e) {
      toast.error('Failed to save income');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Banknote className="h-4 w-4 text-success" />
            Quick Add Income
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Amount (₹)</Label>
            <Input
              type="number"
              placeholder="e.g. 85000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className="text-base font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['Salary', 'Freelance', 'Rental', 'Investment Returns', 'Business', 'Other'].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Input
              placeholder="e.g. March salary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 h-9" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 h-9" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Income'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
function QuickActions({ onTabChange, onMoreNavigation, onAddIncome }: { onTabChange: (t: string) => void; onMoreNavigation: (m: string) => void; onAddIncome: () => void }) {
  const actions = [
    { icon: Plus,       label: 'Add Expense', onClick: () => onTabChange('expenses')                },
    { icon: Banknote,   label: 'Add Income',  onClick: onAddIncome                                  },
    { icon: CreditCard, label: 'Cards',        onClick: () => onTabChange('credit-cards')            },
    { icon: Target,     label: 'Goals',        onClick: () => onTabChange('goals')                   },
    { icon: BarChart3,  label: 'Budget',       onClick: () => onMoreNavigation('budget-vs-actual')   },
    { icon: Crosshair,  label: 'Debt Strike',  onClick: () => onMoreNavigation('debt-strike')        },
  ];
  return (
    <div className="grid grid-cols-6 gap-2" role="group" aria-label="Quick actions">
      {actions.map(({ icon: Icon, label, onClick }) => (
        <button
          key={label}
          onClick={onClick}
          aria-label={label}
          className="
            flex flex-col items-center justify-center gap-1.5
            h-[72px] rounded-2xl
            bg-secondary/60 border border-border/50
            hover:bg-primary/8 hover:border-primary/30
            active:scale-95 transition-all duration-150
            focus-ring
          "
        >
          <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} aria-hidden="true" />
          <span className="text-[10px] font-medium text-foreground leading-none text-center px-1 w-full">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Role-aware metric value helper ────────────────────────────────────────────
function MetricValue({
  raw,
  permission,
}: {
  raw: string;
  permission?: 'showSalary' | 'showInvestments';
}) {
  return (
    <MaskedValue
      value={raw}
      permission={permission}
      placeholder="₹••••••"
      className="tabular-nums"
    />
  );
}

// ── Onboarding Checklist ──────────────────────────────────────────────────────
function OnboardingChecklist({
  incomeCount, onAddIncome, onTabChange, onMoreNavigation, ef
}: {
  incomeCount: number;
  onAddIncome: () => void;
  onTabChange: (t: string) => void;
  onMoreNavigation: (m: string) => void;
  ef: EmergencyFund | null;
}) {
  const [open, setOpen] = useState(true);
  const expenseCount = useLiveQuery(() => db.expenses.count().catch(() => 0), []) ?? 0;
  const creditCardCount = useLiveQuery(() => db.creditCards.count().catch(() => 0), []) ?? 0;

  const items = [
    { done: incomeCount > 0,     label: 'Record your salary',        action: onAddIncome,                            hint: 'So Monthly Surplus shows real data' },
    { done: expenseCount > 0,    label: 'Add your first expense',    action: () => onTabChange('expenses'),          hint: 'Start tracking where money goes' },
    { done: creditCardCount > 0, label: 'Add a credit card',         action: () => onTabChange('credit-cards'),      hint: 'Track due dates & balances' },
    { done: !!ef,                label: 'Set up Emergency Fund',     action: () => onMoreNavigation('emergency-fund'), hint: 'Build your 12-month safety net' },
  ];

  const doneCount = items.filter(i => i.done).length;
  const allDone   = doneCount === items.length;

  // Auto-hide once all tasks complete
  if (allDone) return null;

  return (
    <Card className={`border-primary/20 bg-primary/3 transition-all`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Setup Checklist</span>
          <span className="text-xs text-muted-foreground">({doneCount}/{items.length} done)</span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={(doneCount / items.length) * 100} className="w-16 h-1.5" />
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <CardContent className="pt-0 pb-4 px-4 space-y-1.5">
          {items.map(item => (
            <button
              key={item.label}
              onClick={item.done ? undefined : item.action}
              disabled={item.done}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                item.done
                  ? 'opacity-60 cursor-default'
                  : 'hover:bg-primary/8 hover:border-primary/20 border border-transparent cursor-pointer active:scale-[0.98]'
              }`}
            >
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${item.done ? 'text-success' : 'text-muted-foreground/40'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.label}</p>
                {!item.done && <p className="text-[10px] text-muted-foreground">{item.hint}</p>}
              </div>
              {!item.done && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
            </button>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard({ onTabChange, onMoreNavigation }: DashboardProps) {
  const { dashboardData, loading } = useDashboardData();
  const role = useRole();
  const perms = usePermissions();
  const [hasWill, setHasWill] = useState<boolean | null>(null);
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [showMonthDrilldown, setShowMonthDrilldown] = useState(false);

  // Reactive: updates instantly when settings change in Settings page
  const settings    = useLiveQuery(() => db.globalSettings.limit(1).first(), []);
  const userName    = settings?.userName || 'Devavratha';
  const ef          = useLiveQuery(() => db.emergencyFunds.limit(1).first(), []) ?? null;
  const incomeCount = useLiveQuery(() => (db as any).incomes?.count().catch(() => 0) ?? Promise.resolve(0), []) ?? 0;
  const pendingCount = useLiveQuery(
    () => role === 'ADMIN' ? (db as any).pendingTxns?.count().catch(() => 0) ?? Promise.resolve(0) : Promise.resolve(0),
    [role]
  ) ?? 0;

  useEffect(() => {
    db.willRows.count().then(c => setHasWill(c > 0)).catch(() => setHasWill(true));
  }, []);

  const efPct = ef && ef.targetAmount > 0
    ? Math.min(100, Math.round((ef.currentAmount / ef.targetAmount) * 100))
    : 0;



  // Build metric value strings (actual values — masking applied inside MetricValue)
  const balanceStr = `₹${Math.max(0, dashboardData.monthlyIncome - dashboardData.monthlyExpenses).toLocaleString('en-IN')}`;
  const expenseStr = `₹${dashboardData.monthlyExpenses.toLocaleString('en-IN')}`;
  const investStr  = `₹${dashboardData.totalInvestments.toLocaleString('en-IN')}`;
  const ccStr      = `₹${dashboardData.creditCardDebt.toLocaleString('en-IN')}`;

  const metrics: MetricCardProps[] = [
    {
      title: 'Monthly Surplus',
      value: (role === 'BROTHER') ? '🔒 Hidden' : balanceStr,
      change: dashboardData.savingsRate > 0 ? `${dashboardData.savingsRate.toFixed(1)}% saved` : (dashboardData.monthlyIncome === 0 ? 'Add income →' : '—'),
      icon: Wallet,
      changeType: 'positive',
      trend: { value: dashboardData.savingsRate, isPositive: true },
    },
    {
      title: 'Monthly Exp.',
      value: expenseStr,
      change: dashboardData.monthlyExpenses === 0 ? 'No expenses yet' : '—',
      icon: TrendingDown,
      changeType: 'negative',
      trend: { value: 0, isPositive: false },
    },
    {
      title: 'Investments',
      value: (role === 'BROTHER' || role === 'GUEST') ? '🔒 Hidden' : investStr,
      change: dashboardData.totalInvestments === 0 ? 'Add investments →' : '—',
      icon: TrendingUp,
      changeType: 'positive',
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Credit Cards',
      value: ccStr,
      change: dashboardData.creditCardDebt === 0 ? 'No balance' : '—',
      icon: CreditCard,
      changeType: 'neutral',
      trend: { value: 0, isPositive: false },
    },
  ];


  if (loading) {
    return (
      <div className="space-y-5 animate-pulse" aria-busy="true">
        <div className="h-6 bg-muted rounded-xl w-1/3" />
        <div className="grid grid-cols-4 gap-2.5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[72px] bg-muted rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Page title + role badge ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Welcome back, {userName}</p>
        </div>
        {role === 'GUEST' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border/50 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            Values masked
          </div>
        )}
      </div>

      {/* ── Will & Estate nudge (ADMIN only, no will entries) ── */}
      {role === 'ADMIN' && hasWill === false && (
        <button
          onClick={() => onMoreNavigation('will-estate')}
          className="w-full flex items-start gap-3 p-3.5 rounded-2xl border border-warning/40 bg-warning/5 hover:bg-warning/10 transition-colors text-left"
        >
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-warning">No will entries found</p>
            <p className="text-xs text-muted-foreground">Protect your family — add asset distribution &amp; digital legacy →</p>
          </div>
          <Scale className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      )}

      {/* ── Pending Telegram txns alert (ADMIN only) ── */}
      {role === 'ADMIN' && pendingCount > 0 && (
        <button
          onClick={() => onMoreNavigation('telegram-pending')}
          className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-primary/40 bg-primary/5 hover:bg-primary/10 active:scale-[0.98] transition-all text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 relative">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
              {pendingCount}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {pendingCount} pending Telegram {pendingCount === 1 ? 'transaction' : 'transactions'}
            </p>
            <p className="text-xs text-muted-foreground">Tap to review &amp; approve →</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        </button>
      )}

      {/* ── Salary nudge (show only when no income recorded yet) ── */}
      {role !== 'BROTHER' && role !== 'GUEST' && incomeCount === 0 && (
        <button
          onClick={() => setShowIncomeDialog(true)}
          className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-success/40 bg-success/5 hover:bg-success/10 active:scale-[0.98] transition-all text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/15">
            <Banknote className="h-4 w-4 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Record your salary</p>
            <p className="text-xs text-muted-foreground">Monthly Surplus shows ₹0 — add income to see real data →</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        </button>
      )}

      {/* ── Emergency Fund progress widget ── */}
      <button
        onClick={() => onMoreNavigation('emergency-fund')}
        className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/30 active:scale-[0.98] transition-all text-left"
        aria-label="Open Emergency Fund"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10">
          <PiggyBank className="h-5 w-5 text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-foreground">Emergency Fund</p>
            <span className={`text-xs font-bold tabular-nums ${efPct >= 100 ? 'text-success' : efPct >= 50 ? 'text-warning' : 'value-negative'}`}>
              {ef ? `${efPct}%` : 'Not set up'}
            </span>
          </div>
          <Progress value={efPct} className="h-1.5" />
          {ef && (
            <p className="text-[10px] text-muted-foreground mt-1">
              ₹{ef.currentAmount.toLocaleString('en-IN')} of ₹{ef.targetAmount.toLocaleString('en-IN')} · {ef.targetMonths}-month target
            </p>
          )}
          {!ef && (
            <p className="text-[10px] text-muted-foreground mt-1">Tap to build your safety net →</p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      </button>

      {/* ── Income Quick-Add Dialog ── */}
      <IncomeQuickAdd open={showIncomeDialog} onClose={() => setShowIncomeDialog(false)} />

      {/* ── Monthly Summary Drilldown ── */}
      <MonthlySummaryDrilldown open={showMonthDrilldown} onClose={() => setShowMonthDrilldown(false)} />

      {/* ── Onboarding Checklist (collapses once all items done) ── */}
      <OnboardingChecklist
        incomeCount={incomeCount}
        onAddIncome={() => setShowIncomeDialog(true)}
        onTabChange={onTabChange}
        onMoreNavigation={onMoreNavigation}
        ef={ef}
      />

      {/* ── Quick Actions ── */}
      <QuickActions onTabChange={onTabChange} onMoreNavigation={onMoreNavigation} onAddIncome={() => setShowIncomeDialog(true)} />

      {/* ── Monthly Summary — tappable for drill-down ── */}
      <MonthlySummaryCard onDrilldown={() => setShowMonthDrilldown(true)} />

      {/* ── Metric Cards ── */}
      <MetricSection title="Financial Overview" metrics={metrics} />

      {/* ── Goal Progress Row ── */}
      <GoalProgressRow onNavigate={onTabChange} />

      {/* ── Charts + Recent Activity ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCharts data={dashboardData} />

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recentTransactions.length > 0 ? (
              <ul className="space-y-2" aria-label="Recent transactions">
                {dashboardData.recentTransactions.slice(0, 5).map((t) => (
                  <li
                    key={t.id}
                    className="flex justify-between items-center py-2 border-b border-border/40 last:border-0"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{t.category}</p>
                    </div>
                    <p className="text-sm font-semibold shrink-0 value-negative tabular-nums">
                      ₹{t.amount.toLocaleString('en-IN')}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">No transactions yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-9 text-xs rounded-xl"
                  onClick={() => onTabChange('expenses')}
                >
                  Add your first expense
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
