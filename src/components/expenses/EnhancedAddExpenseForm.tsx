import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ExpenseService } from '@/services/ExpenseService';
import { Expense } from '@/db';

interface EnhancedAddExpenseFormProps {
  onExpenseAdded?: () => void;
  editingExpense?: Expense | null;
  onEditComplete?: () => void;
}

export function EnhancedAddExpenseForm({ onExpenseAdded, editingExpense, onEditComplete }: EnhancedAddExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [tags, setTags] = useState('');
  const [account, setAccount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  const loadInitialData = async () => {
    try {
      // Get categories from existing expenses
      const expenses = await ExpenseService.getExpenses();
      const uniqueCategories = [...new Set(expenses.map(e => e.category))];
      setCategories(uniqueCategories);
      
      // Get payment methods from existing expenses  
      const uniquePaymentMethods = [...new Set(expenses.map(e => e.paymentMethod).filter(Boolean))];
      setPaymentMethods(uniquePaymentMethods);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (editingExpense) {
      setAmount(editingExpense.amount.toString());
      setDescription(editingExpense.description);
      setCategory(editingExpense.category);
      setDate(editingExpense.date);
      setPaymentMethod(editingExpense.paymentMethod || '');
      // Handle tags properly - convert array to string
      const tagsString = Array.isArray(editingExpense.tags) 
        ? editingExpense.tags.join(', ') 
        : (editingExpense.tags || '');
      setTags(tagsString);
      setAccount(editingExpense.account || '');
    }
  }, [editingExpense]);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('');
    setDate('');
    setTags('');
    setAccount('');
    setPaymentMethod('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description || !category || !date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const expenseData = {
        user_id: 'current-user', // This should come from auth context
        description,
        amount: parseFloat(amount),
        date,
        category,
        paymentMethod: paymentMethod || '',
        // Convert tags string to array
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        account: account || '',
        source: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (editingExpense) {
        await ExpenseService.updateExpense(editingExpense.id, expenseData);
        toast.success('Expense updated successfully');
        onEditComplete?.();
      } else {
        await ExpenseService.addExpense(expenseData);
        toast.success('Expense added successfully');
        onExpenseAdded?.();
      }

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Textarea
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., food, groceries"
            />
          </div>
          <div>
            <Label htmlFor="account">Account</Label>
            <Input
              type="text"
              id="account"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
          </div>
          <Button type="submit">{editingExpense ? 'Update Expense' : 'Add Expense'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
