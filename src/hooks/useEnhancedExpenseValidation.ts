import { useState, useCallback } from 'react';
import { Expense } from '@/types/expense'; // Assuming Expense type is defined here

interface ValidationErrors {
  amount?: string;
  date?: string;
  category?: string;
  description?: string;
  // Add other fields as needed
}

// Basic validation rules - can be expanded
const validateExpense = (expense: Partial<Expense>): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (expense.amount === undefined || expense.amount === null || isNaN(Number(expense.amount)) || Number(expense.amount) <= 0) {
    errors.amount = 'Amount must be a positive number.';
  }

  if (!expense.date) {
    errors.date = 'Date is required.';
  } else {
    // Basic date format validation (YYYY-MM-DD) - can be made more robust
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(expense.date)) {
      errors.date = 'Invalid date format. Please use YYYY-MM-DD.';
    } else {
      const parsedDate = new Date(expense.date);
      const today = new Date();
      today.setHours(0,0,0,0); // Normalize today's date to compare against input date
      if (parsedDate > today) {
        errors.date = 'Date cannot be in the future.';
      }
    }
  }

  if (!expense.category || expense.category.trim() === '') {
    errors.category = 'Category is required.';
  }

  if (!expense.description || expense.description.trim() === '') {
    errors.description = 'Description is required.';
  }

  // Add more validation rules here (e.g., for tags, paymentMethod, etc.)

  return errors;
};

export const useEnhancedExpenseValidation = (initialExpense?: Partial<Expense>) => {
  const [expense, setExpense] = useState<Partial<Expense>>(initialExpense || {});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (expenseToValidate: Partial<Expense>): Promise<boolean> => {
    setIsValidating(true);
    const validationErrors = validateExpense(expenseToValidate);
    setErrors(validationErrors);
    setIsValidating(false);
    return Object.keys(validationErrors).length === 0; // Returns true if no errors
  }, []);

  const validateField = useCallback(async (fieldName: keyof Expense, value: any, currentExpenseState: Partial<Expense>) => {
    setIsValidating(true);
    const validationErrors = validateExpense({ ...currentExpenseState, [fieldName]: value });
    setErrors(prev => ({...prev, [fieldName]: validationErrors[fieldName]}));
    setIsValidating(false);
  }, []);

  const hasErrors = Object.values(errors).some(error => !!error);

  const handleChange = useCallback((field: keyof Expense, value: any) => {
    const updatedExpense = { ...expense, [field]: value };
    setExpense(updatedExpense);
    // Optionally, validate on change
    // validate(updatedExpense);
  }, [expense]);

  const handleBlur = useCallback((field: keyof Expense) => {
    // Validate field on blur
    const fieldError = validateExpense({ [field]: expense[field] } as Partial<Expense>);
    setErrors(prevErrors => ({
        ...prevErrors,
        [field]: fieldError[field] // Only update the specific field's error
    }));
  }, [expense]);


  const resetForm = useCallback((newInitialState?: Partial<Expense>) => {
    setExpense(newInitialState || {});
    setErrors({});
  }, []);


  return {
    expense,
    setExpense, // Allow direct setting of expense if needed
    errors,
    validate,
    handleChange,
    handleBlur,
    resetForm,
    isValidating,
    hasErrors,
    validateField,
  };
};
