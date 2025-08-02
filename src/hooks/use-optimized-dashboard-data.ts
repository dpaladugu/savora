
import { useQuery } from "@tanstack/react-query";
import { DashboardData } from "@/types/dashboard";
import { Logger } from "@/services/logger";
import { db } from "@/db";
import type { Expense, Income, Investment } from '@/db';
import { format, parseISO, isValid } from 'date-fns';

// Helper function to safely parse dates
const safeParseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  
  if (dateValue instanceof Date) {
    return isValid(dateValue) ? dateValue : null;
  }
  
  if (typeof dateValue === 'string') {
    try {
      const parsed = parseISO(dateValue);
      return isValid(parsed) ? parsed : null;
    } catch (error) {
      console.warn('Failed to parse date string:', dateValue, error);
      return null;
    }
  }
  
  if (typeof dateValue === 'number') {
    const parsed = new Date(dateValue);
    return isValid(parsed) ? parsed : null;
  }
  
  return null;
};

async function fetchDashboardData(): Promise<DashboardData> {
  Logger.info('Fetching dashboard data from database');

  try {
    // Fetch all data concurrently with proper error handling
    const [expensesResult, incomesResult, investmentsResult, creditCardsResult, goalsResult, efSettingsResult] = 
      await Promise.allSettled([
        db.expenses.toArray(),
        db.incomes.toArray(),
        db.investments.toArray(),
        db.creditCards.toArray(),
        db.goals.toArray(),
        db.getEmergencyFundSettings()
      ]);

    // Extract successful results or use fallbacks
    const allExpenses = expensesResult.status === 'fulfilled' ? expensesResult.value : [];
    const allIncomes = incomesResult.status === 'fulfilled' ? incomesResult.value : [];
    const allInvestments = investmentsResult.status === 'fulfilled' ? investmentsResult.value : [];
    const allCreditCards = creditCardsResult.status === 'fulfilled' ? creditCardsResult.value : [];
    const allGoals = goalsResult.status === 'fulfilled' ? goalsResult.value : [];
    const efSettings = efSettingsResult.status === 'fulfilled' ? efSettingsResult.value : { efMonths: 6 };

    // Calculate current month metrics
    const currentMonthStr = format(new Date(), 'yyyy-MM');
    
    const monthlyExpenses = allExpenses
      .filter(e => {
        const expenseDate = safeParseDate(e.date);
        return expenseDate && format(expenseDate, 'yyyy-MM') === currentMonthStr;
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const totalExpenses = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const monthlyIncome = allIncomes
      .filter(i => {
        const incomeDate = safeParseDate(i.date);
        return incomeDate && format(incomeDate, 'yyyy-MM') === currentMonthStr;
      })
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    // Calculate investment metrics
    const totalInvestments = allInvestments.reduce((sum, inv) => {
      const currentValue = Number(inv.current_value || inv.currentValue) || 0;
      const investedValue = Number(inv.invested_value || inv.investedValue) || 0;
      return sum + Math.max(currentValue, investedValue);
    }, 0);

    // Calculate credit card debt
    const creditCardDebt = allCreditCards.reduce((sum, card) => {
      return sum + (Number(card.currentBalance) || 0);
    }, 0);

    // Calculate emergency fund
    const avgMonthlyExpenses = monthlyExpenses > 0 ? monthlyExpenses : (totalExpenses / Math.max(6, 1));
    const emergencyFundTarget = avgMonthlyExpenses * efSettings.efMonths;
    const emergencyFundCurrent = efSettings.currentAmount || 0;

    // Calculate savings rate
    const savingsRate = monthlyIncome > 0 ? 
      Math.max(0, Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)) : 0;

    // Create category breakdown
    const categoryTotals: { [key: string]: number } = {};
    allExpenses.forEach(e => {
      const category = e.category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + (Number(e.amount) || 0);
    });

    const categoryBreakdown = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
        color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1', '#ec4899'][index % 7] || '#6b7280'
      }));

    // Create recent transactions
    const allTransactions = [
      ...allExpenses.map(e => ({ 
        ...e, 
        type: 'expense' as const,
        date: e.date?.toString() || '',
        description: e.description || 'Expense'
      })),
      ...allIncomes.map(i => ({ 
        ...i, 
        type: 'income' as const,
        date: i.date?.toString() || '',
        description: i.description || 'Income'
      }))
    ];

    const recentTransactions = allTransactions
      .filter(t => t.date && safeParseDate(t.date))
      .sort((a, b) => {
        const dateA = safeParseDate(a.date);
        const dateB = safeParseDate(b.date);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5)
      .map(t => ({
        id: String(t.id || crypto.randomUUID()),
        amount: t.type === 'expense' ? -(Number(t.amount) || 0) : (Number(t.amount) || 0),
        description: t.description,
        category: t.category || 'Uncategorized',
        date: t.date,
        type: t.type
      }));

    // Transform goals data
    const transformedGoals = allGoals.map(goal => ({
      id: goal.id,
      title: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.targetDate.toISOString(),
      category: goal.type
    }));

    const dashboardData: DashboardData = {
      totalExpenses,
      monthlyExpenses,
      totalInvestments,
      expenseCount: allExpenses.length,
      investmentCount: allInvestments.length,
      emergencyFundTarget,
      emergencyFundCurrent,
      monthlyIncome,
      savingsRate,
      investmentValue: totalInvestments,
      creditCardDebt,
      emergencyFund: emergencyFundTarget,
      goals: transformedGoals,
      recentTransactions,
      categoryBreakdown
    };

    Logger.info('Dashboard data calculated successfully', dashboardData);
    return dashboardData;

  } catch (error) {
    Logger.error('Error fetching dashboard data:', error);
    console.error('Dashboard data fetch error:', error);
    
    // Return minimal fallback data
    return {
      totalExpenses: 0,
      monthlyExpenses: 0,
      totalInvestments: 0,
      expenseCount: 0,
      investmentCount: 0,
      emergencyFundTarget: 0,
      emergencyFundCurrent: 0,
      monthlyIncome: 0,
      savingsRate: 0,
      investmentValue: 0,
      creditCardDebt: 0,
      emergencyFund: 0,
      goals: [],
      recentTransactions: [],
      categoryBreakdown: []
    };
  }
}

export function useOptimizedDashboardData() {
  const query = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
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
