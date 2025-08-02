import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { RecurringTransactionRecord } from "@/types/recurring-transaction";

interface RecurringTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<RecurringTransactionRecord, 'id' | 'created_at' | 'updated_at'>) => void;
  initialData?: RecurringTransactionRecord | null;
}

export function RecurringTransactionForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: RecurringTransactionFormProps) {
  const [formData, setFormData] = useState<Omit<RecurringTransactionRecord, 'id' | 'created_at' | 'updated_at'>>({
    user_id: '',
    amount: 0,
    description: '',
    category: '',
    frequency: 'monthly',
    interval: 1,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: undefined,
    day_of_week: undefined,
    day_of_month: undefined,
    next_occurrence_date: undefined,
    next_date: format(new Date(), 'yyyy-MM-dd'),
    is_active: true,
    type: 'expense',
    payment_method: undefined,
    account: undefined,
  });
  const [date, setDate] = useState<DateRange | undefined>({
    from: initialData?.start_date ? new Date(initialData.start_date) : new Date(),
    to: initialData?.end_date ? new Date(initialData.end_date) : undefined,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        user_id: initialData.user_id,
        amount: initialData.amount,
        description: initialData.description,
        category: initialData.category,
        frequency: initialData.frequency,
        interval: initialData.interval,
        start_date: initialData.start_date,
        end_date: initialData.end_date,
        day_of_week: initialData.day_of_week,
        day_of_month: initialData.day_of_month,
        next_occurrence_date: initialData.next_occurrence_date,
        next_date: initialData.next_date,
        is_active: initialData.is_active,
        type: initialData.type,
        payment_method: initialData.payment_method,
        account: initialData.account,
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (date?.from) {
      setFormData(prev => ({ ...prev, start_date: format(date.from as Date, 'yyyy-MM-dd') }));
    }
    if (date?.to) {
      setFormData(prev => ({ ...prev, end_date: format(date.to as Date, 'yyyy-MM-dd') }));
    } else {
      setFormData(prev => ({ ...prev, end_date: undefined }));
    }
  }, [date]);

  const frequency = formData.frequency;

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black/50">
      <div className="relative m-auto mt-20 w-full max-w-lg rounded-lg bg-white p-4">
        <Card>
          <CardHeader>
            <CardTitle>{initialData ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}</CardTitle>
            <CardDescription>Enter the details for the recurring transaction.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount.toString()}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, frequency: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="interval">Interval</Label>
              <Input
                id="interval"
                type="number"
                value={formData.interval.toString()}
                onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Start and End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !date?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        `${format(date.from, "yyyy-MM-dd")} - ${format(date.to, "yyyy-MM-dd")}`
                      ) : (
                        format(date.from, "yyyy-MM-dd")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center" side="bottom">
                  <Calendar
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    pagedNavigation
                  />
                </PopoverContent>
              </Popover>
            </div>

            {(frequency === 'monthly') && (
              <div className="space-y-2">
                <Label htmlFor="day_of_month">Day of Month</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_month: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day of month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(frequency === 'weekly') && (
              <div className="space-y-2">
                <Label htmlFor="day_of_week">Day of Week</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_week: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day of week" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Input
                id="payment_method"
                value={formData.payment_method || ''}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account">Account</Label>
              <Input
                id="account"
                value={formData.account || ''}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit}>
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
