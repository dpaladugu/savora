
import { useMemo } from 'react';
import { DollarSign, TrendingUp, CreditCard, PiggyBank, Target, Wallet, TrendingDown, Calculator } from 'lucide-react';
import { DashboardData } from '@/types/dashboard';
import { MetricCardProps } from '@/types/dashboard';

export function useDashboardMetrics(
  dashboardData: DashboardData | null,
  loading: boolean,
  onTabChange: (tab: string) => void,
  onMoreNavigation: (moduleId: string) => void
) {
  const { primaryMetrics, secondaryMetrics } = useMemo(() => {
    const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
    const formatPercentage = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

    const primary: MetricCardProps[] = [
      {
        title: 'Total Balance',
        value: dashboardData ? formatCurrency(dashboardData.monthlyIncome - dashboardData.totalExpenses) : '₹0',
        change: dashboardData ? formatPercentage(dashboardData.savingsRate) : '+0.0%',
        changeType: dashboardData && dashboardData.savingsRate > 0 ? 'positive' : 'neutral',
        icon: DollarSign,
        onClick: () => onTabChange('dashboard'),
        loading
      },
      {
        title: 'Investments',
        value: dashboardData ? formatCurrency(dashboardData.totalInvestments) : '₹0',
        change: dashboardData ? `${dashboardData.investmentCount} items` : '0 items',
        changeType: 'neutral',
        icon: TrendingUp,
        onClick: () => onTabChange('investments'),
        loading
      },
      {
        title: 'Monthly Expenses',
        value: dashboardData ? formatCurrency(dashboardData.monthlyExpenses) : '₹0',
        change: dashboardData ? `${dashboardData.expenseCount} transactions` : '0 transactions',
        changeType: 'neutral',
        icon: CreditCard,
        onClick: () => onTabChange('expenses'),
        loading
      },
      {
        title: 'Emergency Fund',
        value: dashboardData ? formatCurrency(dashboardData.emergencyFundCurrent) : '₹0',
        change: dashboardData ? `${Math.round((dashboardData.emergencyFundCurrent / dashboardData.emergencyFundTarget) * 100)}% of target` : '0% of target',
        changeType: dashboardData && dashboardData.emergencyFundCurrent >= dashboardData.emergencyFundTarget ? 'positive' : 'neutral',
        icon: PiggyBank,
        onClick: () => onMoreNavigation('emergency-fund'),
        loading
      }
    ];

    const secondary: MetricCardProps[] = [
      {
        title: 'Savings Rate',
        value: dashboardData ? `${dashboardData.savingsRate}%` : '0%',
        change: 'Monthly average',
        changeType: dashboardData && dashboardData.savingsRate >= 20 ? 'positive' : 'neutral',
        icon: Target,
        onClick: () => onTabChange('goals'),
        loading
      },
      {
        title: 'Credit Card Debt',
        value: dashboardData ? formatCurrency(dashboardData.creditCardDebt) : '₹0',
        change: 'Current balance',
        changeType: dashboardData && dashboardData.creditCardDebt > 0 ? 'negative' : 'positive',
        icon: Wallet,
        onClick: () => onMoreNavigation('credit-cards'),
        loading
      },
      {
        title: 'Monthly Income',
        value: dashboardData ? formatCurrency(dashboardData.monthlyIncome) : '₹0',
        change: 'Last month',
        changeType: 'positive',
        icon: TrendingUp,
        onClick: () => onTabChange('dashboard'),
        loading
      },
      {
        title: 'Investment Value',
        value: dashboardData ? formatCurrency(dashboardData.investmentValue) : '₹0',
        change: 'Current market value',
        changeType: 'neutral',
        icon: Calculator,
        onClick: () => onTabChange('investments'),
        loading
      }
    ];

    return { primaryMetrics: primary, secondaryMetrics: secondary };
  }, [dashboardData, loading, onTabChange, onMoreNavigation]);

  return { primaryMetrics, secondaryMetrics };
}
