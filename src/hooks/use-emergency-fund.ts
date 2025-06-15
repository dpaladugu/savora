
import { useState, useEffect } from "react";
import { FirestoreService } from "@/services/firestore";
import { useAuth } from "@/contexts/auth-context";

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

interface EmergencyFundCalculation {
  monthlyRequired: number;
  emergencyFundRequired: number;
  currentCoverage: number;
  shortfall: number;
}

export function useEmergencyFund() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [missingData, setMissingData] = useState<string[]>([]);
  
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

  useEffect(() => {
    if (user) {
      calculateFromExpenses();
    }
  }, [user]);

  const calculateFromExpenses = async () => {
    if (!user) return;
    
    try {
      const expenses = await FirestoreService.getExpenses(user.uid);
      
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const recentExpenses = expenses.filter(expense => 
        new Date(expense.date) >= sixMonthsAgo
      );
      
      const essentialExpenses = recentExpenses.filter(expense => 
        !expense.description?.toLowerCase().includes('bill payment') &&
        !expense.description?.toLowerCase().includes('emi') &&
        !expense.description?.toLowerCase().includes('transfer') &&
        (expense.category === 'Food' || 
         expense.category === 'Bills' || 
         expense.category === 'Health' || 
         expense.category === 'Transport' || 
         expense.category === 'Groceries' ||
         expense.tags?.includes('essential'))
      );
      
      const totalEssential = essentialExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const avgMonthlyEssential = totalEssential / 6;
      
      const missing: string[] = [];
      
      const emiExpenses = recentExpenses.filter(expense => 
        expense.description?.toLowerCase().includes('emi') ||
        expense.category === 'EMI' ||
        expense.tags?.includes('emi')
      );
      
      const insuranceExpenses = recentExpenses.filter(expense => 
        expense.description?.toLowerCase().includes('insurance') ||
        expense.category === 'Insurance' ||
        expense.tags?.includes('insurance')
      );
      
      if (emiExpenses.length === 0) {
        missing.push('EMI/Loan details');
      }
      
      if (insuranceExpenses.length === 0) {
        missing.push('Insurance premium details');
      }
      
      setData(prev => ({
        ...prev,
        monthlyExpenses: Math.round(avgMonthlyEssential),
        monthlyEMIs: emiExpenses.length > 0 ? Math.round(emiExpenses.reduce((sum, expense) => sum + expense.amount, 0) / 6) : 0,
        insurancePremiums: insuranceExpenses.length > 0 ? Math.round(insuranceExpenses.reduce((sum, expense) => sum + expense.amount, 0) * 2) : 0,
      }));
      
      setMissingData(missing);
      
      console.log(`Calculated emergency fund requirements from actual data`);
    } catch (error) {
      console.error('Failed to calculate emergency fund requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateData = (field: keyof EmergencyFundData, value: number) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const calculateEmergencyFund = (): EmergencyFundCalculation => {
    const baseExpenses = data.monthlyExpenses;
    const dependentFactor = data.dependents * 0.3;
    const emiBuffer = data.monthlyEMIs;
    const insuranceBuffer = data.insurancePremiums / 12;
    const bufferAmount = (baseExpenses * data.bufferPercentage) / 100;
    
    const monthlyRequired = baseExpenses + (baseExpenses * dependentFactor) + emiBuffer + insuranceBuffer + bufferAmount - data.rentalIncome;
    const emergencyFundRequired = monthlyRequired * data.emergencyMonths;
    
    return {
      monthlyRequired: Math.round(Math.max(0, monthlyRequired)),
      emergencyFundRequired: Math.round(Math.max(0, emergencyFundRequired)),
      currentCoverage: data.currentCorpus > 0 ? Math.round(data.currentCorpus / Math.max(1, monthlyRequired)) : 0,
      shortfall: Math.max(0, emergencyFundRequired - data.currentCorpus)
    };
  };

  return {
    data,
    updateData,
    loading,
    missingData,
    calculation: calculateEmergencyFund(),
  };
}
