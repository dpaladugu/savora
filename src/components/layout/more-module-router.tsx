import React from 'react';
import { GoldTracker } from '@/components/gold/gold-tracker';
import { LoanManager } from '@/components/loans/loan-manager';
import { InsuranceTracker } from '@/components/insurance/insurance-tracker';
import { VehicleManager } from '@/components/vehicles/VehicleManager';
import { MoreModuleRouterProps } from '@/components/more/more-screen';
import { EnhancedRentalManager } from '@/components/rentals/enhanced-rental-manager';
import { FamilyFinancialDashboard } from '@/components/family/family-financial-dashboard';
import { EnhancedAutoGoalDashboard } from '@/components/goals/enhanced-auto-goal-dashboard';

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
