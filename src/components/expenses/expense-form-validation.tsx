
import { useState } from "react";
import { z } from "zod";

const expenseSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  tag: z.string().min(1, "Tag/Merchant is required"),
  paymentMode: z.enum(['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking', 'Wallet']),
  note: z.string().optional(),
  linkedGoal: z.string().optional(),
  merchant: z.string().optional()
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

export interface ValidationErrors {
  [key: string]: string;
}

export function useExpenseFormValidation() {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = (name: string, value: any, allData?: Partial<ExpenseFormData>) => {
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
      }
      
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [name]: error.errors[0]?.message || 'Invalid value'
        }));
      }
      return false;
    }
  };

  const validateForm = (data: Partial<ExpenseFormData>) => {
    try {
      expenseSchema.parse(data);
      setErrors({});
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
      }
      return false;
    }
  };

  const clearErrors = () => setErrors({});

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0
  };
}
