import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangleIcon } from 'lucide-react';
import { AdvancedExpenseOptions } from './AdvancedExpenseOptions';
import { db } from "@/db";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { Expense as FormExpenseType } from '@/types/expense'; // Original type from the app

// Define the Zod schema for expense validation
const expenseValidationSchema = z.object({
  amount: z.number().positive({ message: "Amount must be a positive number." }),
  date: z.string().min(1, { message: "Date is required." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format. Please use YYYY-MM-DD."})
    .refine(dateStr => new Date(dateStr) <= new Date(new Date().setHours(23,59,59,999)), { // Allow today
      message: "Date cannot be in the future."
    }),
  category: z.string().min(1, { message: "Category is required." }),
  description: z.string().min(1, { message: "Description is required." }),
  payment_method: z.string().optional(),
  tags: z.array(z.string()).optional(),
  merchant: z.string().optional(),
  account: z.string().optional(),
  source: z.string().optional(),
  user_id: z.string().optional(),
  id: z.string().optional(), // Not typically validated on input for new, but part of the type
  type: z.literal('expense').optional(), // Defaulted, not usually user input
});

// This is the type for data actually saved to Dexie (aligns with AppExpense for db.expenses)
interface DexieExpenseRecord {
  id: string;
  user_id?: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  payment_method: string;
  tags_flat: string;
  source: string;
  merchant: string;
  account: string;
  created_at?: string;
  updated_at?: string;
}

// Form data type, derived from Zod schema for type safety in the form state
type ValidatedExpenseFormData = z.infer<typeof expenseValidationSchema>;
// Extended form state type to include all fields used in the form/Dexie, matching FormExpenseType where possible
// This type is what our local `formState` will use.
type EnhancedFormState = FormExpenseType & { // FormExpenseType from '@/types/expense'
    payment_method: string;
    merchant: string;
    account: string;
    // source is already in FormExpenseType if it's up-to-date
    user_id?: string;
};


const initialFormState: EnhancedFormState = {
  id: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  category: '',
  description: '',
  type: 'expense',
  tags: [],
  payment_method: '',
  merchant: '',
  account: '',
  source: '',
  user_id: undefined, // Initialize as undefined
};

export const EnhancedAddExpenseForm: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [formState, setFormState] = useState<EnhancedFormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof ValidatedExpenseFormData, string>>>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setFormState({ ...initialFormState, user_id: user?.uid }); // Set current user_id on reset
    setErrors({});
    setFormMessage(null);
  }, [user]);

  useEffect(() => {
    // Effect to set user_id in formState if it's not already set or doesn't match current user
    // This helps ensure that if the component mounts before user context is ready,
    // it gets updated once the user is available.
    if (user && formState.user_id !== user.uid) {
      setFormState(prev => ({ ...prev, user_id: user.uid }));
    }
    // If user logs out while form is open, clear user_id or handle as needed
    if (!user && formState.user_id) {
        setFormState(prev => ({ ...prev, user_id: undefined }));
    }
  }, [user, formState.user_id]);

  const handleInputChange = (
    field: keyof EnhancedFormState,
    value: any
  ) => {
    setFormState(prevState => ({
      ...prevState,
      [field]: value,
    }));
    // Clear error for this field on change
    if (errors[field as keyof ValidatedExpenseFormData]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [field as keyof ValidatedExpenseFormData]: undefined,
      }));
    }
  };

  const handleBlur = (field: keyof ValidatedExpenseFormData) => {
    const fieldSchema = expenseValidationSchema.shape[field];
    if (fieldSchema) {
      const result = fieldSchema.safeParse(formState[field]);
      if (!result.success) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [field]: result.error.errors[0].message,
        }));
      } else {
        setErrors(prevErrors => ({
          ...prevErrors,
          [field]: undefined,
        }));
      }
    }
  };

  const validateForm = (): boolean => {
    // Ensure amount is number for Zod schema if it's coming from input as string
    const dataToValidate = {
        ...formState,
        amount: Number(formState.amount) || 0,
    };
    const result = expenseValidationSchema.safeParse(dataToValidate);
    if (!result.success) {
      const newErrors: Partial<Record<keyof ValidatedExpenseFormData, string>> = {};
      for (const error of result.error.errors) {
        if (error.path.length > 0) {
          newErrors[error.path[0] as keyof ValidatedExpenseFormData] = error.message;
        }
      }
      setErrors(newErrors);
      setFormMessage('Please correct the errors in the form.');
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    if (!user?.uid) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add an expense.",
        variant: "destructive",
      });
      setFormMessage("Login required to save expense.");
      return;
    }

    try {
      const newId = self.crypto.randomUUID();
      const expenseToSave: DexieExpenseRecord = {
        id: newId,
        user_id: user.uid, // Use directly from auth context
        amount: Number(formState.amount) || 0,
        date: formState.date || new Date().toISOString().split('T')[0],
        category: formState.category || '',
        description: formState.description || '',
        payment_method: formState.payment_method || '',
        tags_flat: (formState.tags || []).map(t => t.toLowerCase()).join(','),
        source: formState.source || '',
        merchant: formState.merchant || '',
        account: formState.account || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.expenses.add(expenseToSave);

      toast({
        title: "Expense Added",
        description: `Expense "${expenseToSave.description || 'Unnamed'}" for ${formatCurrency(expenseToSave.amount)} added.`,
      });
      setFormMessage('Expense added successfully!');
      resetForm();

    } catch (error) {
      console.error("Failed to add expense to Dexie:", error);
      let errorMessage = "Failed to save expense. Please try again.";
      if (error instanceof Error && error.message) {
          errorMessage = error.message;
      }
      toast({ title: "Error Saving Expense", description: errorMessage, variant: "destructive" });
      setFormMessage(`Failed to save expense: ${errorMessage}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg shadow-lg bg-white dark:bg-slate-900">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">Add New Expense</h2>

      {!user && (
        <div className="p-3 mb-4 text-sm text-yellow-800 bg-yellow-100 rounded-lg dark:bg-yellow-900 dark:text-yellow-300" role="alert">
          <AlertTriangleIcon className="inline w-4 h-4 mr-2" />
          You are not logged in. Expenses will not be saved until you log in.
        </div>
      )}

      <div>
        <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</Label>
        <Input
          id="amount" name="amount" type="number" step="0.01"
          value={formState.amount === 0 && !errors.amount ? '' : formState.amount} // Show placeholder if 0 and no error
          onChange={(e) => handleInputChange('amount', e.target.value === '' ? 0 : parseFloat(e.target.value))}
          onBlur={() => handleBlur('amount')}
          aria-invalid={!!errors.amount}
          aria-required="true"
          aria-describedby={errors.amount ? "amount-error" : undefined}
          className={`mt-1 block w-full ${errors.amount ? 'border-red-500' : ''}`} required
          placeholder="0.00"
        />
        {errors.amount && <p id="amount-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{errors.amount}</p>}
      </div>

      <div>
        <Label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</Label>
        <Input
          id="date" name="date" type="date"
          value={formState.date || ''}
          onChange={(e) => handleInputChange('date', e.target.value)}
          onBlur={() => handleBlur('date')}
          aria-invalid={!!errors.date}
          aria-required="true"
          aria-describedby={errors.date ? "date-error" : undefined}
          className={`mt-1 block w-full ${errors.date ? 'border-red-500' : ''}`} required
        />
        {errors.date && <p id="date-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{errors.date}</p>}
      </div>

      <div>
        <Label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</Label>
        <Input
          id="category" name="category" type="text"
          value={formState.category || ''}
          onChange={(e) => handleInputChange('category', e.target.value)}
          onBlur={() => handleBlur('category')}
          aria-invalid={!!errors.category}
          aria-required="true"
          aria-describedby={errors.category ? "category-error" : undefined}
          className={`mt-1 block w-full ${errors.category ? 'border-red-500' : ''}`} required
          placeholder="e.g., Food, Transport"
        />
        {errors.category && <p id="category-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{errors.category}</p>}
      </div>

      <div>
        <Label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</Label>
        <Input
          id="description" name="description" type="text"
          value={formState.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          onBlur={() => handleBlur('description')}
          aria-invalid={!!errors.description}
          aria-required="true"
          aria-describedby={errors.description ? "description-error" : undefined}
          className={`mt-1 block w-full ${errors.description ? 'border-red-500' : ''}`} required
          placeholder="e.g., Lunch with colleagues"
        />
        {errors.description && <p id="description-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{errors.description}</p>}
      </div>

      <div>
        <Label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</Label>
        <Input
          id="payment_method" name="payment_method" type="text"
          value={formState.payment_method || ''}
          onChange={(e) => handleInputChange('payment_method', e.target.value)}
          onBlur={() => handleBlur('payment_method')}
          className="mt-1 block w-full"
          placeholder="e.g., Credit Card, Cash, UPI"
        />
         {errors.payment_method && <p id="payment_method-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{errors.payment_method}</p>}
      </div>

       <div>
        <Label htmlFor="merchant" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Merchant</Label>
        <Input
          id="merchant" name="merchant" type="text"
          value={formState.merchant || ''}
          onChange={(e) => handleInputChange('merchant', e.target.value)}
          onBlur={() => handleBlur('merchant')}
          className="mt-1 block w-full"
          placeholder="e.g., Amazon, Starbucks, Local Cafe"
        />
         {errors.merchant && <p id="merchant-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{errors.merchant}</p>}
      </div>

      <div>
        <Label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account (Optional)</Label>
        <Input
          id="account" name="account" type="text"
          value={formState.account || ''}
          onChange={(e) => handleInputChange('account', e.target.value)}
          onBlur={() => handleBlur('account')}
          className="mt-1 block w-full"
          placeholder="e.g., ICICI Savings, HDFC Credit Card"
        />
        {errors.account && <p id="account-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{errors.account}</p>}
      </div>

      <div>
        <Label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source (Optional)</Label>
        <Input
          id="source" name="source" type="text"
          value={formState.source || ''}
          onChange={(e) => handleInputChange('source', e.target.value)}
          onBlur={() => handleBlur('source')}
          className="mt-1 block w-full"
          placeholder="e.g., Online Purchase, Store Visit"
        />
         {errors.source && <p id="source-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{errors.source}</p>}
      </div>

      <AdvancedExpenseOptions
        tags={formState.tags || []}
        // Pass undefined if user is not available, AdvancedExpenseOptions should handle this
        userId={user?.uid}
        onTagsChange={(newTags) => handleInputChange('tags', newTags)}
      />
       {errors.tags && <p id="tags-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{errors.tags}</p>}


      {formMessage && (
        <p
          className={`mt-3 text-sm ${formMessage.toLowerCase().includes('failed') || Object.keys(errors).length > 0 ? 'text-red-600' : 'text-green-600'}`}
          role={formMessage.toLowerCase().includes('failed') || Object.keys(errors).length > 0 ? 'alert' : 'status'}
          aria-live="polite"
        >
          {formMessage}
        </p>
      )}

      <div className="flex space-x-4 pt-3">
        <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-md">
          Add Expense
        </Button>
        <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
          Reset Form
        </Button>
      </div>
    </form>
  );
};
