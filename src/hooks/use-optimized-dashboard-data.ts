
import { useQuery } from "@tanstack/react-query";
import { DashboardData, Goal } from "@/types/dashboard";
import { Logger } from "@/services/logger";
import {
  db,
  AppSettingTable, // Type for appSettings records
  // Expense as DbExpenseType, // This is ExpenseData from jsonPreload
  // Income as DbIncomeType, // This is from income-tracker component
  InvestmentData as DbInvestmentType,
  CreditCardData as DbCreditCardType
} from "@/db";
// Use AppExpense for expenses table as defined in SavoraDB
import type { Expense as AppExpense } from '@/services/supabase-data-service';
// Use Income from income-tracker for incomes table as defined in SavoraDB
import type { Income as AppIncome } from '@/components/income/income-tracker';
import { format, parseISO } from 'date-fns';


// Default AppSetting for Emergency Fund if not found in DB
const DEFAULT_EF_MONTHS = 6;
const EF_SETTING_KEY = 'emergencyFundSettings_v1';

interface EmergencyFundSetting {
  key: string; // Should be EF_SETTING_KEY
  value: {
    efMonths: number;
    // could add targetAmount manually if preferred over calculation
    // manualTargetAmount?: number;
  };
}


// Keep mock for structure reference, but aim to replace all fields with real data or null/empty.
const fallbackDashboardData: DashboardData = {
  totalExpenses: 0,
  monthlyExpenses: 0,
  totalInvestments: 0,
  expenseCount: 0,
  investmentCount: 0,
  emergencyFundTarget: 0,
  emergencyFundCurrent: 0, // Placeholder - requires specific tracking
  monthlyIncome: 0,
  savingsRate: 0,
  investmentValue: 0, // Same as totalInvestments
  creditCardDebt: 0,
  emergencyFund: 0, // Same as emergencyFundTarget
  goals: [], // Placeholder - requires goal tracking feature
  recentTransactions: [],
  categoryBreakdown: []
};

async function fetchDashboardData(): Promise<DashboardData> {
  Logger.info('Fetching dashboard data from Dexie');

  // Fetch all necessary data concurrently
  const [
    allDexieExpenses,
    allDexieIncomes,
    allDexieInvestments,
    allDexieCreditCards,
    efSettingsData
  ] = await Promise.all([
    db.expenses.toArray(), // Assuming AppExpense type from Dexie table
    db.incomes.toArray(),   // Assuming AppIncome type from Dexie table
    db.investments.toArray(), // DbInvestmentType
    db.creditCards.toArray(), // DbCreditCardType
    db.appSettings.get(EF_SETTING_KEY) as Promise<EmergencyFundSetting | AppSettingTable | undefined>
  ]);

  // Cast to correct types after fetch for clarity in calculations
  const allExpenses = allDexieExpenses as AppExpense[];
  const allIncomes = allDexieIncomes as AppIncome[];
  const allInvestments = allDexieInvestments as DbInvestmentType[];
  const allCreditCards = allDexieCreditCards as DbCreditCardType[];


  // Calculate Expense Metrics
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const monthlyExpenses = allExpenses
    .filter(e => e.date?.startsWith(currentMonthStr)) // No type filter, assuming db.expenses only stores expenses
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalExpenses = allExpenses
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const expenseCount = allExpenses.length;

  // Calculate Income Metrics
  const monthlyIncome = allIncomes
    .filter(i => i.date?.startsWith(currentMonthStr))
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  // Calculate Investment Metrics
  // Assuming DbInvestmentType has 'currentValue' or 'investedAmount'
  const totalInvestments = allInvestments.reduce((sum, inv) => sum + (Number(inv.currentValue) || Number(inv.investedAmount) || 0), 0);
  const investmentCount = allInvestments.length;

  // Calculate Category Breakdown for Expenses
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

  // Calculate Emergency Fund
  const efMonths = (efSettingsData?.value as EmergencyFundSetting['value'])?.efMonths || DEFAULT_EF_MONTHS;
  // More robust average monthly expenses (e.g., last 3-6 months average)
  // For simplicity, using current month's expenses, or total if current is zero.
  const avgMonthlyExpensesForEF = monthlyExpenses > 0 ? monthlyExpenses : (expenseCount > 0 ? totalExpenses / Math.max(1, new Date(allExpenses[0].date).getMonth() +1 ) : 30000 ) ; // Fallback if no expenses
  const emergencyFundTarget = avgMonthlyExpensesForEF * efMonths;
  const emergencyFundCurrent = 0; // Placeholder: Requires specific accounts/investments tagged as EF

  // Calculate Savings Rate
  const savingsRate = monthlyIncome > 0 ? Math.max(0, Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)) : 0;

  // Calculate Credit Card Debt
  // Assuming DbCreditCardType has 'outstandingBalance' or similar
  const creditCardDebt = allCreditCards.reduce((sum, card) => sum + (Number(card.outstandingBalance) || 0), 0);

  // Prepare Recent Transactions (mix of expenses and incomes)
  // Sort all transactions by date to get the most recent ones
  const allTransactions = [
    ...allExpenses.map(e => ({ ...e, type: 'expense' as const, date: e.date || ''})), // Ensure date is string
    ...allIncomes.map(i => ({ ...i, type: 'income' as const, date: i.date || ''}))    // Ensure date is string
  ];

  const recentTransactions = allTransactions
    .filter(t => t.date) // Ensure date exists for sorting
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    .slice(0, 5)
    .map(t => ({
      id: String(t.id || self.crypto.randomUUID()),
      amount: t.type === 'expense' ? -(Number(t.amount) || 0) : (Number(t.amount) || 0),
      description: t.description || 'N/A',
      category: t.category || 'Uncategorized',
      date: t.date,
      type: t.type
    }));

  const realData: DashboardData = {
    totalExpenses,
    monthlyExpenses,
    totalInvestments,
    expenseCount,
    investmentCount,
    emergencyFundTarget,
    emergencyFundCurrent, // Placeholder
    monthlyIncome,
    savingsRate,
    investmentValue: totalInvestments, // Typically same as totalInvestments unless defined differently
    creditCardDebt,
    emergencyFund: emergencyFundTarget, // DashboardData might expect 'emergencyFund' to be the target
    goals: [], // Placeholder - needs goal feature & Dexie table
    recentTransactions,
    categoryBreakdown,
  };

  Logger.info('Dashboard data calculated from Dexie:', realData);
  console.log("Dashboard data calculated from Dexie:", realData);
  return realData;
}

export function useOptimizedDashboardData() {
  const query = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: () => fetchDashboardData(),
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
