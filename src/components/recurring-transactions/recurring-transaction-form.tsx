
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { format, parseISO, addDays, addWeeks, addMonths, addYears, isValid, set } from 'date-fns';
import { db } from '@/db';
import type { RecurringTransactionRecord } from '@/types/recurring-transaction';
import { RecurringTransactionService } from '@/services/RecurringTransactionService';
import { useToast } from "@/hooks/use-toast";

export type RecurringTransactionFormData = Partial<Omit<RecurringTransactionRecord, 'amount' | 'interval' | 'created_at' | 'updated_at'>> & {
  id?: string;
  amount: string;
  interval: string;
  account?: string;
};

interface RecurringTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: RecurringTransactionRecord | null;
  onSubmit?: (data: Omit<RecurringTransactionRecord, 'created_at' | 'updated_at'>) => Promise<void>;
}

const calculateNextOccurrenceDate = (
  startDate: string,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval: number,
  dayOfWeek?: number,
  dayOfMonth?: number
): string => {
  if (!startDate || !frequency || interval < 1) return startDate;

  let nextDate = parseISO(startDate);
  const now = new Date();
  now.setHours(0,0,0,0);

  while (nextDate < now) {
    switch (frequency) {
      case 'daily':
        nextDate = addDays(nextDate, interval);
        break;
      case 'weekly':
        nextDate = addWeeks(nextDate, interval);
        break;
      case 'monthly':
        nextDate = addMonths(nextDate, interval);
        if (dayOfMonth) {
          const currentMonth = nextDate.getMonth();
          const currentYear = nextDate.getFullYear();
          let tempDate = new Date(currentYear, currentMonth, dayOfMonth);
          if (tempDate.getMonth() !== currentMonth) {
             tempDate = new Date(currentYear, currentMonth + 1, 0);
          }
          nextDate = tempDate;
        }
        break;
      case 'yearly':
        nextDate = addYears(nextDate, interval);
        if (dayOfMonth) {
            const currentYearAnnual = nextDate.getFullYear();
            const monthFromStartDate = parseISO(startDate).getMonth();
            let tempDateAnnual = new Date(currentYearAnnual, monthFromStartDate, dayOfMonth);
             if (tempDateAnnual.getMonth() !== monthFromStartDate) {
                tempDateAnnual = new Date(currentYearAnnual, monthFromStartDate + 1, 0);
            }
            nextDate = tempDateAnnual;
        }
        break;
      default:
        return startDate;
    }
  }
  return format(nextDate, 'yyyy-MM-dd');
};

const defaultInitialFormData: RecurringTransactionFormData = {
  description: '',
  amount: '',
  type: 'expense',
  category: '',
  payment_method: '',
  frequency: 'monthly',
  interval: '1',
  start_date: format(new Date(), 'yyyy-MM-dd'),
  end_date: undefined,
  day_of_week: undefined,
  day_of_month: undefined,
  is_active: true,
  account: '',
};

