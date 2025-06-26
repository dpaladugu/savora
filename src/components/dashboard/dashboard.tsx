
import { QuickActions } from "./quick-actions";
import { DashboardMetrics } from "./dashboard-metrics";
import { DashboardCharts } from "./dashboard-charts";
import { AiTokenUsageDisplay } from "./ai-token-usage-display"; // Import the new component
import { ErrorBoundary } from "@/components/error/error-boundary";
import { EnhancedLoadingWrapper } from "@/components/ui/enhanced-loading-wrapper";
import { useOptimizedDashboardData } from "@/hooks/use-optimized-dashboard-data";
import { memo } from "react";
import { Logger } from "@/services/logger";
import { motion } from "framer-motion";

interface DashboardProps {
  onTabChange: (tab: string) => void;
  onMoreNavigation: (moduleId: string) => void;
}

export const Dashboard = memo(function Dashboard({ onTabChange, onMoreNavigation }: DashboardProps) {
  const { dashboardData, loading, error, refetch } = useOptimizedDashboardData();

  Logger.debug('Dashboard render', { loading, error: !!error, hasData: !!dashboardData });

  const handleQuickActions = {
    onAddExpense: () => {
      Logger.info('Quick action: Add expense clicked');
      onTabChange("expenses");
    },
    onImportCSV: () => {
      Logger.info('Quick action: Import CSV clicked');
      onTabChange("upload");
    },
    onCreateGoal: () => {
      Logger.info('Quick action: Create goal clicked');
      onTabChange("goals");
    },
    onViewCards: () => {
      Logger.info('Quick action: View cards clicked');
      onMoreNavigation("credit-cards");
    }
  };

  return (
    <ErrorBoundary>
      {/* The outer div (min-h-screen, bg-gradient, pb-24) and content padding (px-4, py-4)
          are expected to be handled by MainContentRouter now that ModuleHeader is shown.
          This component should just return its direct content.
      */}
      <div className="space-y-6"> {/* Simplified top-level div, specific padding/margins handled by router's structure */}
          {/* Removed inline title/subtitle - ModuleHeader will provide this */}
          {/*
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6" // This margin might still be useful if QuickActions is the first visible thing
          >
            <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Your financial overview
            </p>
          </motion.div>
          */}
          
          <QuickActions {...handleQuickActions} />

          <EnhancedLoadingWrapper 
            loading={loading} 
            loadingText="Loading dashboard data..."
            error={error}
            onRetry={() => {
              Logger.info('Dashboard retry requested');
              refetch();
            }}
          >
            <DashboardMetrics
              dashboardData={dashboardData}
              loading={loading}
              onTabChange={onTabChange}
              onMoreNavigation={onMoreNavigation}
            />
            <DashboardCharts />
            {/* Add the AI Token Usage Display */}
            <div className="mt-6"> {/* Added some margin-top */}
              <AiTokenUsageDisplay />
            </div>
          </EnhancedLoadingWrapper>
        {/* Removed the extra closing div tag that was here */}
      </div>
    </ErrorBoundary>
  );
});
