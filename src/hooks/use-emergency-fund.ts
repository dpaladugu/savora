
import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import type { EmergencyFund, Txn } from '@/lib/db';

interface EmergencyFundData {
  totalExpenses: number;
  totalIncome: number;
  totalSavings: number;
  monthsCovered: number;
  emergencyFunds: EmergencyFund[];
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
    emergencyFunds: [],
    loading: false,
    missingData: [],
  });

  const fetchData = async () => {
    setEmergencyFundData(prev => ({ ...prev, loading: true }));
    
    try {
      const [transactions, emergencyFunds] = await Promise.all([
        db.txns.toArray(),
        db.emergencyFunds.toArray()
      ]);

      // Calculate totals from transactions
      const totalIncome = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Calculate monthly averages
      const monthlyExpenses = totalExpenses / 12; // Assuming 12 months of data
      const monthlyIncome = totalIncome / 12;

      // Get total emergency fund savings
      const totalSavings = emergencyFunds.reduce((sum, fund) => sum + fund.currentAmount, 0);

      const monthsCovered = monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0;

      setEmergencyFundData({
        totalExpenses: monthlyExpenses,
        totalIncome: monthlyIncome,
        totalSavings,
        monthsCovered,
        emergencyFunds,
        data: { totalExpenses: monthlyExpenses, totalIncome: monthlyIncome, totalSavings, monthsCovered },
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
  }, []);

  return emergencyFundData;
};
