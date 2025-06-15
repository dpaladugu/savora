
import { z } from 'zod';

// Expense validation schema
export const expenseSchema = z.object({
  id: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['expense', 'income']),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  tags: z.array(z.string()).optional(),
  userId: z.string().optional(),
});

// Investment validation schema
export const investmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Investment name is required'),
  type: z.enum(['stocks', 'mutual_funds', 'bonds', 'fixed_deposit', 'real_estate', 'crypto', 'others']),
  amount: z.number().positive('Amount must be positive'),
  units: z.number().positive().optional(),
  price: z.number().positive().optional(),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  maturityDate: z.string().optional(),
  expectedReturn: z.number().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  userId: z.string().optional(),
});

// Goal validation schema
export const goalSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Goal title is required'),
  targetAmount: z.number().positive('Target amount must be positive'),
  currentAmount: z.number().min(0, 'Current amount cannot be negative'),
  deadline: z.string().min(1, 'Deadline is required'),
  category: z.string().min(1, 'Category is required'),
});

export class DataValidator {
  static validateExpense(data: unknown) {
    return expenseSchema.safeParse(data);
  }

  static validateInvestment(data: unknown) {
    return investmentSchema.safeParse(data);
  }

  static validateGoal(data: unknown) {
    return goalSchema.safeParse(data);
  }

  static validateCSVExpenses(data: unknown[]) {
    const results = data.map((item, index) => ({
      index,
      valid: expenseSchema.safeParse(item).success,
      errors: expenseSchema.safeParse(item).error?.issues || []
    }));

    return {
      valid: results.every(r => r.valid),
      totalCount: data.length,
      validCount: results.filter(r => r.valid).length,
      invalidItems: results.filter(r => !r.valid)
    };
  }

  static sanitizeAmount(value: string | number): number {
    if (typeof value === 'number') return value;
    const cleanValue = value.toString().replace(/[^\d.-]/g, '');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
  }

  static sanitizeDate(value: string): string {
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : value;
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  static formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
