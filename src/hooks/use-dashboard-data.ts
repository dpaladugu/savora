
import { useState, useEffect, useCallback } from "react";
import { FirestoreService } from "@/services/firestore";
import { DataIntegrationService } from "@/services/data-integration";
import { useAuth } from "@/contexts/auth-context";
import { DashboardData } from "@/types/dashboard";
import { Logger } from "@/services/logger";
import { useErrorHandler } from "./use-error-handler";
import { useLoadingState } from "./use-loading-state";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let dataCache: { data: DashboardData; timestamp: number } | null = null;

export function useDashboardData() {
  const { user } = useAuth();
  const { handleError, clearError, errorMessage } = useErrorHandler();
  const { isLoading, startLoading, stopLoading } = useLoadingState();
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalExpenses: 0,
    monthlyExpenses: 0,
    totalInvestments: 0,
    expenseCount: 0,
    investmentCount: 0,
    emergencyFundTarget: 0,
    emergencyFundCurrent: 0
  });

  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    if (!user) {
      Logger.warn('Attempted to load dashboard data without user');
      return;
    }

    // Check cache first
    if (!forceRefresh && dataCache && (Date.now() - dataCache.timestamp < CACHE_DURATION)) {
      Logger.debug('Using cached dashboard data');
      setDashboardData(dataCache.data);
      return;
    }
    
    try {
      startLoading('Loading dashboard data...');
      clearError();
      
      Logger.info('Fetching dashboard data', { userId: user.uid, forceRefresh });
      
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
      
      const newData: DashboardData = {
        totalExpenses,
        monthlyExpenses,
        totalInvestments,
        expenseCount: expenses.length,
        investmentCount: investments.length,
        emergencyFundTarget,
        emergencyFundCurrent
      };

      setDashboardData(newData);
      
      // Cache the data
      dataCache = {
        data: newData,
        timestamp: Date.now()
      };
      
      Logger.info('Dashboard data loaded successfully', newData);
    } catch (err) {
      Logger.error('Failed to load dashboard data', err);
      handleError(err as Error, 'Failed to load dashboard data');
    } finally {
      stopLoading();
    }
  }, [user, startLoading, stopLoading, clearError, handleError]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  const refetch = useCallback(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  return { 
    dashboardData, 
    loading: isLoading, 
    error: errorMessage, 
    refetch 
  };
}
