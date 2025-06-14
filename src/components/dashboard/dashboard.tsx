import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Target, Shield, Receipt, CreditCard } from "lucide-react";
import { MetricCard } from "../ui/metric-card";
import { ExpenseChart } from "./expense-chart";
import { AssetAllocation } from "./asset-allocation";
import { GlobalHeader } from "../layout/global-header";
import { FirestoreService } from "@/services/firestore";
import { useAuth } from "@/contexts/auth-context";

export function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    totalInvestments: 0,
    expenseCount: 0,
    investmentCount: 0
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
      
      setDashboardData({
        totalExpenses,
        monthlyExpenses,
        totalInvestments,
        expenseCount: expenses.length,
        investmentCount: investments.length
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    {
      title: "Net Worth",
      value: loading ? "Loading..." : `₹${(dashboardData.totalInvestments - dashboardData.totalExpenses).toLocaleString()}`,
      change: dashboardData.totalInvestments > dashboardData.totalExpenses ? "+8.2%" : "-2.1%",
      changeType: dashboardData.totalInvestments > dashboardData.totalExpenses ? "positive" as const : "negative" as const,
      icon: DollarSign,
      gradient: "bg-gradient-blue"
    },
    {
      title: "This Month",
      value: loading ? "Loading..." : `₹${dashboardData.monthlyExpenses.toLocaleString()}`,
      change: `${dashboardData.expenseCount} transactions`,
      changeType: "neutral" as const,
      icon: Receipt,
      gradient: "bg-gradient-orange"
    },
    {
      title: "Emergency Fund",
      value: loading ? "Loading..." : `₹${Math.min(dashboardData.totalInvestments * 0.3, 250000).toLocaleString()}`,
      change: "Target: ₹3,00,000",
      changeType: "positive" as const,
      icon: Shield,
      gradient: "bg-gradient-purple"
    },
    {
      title: "Investments",
      value: loading ? "Loading..." : `₹${dashboardData.totalInvestments.toLocaleString()}`,
      change: `${dashboardData.investmentCount} transactions`,
      changeType: "positive" as const,
      icon: Target,
      gradient: "bg-gradient-green"
    }
  ];

  const additionalMetrics = [
    {
      title: "Total Expenses",
      value: loading ? "Loading..." : `₹${dashboardData.totalExpenses.toLocaleString()}`,
      change: "All time",
      changeType: "neutral" as const,
      icon: TrendingUp,
      gradient: "bg-gradient-green"
    },
    {
      title: "Credit Cards",
      value: "₹12,500",
      change: "Due in 5 days",
      changeType: "neutral" as const,
      icon: CreditCard,
      gradient: "bg-gradient-blue"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 transition-all duration-300 overflow-auto">
      <GlobalHeader title="Good morning! 👋" />
      
      <div className="pt-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 px-2"
        >
          <p className="text-muted-foreground text-lg font-medium">
            Welcome to Savora - Your financial overview
          </p>
        </motion.div>

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

        {/* Charts Section with proper spacing */}
        <div className="space-y-6 px-2">
          <ExpenseChart />
          <AssetAllocation />
        </div>
      </div>
    </div>
  );
}
