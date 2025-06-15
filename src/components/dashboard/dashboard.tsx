
import { DashboardHeader } from "./dashboard-header";
import { QuickActions } from "./quick-actions";
import { DashboardMetrics } from "./dashboard-metrics";
import { DashboardCharts } from "./dashboard-charts";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { LoadingWrapper } from "@/components/ui/loading-wrapper";
import { useDashboardData } from "@/hooks/use-dashboard-data";

interface DashboardProps {
  onTabChange: (tab: string) => void;
  onMoreNavigation: (moduleId: string) => void;
}

export function Dashboard({ onTabChange, onMoreNavigation }: DashboardProps) {
  const { dashboardData, loading } = useDashboardData();

  const handleQuickActions = {
    onAddExpense: () => onTabChange("expenses"),
    onImportCSV: () => onTabChange("upload"),
    onCreateGoal: () => onTabChange("goals"),
    onViewCards: () => onMoreNavigation("credit-cards")
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 transition-all duration-300 overflow-auto">
        <div className="pt-4 px-4">
          <DashboardHeader />
          
          <div className="px-2">
            <QuickActions {...handleQuickActions} />
          </div>

          <LoadingWrapper loading={loading} loadingText="Loading dashboard data...">
            <DashboardMetrics
              dashboardData={dashboardData}
              loading={loading}
              onTabChange={onTabChange}
              onMoreNavigation={onMoreNavigation}
            />
            <DashboardCharts />
          </LoadingWrapper>
        </div>
      </div>
    </ErrorBoundary>
  );
}
