import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { db } from '@/lib/db';

interface CashflowData {
  income: number;
  expenses: number;
  netCashflow: number;
  savingsRate: number;
}

export function CashflowAnalysis() {
  const [cashflowData, setCashflowData] = useState<CashflowData>({
    income: 0, expenses: 0, netCashflow: 0, savingsRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const monthStart = new Date();
        monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

        const [incomes, txns] = await Promise.all([
          db.incomes.toArray(),
          db.txns.toArray(),
        ]);

        const income = incomes
          .filter(i => new Date(i.date) >= monthStart)
          .reduce((s, i) => s + i.amount, 0);

        const expenses = txns
          .filter(t => t.amount < 0 && new Date(t.date) >= monthStart)
          .reduce((s, t) => s + Math.abs(t.amount), 0);

        const netCashflow = income - expenses;
        const savingsRate = income > 0 ? (netCashflow / income) * 100 : 0;

        setCashflowData({ income, expenses, netCashflow, savingsRate });
      } catch (err: any) {
        setError(err.message || 'Failed to fetch cashflow data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <Card>
      <CardHeader><CardTitle>Cashflow Analysis</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">Loading...</p></CardContent>
    </Card>
  );

  if (error) return (
    <Card>
      <CardHeader><CardTitle>Cashflow Analysis</CardTitle></CardHeader>
      <CardContent><p className="text-destructive">Error: {error}</p></CardContent>
    </Card>
  );

  const isPositive = cashflowData.netCashflow >= 0;

  return (
    <Card>
      <CardHeader><CardTitle>Cashflow Analysis</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span>Income:</span>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-success" />
              <span className="text-success font-medium">₹{cashflowData.income.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Expenses:</span>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-destructive" />
              <span className="text-destructive font-medium">₹{cashflowData.expenses.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Net Cashflow:</span>
            <div className="flex items-center">
              {isPositive
                ? <TrendingUp className="mr-2 h-4 w-4 text-success" />
                : <TrendingDown className="mr-2 h-4 w-4 text-destructive" />
              }
              <span className={isPositive ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
                ₹{cashflowData.netCashflow.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Savings Rate:</span>
            <Badge variant="outline">{cashflowData.savingsRate.toFixed(1)}%</Badge>
          </div>
          <Progress value={Math.max(0, cashflowData.savingsRate)} max={100} />
        </div>
      </CardContent>
    </Card>
  );
}
