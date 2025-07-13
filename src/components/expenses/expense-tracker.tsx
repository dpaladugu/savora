import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react"; // Added DollarSign
import { EnhancedAddExpenseForm } from "./enhanced-add-expense-form";
import { ExpenseList } from "./expense-list";
import type { Expense as AppExpense } from "@/services/supabase-data-service"; // Type for expenses
import type { Income as AppIncome } from "@/components/income/income-tracker";
import { db } from "@/db";
import { SupabaseDataService } from "@/services/supabase-data-service";
import { useAuth } from "@/contexts/auth-context";
import { ExpenseService } from "@/services/ExpenseService"; // Import the service
import { EnhancedNotificationService } from "@/services/enhanced-notification-service";
import { useToast } from "@/hooks/use-toast";
import { EnhancedLoadingWrapper } from "@/components/ui/enhanced-loading-wrapper";
import { CriticalErrorBoundary } from "@/components/ui/critical-error-boundary";
import { useSingleLoading } from "@/hooks/use-comprehensive-loading";
import { useLiveQuery } from 'dexie-react-hooks';
import { AdvancedExpenseFilters, ExpenseFilterCriteria } from "./advanced-expense-filters"; // Updated import
import { ComprehensiveDataValidator } from "@/services/comprehensive-data-validator"; // For currency formatting
import { motion } from "framer-motion";
import { parseISO, isValid } from "date-fns";

const initialFiltersState: ExpenseFilterCriteria = {
  searchTerm: "",
  category: "All",
  paymentMethod: "All",
  dateFrom: null,
  dateTo: null,
  minAmount: "",
  maxAmount: "",
  type: "All", // Default to show all types (expenses and potentially income if data model supports it in future)
};

