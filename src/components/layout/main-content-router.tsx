
import { Dashboard } from "@/components/dashboard/dashboard";
import { ExpenseTracker } from "@/components/expenses/expense-tracker";
import { SimpleGoalsTracker } from "@/components/goals/simple-goals-tracker";
import { CSVImports } from "@/components/imports/csv-imports";
import { SettingsScreen } from "@/components/settings/settings-screen";
import { MoreScreen } from "@/components/more/more-screen";
import { MoreModuleRouter } from "./more-module-router";
import { CreditCardFlowTracker } from "@/components/credit-cards/credit-card-flow-tracker";
import { InvestmentsTracker } from "@/components/investments/investments-tracker";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { memo } from "react";

interface MainContentRouterProps {
  activeTab: string;
  activeMoreModule: string | null;
  onMoreNavigation: (moduleId: string) => void;
  onTabChange: (tab: string) => void;
}

export const MainContentRouter = memo(function MainContentRouter({ 
  activeTab, 
  activeMoreModule, 
  onMoreNavigation,
  onTabChange
}: MainContentRouterProps) {
  const renderMoreContent = () => {
    if (!activeMoreModule) {
      return <MoreScreen onNavigate={onMoreNavigation} />;
    }
    return <MoreModuleRouter activeModule={activeMoreModule} />;
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onTabChange={onTabChange} onMoreNavigation={onMoreNavigation} />;
      case "expenses":
        return <ExpenseTracker />;
      case "credit-cards":
        return <CreditCardFlowTracker />;
      case "investments":
        return <InvestmentsTracker />;
      case "goals":
        return <SimpleGoalsTracker />;
      case "upload":
        return <CSVImports />;
      case "settings":
        return <SettingsScreen />;
      case "more":
        return renderMoreContent();
      default:
        return <Dashboard onTabChange={onTabChange} onMoreNavigation={onMoreNavigation} />;
    }
  };

  return (
    <ErrorBoundary>
      {renderContent()}
    </ErrorBoundary>
  );
});
