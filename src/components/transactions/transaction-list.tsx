
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PrivacyMask } from '@/components/auth/PrivacyMask';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    description: 'Grocery Shopping',
    amount: -2500,
    category: 'Food & Dining',
    date: '2024-03-15',
    type: 'expense'
  },
  {
    id: '2',
    description: 'Salary Credit',
    amount: 75000,
    category: 'Income',
    date: '2024-03-14',
    type: 'income'
  },
  {
    id: '3',
    description: 'Electricity Bill',
    amount: -3200,
    category: 'Bills & Utilities',
    date: '2024-03-13',
    type: 'expense'
  },
  {
    id: '4',
    description: 'Freelance Payment',
    amount: 15000,
    category: 'Income',
    date: '2024-03-12',
    type: 'income'
  },
  {
    id: '5',
    description: 'Movie Tickets',
    amount: -800,
    category: 'Entertainment',
    date: '2024-03-11',
    type: 'expense'
  }
];

export function TransactionList() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
    
    return amount < 0 ? `-${formatted}` : `+${formatted}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {transaction.category}
                  </Badge>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`font-medium ${
                  transaction.amount < 0 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  <PrivacyMask value={formatAmount(transaction.amount)} />
                </div>
              </div>
            </div>
          ))}
          
          {mockTransactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
