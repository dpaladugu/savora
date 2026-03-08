
import React from 'react';
import { GoldTracker } from '@/components/gold/gold-tracker';
import { LoanManager } from '@/components/loans/loan-manager';
import { InsuranceTracker } from '@/components/insurance/insurance-tracker';
import { VehicleManager } from '@/components/vehicles/VehicleManager';
import { VehicleFleetWatchdog } from '@/components/vehicles/vehicle-fleet-watchdog';
import { EnhancedRentalManager } from '@/components/rentals/enhanced-rental-manager';
import { PropertyRentalEngine } from '@/components/rentals/property-rental-engine';
import { FamilyFinancialDashboard } from '@/components/family/family-financial-dashboard';
import { BrotherGlobalLiability } from '@/components/family/brother-global-liability';
import { EnhancedAutoGoalDashboard } from '@/components/goals/enhanced-auto-goal-dashboard';
import { AutoGoalEngine } from '@/components/goals/auto-goal-engine';
import { HealthTracker } from '@/components/health/health-tracker';
import { SubscriptionManager } from '@/components/subscriptions/subscription-manager';
import { SubscriptionTracker } from '@/components/subscriptions/subscription-tracker';
import { FamilyBankManager } from '@/components/family/family-bank-manager';
import { FamilyBankingManager } from '@/components/family/family-banking-manager';
import { BrotherRepaymentTracker } from '@/components/family/brother-repayment-tracker';
import { InsuranceManager } from '@/components/insurance/insurance-manager';
import { SpendingLimits } from '@/components/spending/spending-limits';
import { EmergencyFundDashboard } from '@/components/emergency-fund/emergency-fund-dashboard';
import { CFARecommendationsDashboard } from '@/components/recommendations/cfa-recommendations-dashboard';
import { RecommendationsEngine } from '@/components/recommendations/recommendations-engine';
import { ComprehensiveSettingsScreen } from '@/components/settings/comprehensive-settings-screen';
import { CreditCardModule } from '@/components/credit-cards/credit-card-module';
import { WillEstateManager } from '@/components/estate/will-estate-manager';
import { TaxEngine } from '@/components/tax/tax-engine';
import { LLMAdvisor } from '@/components/ai/llm-advisor';
import { AuditLogViewer } from '@/components/audit/audit-log-viewer';
import { InsuranceGapAnalysis } from '@/components/insurance/insurance-gap-analysis';
import { useRole } from '@/store/rbacStore';

export interface MoreModuleRouterProps {
  activeModule: string;
}

export function MoreModuleRouter({ activeModule }: MoreModuleRouterProps) {
  const role = useRole();

  const renderModule = () => {
    switch (activeModule) {
      case 'gold':
        return <GoldTracker />;
      case 'loans':
        return <LoanManager />;
      case 'insurance':
        return <InsuranceTracker />;
      case 'vehicles':
        return <VehicleFleetWatchdog />;
      case 'vehicle-manager':
        return <VehicleManager />;
      case 'enhanced-rentals':
        return <EnhancedRentalManager />;
      case 'property-engine':
        return <PropertyRentalEngine />;
      case 'family-dashboard':
        return <FamilyFinancialDashboard />;
      case 'brother-global':
        if (role !== 'BROTHER' && role !== 'ADMIN') return <div className="p-4 text-muted-foreground">Access restricted</div>;
        return <BrotherGlobalLiability />;
      case 'smart-goals':
        return <EnhancedAutoGoalDashboard />;
      case 'auto-goals':
        return <AutoGoalEngine />;
      case 'health-tracker':
        return <HealthTracker />;
      case 'subscriptions':
        return <SubscriptionTracker />;
      case 'family-banking':
        return <FamilyBankManager />;
      case 'family-banking-v2':
        return <FamilyBankingManager />;
      case 'brother-repayment':
        return <BrotherRepaymentTracker />;
      case 'insurance-manager':
        return <InsuranceManager />;
      case 'spending-limits':
        return <SpendingLimits />;
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
      case 'will-estate':
        return <WillEstateManager />;
      case 'tax-engine':
        return <TaxEngine />;
      case 'ai-advisor':
        return <LLMAdvisor />;
      case 'audit-log':
        if (role !== 'ADMIN') return <div className="p-4 text-muted-foreground">Access restricted to ADMIN</div>;
        return <AuditLogViewer />;
      case 'insurance-gap':
        return <InsuranceGapAnalysis />;
      default:
        return <div className="p-4 text-muted-foreground">Module not found</div>;
    }
  };

  return (
    <div className="h-full">
      {renderModule()}
    </div>
  );
}

