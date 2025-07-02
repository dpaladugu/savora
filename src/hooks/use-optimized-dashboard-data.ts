
import { useQuery } from "@tanstack/react-query";
import { DashboardData } from "@/types/dashboard"; // This type might need adjustment based on data from IndexedDB
import { Logger } from "@/services/logger";
// import { SupabaseExpenseManager } from "@/services/supabase-expense-manager"; // Will be replaced by IndexedDB
// import { SupabaseInvestmentManager } from "@/services/supabase-investment-manager"; // Will be replaced by IndexedDB
import { useAuth } from "@/contexts/auth-context"; // Keep for now, might simplify if no backend auth
import { db, Expense } from "@/db"; // Import Dexie db and Expense type
// Assuming Investment type will be defined in db.ts later or we use a placeholder
// For now, investments will be mocked or zeroed.

// Enhanced mock data for development - will be mostly replaced by calculations from DB
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
  // Removed the outer try-catch that returns mockDashboardData.
  // Let react-query handle errors and retries.
  // If fetchDashboardData throws, react-query will set the error state.

  Logger.info('Fetching dashboard data for user:', userId);

  // Simulate API delay for realistic loading experience - consider removing for production or making it dev-only
  // await new Promise(resolve => setTimeout(resolve, 800));

  // Fetch real data from IndexedDB
  // The userId parameter might be optional if all data in IndexedDB is for the current user.
  // For now, we'll assume db.expenses.toArray() gets all relevant expenses.
  const allExpenses: Expense[] = await db.expenses.toArray();

  // TODO: Fetch investments from IndexedDB once the 'investments' table is defined and populated
  const allInvestments: any[] = []; // Placeholder

  // Calculate real metrics
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthlyExpenses = allExpenses
    .filter(expense => expense.date?.startsWith(currentMonth) && expense.type === 'expense')
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const totalExpenses = allExpenses
    .filter(expense => expense.type === 'expense')
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);

  // Placeholder for investments - replace with actual calculation from allInvestments
  const totalInvestments = allInvestments.reduce((sum, investment) => sum + (investment.currentValue || investment.amount || 0), 0);
  const investmentCount = allInvestments.length;

  // Calculate category breakdown from IndexedDB expenses
  const categoryTotals: { [key: string]: number } = {};
  allExpenses
    .filter(expense => expense.type === 'expense')
    .forEach(expense => {
      const category = expense.category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
    });

  const categoryBreakdownArray = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a) // Sort by amount descending
    .map(([category, amount], index) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      // Consistent colors, or generate dynamically based on more categories
      color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1', '#ec4899'][index % 7]
    }));

  // Calculate emergency fund - using placeholders for now
  // TODO: This needs to be based on actual user settings for EF months and potentially liquid savings
  const avgMonthlyExpensesForEF = monthlyExpenses || (totalExpenses / 6) || 30000; // More robust fallback
  const emergencyFundTarget = avgMonthlyExpensesForEF * 6; // Default 6 months
  // Placeholder: current emergency fund might be a specific account type or goal
  const emergencyFundCurrent = Math.min(totalInvestments * 0.1, emergencyFundTarget); // Highly speculative

  // Build the DashboardData object
  // We use some parts of mockDashboardData as fallbacks or for structure if not yet calculated
  const realData: DashboardData = {
    ...mockDashboardData, // Spread mock first, then override with real calculated values
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
// Removed the orphaned catch block.
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
