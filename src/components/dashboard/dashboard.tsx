
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardCharts } from './dashboard-charts';
import { QuickActions } from './quick-actions';
import { MetricSection } from './metric-section';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import type { MetricCardProps } from '@/types/dashboard';

interface DashboardProps {
  onTabChange: (tab: string) => void;
  onMoreNavigation: (moduleId: string) => void;
}

export function Dashboard({ onTabChange, onMoreNavigation }: DashboardProps) {
  const { dashboardData, loading, error } = useDashboardData();

  const metrics: MetricCardProps[] = [
    {
      title: 'Total Balance',
      value: '₹2,45,678',
      change: '+12.5%',
      icon: DollarSign,
      trend: { value: 12.5, isPositive: true }
    },
    {
      title: 'Monthly Expenses',
      value: `₹${dashboardData.monthlyExpenses.toLocaleString()}`,
      change: '-5.2%',
      icon: TrendingDown,
      trend: { value: 5.2, isPositive: false }
    },
    {
      title: 'Investments',
      value: `₹${dashboardData.totalInvestments.toLocaleString()}`,
      change: '+8.3%',
      icon: TrendingUp,
      trend: { value: 8.3, isPositive: true }
    },
    {
      title: 'Credit Cards',
      value: `₹${dashboardData.creditCardDebt.toLocaleString()}`,
      change: '+2.1%',
      icon: CreditCard,
      trend: { value: 2.1, isPositive: true }
    }
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-destructive">
          Error loading dashboard: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <QuickActions onTabChange={onTabChange} onMoreNavigation={onMoreNavigation} />
      </div>

      <MetricSection title="Financial Overview" metrics={metrics} />

      <div className="grid gap-6 md:grid-cols-2">
        <DashboardCharts 
          data={dashboardData}
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {dashboardData.recentTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.category}</p>
                    </div>
                    <p className="font-semibold">₹{transaction.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent transactions</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
