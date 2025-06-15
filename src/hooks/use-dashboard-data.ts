
import { useState, useEffect } from "react";
import { FirestoreService } from "@/services/firestore";
import { DataIntegrationService } from "@/services/data-integration";
import { useAuth } from "@/contexts/auth-context";
import { DashboardData } from "@/types/dashboard";

export function useDashboardData() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalExpenses: 0,
    monthlyExpenses: 0,
    totalInvestments: 0,
    expenseCount: 0,
    investmentCount: 0,
    emergencyFundTarget: 0,
    emergencyFundCurrent: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [expenses, investments, insurances, emis, rentals] = await Promise.all([
        FirestoreService.getExpenses(user.uid),
        FirestoreService.getInvestments(user.uid),
        DataIntegrationService.getInsuranceData(user.uid),
        DataIntegrationService.getEMIData(user.uid),
        DataIntegrationService.getRentalData(user.uid)
      ]);
      
      const currentMonth = new Date().toISOString().substring(0, 7);
      const monthlyExpenses = expenses
        .filter(expense => expense.date.startsWith(currentMonth))
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalInvestments = investments.reduce((sum, investment) => sum + investment.amount, 0);
      
      // Calculate emergency fund requirements from actual data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const recentExpenses = expenses.filter(expense => 
        new Date(expense.date) >= sixMonthsAgo &&
        !expense.description?.toLowerCase().includes('bill payment') &&
        !expense.description?.toLowerCase().includes('emi')
      );
      
      const avgMonthlyExpenses = recentExpenses.length > 0 
        ? recentExpenses.reduce((sum, expense) => sum + expense.amount, 0) / 6
        : monthlyExpenses;
      
      // Include insurance premiums and EMIs in emergency fund calculation
      const annualInsurancePremiums = DataIntegrationService.calculateAnnualInsurancePremiums(insurances);
      const monthlyEMIs = DataIntegrationService.calculateMonthlyEMIs(emis);
      const monthlyRentalIncome = DataIntegrationService.calculateMonthlyRentalIncome(rentals);
      
      const adjustedMonthlyExpenses = avgMonthlyExpenses + (annualInsurancePremiums / 12) + monthlyEMIs - monthlyRentalIncome;
      const emergencyFundTarget = Math.max(adjustedMonthlyExpenses * 6, 0);
      const emergencyFundCurrent = totalInvestments * 0.15; // Assume 15% is emergency fund
      
      setDashboardData({
        totalExpenses,
        monthlyExpenses,
        totalInvestments,
        expenseCount: expenses.length,
        investmentCount: investments.length,
        emergencyFundTarget,
        emergencyFundCurrent
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return { dashboardData, loading, error, refetch: loadDashboardData };
}
