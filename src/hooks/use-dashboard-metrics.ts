
import { useMemo } from 'react';
import { DollarSign, TrendingUp, CreditCard, PiggyBank } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ComponentType<any>;
  onClick: () => void;
  loading: boolean;
}

export function useDashboardMetrics() {
  const metrics = useMemo((): MetricCardProps[] => [
    {
      title: 'Total Balance',
      value: '₹0',
      change: '+0.0%',
      trend: { value: 0, isPositive: true },
      icon: DollarSign,
      onClick: () => console.log('Navigate to accounts'),
      loading: false
    },
    {
      title: 'Investments',
      value: '₹0',
      change: '+0.0%',
      trend: { value: 0, isPositive: true },
      icon: TrendingUp,
      onClick: () => console.log('Navigate to investments'),
      loading: false
    },
    {
      title: 'Credit Cards',
      value: '₹0',
      change: '+0.0%',
      trend: { value: 0, isPositive: true },
      icon: CreditCard,
      onClick: () => console.log('Navigate to credit cards'),
      loading: false
    },
    {
      title: 'Savings',
      value: '₹0',
      change: '+0.0%',
      trend: { value: 0, isPositive: true },
      icon: PiggyBank,
      onClick: () => console.log('Navigate to savings'),
      loading: false
    }
  ], []);

  return { metrics };
}
