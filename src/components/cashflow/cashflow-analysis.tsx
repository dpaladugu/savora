import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { useAuth } from '@/services/auth-service';

interface CashflowData {
  income: number;
  expenses: number;
  netCashflow: number;
  savingsRate: number;
}

export function CashflowAnalysis() {
  const [cashflowData, setCashflowData] = useState<CashflowData>({
    income: 0,
    expenses: 0,
    netCashflow: 0,
    savingsRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  useEffect(() => {
    const fetchCashflowData = async () => {
      setLoading(true);
      try {
        // Mock data loading with a delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Replace with actual data fetching logic
        const income = 5000;
        const expenses = 3000;
        const netCashflow = income - expenses;
        const savingsRate = (netCashflow / income) * 100;

        setCashflowData({ income, expenses, netCashflow, savingsRate });
      } catch (err: any) {
        setError(err.message || 'Failed to fetch cashflow data');
      } finally {
        setLoading(false);
      }
    };

    fetchCashflowData();
  }, [auth]);

  const netCashflowColor = useMemo(() => {
    if (cashflowData.netCashflow > 0) {
      return "green";
    } else if (cashflowData.netCashflow < 0) {
      return "red";
    } else {
      return "muted";
    }
  }, [cashflowData.netCashflow]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cashflow Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading cashflow data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cashflow Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cashflow Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span>Income:</span>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-green-500" />
              <span>${cashflowData.income.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Expenses:</span>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-red-500" />
              <span>${cashflowData.expenses.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Net Cashflow:</span>
            <div className="flex items-center">
              {cashflowData.netCashflow > 0 ? (
                <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
              )}
              <span className={`text-${netCashflowColor}-500`}>
                ${cashflowData.netCashflow.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Savings Rate:</span>
            <div className="flex items-center">
              <Badge variant="outline">{cashflowData.savingsRate.toFixed(2)}%</Badge>
            </div>
          </div>
          <div>
            <Progress value={cashflowData.savingsRate} max={100} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
