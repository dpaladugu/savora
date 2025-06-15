
import { useMemo } from "react";
import { DashboardData } from "@/types/dashboard";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Target, CreditCard } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: any;
  onClick?: () => void;
  loading?: boolean;
}

export function useDashboardMetrics(
  dashboardData: DashboardData | null,
  loading: boolean,
  onTabChange: (tab: string) => void,
  onMoreNavigation: (moduleId: string) => void
) {
  const primaryMetrics = useMemo(() => {
    if (!dashboardData) return [];

    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);

    return [
      {
        title: "Total Investments",
        value: formatCurrency(dashboardData.totalInvestments || 0),
        change: dashboardData.totalInvestments > 200000 ? "+12.5%" : "+8.2%",
        trend: "up" as const,
        icon: TrendingUp,
        onClick: () => onTabChange("investments"),
        loading
      },
      {
        title: "Monthly Expenses",
        value: formatCurrency(dashboardData.monthlyExpenses || 0),
        change: `${dashboardData.expenseCount || 0} transactions`,
        trend: "neutral" as const,
        icon: DollarSign,
        onClick: () => onTabChange("expenses"),
        loading
      },
      {
        title: "Emergency Fund",
        value: formatCurrency(dashboardData.emergencyFundCurrent || 0),
        change: `${Math.round(((dashboardData.emergencyFundCurrent || 0) / (dashboardData.emergencyFundTarget || 1)) * 100)}% of target (${formatCurrency(dashboardData.emergencyFundTarget || 0)})`,
        trend: (dashboardData.emergencyFundCurrent || 0) >= (dashboardData.emergencyFundTarget || 0) ? "up" : "down" as const,
        icon: PiggyBank,
        onClick: () => onMoreNavigation("emergency-fund"),
        loading
      }
    ];
  }, [dashboardData, loading, onTabChange, onMoreNavigation]);

  const secondaryMetrics = useMemo(() => {
    if (!dashboardData) return [];

    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);

    return [
      {
        title: "Portfolio Value",
        value: formatCurrency(dashboardData.totalInvestments || 0),
        change: `${dashboardData.investmentCount || 0} investments`,
        trend: "up" as const,
        icon: Target,
        onClick: () => onTabChange("investments"),
        loading
      },
      {
        title: "Savings Rate",
        value: `${Math.round(((dashboardData.totalInvestments || 0) / ((dashboardData.monthlyExpenses || 1) * 12)) * 100)}%`,
        change: "Monthly savings vs expenses",
        trend: "neutral" as const,
        icon: TrendingUp,
        onClick: () => onMoreNavigation("cashflow"),
        loading
      },
      {
        title: "Net Worth",
        value: formatCurrency((dashboardData.totalInvestments || 0) - (dashboardData.monthlyExpenses || 0) * 6),
        change: `Investments minus 6mo expenses`,
        trend: ((dashboardData.totalInvestments || 0) - (dashboardData.monthlyExpenses || 0) * 6) > 0 ? "up" : "down" as const,
        icon: CreditCard,
        onClick: () => onMoreNavigation("cashflow"),
        loading
      }
    ];
  }, [dashboardData, loading, onTabChange, onMoreNavigation]);

  return { primaryMetrics, secondaryMetrics };
}
