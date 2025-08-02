import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ExpenseService } from '@/services/ExpenseService';
import { Expense } from '@/db';
import { EnhancedAddExpenseForm } from './EnhancedAddExpenseForm';
import { toast } from 'sonner';

interface DateFilter {
  from?: Date;
  to?: Date;
}

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const expenseData = await ExpenseService.getExpenses();
      setExpenses(expenseData);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || expense.category === categoryFilter;
      const matchesPayment = !paymentMethodFilter || expense.paymentMethod === paymentMethodFilter;
      
      let matchesDate = true;
      if (dateFilter?.from && dateFilter?.to) {
        const expenseDate = new Date(expense.date);
        matchesDate = expenseDate >= dateFilter.from && expenseDate <= dateFilter.to;
      }
      
      return matchesSearch && matchesCategory && matchesPayment && matchesDate;
    });
  }, [expenses, searchTerm, categoryFilter, paymentMethodFilter, dateFilter]);

  const categories = useMemo(() => {
    return [...new Set(expenses.map(e => e.category))];
  }, [expenses]);

  const paymentMethods = useMemo(() => {
    return [...new Set(expenses.map(e => e.paymentMethod).filter(Boolean))];
  }, [expenses]);

  const handleDeleteExpense = async (id: string) => {
    try {
      await ExpenseService.deleteExpense(id);
      await loadExpenses();
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowEditDialog(true);
  };

  const handleUpdateExpense = async (updatedData: Partial<Expense>) => {
    if (!editingExpense) return;
    
    try {
      // Convert tags to array if it's a string
      const processedData = {
        ...updatedData,
        tags: typeof updatedData.tags === 'string' 
          ? updatedData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : updatedData.tags
      };
      
      await ExpenseService.updateExpense(editingExpense.id, processedData);
      await loadExpenses();
      setEditingExpense(null);
      setShowEditDialog(false);
      toast.success('Expense updated successfully');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    }
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      // Convert tags to array if it's a string
      const processedData = {
        ...expenseData,
        tags: typeof expenseData.tags === 'string' 
          ? expenseData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : expenseData.tags || []
      };
      
      await ExpenseService.addExpense(processedData);
      await loadExpenses();
      setShowAddDialog(false);
      toast.success('Expense added successfully');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <EnhancedAddExpenseForm
              onExpenseAdded={() => {
                loadExpenses();
                setShowAddDialog(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          type="search"
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Payment Methods</SelectItem>
            {paymentMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateFilter?.from ? (
              dateFilter.to ? (
                <>
                  {format(dateFilter.from, "LLL dd, y")} -{" "}
                  {format(dateFilter.to, "LLL dd, y")}
                </>
              ) : (
                format(dateFilter.from, "LLL dd, y")
              )
            ) : (
              "Pick a date range"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateFilter?.from}
            selected={dateFilter as any}
            onSelect={setDateFilter}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Expenses List */}
      <div className="grid gap-4">
        {filteredExpenses.map((expense) => (
          <Card key={expense.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{expense.description}</h3>
                    <Badge variant="secondary">{expense.category}</Badge>
                    {expense.paymentMethod && (
                      <Badge variant="outline">{expense.paymentMethod}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Amount: ₹{expense.amount.toLocaleString()}</p>
                    <p>Date: {format(new Date(expense.date), 'PPP')}</p>
                    {expense.tags && expense.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {expense.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditExpense(expense)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteExpense(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <EnhancedAddExpenseForm
            editingExpense={editingExpense}
            onEditComplete={() => {
              loadExpenses();
              setEditingExpense(null);
              setShowEditDialog(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
