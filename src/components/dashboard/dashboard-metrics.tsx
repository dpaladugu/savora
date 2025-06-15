
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Target, Shield, Receipt, CreditCard } from "lucide-react";
import { MetricCard } from "../ui/metric-card";

interface DashboardMetricsProps {
  dashboardData: {
    totalExpenses: number;
    monthlyExpenses: number;
    totalInvestments: number;
    expenseCount: number;
    investmentCount: number;
    emergencyFundTarget: number;
    emergencyFundCurrent: number;
  };
  loading: boolean;
  onTabChange: (tab: string) => void;
  onMoreNavigation: (moduleId: string) => void;
}

export function DashboardMetrics({ 
  dashboardData, 
  loading, 
  onTabChange, 
  onMoreNavigation 
}: DashboardMetricsProps) {
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
    <>
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
    </>
  );
}
