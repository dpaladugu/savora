
import { DashboardData } from "@/types/dashboard";

export class FinancialCalculator {
  static calculateSavingsRate(income: number, expenses: number): number {
    if (income <= 0) return 0;
    return Math.round(((income - expenses) / income) * 100);
  }

  static calculateEmergencyFundTarget(monthlyExpenses: number, months: number = 6): number {
    return monthlyExpenses * months;
  }

  static calculateEmergencyFundProgress(current: number, target: number): number {
    if (target <= 0) return 0;
    return Math.round((current / target) * 100);
  }

  static calculateCreditUtilization(used: number, limit: number): number {
    if (limit <= 0) return 0;
    return Math.round((used / limit) * 100);
  }

  static calculateMonthlyBudget(income: number, savingsGoal: number): number {
    return income - (income * (savingsGoal / 100));
  }

  static calculateInvestmentGrowth(principal: number, rate: number, years: number): number {
    return principal * Math.pow(1 + (rate / 100), years);
  }

  static categorizeExpenses(expenses: any[]): { category: string; amount: number; percentage: number; color: string }[] {
    const categoryMap = new Map<string, number>();
    const total = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    expenses.forEach(expense => {
      const category = expense.category || 'Others';
      categoryMap.set(category, (categoryMap.get(category) || 0) + (expense.amount || 0));
    });

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];
    
    return Array.from(categoryMap.entries()).map(([category, amount], index) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: colors[index % colors.length]
    }));
  }

  static calculateNetWorth(assets: number, liabilities: number): number {
    return assets - liabilities;
  }

  static calculateDebtToIncomeRatio(monthlyDebt: number, monthlyIncome: number): number {
    if (monthlyIncome <= 0) return 0;
    return Math.round((monthlyDebt / monthlyIncome) * 100);
  }
}
