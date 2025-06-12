
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Search, Filter, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AddExpenseForm } from "./add-expense-form";
import { ExpenseList } from "./expense-list";

export interface Expense {
  id: string;
  amount: number;
  date: string;
  category: string;
  tag: string;
  paymentMode: string;
  note?: string;
  linkedGoal?: string;
  merchant?: string;
}

const mockExpenses: Expense[] = [
  {
    id: '1',
    amount: 450,
    date: '2024-01-15',
    category: 'Food',
    tag: 'Zomato',
    paymentMode: 'UPI',
    note: 'Lunch order',
    merchant: 'Zomato'
  },
  {
    id: '2',
    amount: 2500,
    date: '2024-01-14',
    category: 'Bills',
    tag: 'Electricity',
    paymentMode: 'Bank Transfer',
    note: 'Monthly electricity bill'
  },
  {
    id: '3',
    amount: 1200,
    date: '2024-01-13',
    category: 'Fuel',
    tag: 'Petrol Pump',
    paymentMode: 'Credit Card',
    note: 'Full tank'
  }
];

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
    const expense: Expense = {
      ...newExpense,
      id: Date.now().toString()
    };
    
    setExpenses([expense, ...expenses]);
    setShowAddForm(false);
    
    toast({
      title: "Expense added successfully",
      description: `₹${newExpense.amount} added to ${newExpense.category}`,
    });
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
    toast({
      title: "Expense deleted",
    });
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.merchant?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const thisMonthExpenses = expenses
    .filter(exp => new Date(exp.date).getMonth() === new Date().getMonth())
    .reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Expenses</h2>
          <p className="text-muted-foreground">Track your spending</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-blue hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-blue text-white">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-lg font-bold text-foreground">₹{thisMonthExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-green text-white">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-foreground">₹{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AddExpenseForm 
            onSubmit={handleAddExpense}
            onCancel={() => setShowAddForm(false)}
          />
        </motion.div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Expense List */}
      <ExpenseList 
        expenses={filteredExpenses}
        onDelete={handleDeleteExpense}
      />

      {/* Empty State */}
      {expenses.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Expenses Yet</h3>
          <p className="text-muted-foreground mb-4">Start tracking your expenses</p>
          <Button onClick={() => setShowAddForm(true)} className="bg-gradient-blue hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Expense
          </Button>
        </motion.div>
      )}
    </div>
  );
}
