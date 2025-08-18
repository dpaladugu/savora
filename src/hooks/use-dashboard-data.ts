
import { useState, useEffect } from 'react';
import { ExpenseService } from '@/services/ExpenseService';
import { IncomeService } from '@/services/IncomeService';
import { InvestmentService } from '@/services/InvestmentService';
import type { DashboardData, Transaction, CategoryBreakdown, Goal } from '@/types/financial';

export function useDashboardData() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalExpenses: 0,
    monthlyExpenses: 0,
    totalInvestments: 0,
    expenseCount: 0,
    investmentCount: 0,
    emergencyFundTarget: 600000,
    emergencyFundCurrent: 300000,
    monthlyIncome: 0,
    savingsRate: 40,
    investmentValue: 0,
    creditCardDebt: 12340,
    emergencyFund: 300000,
    goals: [],
    recentTransactions: [],
    categoryBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [expenses, incomes, investments] = await Promise.all([
          ExpenseService.getExpenses(),
          IncomeService.getIncomes(),
          InvestmentService.getInvestments()
        ]);
        
        const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
        const monthlyIncome = incomes.reduce((sum: number, inc: any) => sum + inc.amount, 0);
        const totalInvestments = investments.reduce((sum: number, inv: any) => sum + (inv.currentValue || 0), 0);

        // Convert expenses to recent transactions format
        const recentTransactions: Transaction[] = expenses.slice(0, 10).map((expense: any) => ({
          id: expense.id,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          date: expense.date,
          type: 'expense' as const
        }));

        // Calculate category breakdown
        const categoryTotals = expenses.reduce((acc: Record<string, number>, expense: any) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        }, {});

        const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoryTotals).map(([category, amount]) => ({
          category,
          amount: amount as number,
          percentage: totalExpenses > 0 ? ((amount as number) / totalExpenses) * 100 : 0,
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
        }));

        const newDashboardData: DashboardData = {
          totalExpenses,
          monthlyExpenses: totalExpenses, // Assuming current period is monthly
          totalInvestments,
          expenseCount: expenses.length,
          investmentCount: investments.length,
          emergencyFundTarget: 600000,
          emergencyFundCurrent: 300000,
          monthlyIncome,
          savingsRate: monthlyIncome > 0 ? ((monthlyIncome - totalExpenses) / monthlyIncome) * 100 : 0,
          investmentValue: totalInvestments,
          creditCardDebt: 12340, // This would come from credit card service
          emergencyFund: 300000, // This would come from emergency fund service
          goals: [], // This would come from goals service
          recentTransactions,
          categoryBreakdown
        };
        
        setDashboardData(newDashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { dashboardData, loading, error };
}
