import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react"; // Added DollarSign
import { EnhancedAddExpenseForm } from "./enhanced-add-expense-form";
import { TransactionList } from "./transaction-list";
import type { Expense as AppExpense } from "@/services/supabase-data-service";
import type { Income as AppIncome } from "@/components/income/income-tracker";
import { db } from "@/db";
import { SupabaseDataService } from "@/services/supabase-data-service";
import { ExpenseService } from "@/services/ExpenseService";
import { TransactionService } from "@/services/TransactionService";
import { EnhancedNotificationService } from "@/services/enhanced-notification-service";
import { useToast } from "@/hooks/use-toast";
import { EnhancedLoadingWrapper } from "@/components/ui/enhanced-loading-wrapper";
import { CriticalErrorBoundary } from "@/components/ui/critical-error-boundary";
import { useSingleLoading } from "@/hooks/use-comprehensive-loading";
import { useLiveQuery } from 'dexie-react-hooks';
import { AdvancedExpenseFilters, ExpenseFilterCriteria } from "./advanced-expense-filters";
import { ComprehensiveDataValidator } from "@/services/enhanced-data-validator";
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
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const { isLoading: isMutationLoading, startLoading: startMutationLoading, stopLoading: stopMutationLoading } = useSingleLoading();
  const [editingExpense, setEditingExpense] = useState<AppExpense | null>(null);
  const [filters, setFilters] = useState<ExpenseFilterCriteria>(initialFiltersState);

  EnhancedNotificationService.setToastFunction(toast);

  const allTransactions = useLiveQuery(
    () => TransactionService.getTransactions(),
    [],
    []
  );

  const isDataLoading = allTransactions === undefined;
  const expenses = useMemo(() => allTransactions?.filter(t => 'payment_method' in t) as AppExpense[] || [], [allTransactions]);
  const incomes = useMemo(() => allTransactions?.filter(t => !('payment_method' in t)) as AppIncome[] || [], [allTransactions]);

  const handleOpenEditForm = (expense: AppExpense) => {
    setEditingExpense(expense);
    setShowAddForm(true);
  };

  const handleUpdateExpense = async (expenseId: string, updates: Omit<AppExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    startMutationLoading("Updating expense...");
    try {
      await ExpenseService.updateExpense(expenseId, updates);
      setShowAddForm(false); setEditingExpense(null);
      toast({ title: "Success", description: "Expense updated." });
    } catch (error) {
      toast({ title: "Failed to update expense", description: (error as Error).message || "Please try again.", variant: "destructive"});
    } finally { stopMutationLoading(); }
  };

  const handleDeleteTransaction = async (itemId: string, type: 'expense' | 'income') => {
    startMutationLoading(`Deleting ${type}...`);
    try {
      await TransactionService.deleteTransaction(itemId, type);
      toast({ title: "Success", description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted.` });
    } catch (error) {
      toast({ title: `Failed to delete ${type}`, description: (error as Error).message || "Please try again.", variant: "destructive"});
    } finally { stopMutationLoading(); }
  };

  const handleAddExpense = async (expenseFormData: Omit<AppExpense, 'id' | 'created_at' | 'updated_at'>) => {
    startMutationLoading("Adding expense...");
    try {
      await ExpenseService.addExpense(expenseFormData);
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
    let transactions: (AppExpense | AppIncome)[] = [];

    if (filters.type === 'expense') {
      transactions = expenses;
    } else if (filters.type === 'income') {
      transactions = incomes;
    } else { // 'All'
      transactions = [...expenses, ...incomes];
    }

    const filtered = transactions.filter(t => {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const description = 'description' in t ? t.description : t.source_name; // Handle different field names
      const matchesSearch = !filters.searchTerm ||
                            (description || "").toLowerCase().includes(searchTermLower) ||
                            (t.category || "").toLowerCase().includes(searchTermLower) ||
                            (t.tags_flat || "").toLowerCase().includes(searchTermLower);

      const matchesCategory = filters.category === "All" || t.category === filters.category;

      const paymentMethod = 'payment_method' in t ? t.payment_method : 'N/A';
      const matchesPaymentMethod = filters.paymentMethod === "All" || paymentMethod === filters.paymentMethod;

      const date = t.date ? parseISO(t.date) : null;
      const matchesDateFrom = !filters.dateFrom || (date && date >= filters.dateFrom);
      const matchesDateTo = !filters.dateTo || (date && date <= new Date(filters.dateTo.setHours(23,59,59,999)));

      const matchesMinAmount = !filters.minAmount || t.amount >= parseFloat(filters.minAmount);
      const matchesMaxAmount = !filters.maxAmount || t.amount <= parseFloat(filters.maxAmount);

      return matchesSearch && matchesCategory && matchesPaymentMethod && matchesDateFrom && matchesDateTo && matchesMinAmount && matchesMaxAmount;
    });

    return filtered.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

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
              <TransactionList
                transactions={filteredData}
                onDelete={handleDeleteTransaction}
                onEdit={handleOpenEditForm}
              />
            </CardContent>
          </Card>
        </div>
      </EnhancedLoadingWrapper>
    </CriticalErrorBoundary>
  );
}
