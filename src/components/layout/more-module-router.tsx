
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
import { SubscriptionTracker } from '@/components/subscriptions/subscription-tracker';
import { FamilyBankManager } from '@/components/family/family-bank-manager';
import { EmergencyFundDashboard } from '@/components/emergency-fund/emergency-fund-dashboard';
import { CFARecommendationsDashboard } from '@/components/recommendations/cfa-recommendations-dashboard';
import { RecommendationsEngine } from '@/components/recommendations/recommendations-engine';
import { ComprehensiveSettingsScreen } from '@/components/settings/comprehensive-settings-screen';
import { CreditCardModule } from '@/components/credit-cards/credit-card-module';

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
        return <SubscriptionTracker />;
      case 'family-banking':
        return <FamilyBankManager />;
      case 'emergency-fund':
        return <EmergencyFundDashboard />;
      case 'cfa-recommendations':
        return <CFARecommendationsDashboard />;
      case 'recommendations':
        return <RecommendationsEngine />;
      case 'settings':
        return <ComprehensiveSettingsScreen />;
      case 'credit-cards':
        return <CreditCardModule />;
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
