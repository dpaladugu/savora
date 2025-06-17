
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download } from "lucide-react";
import { EnhancedAddExpenseForm } from "./enhanced-add-expense-form";
import { ExpenseList } from "./expense-list";
import { SupabaseExpenseManager } from "@/services/supabase-expense-manager";
import { ExpenseManager } from "@/services/expense-manager";
import { useAuth } from "@/contexts/auth-context";
import { EnhancedNotificationService } from "@/services/enhanced-notification-service";
import { ComprehensiveDataValidator } from "@/services/comprehensive-data-validator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { EnhancedLoadingWrapper } from "@/components/ui/enhanced-loading-wrapper";
import { CriticalErrorBoundary } from "@/components/ui/critical-error-boundary";
import { useSingleLoading } from "@/hooks/use-comprehensive-loading";

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
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
    } catch (error) {
      throw error; // Let the form handle the error
    }
  };

  const exportExpenses = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Date,Description,Category,Amount,Payment Method\n"
        + filteredExpenses.map(expense => 
            `${expense.date},${expense.description},${expense.category},${expense.amount},${expense.paymentMethod || ''}`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `expenses_${new Date().toISOString().split('T')[0]}.csv`);
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

  const categories = ["All", ...ExpenseManager.getPopularCategories()];

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || expense.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  if (showAddForm) {
    return (
      <CriticalErrorBoundary>
        <div className="space-y-4">
          <EnhancedAddExpenseForm
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
          {/* Summary Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {ComprehensiveDataValidator.formatCurrency(totalExpenses)}
                  </h2>
                  <p className="text-muted-foreground">Total Expenses ({filteredExpenses.length} transactions)</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={exportExpenses} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Expense History</CardTitle>
            </CardHeader>
            <CardContent>
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
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
