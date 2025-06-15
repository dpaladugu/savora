
import { Dashboard } from "@/components/dashboard/dashboard";
import { InvestmentsTracker } from "@/components/investments/investments-tracker";
import { EmergencyFundCalculator } from "@/components/goals/emergency-fund-calculator";
import { RentalTracker } from "@/components/rentals/rental-tracker";
import { CreditCardStatements } from "@/components/credit-cards/credit-card-statements";
import { CreditCardFlowTracker } from "@/components/credit-cards/credit-card-flow-tracker";
import { RecommendationsEngine } from "@/components/recommendations/recommendations-engine";
import { CashflowAnalysis } from "@/components/cashflow/cashflow-analysis";
import { TelegramIntegration } from "@/components/telegram/telegram-integration";

interface MoreModuleRouterProps {
  activeModule: string;
}

export function MoreModuleRouter({ activeModule }: MoreModuleRouterProps) {
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
}