export function ExpenseTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const { isLoading: isMutationLoading, startLoading: startMutationLoading, stopLoading: stopMutationLoading } = useSingleLoading();
  const [editingExpense, setEditingExpense] = useState<AppExpense | null>(null);
  const [filters, setFilters] = useState<ExpenseFilterCriteria>(initialFiltersState);

  EnhancedNotificationService.setToastFunction(toast);

  const allExpenses = useLiveQuery(
    () => {
      if (!user) return [];
      // Use the service method for fetching. useLiveQuery expects the promise directly from the Dexie call.
      // So, wrapping the service call is the right pattern here.
      return ExpenseService.getExpenses(user.uid);
    },
    [user?.uid], // Depend on user.uid
    []
  );

  // Fetch incomes for summary card calculation
  const allIncomes = useLiveQuery(
    async () => {
      if(!user) return [];
      // Assuming incomes are also stored per user_id and have a 'date' and 'amount'
      const incomesFromDB = await db.incomes.where({ user_id: user.uid }).toArray();
      return incomesFromDB as AppIncome[];
    },
    [user], []
  );

  const isDataLoading = (allExpenses === undefined || allIncomes === undefined) && user !== null;
  const expenses = allExpenses || [];
  const incomes = allIncomes || [];

  useEffect(() => {
    const syncData = async () => {
      if (!user) return;
      try {
        const [supabaseExpenses, supabaseIncomes] = await Promise.all([
          SupabaseDataService.getExpenses(user.uid),
          SupabaseDataService.getIncomes(user.uid) // Assuming this method exists
        ]);

        const expensesToCache = supabaseExpenses.map(exp => ({ ...exp, user_id: user.uid }));
        await db.expenses.bulkPut(expensesToCache);

        const incomesToCache = supabaseIncomes.map(inc => ({ ...inc, user_id: user.uid }));
        await db.incomes.bulkPut(incomesToCache);

      } catch (error) {
        console.error("Error syncing data with Supabase:", error);
        toast({ title: "Sync Error", description: "Could not sync all data with cloud.", variant: "destructive" });
      }
    };
    syncData();
  }, [user, toast]);

  const handleOpenEditForm = (expense: AppExpense) => {
    setEditingExpense(expense);
    setShowAddForm(true);
  };

  const handleUpdateExpense = async (expenseId: string, updates: Omit<AppExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) { toast({ title: "Error", description: "User not authenticated.", variant: "destructive" }); return; }
    startMutationLoading("Updating expense...");
    try {
      // Still calling Supabase first, then our service for local update
      const updatedExpenseFromSupabase = await SupabaseDataService.updateExpense(expenseId, updates);
      await ExpenseService.updateExpense(expenseId, { ...updatedExpenseFromSupabase, user_id: user.uid });
      setShowAddForm(false); setEditingExpense(null);
      toast({ title: "Success", description: "Expense updated." });
    } catch (error) {
      toast({ title: "Failed to update expense", description: (error as Error).message || "Please try again.", variant: "destructive"});
    } finally { stopMutationLoading(); }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!user) { toast({ title: "Error", description: "User not authenticated.", variant: "destructive" }); return; }
    startMutationLoading("Deleting expense...");
    try {
      await SupabaseDataService.deleteExpense(expenseId);
      await ExpenseService.deleteExpense(expenseId);
      toast({ title: "Success", description: "Expense deleted." });
    } catch (error) {
      toast({ title: "Failed to delete expense", description: (error as Error).message || "Please try again.", variant: "destructive"});
    } finally { stopMutationLoading(); }
  };

  const handleAddExpense = async (expenseFormData: Omit<AppExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) { toast({ title: "Error", description: "User not authenticated.", variant: "destructive" }); return; }
    startMutationLoading("Adding expense...");
    const expensePayload = { ...expenseFormData, user_id: user.uid, tags: expenseFormData.tags || [] };
    try {
      const newExpenseFromSupabase = await SupabaseDataService.addExpense(expensePayload);
      // The service expects the full AppExpense object, which newExpenseFromSupabase is
      await ExpenseService.addExpense(newExpenseFromSupabase);
      setShowAddForm(false);
      toast({ title: "Success", description: "Expense added." });
    } catch (error) {
      toast({ title: "Failed to add expense", description: (error as Error).message || "Please try again.", variant: "destructive"});
    } finally { stopMutationLoading(); }
  };

  const handleSubmitExpenseForm = async (formData: Omit<AppExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingExpense) {
      await handleUpdateExpense(editingExpense.id as string, formData);
    } else {
      await handleAddExpense(formData);
    }
  };

  const filteredData = useMemo(() => {
    // Filter expenses
    const filteredExpensesList = expenses.filter(expense => {
      if (filters.type === "income") return false; // If filtering only for income, exclude expenses
      const searchTermLower = filters.searchTerm.toLowerCase();
      const matchesSearch = !filters.searchTerm ||
                            (expense.description || "").toLowerCase().includes(searchTermLower) ||
                            (expense.category || "").toLowerCase().includes(searchTermLower) ||
                            (expense.tags_flat || "").toLowerCase().includes(searchTermLower);
      const matchesCategory = filters.category === "All" || expense.category === filters.category;
      const matchesPaymentMethod = filters.paymentMethod === "All" || expense.payment_method === filters.paymentMethod;
      const date = expense.date ? parseISO(expense.date) : null;
      const matchesDateFrom = !filters.dateFrom || (date && date >= filters.dateFrom);
      const matchesDateTo = !filters.dateTo || (date && date <= new Date(filters.dateTo.setHours(23,59,59,999))); // include whole day
      const matchesMinAmount = !filters.minAmount || expense.amount >= parseFloat(filters.minAmount);
      const matchesMaxAmount = !filters.maxAmount || expense.amount <= parseFloat(filters.maxAmount);
      return matchesSearch && matchesCategory && matchesPaymentMethod && matchesDateFrom && matchesDateTo && matchesMinAmount && matchesMaxAmount;
    });

    // Filter incomes (only if type filter is 'All' or 'income')
    let filteredIncomesList: AppIncome[] = [];
    if (filters.type === "All" || filters.type === "income") {
        filteredIncomesList = incomes.filter(income => {
            const searchTermLower = filters.searchTerm.toLowerCase();
            const matchesSearch = !filters.searchTerm ||
                                (income.source || "").toLowerCase().includes(searchTermLower) ||
                                (income.category || "").toLowerCase().includes(searchTermLower);
            const matchesCategory = filters.category === "All" || income.category === filters.category;
            // Incomes might not have paymentMethod, adapt if needed
            const date = income.date ? parseISO(income.date) : null;
            const matchesDateFrom = !filters.dateFrom || (date && date >= filters.dateFrom);
            const matchesDateTo = !filters.dateTo || (date && date <= new Date(filters.dateTo.setHours(23,59,59,999)));
            const matchesMinAmount = !filters.minAmount || income.amount >= parseFloat(filters.minAmount);
            const matchesMaxAmount = !filters.maxAmount || income.amount <= parseFloat(filters.maxAmount);
            return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo && matchesMinAmount && matchesMaxAmount;
        });
    }

    // If filter type is 'expense', only return expenses.
    // If filter type is 'income', only return incomes (as expense-like structure for list).
    // If 'All', combine and sort. For now, ExpenseList expects AppExpense[].
    // This might need adjustment if income items are to be displayed in the same list.
    // For simplicity, this example focuses on filtering expenses. If income is displayed, adapt ExpenseList or use separate list.
    return filteredExpensesList;

  }, [expenses, incomes, filters]);

  const totalShownExpenses = filteredData.reduce((sum, item) => item.type === 'expense' || filters.type === 'All' || filters.type === 'expense' ? sum + (item.amount || 0) : sum, 0);

  // Calculate total income based on *original* incomes array, but filtered by date/search if specified in 'filters'
  // This is a simplified income calculation for the summary cards.
  const relevantIncomes = useMemo(() => incomes.filter(income => {
    const searchTermLower = filters.searchTerm.toLowerCase();
    const date = income.date ? parseISO(income.date) : null;
    const matchesDateFrom = !filters.dateFrom || (date && date >= filters.dateFrom);
    const matchesDateTo = !filters.dateTo || (date && date <= new Date(filters.dateTo.setHours(23,59,59,999)));
    const matchesSearch = !filters.searchTerm || (income.source || "").toLowerCase().includes(searchTermLower) || (income.category || "").toLowerCase().includes(searchTermLower);
    return matchesDateFrom && matchesDateTo && matchesSearch;
  }), [incomes, filters.dateFrom, filters.dateTo, filters.searchTerm]);

  const totalIncomeForSummary = relevantIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);
  const netBalanceForSummary = totalIncomeForSummary - totalShownExpenses;

  const uniqueCategories = useMemo(() => ["All", ...new Set(expenses.map(e => e.category || "Uncategorized").filter(Boolean).sort())], [expenses]);
  const uniquePaymentMethods = useMemo(() => ["All", ...new Set(expenses.map(e => e.payment_method || "N/A").filter(Boolean).sort())], [expenses]);

  const exportData = () => { // Renamed from exportExpenses
    try {
      // For now, only exports filtered expenses. Can be expanded.
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Date,Description,Category,Amount,Payment Method,Tags\n" // Added Tags
        + filteredData.map(item =>
            `${item.date},${item.description || ''},${item.category || ''},${item.amount},${item.payment_method || ''},${item.tags_flat || ''}`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({title: "Export Successful", description: "Filtered transactions exported."});
    } catch (error) {
      toast({title: "Export Failed", description: "Could not export data.", variant: "destructive"});
    }
  };

  if (showAddForm) {
    return (
      <CriticalErrorBoundary>
        <div className="space-y-4 p-4 md:p-0"> {/* Adjusted padding for when form is shown */}
          <EnhancedAddExpenseForm
            // initialData expects FormExpenseType, ensure mapping if AppExpense is different for form
            initialData={editingExpense ? {
              ...editingExpense,
              tags: editingExpense.tags_flat ? editingExpense.tags_flat.split(',') : [],
              // Ensure all fields expected by FormExpenseType are present
            } as any : undefined}
            onSubmit={handleSubmitExpenseForm}
            onCancel={() => { setShowAddForm(false); setEditingExpense(null); }}
          />
        </div>
      </CriticalErrorBoundary>
    );
  }

  return (
    <CriticalErrorBoundary>
      <EnhancedLoadingWrapper loading={isDataLoading || isMutationLoading} loadingText="Loading transactions...">
        <div className="space-y-6">
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-red-100 text-sm">Total Expenses</p><p className="text-2xl font-bold">{ComprehensiveDataValidator.formatCurrency(totalShownExpenses)}</p></div>
                    <TrendingDown aria-hidden="true" className="w-8 h-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-green-100 text-sm">Total Income (filtered period)</p><p className="text-2xl font-bold">{ComprehensiveDataValidator.formatCurrency(totalIncomeForSummary)}</p></div>
                    <TrendingUp aria-hidden="true" className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-blue-100 text-sm">Net Balance (filtered period)</p><p className="text-2xl font-bold">{ComprehensiveDataValidator.formatCurrency(netBalanceForSummary)}</p></div>
                    <DollarSign aria-hidden="true" className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="flex justify-end gap-2">
             <Button onClick={exportData} variant="outline" size="sm">
                <Download aria-hidden="true" className="w-4 h-4 mr-2" /> Export Shown
              </Button>
              <Button onClick={() => { setEditingExpense(null); setShowAddForm(true);}}>
                <Plus aria-hidden="true" className="w-4 h-4 mr-2" /> Add Transaction
              </Button>
          </div>

          <AdvancedExpenseFilters
            onFiltersChange={setFilters}
            totalResults={filteredData.length}
            availableCategories={uniqueCategories.filter(c => c !== "All")} // Pass dynamic categories
            availablePaymentMethods={uniquePaymentMethods.filter(pm => pm !== "All")} // Pass dynamic payment methods
          />

          <Card>
            <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
            <CardContent>
              <ExpenseList 
                expenses={filteredData} // Use the comprehensively filtered data
                onDelete={handleDeleteExpense}
                onEdit={handleOpenEditForm}
              />
            </CardContent>
          </Card>
        </div>
      </EnhancedLoadingWrapper>
    </CriticalErrorBoundary>
  );
}
