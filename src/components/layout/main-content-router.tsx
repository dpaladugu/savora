
import React from 'react';
import { Dashboard } from '@/components/dashboard/dashboard';
import { ExpenseTracker } from '@/components/expenses/expense-tracker';
import { CreditCardTracker } from '@/components/credit-cards/credit-card-tracker';
import { InvestmentsTracker } from '@/components/investments/investments-tracker';
import { GoalsManager } from '@/components/goals/goals-manager';
import { CsvUpload } from '@/components/csv/csv-upload';
import { SettingsScreen } from '@/components/settings/settings-screen';
import { MoreScreen } from '@/components/more/more-screen';
import { MoreModuleRouter } from '@/components/layout/more-module-router';
import { EmergencyFundCalculator } from '@/components/goals/emergency-fund-calculator';
import { RentalTracker } from '@/components/rentals/rental-tracker';
import { RecommendationsEngine } from '@/components/recommendations/recommendations-engine';
import { CashflowAnalysis } from '@/components/cashflow/cashflow-analysis';
import { TelegramIntegration } from '@/components/telegram/telegram-integration';
import { CreditCardManager } from '@/components/credit-cards/credit-card-manager';
import { CreditCardStatements } from '@/components/credit-cards/credit-card-statements';
import { RecurringTransactionsPage } from '@/components/recurring-transactions/recurring-transactions-page';
import { VehicleManager } from '@/components/vehicles/VehicleManager';
import { InsuranceTracker } from '@/components/insurance/insurance-tracker';
import type { NavigationTab, MoreModule } from './navigation-router';

interface MainContentRouterProps {
  activeTab: NavigationTab;
  activeMoreModule: MoreModule;
}

export function MainContentRouter({ activeTab, activeMoreModule }: MainContentRouterProps) {
  if (activeTab === 'more') {
    if (activeMoreModule) {
      switch (activeMoreModule) {
        case 'emergency-fund':
          return <EmergencyFundCalculator />;
        case 'rentals':
          return <RentalTracker />;
        case 'recommendations':
          return <RecommendationsEngine />;
        case 'cashflow':
          return <CashflowAnalysis />;
        case 'telegram':
          return <TelegramIntegration />;
        case 'credit-cards':
          return <CreditCardManager />;
        case 'credit-card-statements':
          return <CreditCardStatements />;
        case 'recurring-transactions':
          return <RecurringTransactionsPage />;
        case 'vehicles':
          return <VehicleManager />;
        case 'insurance':
          return <InsuranceTracker />;
        default:
          return <MoreScreen />;
      }
    }
    return <MoreScreen />;
  }

  switch (activeTab) {
    case 'dashboard':
      return <Dashboard />;
    case 'expenses':
      return <ExpenseTracker />;
    case 'credit-cards':
      return <CreditCardTracker />;
    case 'investments':
      return <InvestmentsTracker />;
    case 'goals':
      return <GoalsManager />;
    case 'upload':
      return <CsvUpload />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <Dashboard />;
  }
}
