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
  data?: any;
  calculation?: any;
  loading?: boolean;
  missingData?: string[];
  refreshData?: () => void;
  updateData?: (data: any) => void;
}

export const useEmergencyFund = () => {
  const [emergencyFundData, setEmergencyFundData] = useState<EmergencyFundData>({
    totalExpenses: 0,
    totalIncome: 0,
    totalSavings: 0,
    monthsCovered: 0,
    accountsData: [],
    loading: false,
    missingData: [],
  });
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user) return;

    setEmergencyFundData(prev => ({ ...prev, loading: true }));
    
    try {
      const expenses = await ExpenseService.getExpenses();
      const income = await IncomeService.getIncomes();
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
        accountsData: accounts,
        data: { totalExpenses, totalIncome, totalSavings, monthsCovered },
        calculation: { monthsCovered },
        loading: false,
        missingData: [],
        refreshData: fetchData,
        updateData: (data) => setEmergencyFundData(prev => ({ ...prev, data })),
      });
    } catch (error) {
      console.error("Error fetching emergency fund data:", error);
      setEmergencyFundData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return emergencyFundData;
};
