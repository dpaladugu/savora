
import React from 'react';
import { Dashboard } from '@/components/dashboard/dashboard';
import { ExpenseTracker } from '@/components/expenses/expense-tracker';
import { CreditCardTracker } from '@/components/credit-cards/credit-card-tracker';
import { InvestmentsTracker } from '@/components/investments/investments-tracker';
import { GoalsManager } from '@/components/goals/goals-manager';
import { SettingsScreen } from '@/components/settings/settings-screen';
import { MoreScreen } from '@/components/more/more-screen';
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
  onMoreNavigation 
}: MainContentRouterProps) {
  const renderContent = () => {
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
      case 'more':
        return <MoreScreen />;
      default:
        return <Dashboard onTabChange={onTabChange} onMoreNavigation={onMoreNavigation} />;
    }
  };

  return (
    <div className="flex-1 p-4 overflow-auto">
      {renderContent()}
    </div>
  );
}
