import { QuickActions } from "./quick-actions";
import { EnhancedDashboardMetrics } from "./enhanced-dashboard-metrics"; // Changed to Enhanced
import { DashboardCharts } from "./dashboard-charts";
import { AiTokenUsageDisplay } from "./ai-token-usage-display";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { EnhancedLoadingWrapper } from "@/components/ui/enhanced-loading-wrapper";
import { useOptimizedDashboardData } from "@/hooks/use-optimized-dashboard-data";
import { memo, useEffect } from "react";
import { Logger } from "@/services/logger";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card"; // For Financial Insights
import { TrendingUp, Target, CreditCard } from "lucide-react"; // For Financial Insights
import { DataValidator } from "@/services/data-validator"; // For Financial Insights

interface DashboardProps {
  onTabChange: (tab: string) => void;
  onMoreNavigation: (moduleId: string) => void;
}

export const Dashboard = memo(function Dashboard({ onTabChange, onMoreNavigation }: DashboardProps) {
  const { dashboardData, loading, error, refetch } = useOptimizedDashboardData();

  Logger.debug('Dashboard render', { loading, error: !!error, hasData: !!dashboardData });

  useEffect(() => {
    // Auto-refresh data every 5 minutes
    const interval = setInterval(() => {
      if (!loading) {
        refetch();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loading, refetch]);

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

  const financialInsights = dashboardData ? [
    {
      icon: TrendingUp, // Note: This was TrendUp in enhanced-dashboard, assuming TrendingUp is correct from lucide
      title: "Monthly Expenses Trend", // Example title
      value: DataValidator.formatCurrency(dashboardData.monthlyExpenses),
      trend: dashboardData.monthlyExpenses > (dashboardData.monthlyIncome * 0.5) ? "Spending high vs income" : "Spending moderate", // Example trend
      color: dashboardData.monthlyExpenses > (dashboardData.monthlyIncome * 0.5) ? "text-orange-600" : "text-green-600"
    },
    {
      icon: Target,
      title: "Emergency Fund Progress",
      value: DataValidator.formatPercentage((dashboardData.emergencyFundCurrent / dashboardData.emergencyFundTarget) * 100),
      trend: dashboardData.emergencyFundCurrent < dashboardData.emergencyFundTarget ? "Below target" : "Target met/exceeded",
      color: dashboardData.emergencyFundCurrent < dashboardData.emergencyFundTarget ? "text-red-600" : "text-green-600"
    },
    {
      icon: CreditCard,
      title: "Credit Card Utilization", // Example
      value: DataValidator.formatCurrency(dashboardData.creditCardDebt), // Assuming creditCardDebt is total utilization
      trend: dashboardData.creditCardDebt > 0 ? "Debt present" : "No CC debt",
      color: dashboardData.creditCardDebt > 0 ? "text-red-600" : "text-green-600"
    }
  ] : [];


  return (
    <ErrorBoundary>
      <div className="space-y-6">
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
          {/* Use EnhancedDashboardMetrics */}
          <EnhancedDashboardMetrics
            dashboardData={dashboardData}
            loading={loading}
            // Removed onTabChange and onMoreNavigation if EnhancedDashboardMetrics doesn't use them
            // If it does, they should be passed, but the read file didn't show them as props for EnhancedDashboardMetrics
          />
          
          {/* Financial Insights Section from enhanced-dashboard */}
          {dashboardData && financialInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }} // Adjust delay as needed
              className="mb-6" // Original class from enhanced-dashboard
            >
              <h2 className="text-lg font-semibold text-foreground mb-4">Financial Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {financialInsights.map((insight, index) => (
                  <Card key={index} className="metric-card"> {/* Assuming metric-card for consistent styling */}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <insight.icon aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">
                              {insight.title}
                            </span>
                          </div>
                          <div className="text-xl font-bold text-foreground mb-1">
                            {insight.value}
                          </div>
                          <div className={`text-xs ${insight.color}`}>
                            {insight.trend}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          <DashboardCharts />
          <div className="mt-6">
            <AiTokenUsageDisplay />
          </div>
        </EnhancedLoadingWrapper>
      </div>
    </ErrorBoundary>
  );
});
