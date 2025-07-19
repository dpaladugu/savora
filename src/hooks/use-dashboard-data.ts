
import { useMemo } from "react";
import { useLiveQuery } from 'dexie-react-hooks';
import { ExpenseService } from "@/services/ExpenseService";
import { InvestmentService } from "@/services/InvestmentService";
import { IncomeService } from "@/services/IncomeService";
import { InsuranceService } from "@/services/InsuranceService";
import { LoanService } from "@/services/LoanService";
import { Logger } from "@/services/logger";
import { useErrorHandler } from "./use-error-handler";
import { useLoadingState } from "./use-loading-state";
import { useAuth } from "@/contexts/auth-context";

export function useDashboardData() {
  const { user } = useAuth();

  const allData = useLiveQuery(async () => {
    if (!user?.uid) return null;
    
    const [expenses, investments, incomes, insurances, loans] = await Promise.all([
      ExpenseService.getExpenses(),
      InvestmentService.getInvestments(),
      IncomeService.getIncomes(),
      InsuranceService.getPolicies(),
      LoanService.getLoans(),
    ]);

    return { expenses, investments, incomes, insurances, loans };
  }, [user?.uid]);

  const loading = allData === undefined;

  const dashboardData = useMemo(() => {
    if (!allData) {
      return {
        totalInvestments: 0,
        totalExpenses: 0,
        totalIncome: 0,
        investmentAllocation: {},
        expenseByCategory: {},
        // You can add more detailed calculations here if needed
      };
    }

    const { expenses, investments, incomes } = allData;

    const totalInvestments = investments.reduce((sum, inv) => sum + (inv.current_value || inv.invested_value || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

    const investmentAllocation = investments.reduce((acc, inv) => {
      const key = inv.investment_type || 'Other';
      acc[key] = (acc[key] || 0) + (inv.current_value || inv.invested_value || 0);
      return acc;
    }, {} as Record<string, number>);

    const expenseByCategory = expenses.reduce((acc, exp) => {
      const key = exp.category || 'Uncategorized';
      acc[key] = (acc[key] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalInvestments,
      totalExpenses,
      totalIncome,
      investmentAllocation,
      expenseByCategory,
    };
  }, [allData]);

  return { data: dashboardData, loading };
}
