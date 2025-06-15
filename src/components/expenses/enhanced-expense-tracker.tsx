
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Upload, Trash2 } from "lucide-react";
import { AddExpenseForm } from "@/components/forms/add-expense-form";
import { ExpenseList } from "./expense-list";
import { ExpenseManager } from "@/services/expense-manager";
import { useAuth } from "@/contexts/auth-context";
import { GlobalHeader } from "@/components/layout/global-header";
import { useAsyncOperation } from "@/hooks/use-async-operation";
import { NotificationService } from "@/services/notification-service";
import { DataValidator } from "@/services/data-validator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function EnhancedExpenseTracker() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [dateRange, setDateRange] = useState("all");
  const { user } = useAuth();

  const { execute: loadExpenses, loading } = useAsyncOperation(
    async () => {
      if (!user) return [];
      const data = await ExpenseManager.getExpenses(user.uid);
      setExpenses(data);
      return data;
    },
    {
      showErrorToast: true,
      errorMessage: "Failed to load expenses"
    }
  );

  const { execute: deleteExpense } = useAsyncOperation(
    async (expenseId: string) => {
      if (!user) return;
      await ExpenseManager.deleteExpense(user.uid, expenseId);
      await loadExpenses();
    },
    {
      showSuccessToast: true,
      successMessage: "Expense deleted successfully",
      showErrorToast: true,
      errorMessage: "Failed to delete expense"
    }
  );

  useEffect(() => {
    loadExpenses();
  }, [user]);

  const handleAddExpense = async () => {
    setShowAddForm(false);
    await loadExpenses();
  };

  const categories = ["All", ...ExpenseManager.getPopularCategories()];

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || expense.category === filterCategory;
    
    let matchesDate = true;
    if (dateRange !== "all") {
      const expenseDate = new Date(expense.date);
      const now = new Date();
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      matchesDate = expenseDate >= cutoffDate;
    }
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const avgExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;

  const exportData = () => {
    const csvContent = [
      ['Date', 'Description', 'Category', 'Amount', 'Payment Method'],
      ...filteredExpenses.map(expense => [
        expense.date,
        expense.description,
        expense.category,
        expense.amount,
        expense.paymentMethod || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    NotificationService.success({
      title: 'Data Exported',
      description: `${filteredExpenses.length} expenses exported to CSV`
    });
  };

  if (showAddForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
        <GlobalHeader title="Add Expense" />
        <div className="pt-20 px-4">
          <AddExpenseForm
            onSuccess={handleAddExpense}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
      <GlobalHeader title="Expense Tracker" />
      
      <div className="pt-20 px-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="metric-card">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {DataValidator.formatCurrency(totalExpenses)}
              </div>
              <div className="text-sm text-muted-foreground">Total Expenses</div>
            </CardContent>
          </Card>
          <Card className="metric-card">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">{filteredExpenses.length}</div>
              <div className="text-sm text-muted-foreground">Transactions</div>
            </CardContent>
          </Card>
          <Card className="metric-card">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {DataValidator.formatCurrency(avgExpense)}
              </div>
              <div className="text-sm text-muted-foreground">Average Amount</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Expense Management</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={exportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading expenses...</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 3 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <ExpenseList 
                  expenses={filteredExpenses}
                  onDelete={(id) => deleteExpense(id)}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
