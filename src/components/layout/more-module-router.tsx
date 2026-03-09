
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
import { FinancialHealthAudit } from '@/components/audit/financial-health-audit';
import { InsuranceGapAnalysis } from '@/components/insurance/insurance-gap-analysis';
import { BudgetVsActual } from '@/components/budget/budget-vs-actual';
import { CSVImportFlow } from '@/components/imports/csv-import-flow';
import { RecurringTransactionsPage } from '@/components/recurring-transactions/recurring-transactions-page';
import { DebtStrikeCalculator } from '@/components/debt/debt-strike-calculator';
import { NetWorthTracker } from '@/components/networth/net-worth-tracker';
import { SIPPlanner } from '@/components/goals/sip-planner';
import { CashflowAnalysis } from '@/components/cashflow/cashflow-analysis';
import { TelegramPendingTxns } from '@/components/telegram/telegram-pending-txns';
import { useRole } from '@/store/rbacStore';
import { Shield } from 'lucide-react';

export interface MoreModuleRouterProps {
  activeModule: string;
  onMoreNavigation?: (moduleId: string) => void;
}

// ── Access-denied placeholder ────────────────────────────────────────────────
function AccessDenied({ reason }: { reason: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center p-6">
      <Shield className="h-10 w-10 text-muted-foreground/40" />
      <p className="font-semibold text-foreground">Access Restricted</p>
      <p className="text-sm text-muted-foreground">{reason}</p>
    </div>
  );
}

export function MoreModuleRouter({ activeModule, onMoreNavigation }: MoreModuleRouterProps) {
  const role = useRole();

  // Scroll to top whenever module changes
  React.useEffect(() => {
    const main = document.getElementById('main-content');
    if (main) main.scrollTop = 0;
  }, [activeModule]);

  const renderModule = () => {
    // ── BROTHER restrictions: only sees Guntur waterfall, Family funds, InCred loan, US Sandbox ──
    const brotherAllowed = ['property-engine', 'family-dashboard', 'family-banking', 'family-banking-v2', 'brother-global', 'brother-repayment', 'loans'];
    if (role === 'BROTHER' && !brotherAllowed.includes(activeModule)) {
      return <AccessDenied reason="This module is not accessible to your role. You can view: Guntur Rentals, Family Funds, Loans & Repayments." />;
    }

    // ── SPOUSE restrictions: rentals + health + goals + budget — masks salary/investments ──
    const spouseBlocked = ['audit-log', 'brother-global', 'ai-advisor'];
    if (role === 'SPOUSE' && spouseBlocked.includes(activeModule)) {
      return <AccessDenied reason="This module is restricted for your role." />;
    }

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
        if (role !== 'BROTHER' && role !== 'ADMIN') return <AccessDenied reason="Only ADMIN and BROTHER can view this module." />;
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
        if (role !== 'ADMIN') return <AccessDenied reason="Will & Estate is restricted to ADMIN only." />;
        return <WillEstateManager />;
      case 'tax-engine':
        return <TaxEngine />;
      case 'ai-advisor':
        return <LLMAdvisor />;
      case 'financial-health-audit':
        return <FinancialHealthAudit onMoreNavigation={onMoreNavigation} />;
      case 'audit-log':
        if (role !== 'ADMIN') return <AccessDenied reason="Audit Log is restricted to ADMIN only." />;
        return <AuditLogViewer />;
      case 'insurance-gap':
        return <InsuranceGapAnalysis />;
      case 'budget-vs-actual':
        return <BudgetVsActual />;
      case 'csv-import':
        return <CSVImportFlow />;
      case 'recurring-transactions':
        return <RecurringTransactionsPage />;
      case 'debt-strike':
        if (role === 'GUEST') return <AccessDenied reason="Sign in to view Debt Strike calculator." />;
        return <DebtStrikeCalculator />;
      case 'net-worth':
        if (role === 'GUEST') return <AccessDenied reason="Sign in to view Net Worth." />;
        return <NetWorthTracker />;
      case 'sip-planner':
        return <SIPPlanner />;
      case 'cashflow':
        return React.createElement(React.lazy(() => import('@/components/cashflow/cashflow-analysis').then(m => ({ default: m.CashflowAnalysis }))));
      case 'telegram-pending':
        if (role !== 'ADMIN') return <AccessDenied reason="Only ADMIN can review pending Telegram transactions." />;
        return <TelegramPendingTxns />;
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


