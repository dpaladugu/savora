import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, CreditCard as CreditCardIcon, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { CreditCard } from '@/db';
import { Expense } from '@/services/supabase-data-service';
import { db } from '@/lib/db';
import { format } from 'date-fns';

export function CreditCardFlowTracker() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cards, expenseData] = await Promise.all([
        db.creditCards.toArray(),
        db.expenses.toArray()
      ]);
      
      setCreditCards(cards);
      
      // Map db expenses to supabase format, adding required 'type' property
      const mappedExpenses: Expense[] = expenseData.map(expense => ({
        ...expense,
        type: expense.category || 'general', // Add required type field
        payment_method: expense.paymentMethod || '',
        tags: Array.isArray(expense.tags) ? expense.tags.join(',') : (expense.tags || ''),
        account: expense.account || '',
        user_id: expense.user_id || '',
        created_at: expense.created_at || new Date().toISOString(),
        updated_at: expense.updated_at || new Date().toISOString()
      }));
      
      setExpenses(mappedExpenses);
    } catch (error) {
      console.error('Error loading credit card data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Card Flow Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Credit Cards</h3>
              {creditCards.map((card) => (
                <div key={card.id} className="mb-2 p-2 border rounded-md">
                  <CreditCardIcon className="inline-block mr-2" />
                  {card.name} - Balance: ${card.currentBalance}
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-lg font-semibold">Expenses</h3>
              {expenses.map((expense) => (
                <div key={expense.id} className="mb-2 p-2 border rounded-md">
                  {expense.description} - Amount: ${expense.amount} - Category: {expense.category}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
