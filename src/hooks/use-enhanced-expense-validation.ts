
import { useState, useCallback } from "react";
import { z } from "zod";
import { Logger } from "@/services/logger";

const expenseSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 10000000;
    }, "Amount must be a positive number less than ₹1 crore"),
  date: z.string()
    .min(1, "Date is required")
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      return date <= today && date >= oneYearAgo;
    }, "Date must be within the last year and not in future"),
  category: z.string().min(1, "Category is required"),
  tag: z.string()
    .min(2, "Tag must be at least 2 characters")
    .max(100, "Tag must be less than 100 characters")
    .refine((val) => val.trim().length > 0, "Tag cannot be empty or whitespace only"),
  paymentMode: z.enum(['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking', 'Wallet'], {
    errorMap: () => ({ message: "Please select a valid payment mode" })
  }),
  note: z.string().max(500, "Note must be less than 500 characters").optional(),
  linkedGoal: z.string().optional(),
  merchant: z.string().max(100, "Merchant name must be less than 100 characters").optional()
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

export interface ValidationErrors {
  [key: string]: string;
}

export function useEnhancedExpenseValidation() {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateField = useCallback(async (name: string, value: any, allData?: Partial<ExpenseFormData>) => {
    setIsValidating(true);
    try {
      if (name === 'amount') {
        expenseSchema.shape.amount.parse(value);
      } else if (name === 'date') {
        expenseSchema.shape.date.parse(value);
      } else if (name === 'category') {
        expenseSchema.shape.category.parse(value);
      } else if (name === 'tag') {
        expenseSchema.shape.tag.parse(value);
      } else if (name === 'paymentMode') {
        expenseSchema.shape.paymentMode.parse(value);
      } else if (name === 'note') {
        expenseSchema.shape.note.parse(value);
      } else if (name === 'merchant') {
        expenseSchema.shape.merchant.parse(value);
      }
      
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'Invalid value';
        setErrors(prev => ({
          ...prev,
          [name]: errorMessage
        }));
        Logger.warn('Validation error', { field: name, error: errorMessage });
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateForm = useCallback(async (data: Partial<ExpenseFormData>) => {
    setIsValidating(true);
    try {
      expenseSchema.parse(data);
      setErrors({});
      Logger.info('Form validation successful');
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: ValidationErrors = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
        Logger.warn('Form validation failed', { errors: newErrors });
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0,
    isValidating
  };
}
