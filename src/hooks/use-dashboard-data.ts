
import { useState, useEffect } from 'react';
import { ExpenseService } from '@/services/ExpenseService';
import { IncomeService } from '@/services/IncomeService';
import type { DashboardData } from '@/types/financial';

export function useDashboardData() {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [expenseData, incomeData] = await Promise.all([
          ExpenseService.getExpenses(),
          IncomeService.getIncomes()
        ]);
        
        setExpenses(expenseData);
        setIncomes(incomeData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const dashboardData: DashboardData = {
    totalExpenses: expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
    monthlyExpenses: expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
    totalInvestments: 185450,
    expenseCount: expenses.length,
    investmentCount: 5,
    emergencyFundTarget: 600000,
    emergencyFundCurrent: 300000,
    monthlyIncome: incomes.reduce((sum: number, inc: any) => sum + inc.amount, 0),
    savingsRate: 40,
    investmentValue: 185450,
    creditCardDebt: 12340,
    emergencyFund: 300000,
    goals: [],
    recentTransactions: [],
    categoryBreakdown: []
  };

  return { expenses, incomes, loading, error, dashboardData };
}