export function RecurringTransactionForm({ isOpen, onClose, initialData, onSubmit }: RecurringTransactionFormProps) {
  const [formData, setFormData] = useState<RecurringTransactionFormData>(defaultInitialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof RecurringTransactionFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const categories = ["Salary", "Rent", "Groceries", "Utilities", "Subscription", "Loan Payment", "Investment", "Other Income", "Other Expense"];
  const paymentMethods = ["Bank Transfer", "Credit Card", "Debit Card", "Cash", "UPI", "Wallet"];

  const resetForm = useCallback(() => {
    setFormData(defaultInitialFormData);
    setErrors({});
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          amount: initialData.amount.toString(),
          interval: initialData.interval.toString(),
          start_date: initialData.start_date ? format(parseISO(initialData.start_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          end_date: initialData.end_date ? format(parseISO(initialData.end_date), 'yyyy-MM-dd') : undefined,
          account: initialData.account || '',
        });
      } else {
        setFormData(defaultInitialFormData);
      }
    } else if (!isOpen && initialData) {
        resetForm();
    }
  }, [initialData, isOpen, resetForm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
     if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name as keyof RecurringTransactionFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: keyof RecurringTransactionFormData, value: string | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [name]: value }));
     if (errors[name as keyof RecurringTransactionFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDateChange = (name: keyof RecurringTransactionFormData, date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [name]: date ? format(date, 'yyyy-MM-dd') : undefined }));
     if (errors[name as keyof RecurringTransactionFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RecurringTransactionFormData, string>> = {};
    if (!formData.description?.trim()) newErrors.description = "Description is required.";
    if (!formData.amount?.trim() || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) newErrors.amount = "Valid positive amount is required.";
    if (!formData.category?.trim()) newErrors.category = "Category is required.";
    if (!formData.start_date) newErrors.start_date = "Start date is required.";
    else if (!isValid(parseISO(formData.start_date))) newErrors.start_date = "Invalid start date format.";

    if (formData.end_date && !isValid(parseISO(formData.end_date))) newErrors.end_date = "Invalid end date format.";
    if (formData.end_date && formData.start_date && parseISO(formData.end_date) < parseISO(formData.start_date)) {
      newErrors.end_date = "End date cannot be before start date.";
    }

    if (!formData.interval?.trim() || isNaN(parseInt(formData.interval)) || parseInt(formData.interval) < 1) newErrors.interval = "Valid positive interval is required.";

    if (formData.frequency === 'weekly' && formData.day_of_week === undefined) newErrors.day_of_week = "Day of week is required for weekly frequency.";
    if (formData.frequency === 'monthly' && formData.day_of_month === undefined) newErrors.day_of_month = "Day of month is required for monthly frequency.";
    else if (formData.day_of_month && (formData.day_of_month < 1 || formData.day_of_month > 31)) newErrors.day_of_month = "Day of month must be between 1 and 31.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: "Validation Error", description: "Please check the form for errors.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const amountNum = parseFloat(formData.amount as string);
    const intervalNum = parseInt(formData.interval as string, 10);

    const recordData: Omit<RecurringTransactionRecord, 'created_at' | 'updated_at'> = {
      id: formData.id || '',
      user_id: formData.user_id || '',
      description: formData.description!,
      amount: amountNum,
      type: formData.type!,
      category: formData.category!,
      payment_method: formData.payment_method || '',
      frequency: formData.frequency!,
      interval: intervalNum,
      start_date: formData.start_date!,
      end_date: formData.end_date || undefined,
      day_of_week: formData.day_of_week,
      day_of_month: formData.day_of_month,
      is_active: formData.is_active !== undefined ? formData.is_active : true,
      next_date: calculateNextOccurrenceDate(
        formData.start_date!,
        formData.frequency!,
        intervalNum,
        formData.day_of_week,
        formData.day_of_month
      ),
      account: formData.account,
    };

    try {
      if (onSubmit) {
        await onSubmit(recordData);
      } else {
        if (formData.id) {
          await RecurringTransactionService.updateRecurringTransaction(formData.id, { ...recordData, updated_at: new Date() });
          toast({ title: "Success", description: "Recurring transaction updated." });
        } else {
          await RecurringTransactionService.addRecurringTransaction(recordData);
          toast({ title: "Success", description: "Recurring transaction added." });
        }
      }
      onClose();
    } catch (error) {
      console.error("Failed to save recurring transaction:", error);
      toast({ title: "Error", description: (error as Error).message || `Failed to save transaction.`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const FieldError: React.FC<{ field: keyof RecurringTransactionFormData }> = ({ field }) =>
    errors[field] ? <p id={`${field}-error`} className="text-xs text-red-500 mt-1 flex items-center"><AlertCircle aria-hidden="true" className="w-3 h-3 mr-1"/> {errors[field]}</p> : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] md:sm:max-w-[650px] max-h-[90vh] overflow-y-auto p-6" aria-describedby="add-recurring-transaction-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{formData.id ? 'Edit' : 'Add'} Recurring Transaction</DialogTitle>
          <DialogDescription id="add-recurring-transaction-description">
            Automate your regular income or expenses with ease.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 pb-4">
          <div>
            <Label htmlFor="description" className="font-medium">Description *</Label>
            <Input id="description" name="description" value={formData.description || ''} onChange={handleChange} required
                   className={errors.description ? 'border-red-500' : ''}
                   aria-required="true"
                   aria-invalid={!!errors.description}
                   aria-describedby={errors.description ? "description-error" : undefined}
            />
            <FieldError field="description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount" className="font-medium">Amount *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount || ''} onChange={handleChange} required
                     className={errors.amount ? 'border-red-500' : ''}
                     aria-required="true"
                     aria-invalid={!!errors.amount}
                     aria-describedby={errors.amount ? "amount-error" : undefined}
              />
              <FieldError field="amount" />
            </div>
            <div>
              <Label htmlFor="type" className="font-medium">Type *</Label>
              <Select name="type" value={formData.type || 'expense'} onValueChange={(v) => handleSelectChange('type', v as 'income' | 'expense')}>
                <SelectTrigger className={errors.type ? 'border-red-500' : ''}
                               aria-required="true"
                               aria-invalid={!!errors.type}
                               aria-describedby={errors.type ? "type-error" : undefined}
                ><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field="type" />
            </div>
          </div>

           <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category" className="font-medium">Category *</Label>
              <Select name="category" value={formData.category || ''} onValueChange={(v) => handleSelectChange('category', v)}>
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}
                               aria-required="true"
                               aria-invalid={!!errors.category}
                               aria-describedby={errors.category ? "category-error" : undefined}
                ><SelectValue placeholder="Select category..."/></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
               <FieldError field="category" />
            </div>
            <div>
              <Label htmlFor="payment_method" className="font-medium">Payment Method</Label>
              <Select name="payment_method" value={formData.payment_method || ''} onValueChange={(v) => handleSelectChange('payment_method', v)}>
                <SelectTrigger><SelectValue placeholder="Select payment method..."/></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(pm => <SelectItem key={pm} value={pm}>{pm}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="start_date" className="font-medium">Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`w-full justify-start text-left font-normal ${errors.start_date ? 'border-red-500' : ''}`}
                          aria-required="true"
                          aria-invalid={!!errors.start_date}
                          aria-describedby={errors.start_date ? "start_date-error" : undefined}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date && isValid(parseISO(formData.start_date)) ? format(parseISO(formData.start_date), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date && isValid(parseISO(formData.start_date)) ? parseISO(formData.start_date) : undefined}
                    onSelect={(date) => handleDateChange('start_date', date)}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1)) && !formData.id}
                  />
                </PopoverContent>
              </Popover>
              <FieldError field="start_date" />
            </div>
            <div>
              <Label htmlFor="frequency" className="font-medium">Frequency *</Label>
              <Select name="frequency" value={formData.frequency || 'monthly'} onValueChange={(v) => handleSelectChange('frequency', v as RecurringTransactionRecord['frequency'])}>
                <SelectTrigger className={errors.frequency ? 'border-red-500' : ''}
                               aria-required="true"
                               aria-invalid={!!errors.frequency}
                               aria-describedby={errors.frequency ? "frequency-error" : undefined}
                ><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field="frequency" />
            </div>
            <div>
              <Label htmlFor="interval" className="font-medium">Interval *</Label>
              <Input id="interval" name="interval" type="number" min="1" value={formData.interval || '1'} onChange={handleChange}
                     className={errors.interval ? 'border-red-500' : ''}
                     aria-required="true"
                     aria-invalid={!!errors.interval}
                     aria-describedby={errors.interval ? "interval-error" : undefined}
              />
              <FieldError field="interval" />
            </div>
          </div>

          {formData.frequency === 'weekly' && (
            <div>
              <Label htmlFor="day_of_week" className="font-medium">Day of Week *</Label>
              <Select name="day_of_week" value={formData.day_of_week?.toString() || ''} onValueChange={(v) => handleSelectChange('day_of_week', v ? parseInt(v) : undefined)}>
                <SelectTrigger className={errors.day_of_week ? 'border-red-500' : ''}
                               aria-required="true"
                               aria-invalid={!!errors.day_of_week}
                               aria-describedby={errors.day_of_week ? "day_of_week-error" : undefined}
                ><SelectValue placeholder="Select day..."/></SelectTrigger>
                <SelectContent>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                    <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError field="day_of_week" />
            </div>
          )}
          {formData.frequency === 'monthly' && (
             <div>
              <Label htmlFor="day_of_month" className="font-medium">Day of Month (1-31) *</Label>
              <Input id="day_of_month" name="day_of_month" type="number" min="1" max="31"
                     value={formData.day_of_month || ''}
                     onChange={(e) => handleSelectChange('day_of_month', e.target.value ? parseInt(e.target.value) : undefined)}
                     className={errors.day_of_month ? 'border-red-500' : ''}
                     aria-required="true"
                     aria-invalid={!!errors.day_of_month}
                     aria-describedby={errors.day_of_month ? "day_of_month-error" : undefined}
              />
              <FieldError field="day_of_month" />
            </div>
          )}

          <div>
            <Label htmlFor="end_date" className="font-medium">End Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={`w-full justify-start text-left font-normal ${errors.end_date ? 'border-red-500' : ''}`}
                        aria-invalid={!!errors.end_date}
                        aria-describedby={errors.end_date ? "end_date-error" : undefined}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.end_date && isValid(parseISO(formData.end_date)) ? format(parseISO(formData.end_date), "PPP") : "Never / Pick an end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.end_date && isValid(parseISO(formData.end_date)) ? parseISO(formData.end_date) : undefined}
                  onSelect={(date) => handleDateChange('end_date', date)}
                  disabled={(date) => formData.start_date ? date < parseISO(formData.start_date) : false}
                />
              </PopoverContent>
            </Popover>
            <FieldError field="end_date" />
          </div>

          <div>
            <Label htmlFor="account" className="font-medium">Account (Optional)</Label>
            <Input
              id="account"
              name="account"
              value={formData.account || ''}
              onChange={handleChange}
              placeholder="Account name or identifier"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleSelectChange('is_active', !!checked)}
            />
            <Label htmlFor="is_active" className="font-medium text-sm">
              Active (will generate transactions)
            </Label>
          </div>

          <DialogFooter className="pt-5">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (formData.id ? 'Update Transaction' : 'Save Transaction')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
