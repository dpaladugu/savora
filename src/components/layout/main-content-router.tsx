
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
import { memo, Suspense } from "react";
import { Logger } from "@/services/logger";
import { EnhancedLoadingWrapper } from "@/components/ui/enhanced-loading-wrapper";
import { ModuleHeader } from "./module-header";

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
  
  Logger.debug('MainContentRouter render', { activeTab, activeMoreModule });

  const handleBackFromMore = () => {
    onTabChange('dashboard');
  };

  const getTabConfig = (tabId: string) => {
    const configs = {
      "dashboard": { title: "Dashboard", subtitle: "Your financial overview", showHeader: true }, // Changed showHeader to true
      "expenses": { title: "Expenses", subtitle: "Track your spending", showHeader: true },
      "credit-cards": { title: "Credit Cards", subtitle: "Manage your credit cards", showHeader: true },
      "investments": { title: "Investments", subtitle: "Track your portfolio", showHeader: true },
      "goals": { title: "Goals & SIPs", subtitle: "Financial goals and tracking", showHeader: true },
      "upload": { title: "Import Data", subtitle: "Import CSV files", showHeader: true },
      "settings": { title: "Settings", subtitle: "App preferences", showHeader: true }
    };
    return configs[tabId] || { title: "Module", subtitle: "", showHeader: true };
  };

  const renderMoreContent = () => {
    if (!activeMoreModule) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
          <ModuleHeader 
            title="More Features"
            subtitle="Explore additional modules"
            onBack={handleBackFromMore}
            showBackButton={true}
            showHeader={true}
            showThemeToggle={true}
          />
          <div className="px-4 py-4">
            <MoreScreen onNavigate={onMoreNavigation} />
          </div>
        </div>
      );
    }
    return <MoreModuleRouter activeModule={activeMoreModule} onBack={handleBackFromMore} />;
  };

  const renderTabContent = (tabId: string) => {
    const config = getTabConfig(tabId);
    
    const content = (() => {
      switch (tabId) {
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
        default:
          return <Dashboard onTabChange={onTabChange} onMoreNavigation={onMoreNavigation} />;
      }
    })();

    if (!config.showHeader) {
      return content;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
        <ModuleHeader 
          title={config.title}
          subtitle={config.subtitle}
          showHeader={config.showHeader}
          showThemeToggle={true}
        />
        <div className="px-4 py-4">
          {content}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    try {
      if (activeTab === "more") {
        return renderMoreContent();
      }
      
      return renderTabContent(activeTab);
    } catch (error) {
      Logger.error('Error rendering content', { activeTab, error });
      throw error;
    }
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={
        <EnhancedLoadingWrapper 
          loading={true} 
          loadingText="Loading module..."
        >
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800" />
        </EnhancedLoadingWrapper>
      }>
        {renderContent()}
      </Suspense>
    </ErrorBoundary>
  );
});
