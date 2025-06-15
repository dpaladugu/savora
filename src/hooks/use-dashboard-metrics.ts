
import { useMemo } from "react";
import { DollarSign, TrendingUp, Target, Shield, Receipt, CreditCard, LucideIcon } from "lucide-react";
import { DashboardData, MetricCardProps } from "@/types/dashboard";

export function useDashboardMetrics(
  dashboardData: DashboardData | null,
  loading: boolean,
  onTabChange: (tab: string) => void,
  onMoreNavigation: (moduleId: string) => void
) {
  const primaryMetrics = useMemo((): MetricCardProps[] => {
    if (!dashboardData) {
      return [
        {
          title: "Net Worth",
          value: "Loading...",
          icon: DollarSign as LucideIcon,
          gradient: "bg-gradient-to-r from-blue-500 to-blue-600",
          loading: true
        },
        {
          title: "This Month",
          value: "Loading...",
          icon: Receipt as LucideIcon,
          gradient: "bg-gradient-to-r from-orange-500 to-orange-600",
          loading: true
        },
        {
          title: "Emergency Fund",
          value: "Loading...",
          icon: Shield as LucideIcon,
          gradient: "bg-gradient-to-r from-purple-500 to-purple-600",
          loading: true
        },
        {
          title: "Investments",
          value: "Loading...",
          icon: Target as LucideIcon,
          gradient: "bg-gradient-to-r from-green-500 to-green-600",
          loading: true
        }
      ];
    }

    return [
      {
        title: "Net Worth",
        value: `₹${(dashboardData.totalInvestments - dashboardData.totalExpenses).toLocaleString()}`,
        change: dashboardData.totalInvestments > dashboardData.totalExpenses ? "+8.2%" : "-2.1%",
        changeType: dashboardData.totalInvestments > dashboardData.totalExpenses ? "positive" as const : "negative" as const,
        icon: DollarSign as LucideIcon,
        gradient: "bg-gradient-to-r from-blue-500 to-blue-600",
        onClick: () => onMoreNavigation("investments")
      },
      {
        title: "This Month",
        value: `₹${dashboardData.monthlyExpenses.toLocaleString()}`,
        change: `${dashboardData.expenseCount} transactions`,
        changeType: "neutral" as const,
        icon: Receipt as LucideIcon,
        gradient: "bg-gradient-to-r from-orange-500 to-orange-600",
        onClick: () => onTabChange("expenses")
      },
      {
        title: "Emergency Fund",
        value: `₹${dashboardData.emergencyFundCurrent.toLocaleString()}`,
        change: `${dashboardData.emergencyFundCurrent >= dashboardData.emergencyFundTarget ? '✓ Target met' : `₹${(dashboardData.emergencyFundTarget - dashboardData.emergencyFundCurrent).toLocaleString()} needed`}`,
        changeType: dashboardData.emergencyFundCurrent >= dashboardData.emergencyFundTarget ? "positive" as const : "negative" as const,
        icon: Shield as LucideIcon,
        gradient: "bg-gradient-to-r from-purple-500 to-purple-600",
        onClick: () => onMoreNavigation("emergency-fund")
      },
      {
        title: "Investments",
        value: `₹${dashboardData.totalInvestments.toLocaleString()}`,
        change: `${dashboardData.investmentCount} holdings`,
        changeType: "positive" as const,
        icon: Target as LucideIcon,
        gradient: "bg-gradient-to-r from-green-500 to-green-600",
        onClick: () => onMoreNavigation("investments")
      }
    ];
  }, [dashboardData, loading, onTabChange, onMoreNavigation]);

  const secondaryMetrics = useMemo((): MetricCardProps[] => [
    {
      title: "Smart Tips",
      value: "3 Active",
      change: "View recommendations",
      changeType: "neutral" as const,
      icon: TrendingUp as LucideIcon,
      gradient: "bg-gradient-to-r from-green-500 to-green-600",
      onClick: () => onMoreNavigation("recommendations")
    },
    {
      title: "Cashflow",
      value: dashboardData ? `₹${Math.max(0, dashboardData.totalInvestments - dashboardData.monthlyExpenses).toLocaleString()}` : "Loading...",
      change: "Monthly surplus",
      changeType: "positive" as const,
      icon: CreditCard as LucideIcon,
      gradient: "bg-gradient-to-r from-blue-500 to-blue-600",
      onClick: () => onMoreNavigation("cashflow"),
      loading: !dashboardData
    }
  ], [dashboardData, onMoreNavigation]);

  return { primaryMetrics, secondaryMetrics };
}
