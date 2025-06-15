
import { useMemo } from "react";
import { DollarSign, TrendingUp, Target, Shield, Receipt, CreditCard, LucideIcon } from "lucide-react";
import { DashboardData, MetricCardProps } from "@/types/dashboard";

export function useDashboardMetrics(
  dashboardData: DashboardData,
  loading: boolean,
  onTabChange: (tab: string) => void,
  onMoreNavigation: (moduleId: string) => void
) {
  const primaryMetrics = useMemo((): MetricCardProps[] => [
    {
      title: "Net Worth",
      value: loading ? "Loading..." : `₹${(dashboardData.totalInvestments - dashboardData.totalExpenses).toLocaleString()}`,
      change: dashboardData.totalInvestments > dashboardData.totalExpenses ? "+8.2%" : "-2.1%",
      changeType: dashboardData.totalInvestments > dashboardData.totalExpenses ? "positive" as const : "negative" as const,
      icon: DollarSign as LucideIcon,
      gradient: "bg-gradient-blue",
      onClick: () => onMoreNavigation("investments")
    },
    {
      title: "This Month",
      value: loading ? "Loading..." : `₹${dashboardData.monthlyExpenses.toLocaleString()}`,
      change: `${dashboardData.expenseCount} transactions`,
      changeType: "neutral" as const,
      icon: Receipt as LucideIcon,
      gradient: "bg-gradient-orange",
      onClick: () => onTabChange("expenses")
    },
    {
      title: "Emergency Fund",
      value: loading ? "Loading..." : `₹${dashboardData.emergencyFundCurrent.toLocaleString()}`,
      change: `${dashboardData.emergencyFundCurrent >= dashboardData.emergencyFundTarget ? '✓ Target met' : `₹${(dashboardData.emergencyFundTarget - dashboardData.emergencyFundCurrent).toLocaleString()} needed`}`,
      changeType: dashboardData.emergencyFundCurrent >= dashboardData.emergencyFundTarget ? "positive" as const : "negative" as const,
      icon: Shield as LucideIcon,
      gradient: "bg-gradient-purple",
      onClick: () => onMoreNavigation("emergency-fund")
    },
    {
      title: "Investments",
      value: loading ? "Loading..." : `₹${dashboardData.totalInvestments.toLocaleString()}`,
      change: `${dashboardData.investmentCount} transactions`,
      changeType: "positive" as const,
      icon: Target as LucideIcon,
      gradient: "bg-gradient-green",
      onClick: () => onMoreNavigation("investments")
    }
  ], [dashboardData, loading, onTabChange, onMoreNavigation]);

  const secondaryMetrics = useMemo((): MetricCardProps[] => [
    {
      title: "Smart Tips",
      value: "3 Active",
      change: "View recommendations",
      changeType: "neutral" as const,
      icon: TrendingUp as LucideIcon,
      gradient: "bg-gradient-green",
      onClick: () => onMoreNavigation("recommendations")
    },
    {
      title: "Cashflow",
      value: loading ? "Loading..." : `₹${Math.max(0, dashboardData.totalInvestments - dashboardData.monthlyExpenses).toLocaleString()}`,
      change: "Monthly surplus",
      changeType: "positive" as const,
      icon: CreditCard as LucideIcon,
      gradient: "bg-gradient-blue",
      onClick: () => onMoreNavigation("cashflow")
    }
  ], [dashboardData, loading, onMoreNavigation]);

  return { primaryMetrics, secondaryMetrics };
}
