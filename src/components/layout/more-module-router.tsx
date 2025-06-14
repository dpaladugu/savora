
import { SuggestionsEngine } from "@/components/suggestions/suggestions-engine";
import { UpcomingPayments } from "@/components/reminders/upcoming-payments";
import { IncomeTracker } from "@/components/income/income-tracker";
import { CreditCardTracker } from "@/components/credit-cards/credit-card-tracker";
import { CreditCardStatements } from "@/components/credit-cards/credit-card-statements";
import { AccountManager } from "@/components/accounts/account-manager";
import { VehicleManager } from "@/components/vehicles/vehicle-manager";
import { InsuranceTracker } from "@/components/insurance/insurance-tracker";
import { RecurringGoals } from "@/components/goals/recurring-goals";
import { EmergencyFundCalculator } from "@/components/goals/emergency-fund-calculator";
import { GoldTracker } from "@/components/gold/gold-tracker";
import { RentalTracker } from "@/components/rentals/rental-tracker";

interface MoreModuleRouterProps {
  activeModule: string | null;
}

export function MoreModuleRouter({ activeModule }: MoreModuleRouterProps) {
  const moduleContent = (moduleId: string) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
      {renderModuleComponent(moduleId)}
    </div>
  );

  const renderModuleComponent = (moduleId: string) => {
    switch (moduleId) {
      case 'suggestions':
        return <SuggestionsEngine />;
      case 'reminders':
        return <UpcomingPayments />;
      case 'income':
        return <IncomeTracker />;
      case 'credit-cards':
        return <CreditCardStatements />;
      case 'accounts':
        return <AccountManager />;
      case 'vehicles':
        return <VehicleManager />;
      case 'insurance':
        return <InsuranceTracker />;
      case 'recurring-goals':
        return <RecurringGoals />;
      case 'emergency-fund':
        return <EmergencyFundCalculator />;
      case 'gold':
        return <GoldTracker />;
      case 'rentals':
        return <RentalTracker />;
      default:
        return (
          <div className="pt-16 px-4">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">Coming Soon</h2>
              <p className="text-muted-foreground">This module is under development</p>
            </div>
          </div>
        );
    }
  };

  if (!activeModule) {
    return null;
  }

  return moduleContent(activeModule);
}
