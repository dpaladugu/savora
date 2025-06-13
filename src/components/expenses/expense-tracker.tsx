import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddExpenseForm } from "./add-expense-form";
import { ExpenseList } from "./expense-list";

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
  const { toast } = useToast();

  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: Date.now().toString(),
    };
    
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
    setShowAddForm(false);
    
    toast({
      title: "Success",
      description: "Expense added successfully!",
    });
  };

  const handleDeleteExpense = (id: string) => {
    const updatedExpenses = expenses.filter(expense => expense.id !== id);
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
    
    toast({
      title: "Success",
      description: "Expense deleted successfully!",
    });
  };

  const loadExpenses = () => {
    try {
      const saved = localStorage.getItem('savora-expenses');
      if (saved) {
        setExpenses(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  };

  const saveExpenses = (expenses: Expense[]) => {
    try {
      localStorage.setItem('savora-expenses', JSON.stringify(expenses));
    } catch (error) {
      console.error('Failed to save expenses:', error);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

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
    <div className="space-y-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
