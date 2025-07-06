
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download } from "lucide-react";
import { EnhancedAddExpenseForm } from "./enhanced-add-expense-form";
import { ExpenseList } from "./expense-list";
import type { Expense as AppExpense } from "@/types/entities"; // Changed to import from central types
import { db } from "@/db";
import { SupabaseDataService } from "@/services/supabase-data-service";
import { useAuth } from "@/contexts/auth-context";
import { EnhancedNotificationService } from "@/services/enhanced-notification-service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { EnhancedLoadingWrapper } from "@/components/ui/enhanced-loading-wrapper";
import { CriticalErrorBoundary } from "@/components/ui/critical-error-boundary";
import { useSingleLoading } from "@/hooks/use-comprehensive-loading";
import { useLiveQuery } from 'dexie-react-hooks';

export function ExpenseTracker() {
  const { user } = useAuth(); // Added
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const { isLoading: isMutationLoading, startLoading: startMutationLoading, stopLoading: stopMutationLoading, error: mutationError, clearError: clearMutationError } = useSingleLoading();
  const [editingExpense, setEditingExpense] = useState<AppExpense | null>(null); // For editing

  EnhancedNotificationService.setToastFunction(toast);

  // Live query for expenses from Dexie, filtered by user_id
  const allExpenses = useLiveQuery(
    async () => {
      if (!user) return [];
      // Assuming db.expenses schema is updated to '&id, user_id, date, ...'
      // and AppExpense has user_id field.
      const expensesFromDB = await db.expenses.where({ user_id: user.uid }).orderBy('date').reverse().toArray();
      return expensesFromDB as AppExpense[]; // Cast to AppExpense
    },
    [user], // Dependency: re-run query if user changes
    [] // Initial value
  );

  const isDataLoading = allExpenses === undefined && user !== null; // More accurate loading state
  const expenses = allExpenses || [];

  // Effect to fetch from Supabase and update Dexie
  useEffect(() => {
    const syncWithSupabase = async () => {
      if (!user) {
        // db.expenses.clear(); // Optionally clear Dexie if user logs out, or handle per user data separation carefully
        return;
      }
      // No need to setIsLoading here as useLiveQuery handles its own loading state via `undefined`
      try {
        const supabaseExpenses = await SupabaseDataService.getExpenses(user.uid);
        // Ensure user_id is part of the objects for Dexie if schema requires it for non-compound queries.
        // Our schema is '&id, user_id,...' so user_id is available for where clause.
        // The objects from SupabaseDataService.getExpenses should already include user_id if it's selected.
        // For safety, ensure it's there before bulkPutting.
        const expensesToCache = supabaseExpenses.map(exp => ({ ...exp, user_id: user.uid }));
        await db.expenses.bulkPut(expensesToCache);
        // useLiveQuery will automatically update the UI with these changes from Dexie.
      } catch (error) {
        console.error("Error syncing expenses with Supabase:", error);
        toast({ title: "Sync Error", description: "Could not sync expenses with cloud.", variant: "destructive" });
      }
    };
    syncWithSupabase();
  }, [user, toast]);


  }, [user, toast]);


  const handleOpenEditForm = (expense: AppExpense) => {
    setEditingExpense(expense);
    setShowAddForm(true); // Show the form, which will now be in edit mode
  };

  const handleUpdateExpense = async (expenseId: string, updates: Omit<AppExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    startMutationLoading("Updating expense...");
    clearMutationError();
    try {
      const updatedExpenseFromSupabase = await SupabaseDataService.updateExpense(expenseId, updates);
      // Ensure user_id is on the object for Dexie, though update just needs id.
      const expenseForDexie = { ...updatedExpenseFromSupabase, user_id: user.uid };
      await db.expenses.update(expenseId, expenseForDexie);
      // useLiveQuery will handle UI update from Dexie change.

      setShowAddForm(false); // Close form
      setEditingExpense(null); // Clear editing state
      toast({ title: "Success", description: "Expense updated." });
      EnhancedNotificationService.operationCompleted("Expense updated");
    } catch (error) {
      console.error("Error updating expense:", error);
      EnhancedNotificationService.error({
        title: "Failed to update expense",
        description: (error as Error).message || "Please try again."
      });
      stopMutationLoading(error as Error); // Keep form open on error if desired, or close. For now, stays open.
    } finally {
      stopMutationLoading();
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    startMutationLoading("Deleting expense...");
    clearMutationError();
    try {
      await SupabaseDataService.deleteExpense(expenseId); // Call Supabase service
      // Dexie will update automatically if useLiveQuery is observing a table that Supabase syncs to.
      // However, for immediate UI feedback and offline consistency, explicitly delete from Dexie too.
      await db.expenses.delete(expenseId);
      EnhancedNotificationService.expenseDeleted();
      toast({ title: "Success", description: "Expense deleted." });
    } catch (error) {
      console.error("Error deleting expense:", error);
      EnhancedNotificationService.error({
        title: "Failed to delete expense",
        description: (error as Error).message || "Please try again"
      });
      stopMutationLoading(error as Error);
    } finally {
      stopMutationLoading();
    }
  };

  // Expects data from form, conforming to Omit<AppExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  const handleAddExpense = async (expenseFormData: Omit<AppExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    startMutationLoading("Adding expense...");
    clearMutationError();

    const expensePayload: Omit<AppExpense, 'id' | 'created_at' | 'updated_at'> & { user_id: string } = {
      ...expenseFormData,
      user_id: user.uid,
      // Ensure 'tags' is an array, even if empty, if the form might send undefined/null
      tags: expenseFormData.tags || [],
    };

    try {
      const newExpenseFromSupabase = await SupabaseDataService.addExpense(expensePayload);
      // Add to Dexie. Ensure the object for Dexie includes user_id if your queries rely on it.
      // newExpenseFromSupabase should include id and user_id.
      await db.expenses.add(newExpenseFromSupabase);

      setShowAddForm(false);
      toast({ title: "Success", description: "Expense added." });
      EnhancedNotificationService.operationCompleted("Expense added");
    } catch (error) {
      console.error("Error adding expense:", error);
      EnhancedNotificationService.error({
        title: "Failed to add expense",
        description: (error as Error).message || "Please try again."
      });
      stopMutationLoading(error as Error);
    } finally {
      stopMutationLoading();
    }
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

  // Combined submit handler for the form
  const handleSubmitExpenseForm = async (formData: Omit<AppExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingExpense) {
      await handleUpdateExpense(editingExpense.id, formData);
    } else {
      await handleAddExpense(formData);
    }
  };

  if (showAddForm) {
    return (
      <CriticalErrorBoundary>
        <div className="space-y-4">
          <EnhancedAddExpenseForm
            initialData={editingExpense}
            onSubmit={handleSubmitExpenseForm}
            onCancel={() => {
              setShowAddForm(false);
              setEditingExpense(null); // Clear editing state
            }}
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
                onEdit={handleOpenEditForm} // Pass the edit handler
              />
            </CardContent>
          </Card>
        </div>
      </EnhancedLoadingWrapper>
    </CriticalErrorBoundary>
  );
}
