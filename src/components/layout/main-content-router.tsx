

import React from 'react';
import { Dashboard } from '@/components/dashboard/dashboard';
import { ExpenseTracker } from '@/components/expenses/expense-tracker';
import { CreditCardTracker } from '@/components/credit-cards/credit-card-tracker';
import { InvestmentsTracker } from '@/components/investments/investments-tracker';
import { IncomeTracker } from '@/components/income/income-tracker';
import { GoalsManager } from '@/components/goals/goals-manager';
import { SettingsScreen } from '@/components/settings/settings-screen';
import { MoreModuleRouter } from '@/components/layout/more-module-router';
import { NavigationTab, MoreModule } from '@/types/common';

export interface MainContentRouterProps {
  activeTab: NavigationTab;
  activeMoreModule: MoreModule;
  onTabChange: (tab: NavigationTab) => void;
  onMoreNavigation: (moduleId: string) => void;
}

export function MainContentRouter({
  activeTab,
  activeMoreModule,
  onTabChange,
  onMoreNavigation,
}: MainContentRouterProps) {
  // Sub-module active → render it
  if (
    activeMoreModule &&
    activeTab !== 'dashboard' &&
    activeTab !== 'expenses' &&
    activeTab !== 'credit-cards' &&
    activeTab !== 'investments'
  ) {
    return <MoreModuleRouter activeModule={activeMoreModule} />;
  }

  switch (activeTab) {
    case 'dashboard':
      return <Dashboard onTabChange={onTabChange} onMoreNavigation={onMoreNavigation} />;
    case 'expenses':
      return <ExpenseTracker />;
    case 'credit-cards':
      return <CreditCardTracker />;
    case 'investments':
      return <InvestmentsTracker />;
    case 'goals':
      return <GoalsManager />;
    case 'settings':
      return <SettingsScreen />;
    default:
      if (activeMoreModule) return <MoreModuleRouter activeModule={activeMoreModule} />;
      return <Dashboard onTabChange={onTabChange} onMoreNavigation={onMoreNavigation} />;
  }
}
