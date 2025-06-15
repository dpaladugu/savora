
import { useState, useEffect, useMemo, useCallback } from "react";
import { FirestoreService } from "@/services/firestore";
import { DataIntegrationService } from "@/services/data-integration";
import { useAuth } from "@/contexts/auth-context";
import { DashboardData } from "@/types/dashboard";
import { useErrorHandler } from "./use-error-handler";
import { useLoadingState } from "./use-loading-state";
import { Logger } from "@/services/logger";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

interface CachedData {
  data: DashboardData;
  timestamp: number;
}

export function useOptimizedDashboardData() {
  const { user } = useAuth();
  const { handleError, clearError, errorMessage } = useErrorHandler();
  const { isLoading, startLoading, stopLoading, updateProgress } = useLoadingState();
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalExpenses: 0,
    monthlyExpenses: 0,
    totalInvestments: 0,
    expenseCount: 0,
    investmentCount: 0,
    emergencyFundTarget: 0,
    emergencyFundCurrent: 0
  });

  const [cache, setCache] = useState<CachedData | null>(null);

  const isCacheValid = useMemo(() => {
    if (!cache) return false;
    return Date.now() - cache.timestamp < CACHE_DURATION;
  }, [cache]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string,
    attempts = RETRY_ATTEMPTS
  ): Promise<T> => {
    for (let i = 0; i < attempts; i++) {
      try {
        const result = await operation();
        Logger.debug(`${context} succeeded on attempt ${i + 1}`);
        return result;
      } catch (error) {
        Logger.warn(`${context} failed on attempt ${i + 1}`, error);
        if (i === attempts - 1) throw error;
        await sleep(RETRY_DELAY * (i + 1));
      }
    }
    throw new Error(`${context} failed after ${attempts} attempts`);
  }, []);

  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid && cache) {
      Logger.debug('Using cached dashboard data');
      setDashboardData(cache.data);
      return;
    }
    
    try {
      startLoading('Loading dashboard data...', 0);
      clearError();
      
      Logger.info('Fetching dashboard data', { userId: user.uid, forceRefresh });
      
      // Fetch all data with progress tracking
      updateProgress(20, 'Loading expenses...');
      const expenses = await fetchWithRetry(
        () => FirestoreService.getExpenses(user.uid),
        'Fetch expenses'
      );
      
      updateProgress(40, 'Loading investments...');
      const investments = await fetchWithRetry(
        () => FirestoreService.getInvestments(user.uid),
        'Fetch investments'
      );
      
      updateProgress(60, 'Loading insurance data...');
      const insurances = await fetchWithRetry(
        () => DataIntegrationService.getInsuranceData(user.uid),
        'Fetch insurance data'
      );
      
      updateProgress(80, 'Loading EMI and rental data...');
      const [emis, rentals] = await Promise.all([
        fetchWithRetry(
          () => DataIntegrationService.getEMIData(user.uid),
          'Fetch EMI data'
        ),
        fetchWithRetry(
          () => DataIntegrationService.getRentalData(user.uid),
          'Fetch rental data'
        )
      ]);
      
      updateProgress(90, 'Processing data...');
      
      // Calculate metrics
      const currentMonth = new Date().toISOString().substring(0, 7);
      const monthlyExpenses = expenses
        .filter(expense => expense.date.startsWith(currentMonth))
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalInvestments = investments.reduce((sum, investment) => sum + investment.amount, 0);
      
      // Emergency fund calculation
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
      
      const annualInsurancePremiums = DataIntegrationService.calculateAnnualInsurancePremiums(insurances);
      const monthlyEMIs = DataIntegrationService.calculateMonthlyEMIs(emis);
      const monthlyRentalIncome = DataIntegrationService.calculateMonthlyRentalIncome(rentals);
      
      const adjustedMonthlyExpenses = avgMonthlyExpenses + (annualInsurancePremiums / 12) + monthlyEMIs - monthlyRentalIncome;
      const emergencyFundTarget = Math.max(adjustedMonthlyExpenses * 6, 0);
      const emergencyFundCurrent = totalInvestments * 0.15;
      
      const newData: DashboardData = {
        totalExpenses,
        monthlyExpenses,
        totalInvestments,
        expenseCount: expenses.length,
        investmentCount: investments.length,
        emergencyFundTarget,
        emergencyFundCurrent
      };
      
      updateProgress(100, 'Complete!');
      
      // Update state and cache
      setDashboardData(newData);
      setCache({
        data: newData,
        timestamp: Date.now()
      });
      
      Logger.info('Dashboard data loaded successfully', newData);
    } catch (err) {
      handleError(err as Error, 'Failed to load dashboard data');
    } finally {
      stopLoading();
    }
  }, [user, isCacheValid, cache, startLoading, updateProgress, stopLoading, clearError, handleError, fetchWithRetry]);

  // Auto-load data when user changes
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
    refetch,
    isCacheValid
  };
}
