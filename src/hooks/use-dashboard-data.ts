
import { useState, useEffect } from "react";
import { FirestoreService } from "@/services/firestore";
import { useAuth } from "@/contexts/auth-context";

interface DashboardData {
  totalExpenses: number;
  monthlyExpenses: number;
  totalInvestments: number;
  expenseCount: number;
  investmentCount: number;
  emergencyFundTarget: number;
  emergencyFundCurrent: number;
}

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

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      const [expenses, investments] = await Promise.all([
        FirestoreService.getExpenses(user.uid),
        FirestoreService.getInvestments(user.uid)
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
      
      const emergencyFundTarget = avgMonthlyExpenses * 6;
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
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { dashboardData, loading, refetch: loadDashboardData };
}
