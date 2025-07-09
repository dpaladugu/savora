import React, { useState, useEffect } from 'react';
import { useEnhancedExpenseValidation } from '@/hooks/useEnhancedExpenseValidation';
import { Expense as FormExpenseType } from '@/types/expense'; // Original type from the app
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangleIcon } from 'lucide-react'; // Import the icon
import { AdvancedExpenseOptions } from './AdvancedExpenseOptions';
import { db } from "@/db"; // Dexie DB instance
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';

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
  created_at?: string; // Changed to string
  updated_at?: string; // Changed to string
}

type ExtendedFormExpense = FormExpenseType & {
  payment_method: string;
  merchant: string;
  account: string;
  user_id?: string;
};

const initialFormState: ExtendedFormExpense = {
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
  user_id: 'default_user',
};

export const EnhancedAddExpenseForm: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    expense,
    errors,
    handleChange,
    handleBlur,
    validate,
    resetForm: resetValidationForm
  } = useEnhancedExpenseValidation(initialFormState);

  const [formMessage, setFormMessage] = useState<string | null>(null);
  const currentExpense = expense as ExtendedFormExpense;

  const performResetForm = () => {
    const resetState = { ...initialFormState, user_id: user?.uid || 'default_user' };
    resetValidationForm(resetState);
    setFormMessage(null);
  };

  useEffect(() => {
    if (user && (!currentExpense.user_id || currentExpense.user_id === 'default_user')) {
      handleChange('user_id' as any, user.uid);
    }
  }, [user, currentExpense.user_id, handleChange]);


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (validate(currentExpense)) {
      try {
        const newId = self.crypto.randomUUID();

        const expenseToSave: DexieExpenseRecord = {
          id: newId,
          user_id: currentExpense.user_id || user?.uid || "default_user",
          amount: Number(currentExpense.amount) || 0,
          date: currentExpense.date || new Date().toISOString().split('T')[0],
          category: currentExpense.category || '',
          description: currentExpense.description || '',
          payment_method: currentExpense.payment_method || '',
          tags_flat: (currentExpense.tags || []).join(','),
          source: currentExpense.source || '',
          merchant: currentExpense.merchant || '',
          account: currentExpense.account || '',
          created_at: new Date().toISOString(), // Convert to ISO string
          updated_at: new Date().toISOString(), // Convert to ISO string
        };

        await db.expenses.add(expenseToSave);

        toast({
          title: "Expense Added Locally",
          description: `Expense "${expenseToSave.description || 'Unnamed'}" of ${expenseToSave.amount} added.`,
        });
        setFormMessage('Expense added successfully to local DB!');
        performResetForm();

      } catch (error) {
        console.error("Failed to add expense to Dexie:", error);
        let errorMessage = "Failed to save expense. Please try again.";
        if (error instanceof Error && error.message) {
            errorMessage = error.message;
        }
        toast({
          title: "Dexie Error",
          description: errorMessage,
          variant: "destructive",
        });
        setFormMessage(`Failed to save expense: ${errorMessage}`);
      }
    } else {
      console.log('Validation errors:', errors);
      setFormMessage('Please correct the errors in the form.');
    }
  };

  const handleFormInputChange = (field: keyof ExtendedFormExpense, value: any) => {
    handleChange(field as keyof FormExpenseType, value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg shadow-lg bg-white">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Add New Expense</h2>

      <div>
        <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</Label>
        <Input
          id="amount" name="amount" type="number" step="0.01"
          value={currentExpense.amount || ''}
          onChange={(e) => handleFormInputChange('amount', parseFloat(e.target.value))}
          onBlur={() => handleBlur('amount')}
          aria-invalid={!!errors.amount}
          aria-required="true"
          aria-describedby={errors.amount ? "amount-error" : undefined}
          className={`mt-1 block w-full ${errors.amount ? 'border-red-500' : ''}`} required
        />
        {errors.amount && <p id="amount-error" className="mt-1 text-xs text-red-600 flex items-center"><AlertTriangleIcon aria-hidden="true" className="w-3 h-3 mr-1"/>{errors.amount}</p>}
      </div>

      <div>
        <Label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</Label>
        <Input
          id="date" name="date" type="date"
          value={currentExpense.date || ''}
          onChange={(e) => handleFormInputChange('date', e.target.value)}
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
          value={currentExpense.category || ''}
          onChange={(e) => handleFormInputChange('category', e.target.value)}
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
          value={currentExpense.description || ''}
          onChange={(e) => handleFormInputChange('description', e.target.value)}
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
          value={currentExpense.payment_method || ''}
          onChange={(e) => handleFormInputChange('payment_method', e.target.value)}
          onBlur={() => handleBlur('payment_method' as any)}
          className="mt-1 block w-full"
          placeholder="e.g., Credit Card, Cash, UPI"
        />
      </div>

       <div>
        <Label htmlFor="merchant" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Merchant</Label>
        <Input
          id="merchant" name="merchant" type="text"
          value={currentExpense.merchant || ''}
          onChange={(e) => handleFormInputChange('merchant', e.target.value)}
          onBlur={() => handleBlur('merchant' as any)}
          className="mt-1 block w-full"
          placeholder="e.g., Amazon, Starbucks, Local Cafe"
        />
      </div>

      <div>
        <Label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account (Optional)</Label>
        <Input
          id="account" name="account" type="text"
          value={currentExpense.account || ''}
          onChange={(e) => handleFormInputChange('account', e.target.value)}
          onBlur={() => handleBlur('account' as any)}
          className="mt-1 block w-full"
          placeholder="e.g., ICICI Savings, HDFC Credit Card"
        />
      </div>

      <div>
        <Label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source (Optional)</Label>
        <Input
          id="source" name="source" type="text"
          value={currentExpense.source || ''}
          onChange={(e) => handleFormInputChange('source', e.target.value)}
          onBlur={() => handleBlur('source' as any)}
          className="mt-1 block w-full"
          placeholder="e.g., Online Purchase, Store Visit"
        />
      </div>

      <AdvancedExpenseOptions
        tags={currentExpense.tags || []}
        userId={user?.uid || 'default_user'}
        onTagsChange={(newTags) => handleFormInputChange('tags', newTags)}
      />

      {formMessage && (
        <p
          className={`mt-3 text-sm ${formMessage.toLowerCase().includes('failed') || (errors && Object.keys(errors).filter(k => !!(errors as any)[k]).length > 0) ? 'text-red-600' : 'text-green-600'}`}
          role={formMessage.toLowerCase().includes('failed') || (errors && Object.keys(errors).filter(k => !!(errors as any)[k]).length > 0) ? 'alert' : 'status'}
          aria-live="polite"
        >
          {formMessage}
        </p>
      )}

      <div className="flex space-x-4 pt-3">
        <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-md">
          Add Expense
        </Button>
        <Button type="button" variant="outline" onClick={performResetForm} className="flex-1">
          Reset Form
        </Button>
      </div>
    </form>
  );
};
