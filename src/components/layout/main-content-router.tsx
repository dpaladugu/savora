
import React from 'react';
import { Dashboard } from '@/components/dashboard/dashboard';
import { ExpenseTracker } from '@/components/expenses/expense-tracker';
import { CreditCardTracker } from '@/components/credit-cards/credit-card-tracker';
import { InvestmentsTracker } from '@/components/investments/investments-tracker';
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
  // If a More sub-module is active, render it full-screen with its own scroll
  if (activeMoreModule && activeTab !== 'dashboard' && activeTab !== 'expenses' &&
      activeTab !== 'credit-cards' && activeTab !== 'investments') {
    return (
      <div className="min-h-[calc(100vh-7.5rem)] overflow-y-auto">
        <MoreModuleRouter activeModule={activeMoreModule} />
      </div>
    );
  }

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
      default:
        if (activeMoreModule) return <MoreModuleRouter activeModule={activeMoreModule} />;
        return <Dashboard onTabChange={onTabChange} onMoreNavigation={onMoreNavigation} />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-7.5rem)] overflow-y-auto">
      {renderContent()}
    </div>
  );
}
