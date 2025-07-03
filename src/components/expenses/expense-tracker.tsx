
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download } from "lucide-react";
import { EnhancedAddExpenseForm } from "./enhanced-add-expense-form"; // Or AddExpenseForm if preferred
import { ExpenseList } from "./expense-list";
import { db, Expense } from "@/db"; // Import db and Expense type from Dexie ORM
// import { ExpenseManager } from "@/services/expense-manager"; // To be replaced for categories
import { EnhancedNotificationService } from "@/services/enhanced-notification-service";
// import { ComprehensiveDataValidator } from "@/services/comprehensive-data-validator"; // Review if needed or simplify
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { EnhancedLoadingWrapper } from "@/components/ui/enhanced-loading-wrapper";
import { CriticalErrorBoundary } from "@/components/ui/critical-error-boundary";
import { useSingleLoading } from "@/hooks/use-comprehensive-loading";
import { useLiveQuery } from 'dexie-react-hooks';

export function ExpenseTracker() {
  // const [expenses, setExpenses] = useState<Expense[]>([]); // Replaced by useLiveQuery
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  // const { user } = useAuth(); // Removed useAuth
  const { toast } = useToast();
  const { isLoading: isMutationLoading, startLoading: startMutationLoading, stopLoading: stopMutationLoading, error: mutationError, clearError: clearMutationError } = useSingleLoading(); // For add/delete operations

  // Initialize notification service
  EnhancedNotificationService.setToastFunction(toast);

  // Live query for expenses from Dexie
  const allExpenses = useLiveQuery(
    async () => {
      // Add any default sorting or complex queries here if needed
      // For now, just fetching all and sorting by date client-side later if needed, or let filtering handle it.
      // Fetching sorted by date (descending) directly from Dexie
      const expensesFromDB = await db.expenses.orderBy('date').reverse().toArray();
      return expensesFromDB;
    },
    [], // Dependencies array for useLiveQuery
    [] // Initial value
  );

  const isLoading = allExpenses === undefined; // Loading state for useLiveQuery
  const expenses = allExpenses || [];


  const handleDeleteExpense = async (expenseId: number) => { // expenseId is number
    startMutationLoading("Deleting expense...");
    clearMutationError();
    try {
      await db.expenses.delete(expenseId);
      // loadExpenses(); // No longer needed, useLiveQuery handles updates
      EnhancedNotificationService.expenseDeleted();
      toast({ title: "Success", description: "Expense deleted." });
    } catch (error) {
      EnhancedNotificationService.error({
        title: "Failed to delete expense",
        description: (error as Error).message || "Please try again"
      });
      stopMutationLoading(error as Error);
    }
    stopMutationLoading();
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    startMutationLoading("Adding expense...");
    clearMutationError();
    try {
      // Form should ideally enforce required fields.
      // Additional validation can be re-introduced here if needed.
      const newExpense: Expense = {
        ...expenseData,
        type: expenseData.type || 'expense',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.expenses.add(newExpense);
      setShowAddForm(false);
      toast({ title: "Success", description: "Expense added." });
      EnhancedNotificationService.operationCompleted("Expense added");
    } catch (error) {
      EnhancedNotificationService.error({
        title: "Failed to add expense",
        description: (error as Error).message || "Please try again."
      });
      stopMutationLoading(error as Error);
    }
    stopMutationLoading();
  };

  const exportExpenses = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Date,Description,Category,Amount,Payment Method\n"
        + filteredExpenses.map(expense => 
            `${expense.date},${expense.description || ''},${expense.category || ''},${expense.amount},${expense.paymentMethod || ''}`
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

  // useEffect for loadExpenses is no longer needed due to useLiveQuery

  const uniqueCategories = expenses ? [...new Set(expenses.map(e => e.category || "Uncategorized"))].sort() : [];
  const categoriesForFilter = ["All", ...uniqueCategories];

  const filteredExpenses = expenses.filter(expense => {
    const description = expense.description || "";
    const category = expense.category || ""; // Ensure category is not null/undefined
    const searchTermLower = searchTerm.toLowerCase();

    const matchesSearch = description.toLowerCase().includes(searchTermLower) ||
                         category.toLowerCase().includes(searchTermLower);
    const matchesCategory = filterCategory === "All" || category === filterCategory;
    
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
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesForFilter.map(cat => (
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
