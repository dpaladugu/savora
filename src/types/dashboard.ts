
export interface DashboardData {
  totalExpenses: number;
  monthlyExpenses: number;
  totalInvestments: number;
  expenseCount: number;
  investmentCount: number;
  emergencyFundTarget: number;
  emergencyFundCurrent: number;
}

export interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  gradient: string;
  onClick?: () => void;
}

export interface DashboardMetricsProps {
  dashboardData: DashboardData;
  loading: boolean;
  onTabChange: (tab: string) => void;
  onMoreNavigation: (moduleId: string) => void;
}
