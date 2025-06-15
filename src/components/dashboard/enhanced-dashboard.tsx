
import { QuickActions } from "./quick-actions";
import { DashboardMetrics } from "./dashboard-metrics";
import { DashboardCharts } from "./dashboard-charts";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { EnhancedLoadingWrapper } from "@/components/ui/enhanced-loading-wrapper";
import { useOptimizedDashboardData } from "@/hooks/use-optimized-dashboard-data";
import { memo, useEffect } from "react";
import { Logger } from "@/services/logger";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, Target, CreditCard } from "lucide-react";
import { DataValidator } from "@/services/data-validator";

interface EnhancedDashboardProps {
  onTabChange: (tab: string) => void;
  onMoreNavigation: (moduleId: string) => void;
}

export const EnhancedDashboard = memo(function EnhancedDashboard({ 
  onTabChange, 
  onMoreNavigation 
}: EnhancedDashboardProps) {
  const { dashboardData, loading, error, refetch } = useOptimizedDashboardData();

  Logger.debug('Enhanced Dashboard render', { loading, error: !!error, hasData: !!dashboardData });

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

  const insights = dashboardData ? [
    {
      icon: TrendingUp,
      title: "Monthly Expenses",
      value: DataValidator.formatCurrency(dashboardData.monthlyExpenses),
      trend: dashboardData.monthlyExpenses > 50000 ? "High spending this month" : "Spending looks good",
      color: dashboardData.monthlyExpenses > 50000 ? "text-orange-600" : "text-green-600"
    },
    {
      icon: Target,
      title: "Emergency Fund",
      value: DataValidator.formatPercentage((dashboardData.emergencyFundCurrent / dashboardData.emergencyFundTarget) * 100),
      trend: dashboardData.emergencyFundCurrent < dashboardData.emergencyFundTarget ? "Below target" : "On track",
      color: dashboardData.emergencyFundCurrent < dashboardData.emergencyFundTarget ? "text-red-600" : "text-green-600"
    },
    {
      icon: CreditCard,
      title: "Credit Card Debt",
      value: DataValidator.formatCurrency(dashboardData.creditCardDebt),
      trend: dashboardData.creditCardDebt > 0 ? "Consider paying down" : "No debt",
      color: dashboardData.creditCardDebt > 0 ? "text-red-600" : "text-green-600"
    }
  ] : [];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 transition-all duration-300 overflow-auto">
        <div className="px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Your financial overview
            </p>
          </motion.div>
          
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
            
            {/* Financial Insights */}
            {dashboardData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4">Financial Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {insights.map((insight, index) => (
                    <Card key={index} className="metric-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <insight.icon className="w-4 h-4 text-muted-foreground" />
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
          </EnhancedLoadingWrapper>
        </div>
      </div>
    </ErrorBoundary>
  );
});
