import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/services/auth-service";
import { VehicleService } from "@/services/VehicleService";
import { GoldInvestmentService } from "@/services/GoldInvestmentService";
import { InvestmentService } from "@/services/InvestmentService";
import { ExpenseService } from "@/services/ExpenseService";
import { IncomeService } from "@/services/IncomeService";

export const useDashboardData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<{
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsRate: number;
    totalInvestments: number;
    investmentCount: number;
    emergencyFundCurrent: number;
    emergencyFundTarget: number;
    creditCardDebt: number;
  } | null>(null);
  const [vehicles, setVehicles] = useState([]);
  const [goldInvestments, setGoldInvestments] = useState([]);
  const [investments, setInvestments] = useState([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const [
        monthlyIncome,
        monthlyExpenses,
        allInvestments,
        allVehicles,
        allGoldInvestments
      ] = await Promise.all([
        IncomeService.getMonthlyIncome(user.uid, currentMonth),
        ExpenseService.getMonthlyExpenses(user.uid, currentMonth),
        InvestmentService.getAll(user.uid),
        VehicleService.getAll(user.uid),
        GoldInvestmentService.getAll(user.uid)
      ]);

      const totalIncome = monthlyIncome || 0;
      const totalExpenses = monthlyExpenses || 0;
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

      setInvestments(allInvestments);
      setVehicles(allVehicles);
      setGoldInvestments(allGoldInvestments);

      setDashboardData({
        monthlyIncome: totalIncome,
        monthlyExpenses: totalExpenses,
        savingsRate: savingsRate,
        totalInvestments: 0, // calculated below
        investmentCount: allInvestments.length,
        emergencyFundCurrent: 5000, // hardcoded
        emergencyFundTarget: 10000, // hardcoded
        creditCardDebt: 1000 // hardcoded
      });
    } catch (e: any) {
      setError(e.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateTotalAssets = useCallback(() => {
    let total = 0;
    
    // Add vehicle values safely
    vehicles.forEach(vehicle => {
      // Use a default value if currentValue doesn't exist
      const vehicleValue = (vehicle as any).currentValue || (vehicle as any).current_value || 0;
      total += vehicleValue;
    });
    
    // Add gold investment values safely
    goldInvestments.forEach(gold => {
      // Use a default value if totalValue doesn't exist
      const goldValue = (gold as any).totalValue || (gold as any).total_value || (gold.quantity * gold.rate_per_unit) || 0;
      total += goldValue;
    });
    
    investments.forEach(investment => {
      total += (investment.current_value || investment.current_price || 0);
    });

    return total;
  }, [vehicles, goldInvestments, investments]);

  useEffect(() => {
    if (dashboardData) {
      setDashboardData(prev => ({
        ...prev!,
        totalInvestments: calculateTotalAssets(),
      }));
    }
  }, [vehicles, goldInvestments, investments, dashboardData, calculateTotalAssets]);

  const refetch = () => {
    fetchData();
  };

  return { dashboardData, loading, error, refetch };
};
