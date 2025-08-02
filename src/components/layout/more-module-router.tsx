
import { Dashboard } from "@/components/dashboard/dashboard";
import { InvestmentsTracker } from "@/components/investments/investments-tracker";
import { EnhancedEmergencyFundCalculator } from "@/components/goals/enhanced-emergency-fund-calculator";
import { RentalTracker } from "@/components/rentals/rental-tracker";
import { CreditCardStatements } from "@/components/credit-cards/credit-card-statements";
import { CreditCardFlowTracker } from "@/components/credit-cards/credit-card-flow-tracker";
import { RecommendationsEngine } from "@/components/recommendations/recommendations-engine";
import { CashflowAnalysis } from "@/components/cashflow/cashflow-analysis";
import { TelegramIntegration } from "@/components/telegram/telegram-integration";
import { RecurringTransactionsPage } from "@/components/recurring-transactions/recurring-transactions-page";
import { VehicleManager } from "@/components/vehicles/VehicleManager";
import { ModuleHeader } from "./module-header";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Logger } from "@/services/logger";

interface MoreModuleRouterProps {
  activeModule: string;
  onBack?: () => void;
}

export function MoreModuleRouter({ activeModule, onBack }: MoreModuleRouterProps) {
  Logger.debug('MoreModuleRouter render', { activeModule });

  const getModuleConfig = (moduleId: string) => {
    const configs = {
      "investments": { title: "Investments", subtitle: "Track stocks, mutual funds & more", showHeader: true },
      "emergency-fund": { title: "Emergency Fund", subtitle: "Calculate and track your emergency corpus", showHeader: true },
      "rentals": { title: "Rental Properties", subtitle: "Manage rental income & tenants", showHeader: true },
      "credit-cards": { title: "Credit Cards", subtitle: "Manage credit cards & limits", showHeader: true },
      "credit-card-statements": { title: "Credit Card Statements", subtitle: "View and analyze statements", showHeader: true },
      "recommendations": { title: "Smart Tips", subtitle: "Personalized financial recommendations", showHeader: true },
      "cashflow": { title: "Cashflow Analysis", subtitle: "Income vs expense analysis", showHeader: true },
      "telegram": { title: "Telegram Bot", subtitle: "Connect Telegram for quick updates", showHeader: true },
      "recurring-transactions": { title: "Recurring Transactions", subtitle: "Manage automated income and expenses", showHeader: true },
      "vehicles": { title: "Vehicle Management", subtitle: "Track vehicle details and related expenses", showHeader: true }
    };
    return configs[moduleId] || { title: "Module", subtitle: "", showHeader: true };
  };

  const config = getModuleConfig(activeModule);

  const renderModuleContent = () => {
    try {
      switch (activeModule) {
        case "investments":
          return <InvestmentsTracker />;
        case "emergency-fund":
          return <EnhancedEmergencyFundCalculator />;
        case "rentals":
          return <RentalTracker />;
        case "credit-cards":
          return <CreditCardFlowTracker />;
        case "credit-card-statements":
          return <CreditCardStatements />;
        case "recommendations":
          return <RecommendationsEngine />;
        case "cashflow":
          return <CashflowAnalysis />;
        case "telegram":
          return <TelegramIntegration />;
        case "recurring-transactions":
          return <RecurringTransactionsPage />;
        case "vehicles":
          return <VehicleManager />;
        default:
          Logger.debug('Unknown module, rendering dashboard', { activeModule });
          return <Dashboard onTabChange={() => {}} onMoreNavigation={() => {}} />;
      }
    } catch (error) {
      Logger.error('Error rendering module content', { activeModule, error });
      throw error; // Let ErrorBoundary handle it
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
        <ModuleHeader 
          title={config.title}
          subtitle={config.subtitle}
          onBack={onBack}
          showBackButton={!!onBack}
          showHeader={config.showHeader}
          showThemeToggle={true}
        />
        <div className="px-4 py-4">
          {renderModuleContent()}
        </div>
      </div>
    </ErrorBoundary>
  );
}
