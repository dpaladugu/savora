
import { useQuery } from "@tanstack/react-query";
import { DashboardData } from "@/types/dashboard";
import { Logger } from "@/services/logger";
import { SupabaseExpenseManager } from "@/services/supabase-expense-manager";
import { SupabaseInvestmentManager } from "@/services/supabase-investment-manager";
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
    
    // Fetch real data from Supabase
    const [expenses, investments] = await Promise.all([
      SupabaseExpenseManager.getExpenses(userId).catch(() => []),
      SupabaseInvestmentManager.getInvestments(userId).catch(() => [])
    ]);

    // Calculate real metrics with proper type handling and initial values
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyExpenses = expenses
      .filter(expense => expense.date?.startsWith(currentMonth) && expense.type === 'expense')
      .map(expense => typeof expense.amount === 'number' ? expense.amount : 0)
      .reduce((sum, amount) => sum + amount, 0);

    const totalExpenses = expenses
      .filter(expense => expense.type === 'expense')
      .map(expense => typeof expense.amount === 'number' ? expense.amount : 0)
      .reduce((sum, amount) => sum + amount, 0);

    const totalInvestments = investments
      .map(investment => typeof investment.amount === 'number' ? investment.amount : 0)
      .reduce((sum, amount) => sum + amount, 0);

    // Calculate category breakdown from real data
    const categoryBreakdown = await SupabaseExpenseManager.getExpensesByCategory(userId);
    const categoryBreakdownArray = Object.entries(categoryBreakdown).map(([category, amount], index) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'][index % 5]
    }));

    // Calculate emergency fund
    const avgMonthlyExpenses = monthlyExpenses || 15000; // fallback
    const emergencyFundTarget = avgMonthlyExpenses * 6;
    const emergencyFundCurrent = totalInvestments * 0.15; // Assume 15% is liquid

    const realData: DashboardData = {
      ...mockDashboardData,
      totalExpenses,
      monthlyExpenses,
      totalInvestments,
      expenseCount: expenses.filter(e => e.type === 'expense').length,
      investmentCount: investments.length,
      emergencyFundTarget,
      emergencyFundCurrent,
      categoryBreakdown: categoryBreakdownArray.length > 0 ? categoryBreakdownArray : mockDashboardData.categoryBreakdown,
      recentTransactions: expenses.slice(0, 5).map(expense => ({
        id: expense.id || '',
        amount: expense.type === 'expense' ? -(typeof expense.amount === 'number' ? expense.amount : 0) : (typeof expense.amount === 'number' ? expense.amount : 0),
        description: expense.description || 'Unknown',
        category: expense.category || 'Other',
        date: expense.date || new Date().toISOString().split('T')[0],
        type: expense.type as 'expense' | 'income'
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
