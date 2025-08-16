
import React from 'react';
import { GoldTracker } from '@/components/gold/gold-tracker';
import { LoanManager } from '@/components/loans/loan-manager';
import { InsuranceTracker } from '@/components/insurance/insurance-tracker';
import { VehicleManager } from '@/components/vehicles/VehicleManager';
import { EnhancedRentalManager } from '@/components/rentals/enhanced-rental-manager';
import { FamilyFinancialDashboard } from '@/components/family/family-financial-dashboard';
import { EnhancedAutoGoalDashboard } from '@/components/goals/enhanced-auto-goal-dashboard';
import { HealthTracker } from '@/components/health/health-tracker';
import { SubscriptionManager } from '@/components/subscriptions/subscription-manager';
import { FamilyBankManager } from '@/components/family/family-bank-manager';

export interface MoreModuleRouterProps {
  activeModule: string;
}

export function MoreModuleRouter({ activeModule }: MoreModuleRouterProps) {
  const renderModule = () => {
    switch (activeModule) {
      case 'gold':
        return <GoldTracker />;
      case 'loans':
        return <LoanManager />;
      case 'insurance':
        return <InsuranceTracker />;
      case 'vehicles':
        return <VehicleManager />;
      case 'enhanced-rentals':
        return <EnhancedRentalManager />;
      case 'family-dashboard':
        return <FamilyFinancialDashboard />;
      case 'smart-goals':
        return <EnhancedAutoGoalDashboard />;
      case 'health-tracker':
        return <HealthTracker />;
      case 'subscriptions':
        return <SubscriptionManager />;
      case 'family-banking':
        return <FamilyBankManager />;
      default:
        return <div>Module not found</div>;
    }
  };

  return (
    <div className="h-full">
      {renderModule()}
    </div>
  );
}
