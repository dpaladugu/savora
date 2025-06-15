
import { Dashboard } from "@/components/dashboard/dashboard";
import { InvestmentsTracker } from "@/components/investments/investments-tracker";
import { EmergencyFundCalculator } from "@/components/goals/emergency-fund-calculator";
import { RentalTracker } from "@/components/rentals/rental-tracker";
import { CreditCardStatements } from "@/components/credit-cards/credit-card-statements";
import { CreditCardFlowTracker } from "@/components/credit-cards/credit-card-flow-tracker";
import { RecommendationsEngine } from "@/components/recommendations/recommendations-engine";
import { CashflowAnalysis } from "@/components/cashflow/cashflow-analysis";
import { TelegramIntegration } from "@/components/telegram/telegram-integration";
import { ModuleHeader } from "./module-header";

interface MoreModuleRouterProps {
  activeModule: string;
  onBack?: () => void;
}

export function MoreModuleRouter({ activeModule, onBack }: MoreModuleRouterProps) {
  const getModuleConfig = (moduleId: string) => {
    const configs = {
      "investments": { title: "Investments", subtitle: "Track stocks, mutual funds & more" },
      "emergency-fund": { title: "Emergency Fund", subtitle: "Calculate and track your emergency corpus" },
      "rentals": { title: "Rental Properties", subtitle: "Manage rental income & tenants" },
      "credit-cards": { title: "Credit Cards", subtitle: "Manage credit cards & limits" },
      "credit-card-statements": { title: "Credit Card Statements", subtitle: "View and analyze statements" },
      "recommendations": { title: "Smart Tips", subtitle: "Personalized financial recommendations" },
      "cashflow": { title: "Cashflow Analysis", subtitle: "Income vs expense analysis" },
      "telegram": { title: "Telegram Bot", subtitle: "Connect Telegram for quick updates" }
    };
    return configs[moduleId] || { title: "Module", subtitle: "" };
  };

  const config = getModuleConfig(activeModule);

  const renderModuleContent = () => {
    switch (activeModule) {
      case "investments":
        return <InvestmentsTracker />;
      case "emergency-fund":
        return <EmergencyFundCalculator />;
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
      default:
        return <Dashboard onTabChange={() => {}} onMoreNavigation={() => {}} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
      <ModuleHeader 
        title={config.title}
        subtitle={config.subtitle}
        onBack={onBack}
        showBackButton={!!onBack}
      />
      <div className="px-4 py-4">
        {renderModuleContent()}
      </div>
    </div>
  );
}
