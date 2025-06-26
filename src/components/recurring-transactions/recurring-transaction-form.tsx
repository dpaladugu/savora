import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ExpenseManager } from '@/services/expense-manager'; // For categories and payment methods

// Matches the data model defined in step 1
interface RecurringTransactionData {
  id?: string;
  description: string;
  amount: number | string; // Allow string for input, convert to number on save
  type: 'income' | 'expense';
  category: string;
  payment_method?: string;

  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number | string; // Allow string for input
  start_date: string; // ISO YYYY-MM-DD
  end_date?: string; // ISO YYYY-MM-DD

  day_of_week?: number; // 0-6 for weekly
  day_of_month?: number; // 1-31 for monthly/yearly
  // month_of_year?: number; // 1-12 for yearly - Can be derived from start_date for simple yearly
}

interface RecurringTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RecurringTransactionData) => void;
  initialData?: RecurringTransactionData | null;
}

const defaultInitialData: RecurringTransactionData = {
  description: '',
  amount: '',
  type: 'expense',
  category: '',
  payment_method: '',
  frequency: 'monthly',
  interval: 1,
  start_date: format(new Date(), 'yyyy-MM-dd'),
  // end_date: undefined,
  // day_of_week: undefined,
  // day_of_month: undefined,
};

export function RecurringTransactionForm({ isOpen, onClose, onSubmit, initialData }: RecurringTransactionFormProps) {
  const [formData, setFormData] = useState<RecurringTransactionData>(initialData || defaultInitialData);

  const categories = ExpenseManager.getPopularCategories();
  const paymentMethods = ExpenseManager.getPaymentMethods();

  useEffect(() => {
    setFormData(initialData || defaultInitialData);
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, [name]: format(date, 'yyyy-MM-dd') }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add validation
    const dataToSubmit = {
      ...formData,
      amount: parseFloat(formData.amount as string),
      interval: parseInt(formData.interval as string, 10),
    };
    onSubmit(dataToSubmit);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Add'} Recurring Transaction</DialogTitle>
          <DialogDescription>
            Set up automated entries for your regular income or expenses.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Basic Info: Description, Amount, Type */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" value={formData.description} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select name="type" value={formData.type} onValueChange={(v) => handleSelectChange('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category and Payment Method */}
           <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select name="category" value={formData.category} onValueChange={(v) => handleSelectChange('category', v)}>
                <SelectTrigger><SelectValue placeholder="Select category..."/></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment_method">Payment Method (Optional)</Label>
              <Select name="payment_method" value={formData.payment_method || ''} onValueChange={(v) => handleSelectChange('payment_method', v)}>
                <SelectTrigger><SelectValue placeholder="Select payment method..."/></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(pm => <SelectItem key={pm} value={pm}>{pm}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recurrence Rule: Start Date, Frequency, Interval */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(parseISO(formData.start_date), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date ? parseISO(formData.start_date) : undefined}
                    onSelect={(date) => handleDateChange('start_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select name="frequency" value={formData.frequency} onValueChange={(v) => handleSelectChange('frequency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="interval">Interval</Label>
              <Input id="interval" name="interval" type="number" min="1" value={formData.interval} onChange={handleChange} />
            </div>
          </div>

          {/* Conditional Recurrence Fields: Day of Week, Day of Month */}
          {formData.frequency === 'weekly' && (
            <div>
              <Label htmlFor="day_of_week">Day of Week</Label>
              <Select name="day_of_week" value={formData.day_of_week?.toString() || ''} onValueChange={(v) => handleSelectChange('day_of_week', parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select day..."/></SelectTrigger>
                <SelectContent>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                    <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {formData.frequency === 'monthly' && (
             <div>
              <Label htmlFor="day_of_month">Day of Month (1-31)</Label>
              {/* TODO: Improve this for "last day" or specific weekday of month */}
              <Input id="day_of_month" name="day_of_month" type="number" min="1" max="31"
                     value={formData.day_of_month || ''}
                     onChange={(e) => handleSelectChange('day_of_month', parseInt(e.target.value))} />
            </div>
          )}
          {/* Note: For 'yearly', day_of_month and month_of_year (from start_date) would be used. */}
          {/* Simpler yearly might just use the day/month of start_date. */}


          {/* End Date (Optional) */}
          <div>
            <Label htmlFor="end_date">End Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.end_date ? format(parseISO(formData.end_date), "PPP") : "Pick an end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.end_date ? parseISO(formData.end_date) : undefined}
                  onSelect={(date) => handleDateChange('end_date', date)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* TODO: Add tags input if needed */}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Recurring Transaction</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
