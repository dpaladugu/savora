
import * as React from 'react';
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
import { Logger } from "@/services/logger";
import { EnhancedLoadingWrapper } from "@/components/ui/enhanced-loading-wrapper";
import { ModuleHeader } from "./module-header";

interface MainContentRouterProps {
  activeTab: string;
  activeMoreModule: string | null;
  onMoreNavigation: (moduleId: string) => void;
  onTabChange: (tab: string) => void;
}

export const MainContentRouter = React.memo(function MainContentRouter({ 
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
      return React.createElement(
        'div',
        { className: "min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24" },
        React.createElement(ModuleHeader, {
          title: "More Features",
          subtitle: "Explore additional modules",
          onBack: handleBackFromMore,
          showBackButton: true,
          showHeader: true,
          showThemeToggle: true
        }),
        React.createElement(
          'div',
          { className: "px-4 py-4" },
          React.createElement(MoreScreen, { onNavigate: onMoreNavigation })
        )
      );
    }
    return React.createElement(MoreModuleRouter, { activeModule: activeMoreModule, onBack: handleBackFromMore });
  };

  const renderTabContent = (tabId: string) => {
    const config = getTabConfig(tabId);
    
    const content = (() => {
      switch (tabId) {
        case "dashboard":
          return React.createElement(Dashboard, { onTabChange: onTabChange, onMoreNavigation: onMoreNavigation });
        case "expenses":
          return React.createElement(ExpenseTracker);
        case "credit-cards":
          return React.createElement(CreditCardFlowTracker);
        case "investments":
          return React.createElement(InvestmentsTracker);
        case "goals":
          return React.createElement(SimpleGoalsTracker);
        case "upload":
          return React.createElement(CSVImports);
        case "settings":
          return React.createElement(SettingsScreen);
        default:
          return React.createElement(Dashboard, { onTabChange: onTabChange, onMoreNavigation: onMoreNavigation });
      }
    })();

    if (!config.showHeader) {
      return content;
    }

    return React.createElement(
      'div',
      { className: "min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24" },
      React.createElement(ModuleHeader, {
        title: config.title,
        subtitle: config.subtitle,
        showHeader: config.showHeader,
        showThemeToggle: true
      }),
      React.createElement(
        'div',
        { className: "px-4 py-4" },
        content
      )
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

  return React.createElement(
    ErrorBoundary,
    null,
    React.createElement(
      React.Suspense,
      {
        fallback: React.createElement(
          EnhancedLoadingWrapper,
          {
            loading: true,
            loadingText: "Loading module..."
          },
          React.createElement('div', {
            className: "min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800"
          })
        )
      },
      renderContent()
    )
  );
});
