
import { z } from 'zod';
import { Logger } from "./logger";
import { jsonPreloadMVPDataSchema } from './jsonPreloadValidators';
import type { JsonPreloadMVPData } from '@/types/jsonPreload';

// Comprehensive validation schemas
export const ExpenseValidationSchema = z.object({
  id: z.string().optional(),
  amount: z.number().positive("Amount must be positive").max(10000000, "Amount too large"),
  description: z.string().min(1, "Description is required").max(200, "Description too long"),
  category: z.string().min(1, "Category is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  type: z.enum(['expense', 'income']),
  paymentMethod: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const InvestmentValidationSchema = z.object({
  id: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  type: z.string().min(1, "Investment type is required"),
  name: z.string().min(1, "Investment name is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid purchase date format"),
  riskLevel: z.enum(['low', 'medium', 'high'])
});

export const GoalValidationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Goal title is required").max(100, "Title too long"),
  targetAmount: z.number().positive("Target amount must be positive"),
  currentAmount: z.number().min(0, "Current amount cannot be negative"),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid deadline format"),
  category: z.string().min(1, "Category is required")
});

export type ValidatedExpense = z.infer<typeof ExpenseValidationSchema>;
export type ValidatedInvestment = z.infer<typeof InvestmentValidationSchema>;
export type ValidatedGoal = z.infer<typeof GoalValidationSchema>;

export class ComprehensiveDataValidator {
  static validateExpense(data: unknown): ValidatedExpense {
    try {
      return ExpenseValidationSchema.parse(data);
    } catch (error) {
      Logger.error('Expense validation failed:', error);
      throw new Error(`Invalid expense data: ${error instanceof z.ZodError ? error.errors[0]?.message : 'Unknown error'}`);
    }
  }

  static validateInvestment(data: unknown): ValidatedInvestment {
    try {
      return InvestmentValidationSchema.parse(data);
    } catch (error) {
      Logger.error('Investment validation failed:', error);
      throw new Error(`Invalid investment data: ${error instanceof z.ZodError ? error.errors[0]?.message : 'Unknown error'}`);
    }
  }

  static validateGoal(data: unknown): ValidatedGoal {
    try {
      return GoalValidationSchema.parse(data);
    } catch (error) {
      Logger.error('Goal validation failed:', error);
      throw new Error(`Invalid goal data: ${error instanceof z.ZodError ? error.errors[0]?.message : 'Unknown error'}`);
    }
  }

  static validateExpenseArray(data: unknown[]): ValidatedExpense[] {
    return data.map((item, index) => {
      try {
        return this.validateExpense(item);
      } catch (error) {
        Logger.error(`Expense validation failed at index ${index}:`, error);
        throw new Error(`Invalid expense at position ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  static validateInvestmentArray(data: unknown[]): ValidatedInvestment[] {
    return data.map((item, index) => {
      try {
        return this.validateInvestment(item);
      } catch (error) {
        Logger.error(`Investment validation failed at index ${index}:`, error);
        throw new Error(`Invalid investment at position ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  static formatCurrency(amount: number): string {
    if (typeof amount !== 'number') {
      return 'N/A';
    }
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
}

export interface ValidationResult {
  isValid: boolean;
  data?: JsonPreloadMVPData;
  errors?: Array<{
    path: string[];
    message: string;
  }>;
}

export function validateFinancialData(data: unknown): ValidationResult {
  try {
    const validatedData = jsonPreloadMVPDataSchema.parse(data);
    return {
      isValid: true,
      data: validatedData as JsonPreloadMVPData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("JSON validation errors (MVP sections):", error.errors);
      const formattedErrors = error.errors.map(err => ({
        path: err.path.map(p => String(p)),
        message: err.message
      }));
      return {
        isValid: false,
        errors: formattedErrors
      };
    }
    console.error("Unexpected validation error:", error);
    return {
      isValid: false,
      errors: [{
        path: [],
        message: "Unexpected validation error"
      }]
    };
  }
}
