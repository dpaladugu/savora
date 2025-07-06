import React, { useState } from 'react';
import { useEnhancedExpenseValidation } from '@/hooks/useEnhancedExpenseValidation';
import { Expense } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Assuming AdvancedExpenseOptions will be imported here
import { AdvancedExpenseOptions } from './AdvancedExpenseOptions';

export const EnhancedAddExpenseForm: React.FC = () => {
  const { expense, errors, handleChange, handleBlur, validate, resetForm } = useEnhancedExpenseValidation({
    // Initial state for a new expense
    amount: 0,
    date: new Date().toISOString().split('T')[0], // Default to today
    category: '',
    description: '',
    type: 'expense',
    tags: [],
  });

  const [formMessage, setFormMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validate(expense)) {
      // TODO: Implement actual expense submission logic (e.g., API call, state update)
      console.log('Expense submitted:', expense);
      setFormMessage('Expense added successfully!');
      resetForm({ /* Keep some defaults or clear all */
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        type: 'expense',
        tags: []
      });
      // setTimeout(() => setFormMessage(null), 3000); // Clear message after 3s
    } else {
      console.log('Validation errors:', errors);
      setFormMessage('Please correct the errors in the form.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-xl font-semibold">Add New Expense (Enhanced)</h2>

      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          value={expense.amount || ''}
          onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
          onBlur={() => handleBlur('amount')}
          aria-invalid={!!errors.amount}
        />
        {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
      </div>

      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={expense.date || ''}
          onChange={(e) => handleChange('date', e.target.value)}
          onBlur={() => handleBlur('date')}
          aria-invalid={!!errors.date}
        />
        {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          type="text"
          value={expense.category || ''}
          onChange={(e) => handleChange('category', e.target.value)}
          onBlur={() => handleBlur('category')}
          aria-invalid={!!errors.category}
        />
        {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          type="text"
          value={expense.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          onBlur={() => handleBlur('description')}
          aria-invalid={!!errors.description}
        />
        {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
      </div>

      {/* Integrate AdvancedExpenseOptions for tags */}
      <AdvancedExpenseOptions
        tags={expense.tags || []}
        onTagsChange={(newTags) => handleChange('tags', newTags)}
      />
      {/* TODO: Add error display for tags if validation is added for them */}

      {formMessage && <p className={`text-sm ${errors && Object.keys(errors).length > 0 && Object.values(errors).some(e => e) ? 'text-red-500' : 'text-green-500'}`}>{formMessage}</p>}

      <div className="flex space-x-2">
        <Button type="submit">Add Expense</Button>
        <Button type="button" variant="outline" onClick={() => resetForm({ amount: 0, date: new Date().toISOString().split('T')[0], category: '', description: '', type: 'expense', tags: [] })}>
          Reset
        </Button>
      </div>
    </form>
  );
};
