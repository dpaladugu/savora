
import { useQuery } from "@tanstack/react-query";
import { DashboardData } from "@/types/dashboard";
import { Logger } from "@/services/logger";

// Mock data for development
const mockDashboardData: DashboardData = {
  totalExpenses: 45230,
  monthlyExpenses: 15430,
  totalInvestments: 230000,
  expenseCount: 42,
  investmentCount: 8,
  emergencyFundTarget: 150000,
  emergencyFundCurrent: 120000,
  monthlyIncome: 85000,
  savingsRate: 25,
  investmentValue: 230000,
  creditCardDebt: 12500,
  emergencyFund: 150000,
  goals: [
    {
      id: "1",
      title: "House Down Payment",
      targetAmount: 500000,
      currentAmount: 150000,
      deadline: "2025-12-31",
      category: "Housing"
    }
  ],
  recentTransactions: [
    {
      id: "1",
      amount: -2500,
      description: "Grocery Shopping",
      category: "Food",
      date: "2024-01-15",
      type: "expense"
    }
  ],
  categoryBreakdown: [
    {
      category: "Food",
      amount: 15000,
      percentage: 33,
      color: "#3b82f6"
    },
    {
      category: "Transport",
      amount: 8000,
      percentage: 18,
      color: "#ef4444"
    }
  ]
};

async function fetchDashboardData(): Promise<DashboardData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In production, this would make an actual API call
  Logger.info('Fetching dashboard data');
  return mockDashboardData;
}

export function useOptimizedDashboardData() {
  const query = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
  });

  return {
    dashboardData: query.data || null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching
  };
}
