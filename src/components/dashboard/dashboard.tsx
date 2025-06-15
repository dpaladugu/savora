
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Target, Shield, Receipt, CreditCard } from "lucide-react";
import { MetricCard } from "../ui/metric-card";
import { ExpenseChart } from "./expense-chart";
import { AssetAllocation } from "./asset-allocation";
import { QuickActions } from "./quick-actions";
import { FirestoreService } from "@/services/firestore";
import { useAuth } from "@/contexts/auth-context";

interface DashboardProps {
  onTabChange: (tab: string) => void;
  onMoreNavigation: (moduleId: string) => void;
}

export function Dashboard({ onTabChange, onMoreNavigation }: DashboardProps) {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    totalInvestments: 0,
    expenseCount: 0,
    investmentCount: 0,
    emergencyFundTarget: 0,
    emergencyFundCurrent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      const [expenses, investments] = await Promise.all([
        FirestoreService.getExpenses(user.uid),
        FirestoreService.getInvestments(user.uid)
      ]);
      
      const currentMonth = new Date().toISOString().substring(0, 7);
      const monthlyExpenses = expenses
        .filter(expense => expense.date.startsWith(currentMonth))
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalInvestments = investments.reduce((sum, investment) => sum + investment.amount, 0);
      
      // Calculate emergency fund requirements from actual data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const recentExpenses = expenses.filter(expense => 
        new Date(expense.date) >= sixMonthsAgo &&
        !expense.description?.toLowerCase().includes('bill payment') &&
        !expense.description?.toLowerCase().includes('emi')
      );
      
      const avgMonthlyExpenses = recentExpenses.length > 0 
        ? recentExpenses.reduce((sum, expense) => sum + expense.amount, 0) / 6
        : monthlyExpenses;
      
      const emergencyFundTarget = avgMonthlyExpenses * 6;
      const emergencyFundCurrent = totalInvestments * 0.15; // Assume 15% is emergency fund
      
      setDashboardData({
        totalExpenses,
        monthlyExpenses,
        totalInvestments,
        expenseCount: expenses.length,
        investmentCount: investments.length,
        emergencyFundTarget,
        emergencyFundCurrent
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickActions = {
    onAddExpense: () => onTabChange("expenses"),
    onImportCSV: () => onTabChange("upload"),
    onCreateGoal: () => onTabChange("goals"),
    onViewCards: () => onMoreNavigation("credit-cards")
  };

  const metrics = [
    {
      title: "Net Worth",
      value: loading ? "Loading..." : `₹${(dashboardData.totalInvestments - dashboardData.totalExpenses).toLocaleString()}`,
      change: dashboardData.totalInvestments > dashboardData.totalExpenses ? "+8.2%" : "-2.1%",
      changeType: dashboardData.totalInvestments > dashboardData.totalExpenses ? "positive" as const : "negative" as const,
      icon: DollarSign,
      gradient: "bg-gradient-blue",
      onClick: () => onMoreNavigation("investments")
    },
    {
      title: "This Month",
      value: loading ? "Loading..." : `₹${dashboardData.monthlyExpenses.toLocaleString()}`,
      change: `${dashboardData.expenseCount} transactions`,
      changeType: "neutral" as const,
      icon: Receipt,
      gradient: "bg-gradient-orange",
      onClick: () => onTabChange("expenses")
    },
    {
      title: "Emergency Fund",
      value: loading ? "Loading..." : `₹${dashboardData.emergencyFundCurrent.toLocaleString()}`,
      change: `${dashboardData.emergencyFundCurrent >= dashboardData.emergencyFundTarget ? '✓ Target met' : `₹${(dashboardData.emergencyFundTarget - dashboardData.emergencyFundCurrent).toLocaleString()} needed`}`,
      changeType: dashboardData.emergencyFundCurrent >= dashboardData.emergencyFundTarget ? "positive" as const : "negative" as const,
      icon: Shield,
      gradient: "bg-gradient-purple",
      onClick: () => onMoreNavigation("emergency-fund")
    },
    {
      title: "Investments",
      value: loading ? "Loading..." : `₹${dashboardData.totalInvestments.toLocaleString()}`,
      change: `${dashboardData.investmentCount} transactions`,
      changeType: "positive" as const,
      icon: Target,
      gradient: "bg-gradient-green",
      onClick: () => onMoreNavigation("investments")
    }
  ];

  const additionalMetrics = [
    {
      title: "Smart Tips",
      value: "3 Active",
      change: "View recommendations",
      changeType: "neutral" as const,
      icon: TrendingUp,
      gradient: "bg-gradient-green",
      onClick: () => onMoreNavigation("recommendations")
    },
    {
      title: "Cashflow",
      value: loading ? "Loading..." : `₹${Math.max(0, dashboardData.totalInvestments - dashboardData.monthlyExpenses).toLocaleString()}`,
      change: "Monthly surplus",
      changeType: "positive" as const,
      icon: CreditCard,
      gradient: "bg-gradient-blue",
      onClick: () => onMoreNavigation("cashflow")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 transition-all duration-300 overflow-auto">
      <div className="pt-4 px-4">
        {/* Compact header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 px-2"
        >
          <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            Your financial overview
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="px-2">
          <QuickActions {...handleQuickActions} />
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 px-2">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-8 px-2">
          {additionalMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (metrics.length + index) * 0.1 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="space-y-6 px-2">
          <ExpenseChart />
          <AssetAllocation />
        </div>
      </div>
    </div>
  );
}
