import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, ArrowUpDown } from "lucide-react";
import { SupabaseDataService } from "@/services/supabase-data-service";
import { formatCurrency } from "@/lib/format-utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAuth } from "@/contexts/auth-context";

interface CashflowChartEntry {
  month: string;
  income: number;
  expenses: number;
  investments: number;
  surplus: number;
}

interface CategoryChartEntry {
  category: string;
  amount: number;
}

export function CashflowAnalysis() {
  const { user } = useAuth();
  const [cashflowData, setCashflowData] = useState<CashflowChartEntry[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryChartEntry[]>([]);
  const [timeFilter, setTimeFilter] = useState<'3m' | '6m' | '1y'>('6m');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCashflowData();
  }, [timeFilter]);

  const loadCashflowData = async () => {
    setLoading(true);
    
    try {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      // Pass user_id to the service methods
      const [incomes, expenses] = await Promise.all([
        SupabaseDataService.getIncomes(user.uid),
        SupabaseDataService.getExpenses(user.uid),
      ]);
      const investments: any[] = []; // Mock empty investments

      // Calculate date range based on filter
      const endDate = new Date();
      const startDate = new Date();
      if (timeFilter === '3m') startDate.setMonth(endDate.getMonth() - 3);
      else if (timeFilter === '6m') startDate.setMonth(endDate.getMonth() - 6);
      else startDate.setFullYear(endDate.getFullYear() - 1);

      // Group data by month
      const monthlyData: Record<string, { expenses: number; investments: number; income: number }> = {};
      
      expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        if (expenseDate >= startDate && expenseDate <= endDate) {
          const month = expense.date.substring(0, 7);
          if (!monthlyData[month]) {
            monthlyData[month] = { expenses: 0, investments: 0, income: 0 };
          }
          monthlyData[month].expenses += expense.amount;
        }
      });

      investments.forEach(investment => {
        const investmentDate = new Date(investment.date);
        if (investmentDate >= startDate && investmentDate <= endDate) {
          const month = investment.date.substring(0, 7);
          if (!monthlyData[month]) {
            monthlyData[month] = { expenses: 0, investments: 0, income: 0 };
          }
          monthlyData[month].investments += investment.amount;
        }
      });

      incomes.forEach(income => {
        const incomeDate = new Date(income.date);
        if (incomeDate >= startDate && incomeDate <= endDate) {
          const month = income.date.substring(0, 7); // YYYY-MM
          if (!monthlyData[month]) {
            monthlyData[month] = { expenses: 0, investments: 0, income: 0 };
          }
          monthlyData[month].income += income.amount;
        }
      });

      // Ensure all months have a default income of 0 if no income was recorded
      Object.keys(monthlyData).forEach(month => {
        if (monthlyData[month].income === undefined) {
          monthlyData[month].income = 0;
        }
      });

      const chartData = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
          income: data.income,
          expenses: data.expenses,
          investments: data.investments,
          surplus: data.income - data.expenses - data.investments
        }));

      setCashflowData(chartData);

      // Category breakdown for current month
      const currentMonth = new Date().toISOString().substring(0, 7);
      const currentMonthExpenses = expenses.filter(exp => exp.date.startsWith(currentMonth));
      
      const categories = currentMonthExpenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      const categoryChartData = Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([category, amount]) => ({ category, amount }));

      setCategoryData(categoryChartData);
    } catch (error) {
      console.error('Failed to load cashflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = cashflowData.reduce((sum, data) => sum + data.income, 0);
  const totalExpenses = cashflowData.reduce((sum, data) => sum + data.expenses, 0);
  const totalInvestments = cashflowData.reduce((sum, data) => sum + data.investments, 0);
  const netSurplus = totalIncome - totalExpenses - totalInvestments;
  const savingsRate = totalIncome > 0 ? ((totalInvestments / totalIncome) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {/* Title/subtitle would come from ModuleHeader via router config.
              This text is more of a description for the page content itself.
          */}
          <p className="text-muted-foreground text-base"> {/* Adjusted size */}
            Analyze your income, expenses, and savings flow over selected periods.
          </p>
        </div>
        <div className="flex gap-2">
            {(['3m', '6m', '1y'] as const).map((period) => (
              <Button
                key={period}
                variant={timeFilter === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter(period)}
              >
                {period.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing cashflow...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="metric-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Income</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(totalIncome)}</div>
                </CardContent>
              </Card>

              <Card className="metric-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">Expenses</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(totalExpenses)}</div>
                </CardContent>
              </Card>

              <Card className="metric-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Investments</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(totalInvestments)}</div>
                </CardContent>
              </Card>

              <Card className="metric-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpDown className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Surplus</span>
                  </div>
                  <div className={`text-2xl font-bold ${netSurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(netSurplus)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Savings Rate */}
            <Card className="metric-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Savings Rate</span>
                  <span className="text-lg font-bold text-foreground">{savingsRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      savingsRate >= 20 ? 'bg-green-500' : 
                      savingsRate >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(savingsRate, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: 20% | Current: {savingsRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            {/* Cashflow Chart */}
            <Card className="metric-card border-border/50">
              <CardHeader>
                <CardTitle>Monthly Cashflow Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cashflowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']} />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                      <Line type="monotone" dataKey="investments" stroke="#3b82f6" strokeWidth={2} name="Investments" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="metric-card border-border/50">
              <CardHeader>
                <CardTitle>Expense Categories (This Month)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Amount']} />
                      <Bar dataKey="amount" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
