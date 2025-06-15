
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Calendar } from "lucide-react";
import { EnhancedAddExpenseForm } from "./enhanced-add-expense-form";
import { ExpenseList } from "./expense-list";
import { ExpenseManager } from "@/services/expense-manager";
import { useAuth } from "@/contexts/auth-context";
import { NotificationService } from "@/services/notification-service";
import { DataValidator } from "@/services/data-validator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function EnhancedExpenseTracker() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadExpenses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await ExpenseManager.getExpenses(user.uid);
      setExpenses(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!user) return;
    
    try {
      await ExpenseManager.deleteExpense(user.uid, expenseId);
      await loadExpenses();
      toast({
        title: "Success",
        description: "Expense deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive"
      });
    }
  };

  const handleAddExpense = async (expenseData: any) => {
    if (!user) return;
    
    try {
      await ExpenseManager.addExpense(user.uid, expenseData);
      await loadExpenses();
      setShowAddForm(false);
    } catch (error) {
      throw error; // Let the form handle the error
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [user]);

  const categories = ["All", ...ExpenseManager.getPopularCategories()];

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "All" || expense.category === filterCategory;
      
      let matchesDate = true;
      if (dateFilter !== "all") {
        const expenseDate = new Date(expense.date);
        const now = new Date();
        
        switch (dateFilter) {
          case "today":
            matchesDate = expenseDate.toDateString() === now.toDateString();
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = expenseDate >= weekAgo;
            break;
          case "month":
            matchesDate = expenseDate.getMonth() === now.getMonth() && 
                         expenseDate.getFullYear() === now.getFullYear();
            break;
        }
      }
      
      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [expenses, searchTerm, filterCategory, dateFilter]);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const exportExpenses = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Description,Category,Amount,Payment Method\n"
      + filteredExpenses.map(expense => 
          `${expense.date},${expense.description},${expense.category},${expense.amount},${expense.paymentMethod || ''}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expenses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (showAddForm) {
    return (
      <div className="space-y-4">
        <EnhancedAddExpenseForm
          onSubmit={handleAddExpense}
          onCancel={() => setShowAddForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {DataValidator.formatCurrency(totalExpenses)}
              </h2>
              <p className="text-muted-foreground">
                Total Expenses ({filteredExpenses.length} transactions)
              </p>
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
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
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
  );
}
