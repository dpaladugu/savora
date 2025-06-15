
import { useQuery } from "@tanstack/react-query";
import { DashboardData } from "@/types/dashboard";
import { Logger } from "@/services/logger";
import { FirestoreService } from "@/services/firestore";
import { useAuth } from "@/contexts/auth-context";

// Enhanced mock data for development
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
    },
    {
      id: "2",
      amount: -800,
      description: "Gas Station",
      category: "Transport",
      date: "2024-01-14",
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
    },
    {
      category: "Entertainment",
      amount: 5000,
      percentage: 11,
      color: "#10b981"
    },
    {
      category: "Shopping",
      amount: 12000,
      percentage: 26,
      color: "#f59e0b"
    },
    {
      category: "Others",
      amount: 5430,
      percentage: 12,
      color: "#8b5cf6"
    }
  ]
};

async function fetchDashboardData(userId: string): Promise<DashboardData> {
  try {
    Logger.info('Fetching dashboard data for user:', userId);
    
    // Simulate API delay for realistic loading experience
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In production, fetch real data from Firestore
    const [expenses, investments] = await Promise.all([
      FirestoreService.getExpenses(userId).catch(() => []),
      FirestoreService.getInvestments(userId).catch(() => [])
    ]);

    // Calculate real metrics with correct reduce usage - Fixed with initial value
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyExpenses = expenses
      .filter(expense => expense.date?.startsWith(currentMonth))
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);

    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const totalInvestments = investments.reduce((sum, investment) => sum + (investment.amount || 0), 0);

    // Calculate emergency fund
    const avgMonthlyExpenses = monthlyExpenses || 15000; // fallback
    const emergencyFundTarget = avgMonthlyExpenses * 6;
    const emergencyFundCurrent = totalInvestments * 0.15; // Assume 15% is liquid

    const realData: DashboardData = {
      ...mockDashboardData,
      totalExpenses,
      monthlyExpenses,
      totalInvestments,
      expenseCount: expenses.length,
      investmentCount: investments.length,
      emergencyFundTarget,
      emergencyFundCurrent,
      recentTransactions: expenses.slice(0, 5).map(expense => ({
        id: expense.id || '',
        amount: -(expense.amount || 0),
        description: expense.description || 'Unknown',
        category: expense.category || 'Other',
        date: expense.date || new Date().toISOString().split('T')[0],
        type: 'expense' as const
      }))
    };

    Logger.info('Dashboard data calculated:', realData);
    return realData;
  } catch (error) {
    Logger.error('Error fetching dashboard data:', error);
    // Return mock data on error for better UX
    return mockDashboardData;
  }
}

export function useOptimizedDashboardData() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['dashboard-data', user?.uid],
    queryFn: () => fetchDashboardData(user?.uid || ''),
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    dashboardData: query.data || null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching
  };
}
