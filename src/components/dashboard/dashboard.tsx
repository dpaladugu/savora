
import React from 'react';
import { DashboardCharts } from './dashboard-charts';
import { QuickActions } from './quick-actions';
import { MetricSection } from './metric-section';
import { NavigationTab } from '@/types/common';
import { useDashboardData } from '@/hooks/use-dashboard-data';

export interface DashboardProps {
  onTabChange: (tab: NavigationTab) => void;
  onMoreNavigation: (moduleId: string) => void;
}

export function Dashboard({ onTabChange, onMoreNavigation }: DashboardProps) {
  const { data: dashboardData, loading } = useDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      
      <MetricSection 
        title="Financial Overview"
        metrics={[
          {
            title: 'Total Assets',
            value: dashboardData?.totalInvestments || 0,
            icon: 'TrendingUp',
            change: '+5.2%'
          },
          {
            title: 'Monthly Expenses',
            value: dashboardData?.monthlyExpenses || 0,
            icon: 'CreditCard',
            change: '-2.1%'
          },
          {
            title: 'Savings Rate',
            value: `${dashboardData?.savingsRate || 0}%`,
            icon: 'PiggyBank',
            change: '+1.8%'
          }
        ]}
      />
      <DashboardCharts data={dashboardData} loading={loading} />
      <QuickActions onTabChange={onTabChange} onMoreNavigation={onMoreNavigation} />
    </div>
  );
}
