import { useState, useEffect } from 'react';
import { ExpenseService } from '@/services/ExpenseService';
import { IncomeService } from '@/services/IncomeService';
import { InvestmentService } from '@/services/InvestmentService';
import { AccountService } from '@/services/AccountService';
import { useAuth } from '@/services/auth-service';

interface EmergencyFundData {
  totalExpenses: number;
  totalIncome: number;
  totalSavings: number;
  monthsCovered: number;
  accountsData: any[];
}

export const useEmergencyFund = () => {
  const [emergencyFundData, setEmergencyFundData] = useState<EmergencyFundData>({
    totalExpenses: 0,
    totalIncome: 0,
    totalSavings: 0,
    monthsCovered: 0,
    accountsData: []
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const expenses = await ExpenseService.getExpenses(user.uid);
        const income = await IncomeService.getIncomeSources(user.uid);
        const accounts = await AccountService.getAccounts(user.uid);

        const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
        const totalIncome = income.reduce((acc, income) => acc + income.amount, 0);
        const totalSavings = accounts.reduce((acc, account) => acc + account.balance, 0);

        const monthsCovered = totalExpenses > 0 ? totalSavings / totalExpenses : 0;

        setEmergencyFundData({
          totalExpenses,
          totalIncome,
          totalSavings,
          monthsCovered,
          accountsData: accounts
        });
      } catch (error) {
        console.error("Error fetching emergency fund data:", error);
      }
    };

    fetchData();
  }, [user]);

  return emergencyFundData;
};
