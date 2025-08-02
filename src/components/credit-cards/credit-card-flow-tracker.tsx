
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CreditCard, Plus } from 'lucide-react';
import { format, parseISO, addMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { CreditCard, Expense } from '@/db';

interface FlowData {
  date: Date;
  amount: number;
  description: string;
  category: string;
}

export function CreditCardFlowTracker() {
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [flowData, setFlowData] = useState<FlowData[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const creditCards = useLiveQuery(() => db.creditCards.toArray(), []);

  useEffect(() => {
    if (selectedCard) {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);

      db.expenses
        .where('cardId')
        .equals(selectedCard)
        .toArray()
        .then((cardExpenses) => {
          const filteredExpenses = cardExpenses.filter(expense => {
            const expenseDate = typeof expense.date === 'string' ? parseISO(expense.date) : expense.date;
            return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
          });

          // Convert to compatible format by adding required 'type' property
          const compatibleExpenses: Expense[] = filteredExpenses.map(expense => ({
            ...expense,
            type: 'expense' // Add the missing type property
          }));

          setExpenses(compatibleExpenses);
          
          const flows = compatibleExpenses.map(expense => ({
            date: typeof expense.date === 'string' ? parseISO(expense.date) : expense.date,
            amount: expense.amount,
            description: expense.description,
            category: expense.category
          }));

          setFlowData(flows);
        })
        .catch(error => {
          console.error('Error loading expenses:', error);
          toast.error('Failed to load expenses');
        });
    }
  }, [selectedCard, selectedMonth]);

  const selectedCardData = creditCards?.find(card => card.id === selectedCard);

  const totalSpent = flowData.reduce((sum, flow) => sum + flow.amount, 0);
  const transactionCount = flowData.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Credit Card Flow Tracker</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Select Credit Card</Label>
          <Select value={selectedCard} onValueChange={setSelectedCard}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a credit card" />
            </SelectTrigger>
            <SelectContent>
              {creditCards?.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.issuer} *{card.last4}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Select Month</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedMonth, "MMMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedMonth}
                onSelect={(date) => date && setSelectedMonth(startOfMonth(date))}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {selectedCardData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {selectedCardData.issuer} *{selectedCardData.last4}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold">{transactionCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Available Credit</p>
                    <p className="text-2xl font-bold">₹{(selectedCardData.creditLimit - totalSpent).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Transaction History</h3>
              {flowData.length > 0 ? (
                <div className="space-y-2">
                  {flowData.map((flow, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{flow.description}</p>
                        <p className="text-sm text-muted-foreground">{flow.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{flow.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{format(flow.date, 'dd MMM')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No transactions found for the selected period.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedCard && (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Select a Credit Card</h3>
            <p className="text-muted-foreground">
              Choose a credit card to view its transaction flow and spending patterns.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
