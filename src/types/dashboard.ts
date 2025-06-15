
import { LucideIcon } from "lucide-react";

export interface DashboardData {
  totalExpenses: number;
  monthlyExpenses: number;
  totalInvestments: number;
  expenseCount: number;
  investmentCount: number;
  emergencyFundTarget: number;
  emergencyFundCurrent: number;
  monthlyIncome: number;
  savingsRate: number;
  investmentValue: number;
  creditCardDebt: number;
  emergencyFund: number;
  goals: Goal[];
  recentTransactions: Transaction[];
  categoryBreakdown: CategoryBreakdown[];
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  gradient?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
  loading?: boolean;
}

export interface DashboardMetricsProps {
  dashboardData: DashboardData | null;
  loading: boolean;
  onTabChange: (tab: string) => void;
  onMoreNavigation: (moduleId: string) => void;
}
