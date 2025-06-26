
import { useState, useEffect } from "react";
import { FirestoreService } from "@/services/firestore";
import { DataIntegrationService } from "@/services/data-integration";
import { useAuth } from "@/contexts/auth-context";

interface EmergencyFundData {
  monthlyExpenses: number;
  dependents: number;
  monthlyEMIs: number;
  insurancePremiums: number;
  bufferPercentage: number;
  currentCorpus: number;
  rentalIncome: number;
  emergencyMonths: number; // User's desired months, can be an input to LLM
  // New fields for more detailed AI advice
  numIncomeSources?: number; // Optional, as it might not be readily available
  jobStability?: 'high' | 'medium' | 'low';
  otherLiquidSavings?: number;
  efRiskTolerance?: 'conservative' | 'moderate' | 'aggressive';
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
    // Default values for new fields
    numIncomeSources: 1, // Default to 1, user can change
    jobStability: 'medium',
    otherLiquidSavings: 0,
    efRiskTolerance: 'moderate',
  });

  useEffect(() => {
    if (user) {
      loadIntegratedData();
    }
  }, [user]);

  const loadIntegratedData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load data from all modules concurrently
      const [expenses, insurances, emis, rentals] = await Promise.all([
        FirestoreService.getExpenses(user.uid),
        DataIntegrationService.getInsuranceData(user.uid),
        DataIntegrationService.getEMIData(user.uid),
        DataIntegrationService.getRentalData(user.uid)
      ]);
      
      // Calculate essential expenses from expense data
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
      const avgMonthlyEssential = recentExpenses.length > 0 ? totalEssential / 6 : 0;
      
      // Calculate data from integrated modules
      const monthlyEMIs = DataIntegrationService.calculateMonthlyEMIs(emis);
      const annualInsurancePremiums = DataIntegrationService.calculateAnnualInsurancePremiums(insurances);
      const monthlyRentalIncome = DataIntegrationService.calculateMonthlyRentalIncome(rentals);
      
      // Determine missing data
      const missing: string[] = [];
      
      if (emis.length === 0) {
        missing.push('EMI/Loan details - Add your active loans');
      }
      
      if (insurances.length === 0) {
        missing.push('Insurance policies - Add your active policies');
      }
      
      if (avgMonthlyEssential === 0) {
        missing.push('Monthly expenses - Add your regular expenses');
      }
      
      // Update state with real data
      setData(prev => ({
        ...prev,
        monthlyExpenses: Math.round(avgMonthlyEssential),
        monthlyEMIs: monthlyEMIs,
        insurancePremiums: annualInsurancePremiums,
        rentalIncome: monthlyRentalIncome,
      }));
      
      setMissingData(missing);
      
      console.log('Emergency fund data loaded:', {
        monthlyExpenses: Math.round(avgMonthlyEssential),
        monthlyEMIs,
        annualInsurancePremiums,
        monthlyRentalIncome,
        missingDataCount: missing.length
      });
      
    } catch (error) {
      console.error('Failed to load integrated emergency fund data:', error);
      setMissingData(['Unable to load data - Please check your connection']);
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
    refreshData: loadIntegratedData,
  };
}
