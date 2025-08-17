
import React from 'react';
import { DashboardCharts } from './dashboard-charts';
import { QuickActions } from './quick-actions';
import { MetricSection } from './metric-section';
import { NavigationTab } from '@/types/common';

export interface DashboardProps {
  onTabChange: (tab: NavigationTab) => void;
  onMoreNavigation: (moduleId: string) => void;
}

export function Dashboard({ onTabChange, onMoreNavigation }: DashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      
      <MetricSection />
      <DashboardCharts />
      <QuickActions onTabChange={onTabChange} onMoreNavigation={onMoreNavigation} />
    </div>
  );
}
