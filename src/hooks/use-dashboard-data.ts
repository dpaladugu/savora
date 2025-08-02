
import { useState, useEffect } from 'react';
import { ExpenseService } from '@/services/ExpenseService';
import { IncomeService } from '@/services/IncomeService';

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

  return { expenses, incomes, loading, error };
}
