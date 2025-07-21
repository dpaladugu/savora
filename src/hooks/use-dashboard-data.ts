
import { useState, useEffect } from 'react';
import { ExpenseService } from '@/services/ExpenseService';
import { IncomeService } from '@/services/IncomeService';
import { InvestmentService } from '@/services/InvestmentService';
import { CreditCardService } from '@/services/CreditCardService';
import { AccountService } from '@/services/AccountService';
import { InsuranceService } from '@/services/InsuranceService';
import { VehicleService } from '@/services/VehicleService';
import { GoldInvestmentService } from '@/services/GoldInvestmentService';
import { db } from '@/db';
import { toast } from 'sonner';
import { useAuth } from '@/services/auth-service';

interface DashboardData {
  totalExpenses: number;
  totalIncome: number;
  totalInvestments: number;
  totalCreditCardBalance: number;
  totalAccountBalance: number;
  totalInsuranceCoverage: number;
  totalVehicleValue: number;
  totalGoldInvestmentValue: number;
}

const defaultDashboardData: DashboardData = {
  totalExpenses: 0,
  totalIncome: 0,
  totalInvestments: 0,
  totalCreditCardBalance: 0,
  totalAccountBalance: 0,
  totalInsuranceCoverage: 0,
  totalVehicleValue: 0,
  totalGoldInvestmentValue: 0,
};

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('useDashboardData: No user found, returning default data');
      setDashboardData(defaultDashboardData);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const [
          expenses,
          income,
          investments,
          creditCards,
          accounts,
          insurances,
          vehicles,
          goldInvestments,
        ] = await Promise.all([
          ExpenseService.getExpenses(),
          IncomeService.getIncomeSources(),
          InvestmentService.getInvestments(),
          CreditCardService.getCreditCards(),
          AccountService.getAccounts(),
          InsuranceService.getPolicies(user.uid),
          VehicleService.getVehicles(),
          GoldInvestmentService.getGoldInvestments(),
        ]);

        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalIncome = income.reduce((sum, income) => sum + income.amount, 0);
        const totalInvestments = investments.reduce((sum, investment) => sum + investment.amount, 0);
        const totalCreditCardBalance = creditCards.reduce((sum, card) => sum + card.balance, 0);
        const totalAccountBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
        const totalInsuranceCoverage = insurances.reduce((sum, insurance) => sum + insurance.coverageAmount, 0);
        const totalVehicleValue = vehicles.reduce((sum, vehicle) => sum + vehicle.currentValue, 0);
        const totalGoldInvestmentValue = goldInvestments.reduce((sum, investment) => sum + investment.totalValue, 0);

        setDashboardData({
          totalExpenses,
          totalIncome,
          totalInvestments,
          totalCreditCardBalance,
          totalAccountBalance,
          totalInsuranceCoverage,
          totalVehicleValue,
          totalGoldInvestmentValue,
        });
      } catch (error: any) {
        console.error("useDashboardData: Error fetching dashboard data:", error);
        toast.error(`Failed to load dashboard data: ${error.message}`);
      }
    };

    fetchDashboardData();
  }, [user]);

  return dashboardData;
};
