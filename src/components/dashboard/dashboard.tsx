
import React from 'react';
import { DashboardCharts } from './dashboard-charts';
import { MetricSection } from './metric-section';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { TrendingUp, TrendingDown, Wallet, CreditCard, Plus, Target, Shield, Scale, AlertTriangle, PiggyBank, ChevronRight, BarChart3, Crosshair } from 'lucide-react';
import type { MetricCardProps } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRole, usePermissions } from '@/store/rbacStore';
import { MaskedValue } from '@/components/ui/masked-value';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { EmergencyFund } from '@/types/financial';



interface DashboardProps {
  onTabChange: (tab: string) => void;
  onMoreNavigation: (moduleId: string) => void;
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
function QuickActions({ onTabChange, onMoreNavigation }: { onTabChange: (t: string) => void; onMoreNavigation: (m: string) => void }) {
  const actions = [
    { icon: Plus,       label: 'Add Expense', onClick: () => onTabChange('expenses')                },
    { icon: CreditCard, label: 'Cards',        onClick: () => onTabChange('credit-cards')            },
    { icon: Target,     label: 'Goals',        onClick: () => onTabChange('goals')                   },
    { icon: TrendingUp, label: 'Invest',       onClick: () => onTabChange('investments')             },
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard({ onTabChange, onMoreNavigation }: DashboardProps) {
  const { dashboardData, loading } = useDashboardData();
  const role = useRole();
  const perms = usePermissions();
  const [hasWill, setHasWill] = useState<boolean | null>(null);
  const [ef, setEf] = useState<EmergencyFund | null>(null);
  const [userName, setUserName] = useState('Devavratha');

  useEffect(() => {
    db.willRows.count().then(c => setHasWill(c > 0)).catch(() => setHasWill(true));
    db.emergencyFunds.limit(1).first().then(r => setEf(r ?? null)).catch(() => {});
    db.globalSettings.limit(1).first()
      .then(s => { if (s?.userName) setUserName(s.userName); })
      .catch(() => {});
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

      {/* ── Quick Actions ── */}
      <QuickActions onTabChange={onTabChange} onMoreNavigation={onMoreNavigation} />


      {/* ── Metric Cards ── */}
      <MetricSection title="Financial Overview" metrics={metrics} />

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
