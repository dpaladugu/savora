
import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import type { EmergencyFund, Txn } from '@/lib/db';

interface EmergencyFundCalculation {
  monthlyRequired: number;
  emergencyFundRequired: number;
  currentCoverage: number;
  shortfall: number;
}

interface EmergencyFundData {
  monthlyExpenses: number;
  dependents: number;
  monthlyEMIs: number;
  insurancePremiums: number;
  bufferPercentage: number;
  currentCorpus: number;
  rentalIncome: number;
  emergencyMonths: number;
}

interface UseEmergencyFundReturn {
  data: EmergencyFundData;
  updateData: (field: keyof EmergencyFundData | any, value?: any) => void;
  loading: boolean;
  missingData: string[];
  calculation: EmergencyFundCalculation;
  refreshData: () => void;
  totalExpenses: number;
  totalIncome: number;
  totalSavings: number;
  monthsCovered: number;
  emergencyFunds: EmergencyFund[];
}

export const useEmergencyFund = (): UseEmergencyFundReturn => {
  const [data, setData] = useState<EmergencyFundData>({
    monthlyExpenses: 0,
    dependents: 0,
    monthlyEMIs: 0,
    insurancePremiums: 0,
    bufferPercentage: 20,
    currentCorpus: 0,
    rentalIncome: 0,
    emergencyMonths: 6,
  });

  const [loading, setLoading] = useState(false);
  const [emergencyFunds, setEmergencyFunds] = useState<EmergencyFund[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);

  const updateData = (field: keyof EmergencyFundData | any, value?: any) => {
    if (typeof field === 'object') {
      // Handle object updates
      setData(prev => ({ ...prev, ...field }));
    } else {
      // Handle single field updates
      setData(prev => ({ ...prev, [field]: value }));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    try {
      const [transactions, emergencyFundsData] = await Promise.all([
        db.txns.toArray(),
        db.emergencyFunds.toArray()
      ]);

      // Calculate totals from transactions
      const income = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Calculate monthly averages (assuming 12 months of data)
      const monthlyExpenses = expenses / 12;
      const monthlyIncome = income / 12;

      // Get total emergency fund savings
      const savings = emergencyFundsData.reduce((sum, fund) => sum + fund.currentAmount, 0);

      setTotalExpenses(monthlyExpenses);
      setTotalIncome(monthlyIncome);
      setTotalSavings(savings);
      setEmergencyFunds(emergencyFundsData);

      // Update data with calculated values if they're not set
      setData(prev => ({
        ...prev,
        monthlyExpenses: prev.monthlyExpenses || monthlyExpenses,
        currentCorpus: prev.currentCorpus || savings,
      }));
    } catch (error) {
      console.error("Error fetching emergency fund data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate emergency fund requirements
  const calculation: EmergencyFundCalculation = {
    monthlyRequired: (data.monthlyExpenses * (1 + data.bufferPercentage / 100)) + data.monthlyEMIs,
    get emergencyFundRequired() {
      return this.monthlyRequired * data.emergencyMonths;
    },
    get currentCoverage() {
      return this.monthlyRequired > 0 ? data.currentCorpus / this.monthlyRequired : 0;
    },
    get shortfall() {
      return Math.max(0, this.emergencyFundRequired - data.currentCorpus);
    },
  };

  // Detect missing data
  const missingData: string[] = [];
  if (data.monthlyExpenses === 0) missingData.push('Monthly expenses not set');
  if (data.currentCorpus === 0) missingData.push('Current corpus not set');

  const monthsCovered = totalExpenses > 0 ? totalSavings / totalExpenses : 0;

  return {
    data,
    updateData,
    loading,
    missingData,
    calculation,
    refreshData: fetchData,
    totalExpenses,
    totalIncome,
    totalSavings,
    monthsCovered,
    emergencyFunds,
  };
};
