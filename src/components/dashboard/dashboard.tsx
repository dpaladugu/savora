
import React from 'react';
import { DashboardCharts } from './dashboard-charts';
import { MetricSection } from './metric-section';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Plus, Target } from 'lucide-react';
import type { MetricCardProps } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DashboardProps {
  onTabChange: (tab: string) => void;
  onMoreNavigation: (moduleId: string) => void;
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
function QuickActions({
  onTabChange,
}: {
  onTabChange: (t: string) => void;
}) {
  const actions = [
    { icon: Plus,       label: 'Add Expense', onClick: () => onTabChange('expenses')     },
    { icon: CreditCard, label: 'Cards',        onClick: () => onTabChange('credit-cards') },
    { icon: Target,     label: 'Goals',        onClick: () => onTabChange('goals')        },
    { icon: TrendingUp, label: 'Invest',       onClick: () => onTabChange('investments')  },
  ];

  return (
    /*
      Equal-width grid on all screen sizes.
      Each button fills its column — no horizontal scroll, no overflow.
      iPhone SE (320px): 4 × ~68px = fine.
      S22 Ultra (412px): 4 × ~88px = comfortable.
    */
    <div className="grid grid-cols-4 gap-2.5" role="group" aria-label="Quick actions">
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
          <span className="text-[10px] font-medium text-foreground leading-none text-center px-1 break-words w-full text-center">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard({ onTabChange, onMoreNavigation }: DashboardProps) {
  const { dashboardData, loading } = useDashboardData();

  const metrics: MetricCardProps[] = [
    {
      title: 'Total Balance',
      value: '₹2,45,678',
      change: '+12.5%',
      icon: DollarSign,
      changeType: 'positive',
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: 'Monthly Exp.',
      value: `₹${dashboardData.monthlyExpenses.toLocaleString('en-IN')}`,
      change: '-5.2%',
      icon: TrendingDown,
      changeType: 'negative',
      trend: { value: 5.2, isPositive: false },
    },
    {
      title: 'Investments',
      value: `₹${dashboardData.totalInvestments.toLocaleString('en-IN')}`,
      change: '+8.3%',
      icon: TrendingUp,
      changeType: 'positive',
      trend: { value: 8.3, isPositive: true },
    },
    {
      title: 'Credit Cards',
      value: `₹${dashboardData.creditCardDebt.toLocaleString('en-IN')}`,
      change: '+2.1%',
      icon: CreditCard,
      changeType: 'neutral',
      trend: { value: 2.1, isPositive: false },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
        <div className="h-6 bg-muted rounded-xl w-1/3" />
        <div className="grid grid-cols-4 gap-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[72px] bg-muted rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Page title ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Welcome back, Prasad</p>
      </div>

      {/* ── Quick Actions ── */}
      <QuickActions onTabChange={onTabChange} />

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
