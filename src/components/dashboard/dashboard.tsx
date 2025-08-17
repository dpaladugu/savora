
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardCharts } from './dashboard-charts';
import { QuickActions } from './quick-actions';
import { MetricSection } from './metric-section';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import type { MetricCardProps, DashboardData } from '@/types/dashboard';

interface DashboardProps {
  onTabChange: (tab: string) => void;
  onMoreNavigation: (moduleId: string) => void;
}

export function Dashboard({ onTabChange, onMoreNavigation }: DashboardProps) {
  const dashboardData = useDashboardData();

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
      value: '₹45,230',
      change: '-5.2%',
      icon: TrendingDown,
      trend: { value: 5.2, isPositive: false }
    },
    {
      title: 'Investments',
      value: '₹1,85,450',
      change: '+8.3%',
      icon: TrendingUp,
      trend: { value: 8.3, isPositive: true }
    },
    {
      title: 'Credit Cards',
      value: '₹12,340',
      change: '+2.1%',
      icon: CreditCard,
      trend: { value: 2.1, isPositive: true }
    }
  ];

  // Create proper DashboardData structure
  const fullDashboardData: DashboardData = {
    totalExpenses: 45230,
    monthlyExpenses: 45230,
    totalInvestments: 185450,
    expenseCount: dashboardData.expenses.length,
    investmentCount: 5,
    emergencyFundTarget: 600000,
    emergencyFundCurrent: 300000,
    monthlyIncome: 75000,
    savingsRate: 40,
    investmentValue: 185450,
    creditCardDebt: 12340,
    emergencyFund: 300000,
    goals: [],
    recentTransactions: [],
    categoryBreakdown: []
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <QuickActions onTabChange={onTabChange} onMoreNavigation={onMoreNavigation} />
      </div>

      <MetricSection metrics={metrics} />

      <div className="grid gap-6 md:grid-cols-2">
        <DashboardCharts 
          data={dashboardData.expenses} 
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.loading ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
              </div>
            ) : dashboardData.expenses.length > 0 ? (
              <div className="space-y-2">
                {dashboardData.expenses.slice(0, 5).map((expense: any) => (
                  <div key={expense.id} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">{expense.category}</p>
                    </div>
                    <p className="font-semibold">₹{expense.amount.toLocaleString()}</p>
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
