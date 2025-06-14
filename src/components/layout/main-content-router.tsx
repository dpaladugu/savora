
import { Dashboard } from "@/components/dashboard/dashboard";
import { ExpenseTracker } from "@/components/expenses/expense-tracker";
import { SimpleGoalsTracker } from "@/components/goals/simple-goals-tracker";
import { CSVImports } from "@/components/imports/csv-imports";
import { SettingsScreen } from "@/components/settings/settings-screen";
import { MoreScreen } from "@/components/more/more-screen";
import { MoreModuleRouter } from "./more-module-router";

interface MainContentRouterProps {
  activeTab: string;
  activeMoreModule: string | null;
  onMoreNavigation: (moduleId: string) => void;
}

export function MainContentRouter({ 
  activeTab, 
  activeMoreModule, 
  onMoreNavigation 
}: MainContentRouterProps) {
  const renderMoreContent = () => {
    if (!activeMoreModule) {
      return <MoreScreen onNavigate={onMoreNavigation} />;
    }
    return <MoreModuleRouter activeModule={activeMoreModule} />;
  };

  switch (activeTab) {
    case "dashboard":
      return <Dashboard />;
    case "expenses":
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
          <ExpenseTracker />
        </div>
      );
    case "goals":
      return <SimpleGoalsTracker />;
    case "upload":
      return <CSVImports />;
    case "settings":
      return <SettingsScreen />;
    case "more":
      return renderMoreContent();
    default:
      return <Dashboard />;
  }
}
