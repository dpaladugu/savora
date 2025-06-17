
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, TrendingUp, TrendingDown } from "lucide-react";
import { AdvancedExpenseForm } from "./advanced-expense-form";
import { AdvancedExpenseFilters } from "./advanced-expense-filters";
import { ExpenseList } from "./expense-list";
import { SupabaseExpenseManager } from "@/services/supabase-expense-manager";
import { useAuth } from "@/contexts/auth-context";
import { EnhancedNotificationService } from "@/services/enhanced-notification-service";
import { ComprehensiveDataValidator } from "@/services/comprehensive-data-validator";
import { useToast } from "@/hooks/use-toast";
import { EnhancedLoadingWrapper } from "@/components/ui/enhanced-loading-wrapper";
import { CriticalErrorBoundary } from "@/components/ui/critical-error-boundary";
import { useSingleLoading } from "@/hooks/use-comprehensive-loading";
import { motion } from "framer-motion";

export function EnhancedExpenseTrackerV2() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState<any>({
    searchTerm: "",
    category: "All",
    paymentMethod: "All",
    dateFrom: null,
    dateTo: null,
    minAmount: "",
    maxAmount: "",
    type: "All",
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const { isLoading, startLoading, stopLoading, error, clearError } = useSingleLoading();

  // Initialize notification service
  EnhancedNotificationService.setToastFunction(toast);

  const loadExpenses = async () => {
    if (!user) return;
    
    startLoading("Loading expenses...");
    clearError();
    
    try {
      const data = await SupabaseExpenseManager.getExpenses(user.uid);
      setExpenses(data);
    } catch (error) {
      EnhancedNotificationService.dataLoadError(() => loadExpenses());
      stopLoading(error as Error);
      return;
    }
    
    stopLoading();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!user) return;
    
    try {
      await SupabaseExpenseManager.deleteExpense(user.uid, expenseId);
      await loadExpenses();
      EnhancedNotificationService.expenseDeleted();
    } catch (error) {
      EnhancedNotificationService.error({
        title: "Failed to delete expense",
        description: "Please try again"
      });
    }
  };

  const handleAddExpense = async (expenseData: any) => {
    if (!user) return;
    
    try {
      // Validate expense data before submission
      ComprehensiveDataValidator.validateExpense({
        ...expenseData,
        userId: user.uid
      });
      
      await SupabaseExpenseManager.addExpense(user.uid, expenseData);
      await loadExpenses();
      setShowAddForm(false);
      EnhancedNotificationService.expenseAdded();
    } catch (error) {
      throw error; // Let the form handle the error
    }
  };

  const exportExpenses = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Date,Description,Category,Amount,Type,Payment Method,Tags\n"
        + filteredExpenses.map(expense => 
            `${expense.date},${expense.description},${expense.category},${expense.amount},${expense.type},${expense.paymentMethod || ''},${expense.tags?.join(';') || ''}`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      EnhancedNotificationService.operationCompleted("Export");
    } catch (error) {
      EnhancedNotificationService.error({
        title: "Export Failed",
        description: "Unable to export expenses. Please try again."
      });
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [user]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          expense.description?.toLowerCase().includes(searchLower) ||
          expense.category?.toLowerCase().includes(searchLower) ||
          expense.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (filters.category !== "All" && expense.category !== filters.category) return false;
      
      // Payment method filter
      if (filters.paymentMethod !== "All" && expense.paymentMethod !== filters.paymentMethod) return false;
      
      // Type filter
      if (filters.type !== "All" && expense.type !== filters.type) return false;
      
      // Date filters
      if (filters.dateFrom && expense.date < filters.dateFrom.toISOString().split('T')[0]) return false;
      if (filters.dateTo && expense.date > filters.dateTo.toISOString().split('T')[0]) return false;
      
      // Amount filters
      if (filters.minAmount && expense.amount < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && expense.amount > parseFloat(filters.maxAmount)) return false;
      
      return true;
    });
  }, [expenses, filters]);

  const totalExpenses = filteredExpenses
    .filter(expense => expense.type === 'expense')
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
  const totalIncome = filteredExpenses
    .filter(expense => expense.type === 'income')
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);

  if (showAddForm) {
    return (
      <CriticalErrorBoundary>
        <div className="space-y-4">
          <AdvancedExpenseForm
            onSubmit={handleAddExpense}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      </CriticalErrorBoundary>
    );
  }

  return (
    <CriticalErrorBoundary>
      <EnhancedLoadingWrapper 
        loading={isLoading} 
        loadingText="Loading expenses..."
        error={error}
        onRetry={loadExpenses}
      >
        <div className="space-y-6">
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm">Total Expenses</p>
                      <p className="text-2xl font-bold">
                        {ComprehensiveDataValidator.formatCurrency(totalExpenses)}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Income</p>
                      <p className="text-2xl font-bold">
                        {ComprehensiveDataValidator.formatCurrency(totalIncome)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Net Balance</p>
                      <p className="text-2xl font-bold">
                        {ComprehensiveDataValidator.formatCurrency(totalIncome - totalExpenses)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={exportExpenses}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => setShowAddForm(true)}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Advanced Filters */}
          <AdvancedExpenseFilters
            onFiltersChange={setFilters}
            totalResults={filteredExpenses.length}
          />

          {/* Expense List */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseList 
                expenses={filteredExpenses}
                onDelete={handleDeleteExpense}
              />
            </CardContent>
          </Card>
        </div>
      </EnhancedLoadingWrapper>
    </CriticalErrorBoundary>
  );
}
