
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddExpenseForm } from "./add-expense-form";
import { ExpenseList } from "./expense-list";
import { FirestoreService, FirestoreExpense } from "@/services/firestore";
import { useAuth } from "@/contexts/auth-context";
import { GlobalHeader } from "@/components/layout/global-header";

export interface Expense {
  id: string;
  amount: number;
  date: string;
  category: string;
  tag: string;
  paymentMode: 'UPI' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Net Banking' | 'Wallet';
  note?: string;
  linkedGoal?: string;
  merchant?: string;
  linkedVehicle?: string;
  linkedInsurance?: string;
  linkedProperty?: string;
  linkedCreditCard?: string;
  linkedRecurringGoal?: string;
  linkedAccount?: string;
  autoTagged?: boolean;
  recurring?: boolean;
  lineItems?: Array<{
    id: string;
    title: string;
    amount: number;
  }>;
}

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadFirestoreExpenses();
    }
  }, [user]);

  const loadFirestoreExpenses = async () => {
    if (!user) return;
    
    try {
      const firestoreExpenses = await FirestoreService.getExpenses(user.uid);
      
      // Convert Firestore expenses to local expense format
      const convertedExpenses: Expense[] = firestoreExpenses.map(expense => ({
        id: expense.id || Date.now().toString(),
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        tag: expense.description || expense.tags || 'Imported',
        paymentMode: (expense.paymentMode as any) || 'UPI',
        note: expense.description,
        linkedAccount: expense.account,
        autoTagged: expense.source === 'csv'
      }));
      
      setExpenses(convertedExpenses);
      console.log(`Loaded ${convertedExpenses.length} expenses from Firestore`);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expenses from database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id'>) => {
    if (!user) return;
    
    try {
      const firestoreExpense = {
        userId: user.uid,
        date: expenseData.date,
        amount: expenseData.amount,
        category: expenseData.category,
        paymentMode: expenseData.paymentMode,
        description: expenseData.note || expenseData.tag,
        tags: expenseData.tag,
        account: expenseData.linkedAccount || 'Manual',
        source: 'manual' as const,
        createdAt: new Date().toISOString()
      };
      
      await FirestoreService.addExpenses([firestoreExpense]);
      await loadFirestoreExpenses(); // Reload to get updated data
      setShowAddForm(false);
      
      toast({
        title: "Success",
        description: "Expense added successfully!",
      });
    } catch (error) {
      console.error('Failed to add expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await FirestoreService.deleteExpense(id);
      await loadFirestoreExpenses(); // Reload to get updated data
      
      toast({
        title: "Success",
        description: "Expense deleted successfully!",
      });
    } catch (error) {
      console.error('Failed to delete expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const categories = ["All", "Food", "Bills", "Fuel", "EMI", "Shopping", "Entertainment", "Health", "Travel", "Education", "Other"];

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || expense.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (showAddForm) {
    return (
      <AddExpenseForm
        onSubmit={handleAddExpense}
        onCancel={() => setShowAddForm(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
      <GlobalHeader title="Expense Tracker" />
      
      <div className="pt-20 px-4 space-y-6">
        <Card className="metric-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Expense Tracker</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="metric-card p-4">
                    <div className="text-2xl font-bold text-foreground">₹{totalExpenses.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Expenses</div>
                  </div>
                  <div className="metric-card p-4">
                    <div className="text-2xl font-bold text-foreground">{filteredExpenses.length}</div>
                    <div className="text-sm text-muted-foreground">Transactions</div>
                  </div>
                  <div className="metric-card p-4">
                    <div className="text-2xl font-bold text-foreground">₹{filteredExpenses.length > 0 ? Math.round(totalExpenses / filteredExpenses.length) : 0}</div>
                    <div className="text-sm text-muted-foreground">Avg. Amount</div>
                  </div>
                </div>

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
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <Button onClick={() => setShowAddForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Expense
                    </Button>
                  </div>
                </div>

                <ExpenseList 
                  expenses={filteredExpenses}
                  onDelete={handleDeleteExpense}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
